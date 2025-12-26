import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{ attribution:"© OpenStreetMap"}).addTo(map);

let avaliacoes = [];
let camadaPontos = L.layerGroup().addTo(map);

const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

// Função de criar marcador
function criarPonto(d){
  const cor = cores[d.classe] || "#000";
  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8, color:cor, fillColor:cor, fillOpacity:0.8
  }).bindPopup(`<strong>${d.escola}</strong><br>Status: ${d.status}<br>Pontuação: ${d.pontuacao || "-"}<br>Última avaliação: ${d.data || "-"}`);

  if(document.getElementById("togglePulso").checked) {
    const pulseDiv = L.divIcon({
      className: "pulse",
      iconSize: [24,24],
      html: `<div style="width:24px;height:24px;border-radius:50%;background:${cor};opacity:0.4"></div>`
    });
    const pulseMarker = L.marker([d.lat,d.lng], {icon:pulseDiv}).addTo(camadaPontos);
  }

  return marker;
}

// Carregar avaliações do Firebase
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes = [];
  const ultimos = {}; // manter só últimos por escola
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe){
      ultimos[d.escola] = d;
    }
  });
  avaliacoes = Object.values(ultimos);
}

// Atualizar camada de pontos
function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const s = d.classe;
    if((s==="ok" && !fAdequado.checked) || (s==="alerta" && !fAlerta.checked) ||
       (s==="atenção" && !fAtencao.checked) || (s==="critico" && !fCritico.checked)) return;
    criarPonto(d).addTo(camadaPontos);
  });
}

document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico, #togglePulso").forEach(el=>{
  el.addEventListener("change", atualizarPontos);
});

// Inicialização
await carregarAvaliacoes();
atualizarPontos();