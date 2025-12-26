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

const statusCores = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atencao: "#FF9800",
  critico: "#F44336"
};

const bola = {
  ok: "🟢",
  alerta: "🟡",
  atencao: "🟠",
  critico: "🔴"
};

// Frequência dos pulsos em milissegundos
const pulsosFreq = { critico:1200, atencao:2400, alerta:3600, ok:4800 };

// Carrega dados do Firebase
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes = [];
  snap.forEach(doc => {
    const d = doc.data();
    if(d.lat && d.lng && d.classe) avaliacoes.push(d);
  });
}

// Cria cada ponto com tooltip e pulso
function criarPonto(d){
  const classe = (d.classe||"").toLowerCase();
  const cor = statusCores[classe] || "#000";

  let observacao = "";
  switch(classe){
    case "critico": observacao="🔴 Problema grave – intervenção imediata recomendada."; break;
    case "atencao": observacao="🟠 Problema localizado, tendência de evoluir a crítico."; break;
    case "alerta": observacao="🟡 Problema pontual, monitoramento recomendado."; break;
    case "ok": observacao="🟢 Situação satisfatória – manutenção do acompanhamento."; break;
    default: observacao="Sem classificação";
  }

  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8,
    color: cor,
    fillColor: cor,
    fillOpacity:0.8
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status || "-"}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${observacao}
  `);

  if(document.getElementById("togglePulso").checked){
    ativarPulso(marker, classe);
  }

  return marker;
}

// Função de pulso
function ativarPulso(marker, classe){
  const freq = pulsosFreq[classe] || 2400;
  let growing = true;
  let r = 8;

  setInterval(()=>{
    r = growing ? 12 : 8; // pulso leve
    marker.setStyle({ radius: r });
    growing = !growing;
  }, freq);
}

// Atualiza pontos no mapa
function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const classe = (d.classe||"").toLowerCase();
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

// Adiciona eventos de checkbox
document.querySelectorAll("input").forEach(i => i.addEventListener("change", atualizarPontos));

// Ativa mapa vivo e checkbox por padrão
document.getElementById("togglePulso").checked = true;
document.getElementById("fAdequado").checked = true;
document.getElementById("fAlerta").checked = true;
document.getElementById("fAtencao").checked = true;
document.getElementById("fCritico").checked = true;

// Inicializa
await carregarAvaliacoes();
atualizarPontos();
