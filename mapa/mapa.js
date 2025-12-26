import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{ attribution:"© OpenStreetMap"}).addTo(map);

let avaliacoes = [];
let camadaPontos = L.layerGroup().addTo(map);

// cores por classe
const statusCores = { ok:"#4CAF50", critico:"#F44336", atencao:"#FF9800", alerta:"#FFD700" };

// frequência de pulso em ms
const pulsosFreq = { critico:1200, atencao:2400, alerta:3600, ok:4800 };

async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes=[];
  const mapId = new Map();
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe){
      const key = `${d.lat}-${d.lng}`;
      if(!mapId.has(key) || new Date(d.data) > new Date(mapId.get(key).data)){
        mapId.set(key,d);
      }
    }
  });
  avaliacoes = Array.from(mapId.values());
}

function criarPonto(d){
  const cor = statusCores[d.classe] || "#000";
  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8,
    color:cor,
    fillColor:cor,
    fillOpacity:.8
  }).bindPopup(`<strong>${d.escola}</strong><br>Status: ${d.status}<br>Pontuação: ${d.pontuacao || "-"}<br>Última avaliação: ${d.data || "-"}<br>Observação: ${d.classe}`);

  // pulso suave
  if(document.getElementById("togglePulso").checked){
    const freq = pulsosFreq[d.classe] || 2400;
    let opacity = 0.8;
    const step = 0.02;
    let fadeOut = true;
    setInterval(()=>{
      opacity = fadeOut ? opacity-step : opacity+step;
      if(opacity<=0){ fadeOut=false; opacity=0; }
      if(opacity>=0.8){ fadeOut=true; opacity=0.8; }
      marker.setStyle({ fillOpacity: opacity });
    }, freq/40); // divide o tempo em passos suaves
  }

  return marker;
}

function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const s = d.classe;
    if((s=="ok" && !fAdequado.checked) || (s=="alerta" && !fAlerta.checked) ||
       (s=="atencao" && !fAtencao.checked) || (s=="critico" && !fCritico.checked)) return;
    criarPonto(d).addTo(camadaPontos);
  });
}

document.querySelectorAll("input").forEach(i=>i.addEventListener("change", atualizarPontos));

document.getElementById("togglePulso").checked=true;
document.getElementById("fAdequado").checked=true;
document.getElementById("fAlerta").checked=true;
document.getElementById("fAtencao").checked=true;
document.getElementById("fCritico").checked=true;

await carregarAvaliacoes();
atualizarPontos();