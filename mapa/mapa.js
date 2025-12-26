// mapa.js
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
const map = L.map("map").setView([-3.7319, -38.5267], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// Layer para pontos
let camadaPontos = L.layerGroup().addTo(map);

// Variáveis globais
let avaliacoes = [];
let pulsoAtivo = true;

// Frequência de pulso em ms
const pulsosFreq = { "critico":1200, "atenção":2400, "alerta":3600, "adequado":4800 };

// Cor por status (do Firebase)
function corPorStatus(status){
  status = status.toLowerCase();
  if(status.includes("crit")) return "#F44336"; // vermelho
  if(status.includes("atenção")) return "#FF9800"; // laranja
  if(status.includes("alerta")) return "#FFD700"; // amarelo
  return "#4CAF50"; // verde (adequado)
}

// Classe CSS para pulso
function classePulso(status){
  if(!pulsoAtivo) return "";
  status = status.toLowerCase();
  if(status.includes("crit")) return "pulse-critico";
  if(status.includes("atenção")) return "pulse-atenção";
  if(status.includes("alerta")) return "pulse-alerta";
  return "pulse-adequado";
}

// Criar marcador de escola
function criarPonto(d){
  let observacao = "";
  const status = d.status.toLowerCase();
  if(status.includes("crit")) observacao = "🔴 Problema grave – intervenção imediata recomendada.";
  else if(status.includes("atenção")) observacao = "🟠 Problema localizado, tendência de evoluir a crítico.";
  else if(status.includes("alerta")) observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else if(status.includes("adequado")) observacao = "🟢 Situação satisfatória – manutenção do acompanhamento.";

  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8,
    color: corPorStatus(d.status),
    fillColor: corPorStatus(d.status),
    fillOpacity:0.8,
    className: classePulso(d.status)
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${observacao}
  `);

  return marker;
}

// Atualizar camada de pontos
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

// Carregar avaliações do Firebase
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes = [];
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.status) avaliacoes.push(d);
  });
}

// Eventos de checkbox
document.querySelectorAll("input").forEach(i=>{
  i.addEventListener("change",()=>{
    pulsoAtivo = togglePulso.checked;
    atualizarPontos();
  });
});

// Inicializa
document.getElementById("togglePulso").checked = true;
document.getElementById("fAdequado").checked = true;
document.getElementById("fAlerta").checked = true;
document.getElementById("fAtencao").checked = true;
document.getElementById("fCritico").checked = true;

await carregarAvaliacoes();
atualizarPontos();