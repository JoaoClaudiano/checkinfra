import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===== FIREBASE ===== */
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===== MAPA ===== */
export const map = L.map("map").setView([-3.7319,-38.5267],12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
  attribution:"© OpenStreetMap"
}).addTo(map);

/* ===== CAMADAS ===== */
export const camadaPontos = L.layerGroup().addTo(map);
export const camadaPulso = L.layerGroup().addTo(map);

/* ===== CORES ===== */
export const cores = {
  ok:"#4CAF50",
  alerta:"#FFD700",
  atenção:"#FF9800",
  critico:"#F44336"
};

/* ===== FREQUÊNCIA DO PULSO (ms) ===== */
const frequencia = {
  ok:3000,
  alerta:1500,
  atenção:1500,
  critico:800
};

/* ===== BUSCAR AVALIAÇÕES MAIS RECENTES ===== */
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  const ultimas = {};

  snap.forEach(doc=>{
    const d = doc.data();
    if(!d.lat || !d.lng || !d.escola || !d.data) return;

    if(!ultimas[d.escola] || new Date(d.data) > new Date(ultimas[d.escola].data)){
      ultimas[d.escola] = d;
    }
  });

  return Object.values(ultimas);
}

/* ===== CRIAR PULSO (SEM PONTO FIXO) ===== */
function criarPulso(d){
  const cor = cores[d.classe] || "#000";

  const icon = L.divIcon({
    className:"pulse-dot",
    iconSize:[14,14],
    html:`<div style="background:${cor}"></div>`
  });

  const marker = L.marker([d.lat,d.lng],{icon});
  camadaPulso.addLayer(marker);

  setTimeout(()=>camadaPulso.removeLayer(marker),1200);
}

/* ===== LOOP DO MAPA VIVO ===== */
async function iniciarMapaVivo(){
  const avaliacoes = await carregarAvaliacoes();

  avaliacoes.forEach(d=>{
    setInterval(()=>criarPulso(d), frequencia[d.classe] || 2000);
  });
}

/* ===== LEGENDA ===== */
const legenda = L.control({position:"bottomright"});
legenda.onAdd = function(){
  const div = L.DomUtil.create("div","legenda");
  div.innerHTML = `
    <strong>Status</strong><br>
    <span class="bola ok"></span> Adequado<br>
    <span class="bola alerta"></span> Alerta<br>
    <span class="bola atencao"></span> Atenção<br>
    <span class="bola critico"></span> Crítico
  `;
  return div;
};
legenda.addTo(map);

/* ===== START ===== */
iniciarMapaVivo();