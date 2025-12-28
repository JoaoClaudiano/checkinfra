// mapabairros.js

// Referência ao Firestore já inicializado no index
const db = window.dbFirebase; // Você precisa setar window.dbFirebase = db no index.html

// Layer para os pontos de leitura por bairros
window.camadaBairros = L.layerGroup().addTo(window._checkinfraMap);

// Cores por classe
const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

// Variável global para armazenar avaliações
window.avaliacoesBairro = [];

// Função para carregar as avaliações do Firebase
window.carregarAvaliacoesBairro = async function() {
  const snap = await getDocs(collection(db,"avaliacoes"));
  const ultimos = {};
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe && d.escola){
      // Mantém apenas a última avaliação por escola
      if(!ultimos[d.escola] || (d.timestamp && d.timestamp.toMillis() > ultimos[d.escola].timestamp?.toMillis())){
        ultimos[d.escola] = d;
      }
    }
  });
  window.avaliacoesBairro = Object.values(ultimos);
};

// Função para criar e atualizar os pontos no mapa
window.atualizarBairros = function(){
  window.camadaBairros.clearLayers();

  window.avaliacoesBairro.forEach(d=>{
    const s = d.classe;

    // Respeita filtros do painel
    if(
      (s==="ok" && !fAdequado.checked) ||
      (s==="alerta" && !fAlerta.checked) ||
      (s==="atenção" && !fAtencao.checked) ||
      (s==="critico" && !fCritico.checked)
    ) return;

    const cor = cores[s] || "#000";
    const marker = L.circleMarker([d.lat,d.lng], {
      radius:8,
      color:cor,
      fillColor:cor,
      fillOpacity:0.8
    }).bindPopup(`<strong>${d.escola}</strong><br>Status: ${d.classe}<br>Pontuação: ${d.pontuacao || "-"}<br>Última avaliação: ${d.data || "-"}`);

    marker.addTo(window.camadaBairros);
  });
};

// Listener do checkbox no index.html
document.getElementById("toggleBairros").addEventListener("change", async function(){
  if(this.checked){
    await window.carregarAvaliacoesBairro();
    window.atualizarBairros();
  } else {
    window.camadaBairros.clearLayers();
  }
});