// mapabairros.js
// Usa db e map já inicializados no index.html
let camadaPontos = L.layerGroup().addTo(map);
let avaliacoes = []; // será preenchido pelo Firebase

const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
const pulsosCor = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

// Carregar avaliações do Firebase
async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  const ultimos = {};
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe && d.escola){
      if(!ultimos[d.escola] || (d.timestamp && d.timestamp.toMillis() > ultimos[d.escola].timestamp?.toMillis())){
        ultimos[d.escola] = d;
      }
    }
  });
  avaliacoes = Object.values(ultimos);
}

// Criar marcador
function criarPonto(d){
  const cor = cores[d.classe] || "#000";
  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8, color:cor, fillColor:cor, fillOpacity:0.8
  }).bindPopup(`<strong>${d.escola}</strong><br>Status: ${d.classe}<br>Pontuação: ${d.pontuacao || "-"}<br>Última avaliação: ${d.data || "-"}`);

  if(document.getElementById("togglePulso").checked){
    const pulseDiv = L.divIcon({
      className: "pulse",
      iconSize: [14,14],
      html:`<div style="width:14px;height:14px;border-radius:50%;background:${pulsosCor[d.classe]};opacity:0.7"></div>`
    });
    L.marker([d.lat,d.lng], {icon:pulseDiv}).addTo(camadaPontos);
  }

  return marker;
}

// Atualizar camada de pontos
function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const s = d.classe;
    if(
      (s==="ok" && !fAdequado.checked) ||
      (s==="alerta" && !fAlerta.checked) ||
      (s==="atenção" && !fAtencao.checked) ||
      (s==="critico" && !fCritico.checked)
    ) return;

    criarPonto(d).addTo(camadaPontos);
  });
}

// Listeners para filtros
document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico, #togglePulso").forEach(el=>{
  el.addEventListener("change", atualizarPontos);
});

// Inicialização
document.getElementById("togglePulso").checked = true;
document.getElementById("fAdequado").checked = true;
document.getElementById("fAlerta").checked = true;
document.getElementById("fAtencao").checked = true;
document.getElementById("fCritico").checked = true;

await carregarAvaliacoes();
atualizarPontos();