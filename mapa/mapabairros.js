// mapabairros.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let camadaBairros = L.layerGroup();
let avaliacoes = [];

const bola = {
  ok: "🟢",
  alerta: "🟡",
  atencao: "🟠",
  critico: "🔴"
};

// Carrega avaliações do Firebase
export async function carregarAvaliacoesBairros() {
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes = [];
  snap.forEach(doc => {
    const d = doc.data();
    if(d.lat && d.lng && d.classe) avaliacoes.push(d);
  });
}

// Função para gerar observação do bairro
function observacaoBairro(cont, total){
  const p = k => Math.round((cont[k]/total)*100);
  if(p("critico") >= 50) return "🔴 Problema generalizado – alto risco de impacto.";
  if(p("atencao") >= 50) return "🟠 Problema localizado, tendência de piora.";
  if(p("alerta") >= 50) return "🟡 Problema pontual, monitoramento recomendado.";
  if(p("ok") > 0) return "🟢 Situação controlada – continuar acompanhamento rotineiro.";
  return "⚪ Sem dados – avaliação necessária.";
}

// Estilo do bairro baseado em avaliações dentro do polígono
function estiloBairro(feature){
  const coords = feature.geometry.coordinates[0].map(c => [c[1], c[0]]);
  const poly = L.polygon(coords);

  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat, a.lng]));
  if(escolas.length === 0) return { fillColor:"#999", fillOpacity:0, color:"#555", weight:1 };

  const cont = { ok:0, alerta:0, atencao:0, critico:0 };
  escolas.forEach(e => cont[e.classe.toLowerCase()]++);

  const total = escolas.length;
  let cor = "#4CAF50"; // verde padrão
  if(cont.critico/total >= 0.5) cor = "#F44336";
  else if(cont.atencao/total >= 0.5) cor = "#FF9800";
  else if(cont.alerta/total >= 0.5) cor = "#FFD700";

  return { fillColor: cor, fillOpacity: 0.45, color:"#555", weight:1 };
}

// Tooltip do bairro
function tooltipBairro(feature){
  const coords = feature.geometry.coordinates[0].map(c => [c[1], c[0]]);
  const poly = L.polygon(coords);

  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat, a.lng]));
  if(escolas.length === 0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont = { ok:0, alerta:0, atencao:0, critico:0 };
  escolas.forEach(e => cont[e.classe.toLowerCase()]++);

  return `
    <strong>${feature.properties.nome}</strong><br>
    ${bola.critico} ${Math.round(cont.critico/escolas.length*100)}% crítico (${cont.critico})<br>
    ${bola.atencao} ${Math.round(cont.atencao/escolas.length*100)}% atenção (${cont.atencao})<br>
    ${bola.alerta} ${Math.round(cont.alerta/escolas.length*100)}% alerta (${cont.alerta})<br>
    ${bola.ok} ${Math.round(cont.ok/escolas.length*100)}% adequado (${cont.ok})<br>
    Observação: ${observacaoBairro(cont,escolas.length)}
  `;
}

// Carrega GeoJSON dos bairros
export async function carregarBairros(map){
  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  camadaBairros = L.geoJSON(geo, {
    style: estiloBairro,
    onEachFeature: (f,l) => l.bindTooltip(tooltipBairro(f))
  });

  camadaBairros.addTo(map);
}

// Remove camada do mapa
export function removerBairros(map){
  if(camadaBairros) map.removeLayer(camadaBairros);
}