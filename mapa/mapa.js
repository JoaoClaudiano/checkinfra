import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inicializa mapa
const map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{ attribution:"© OpenStreetMap"}).addTo(map);

let avaliacoes = [];
let camadaPontos = L.layerGroup().addTo(map);
let camadaBairros = L.geoJSON(null);

const statusCores = {
  "adequado":"#4CAF50",
  "alerta":"#FFD700",
  "atenção":"#FF9800",
  "critico":"#F44336",
  "crítico":"#F44336"
};

const bola = {
  adequado: "🟢",
  alerta: "🟡",
  atenção: "🟠",
  crítico: "🔴"
};

const piscarFrequencia = {
  "crítico":1200,
  "atenção":2400,
  "alerta":3600,
  "adequado":4800
};

// Criar ponto com tooltip e pulso
function criarPonto(d){
  const status = (d.status||"").toLowerCase();
  const pulso = document.getElementById("togglePulso").checked ? "pulse" : "";

  let observacao = "";
  if(status.includes("crit")) observacao = "🔴 Problema grave – intervenção imediata recomendada.";
  else if(status.includes("atenção")) observacao = "🟠 Problema localizado, tendência de evoluir a crítico.";
  else if(status.includes("alerta")) observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else if(status.includes("adequado")) observacao = "🟢 Situação satisfatória – manutenção do acompanhamento.";

  const circle = L.circleMarker([d.lat,d.lng],{
    radius:8,
    color:statusCores[status],
    fillColor:statusCores[status],
    fillOpacity:.8,
    className:pulso
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${observacao}
  `);

  if(pulso){
    const freq = piscarFrequencia[status] || 2400;
    setInterval(()=>{
      circle.setStyle({ fillOpacity: circle.options.fillOpacity===0 ? 0.8 : 0 });
    }, freq);
  }

  return circle;
}

// Carregar avaliações do Firebase
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes=[];
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.status) avaliacoes.push(d);
  });
}

// Atualizar pontos
function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const s = d.status.toLowerCase();
    if(
      (s.includes("adequado") && !fAdequado.checked) ||
      (s.includes("alerta") && !fAlerta.checked) ||
      (s.includes("atenção") && !fAtencao.checked) ||
      (s.includes("crit") && !fCritico.checked)
    ) return;

    criarPonto(d).addTo(camadaPontos);
  });
}

// Estilo do bairro baseado nas escolas dentro do polígono
function estiloBairro(feature){
  const escolas = avaliacoes.filter(a=>{
    const pt = turf.point([a.lng,a.lat]);
    return turf.booleanPointInPolygon(pt, feature);
  });

  if(escolas.length===0) return { fillOpacity:0, color:"#999", weight:1 };

  const cont={ adequado:0, alerta:0, atenção:0, crítico:0 };
  escolas.forEach(e=>{
    const s=(e.status||"").toLowerCase();
    if(s.includes("adequado")) cont.adequado++;
    else if(s.includes("alerta")) cont.alerta++;
    else if(s.includes("atenção")) cont.atenção++;
    else cont.crítico++;
  });

  const total = escolas.length;
  const pCrit = cont.crítico/total;
  const pAtencao = cont.atenção/total;
  const pAlerta = cont.alerta/total;

  let cor = "#4CAF50"; // verde
  if(pCrit >= 0.5) cor="#F44336";          // 🔴 ≥50% crítico
  else if(pCrit < 0.5 && pAtencao >= 0.5) cor="#FF9800"; // 🟠 atenção ≥50%
  else if(pCrit === 0 && pAtencao < 0.5 && pAlerta >= 0.5) cor="#FFD700"; // 🟡 alerta ≥50%

  return { fillColor:cor, fillOpacity:.45, color:"#555", weight:1 };
}

// Tooltip do bairro
function tooltipBairro(feature){
  const escolas = avaliacoes.filter(a=>{
    const pt = turf.point([a.lng,a.lat]);
    return turf.booleanPointInPolygon(pt, feature);
  });

  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont={ adequado:0, alerta:0, atenção:0, crítico:0 };
  escolas.forEach(e=>{
    const s=(e.status||"").toLowerCase();
    if(s.includes("adequado")) cont.adequado++;
    else if(s.includes("alerta")) cont.alerta++;
    else if(s.includes("atenção")) cont.atenção++;
    else cont.crítico++;
  });

  const t = escolas.length;
  const p = k => Math.round((cont[k]/t)*100);

  let observacao = "";
  if(p("crítico")>=50) observacao = "🔴 Problema generalizado – alto risco de impacto.";
  else if(p("atenção")>=50) observacao = "🟠 Problema localizado, tendência de piora.";
  else if(p("alerta")>=50) observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else observacao = "🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `
    <strong>${feature.properties.nome}</strong><br>
    ${bola.crítico} ${p("crítico")}% crítico (${cont.crítico})<br>
    ${bola.atenção} ${p("atenção")}% atenção (${cont.atenção})<br>
    ${bola.alerta} ${p("alerta")}% alerta (${cont.alerta})<br>
    ${bola.adequado} ${p("adequado")}% adequado (${cont.adequado})<br>
    Observação: ${observacao}
  `;
}

// Carregar bairros do geojson
async function carregarBairros(){
  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  camadaBairros = L.geoJSON(geo,{
    style:estiloBairro,
    onEachFeature:(f,l)=> l.bindTooltip(tooltipBairro(f))
  });
}

// Eventos checkbox
document.querySelectorAll("input").forEach(i=>i.addEventListener("change",()=>{
  atualizarPontos();
  if(toggleBairros.checked){
    camadaBairros.addTo(map);
  } else {
    map.removeLayer(camadaBairros);
  }
}));

// Inicializa
await carregarAvaliacoes();
await carregarBairros();
atualizarPontos();