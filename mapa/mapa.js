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

// Mapeamento das cores por classe
const coresClasse = {
  ok:"#4CAF50",
  alerta:"#FFD700",
  atencao:"#FF9800",
  critico:"#F44336"
};

// Frequência do pulso por classe (ms)
const freqPulso = {
  critico:1200,
  atencao:2400,
  alerta:3600,
  ok:4800
};

// Função para criar o marcador
function criarPonto(d){
  const classe = (d.classe || "ok").toLowerCase();
  const cor = coresClasse[classe] || "#000";

  let observacao = "";
  if(classe === "critico") observacao = "🔴 Problema grave – intervenção imediata recomendada.";
  else if(classe === "atencao") observacao = "🟠 Problema localizado, tendência de evoluir a crítico.";
  else if(classe === "alerta") observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else if(classe === "ok") observacao = "🟢 Situação satisfatória – manutenção do acompanhamento.";

  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8,
    color:cor,
    fillColor:cor,
    fillOpacity:0.8
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Classe: ${d.classe}<br>
    Status: ${d.status}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${observacao}
  `);

  // Pulsos
  if(document.getElementById("togglePulso").checked){
    pulsar(marker, classe);
  }

  return marker;
}

// Função para animar pulsos
function pulsar(marker, classe){
  const freq = freqPulso[classe] || 2400;
  const cor = coresClasse[classe] || "#000";
  let increasing = true;
  let radius = 8;

  setInterval(()=>{
    radius = increasing ? 12 : 8;
    marker.setStyle({ radius: radius, color: cor, fillColor: cor });
    increasing = !increasing;
  }, freq);
}

// Atualizar pontos no mapa
function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const classe = (d.classe || "ok").toLowerCase();
    if(
      (classe==="ok" && !fAdequado.checked) ||
      (classe==="alerta" && !fAlerta.checked) ||
      (classe==="atencao" && !fAtencao.checked) ||
      (classe==="critico" && !fCritico.checked)
    ) return;

    const marker = criarPonto(d);
    marker.addTo(camadaPontos);
  });
}

// Carregar dados do Firebase
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes=[];
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe) avaliacoes.push(d);
  });
}

// Checkbox
const fAdequado = document.getElementById("fAdequado");
const fAlerta = document.getElementById("fAlerta");
const fAtencao = document.getElementById("fAtencao");
const fCritico = document.getElementById("fCritico");

document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico, #togglePulso").forEach(i=>{
  i.addEventListener("change", atualizarPontos);
});

// Ativar mapa vivo e checkbox por padrão
document.getElementById("togglePulso").checked = true;
fAdequado.checked = true;
fAlerta.checked = true;
fAtencao.checked = true;
fCritico.checked = true;

await carregarAvaliacoes();
atualizarPontos();