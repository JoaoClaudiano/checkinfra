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

const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
const pulsosFreq = { critico:1200, atenção:2400, alerta:3600, ok:4800 };

async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  const ultimos = {};
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe){
      ultimos[d.escola] = d; // mantém só o último por escola
    }
  });
  avaliacoes = Object.values(ultimos);
}

function criarPonto(d){
  const cor = cores[d.classe] || "#000";
  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8, color:cor, fillColor:cor, fillOpacity:.8
  }).bindPopup(`<strong>${d.escola}</strong><br>Status: ${d.status}<br>Pontuação: ${d.pontuacao || "-"}<br>Última avaliação: ${d.data || "-"}`);

  if(document.getElementById("togglePulso").checked){
    const freq = pulsosFreq[d.classe] || 2400;
    const pulse = L.circle([d.lat,d.lng],{
      radius:8, color:cor, fillColor:cor, fillOpacity:0.5
    }).addTo(camadaPontos);

    let op = 0.5;
    let growing = true;
    setInterval(()=>{
      if(growing){ op -= 0.05; if(op<=0){ op=0; growing=false; } }
      else { op +=0.05; if(op>=0.5){ op=0.5; growing=true; } }
      pulse.setStyle({ fillOpacity: op });
    }, freq/10);
  }

  return marker;
}

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

await carregarAvaliacoes();
atualizarPontos();