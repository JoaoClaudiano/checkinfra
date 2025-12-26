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

const statusCores = { "ok":"#4CAF50", "critico":"#F44336", "atencao":"#FF9800", "alerta":"#FFD700" };
const pulsosClasse = { "ok":"pulse-green", "critico":"pulse-red", "atencao":"pulse-orange", "alerta":"pulse-yellow" };

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
  const pulso = document.getElementById("togglePulso").checked ? pulsosClasse[d.classe] || "" : "";
  let observacao = "";
  switch(d.classe){
    case "critico": observacao="🔴 Problema grave – intervenção imediata recomendada."; break;
    case "atencao": observacao="🟠 Problema localizado, tendência de evoluir a crítico."; break;
    case "alerta": observacao="🟡 Problema pontual, monitoramento recomendado."; break;
    case "ok": observacao="🟢 Situação satisfatória – manutenção do acompanhamento."; break;
  }
  return L.circleMarker([d.lat,d.lng],{
    radius:8, color:cor, fillColor:cor, fillOpacity:.8, className:pulso
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${observacao}
  `);
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