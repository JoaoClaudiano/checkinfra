import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase
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

let avaliacoes = [];
let camadaPontos = L.layerGroup().addTo(map);

const statusCores = {
  "adequado":"#4CAF50",
  "alerta":"#FFD700",
  "atenção":"#FF9800",
  "critico":"#F44336",
  "crítico":"#F44336"
};

const pulsosFreq = { "critico":1200, "atenção":2400, "alerta":3600, "adequado":4800 };

// Normalize status (remove acentos, lowercase)
function normalizeStatus(status){
  return status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

// Cria ponto com tooltip
function criarPonto(d){
  const status = normalizeStatus(d.status||"adequado");
  const cor = statusCores[status] || "#000";
  
  let observacao = "";
  if(status.includes("crit")) observacao = "🔴 Problema grave – intervenção imediata recomendada.";
  else if(status.includes("atenção")) observacao = "🟠 Problema localizado, tendência de evoluir a crítico.";
  else if(status.includes("alerta")) observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else if(status.includes("adequado")) observacao = "🟢 Situação satisfatória – manutenção do acompanhamento.";

  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8,
    color:cor,
    fillColor:cor,
    fillOpacity:.8
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${observacao}
  `);

  // Pulso colorido
  if(document.getElementById("togglePulso").checked) pulso(marker,status);

  return marker;
}

// Pulso animado via CSS (não altera o raio)
function pulso(marker,status){
  const freq = pulsosFreq[status] || 2400;
  const pulsante = L.circle(marker.getLatLng(),{
    radius:12,
    color: statusCores[status],
    fillColor: statusCores[status],
    fillOpacity:0.3,
    interactive:false
  }).addTo(map);

  setInterval(()=>{
    pulsante.setStyle({ fillOpacity: pulsante.options.fillOpacity === 0.3 ? 0.8 : 0.3 });
  }, freq);
}

// Atualiza camada de pontos
function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const s = normalizeStatus(d.status);
    if(
      (s.includes("adequado") && !fAdequado.checked) ||
      (s.includes("alerta") && !fAlerta.checked) ||
      (s.includes("atenção") && !fAtencao.checked) ||
      (s.includes("crit") && !fCritico.checked)
    ) return;
    criarPonto(d).addTo(camadaPontos);
  });
}

// Carrega avaliações do Firestore
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes=[];
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.status) avaliacoes.push(d);
  });
}

// Eventos checkbox
document.querySelectorAll("input").forEach(i=>{
  i.addEventListener("change", atualizarPontos);
});

// Ativar mapa vivo e checkbox por padrão
document.getElementById("togglePulso").checked = true;
document.getElementById("fAdequado").checked = true;
document.getElementById("fAlerta").checked = true;
document.getElementById("fAtencao").checked = true;
document.getElementById("fCritico").checked = true;

// Inicializa
await carregarAvaliacoes();
atualizarPontos();
