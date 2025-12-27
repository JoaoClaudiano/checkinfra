import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mapa
const map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{ attribution:"© OpenStreetMap"}).addTo(map);

export let avaliacoes = []; // export para mapabairros.js
let camadaPontos = L.layerGroup().addTo(map);

const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
const pulsosCor = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
const pulsosFreq = { ok:2000, alerta:2000, atenção:2000, critico:2000 };

// Carregar avaliações do Firebase
export async function carregarAvaliacoes(){
  const q = query(collection(db,"avaliacoes"), orderBy("timestamp","desc"));
  const snap = await getDocs(q);

  const ultimos = {}; // manter apenas a última por escola
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe && d.escola){
      if(!ultimos[d.escola]) ultimos[d.escola] = d;
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
export function atualizarPontos(){
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