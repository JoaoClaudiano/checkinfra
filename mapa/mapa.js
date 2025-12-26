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
const camadaPontos = L.layerGroup().addTo(map);

const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

function criarPulso(lat,lng,cor){
  const pulseDiv = L.divIcon({
    className: "pulse-dot",
    iconSize: [12,12],
    html:`<div style="background:${cor};"></div>`
  });
  const marker = L.marker([lat,lng], {icon:pulseDiv});
  marker.addTo(camadaPontos);
}

function criarPonto(d){
  const cor = cores[d.classe] || "#000";
  if(document.getElementById("togglePulso").checked){
    criarPulso(d.lat,d.lng,cor);
    return null;
  } else {
    return L.circleMarker([d.lat,d.lng],{
      radius:8,
      color:cor,
      fillColor:cor,
      fillOpacity:0.8
    }).bindPopup(`<strong>${d.escola}</strong><br>Status: ${d.status}<br>Pontuação: ${d.pontuacao || "-"}<br>Última avaliação: ${d.data || "-"}`);
  }
}

async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  const ultimos = {};
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe) ultimos[d.escola] = d;
  });
  avaliacoes = Object.values(ultimos);
}

function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const s = d.classe;
    if((s==="ok" && !fAdequado.checked) ||
       (s==="alerta" && !fAlerta.checked) ||
       (s==="atenção" && !fAtencao.checked) ||
       (s==="critico" && !fCritico.checked)) return;

    const marker = criarPonto(d);
    if(marker) marker.addTo(camadaPontos);
  });
}

document.querySelectorAll("#fAdequado,#fAlerta,#fAtencao,#fCritico,#togglePulso")
  .forEach(el=>el.addEventListener("change", atualizarPontos));

await carregarAvaliacoes();
atualizarPontos();