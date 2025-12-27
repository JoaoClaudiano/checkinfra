import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   Estado global único
================================ */
window.CheckInfra = {
  avaliacoes: [],
  prontas: false
};

/* ===============================
   Firebase
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===============================
   Mapa
================================ */
const map = L.map("map").setView([-3.7319, -38.5267], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

window.map = map; // 👈 necessário para mapabairros.js

let camadaPontos = L.layerGroup().addTo(map);

/* ===============================
   Cores e pulso
================================ */
const cores = {
  adequado: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  atencao: "#FF9800",
  critico: "#F44336",
  crítico: "#F44336"
};

const pulsosFreq = {
  adequado: 4800,
  alerta: 3600,
  atenção: 2400,
  atencao: 2400,
  critico: 1200,
  crítico: 1200
};

/* ===============================
   Carregar avaliações (mais recente)
================================ */
async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  const porEscola = {};

  snap.forEach(doc => {
    const d = doc.data();
    if (!d.lat || !d.lng || !d.classe || !d.timestamp) return;

    const id = d.escolaId || d.escola || doc.id;

    if (!porEscola[id] || d.timestamp > porEscola[id].timestamp) {
      porEscola[id] = d;
    }
  });

  window.CheckInfra.avaliacoes = Object.values(porEscola);
  window.CheckInfra.prontas = true;

  window.dispatchEvent(new Event("avaliacoesProntas"));
}

/* ===============================
   Criar ponto
================================ */
function criarPonto(d) {
  const classe = d.classe.toLowerCase();
  const cor = cores[classe] || "#999";

  const marker = L.circleMarker([d.lat, d.lng], {
    radius: 8,
    color: cor,
    fillColor: cor,
    fillOpacity: 0.85
  }).bindPopup(`
    <strong>${d.escola || "-"}</strong><br>
    Classe: ${d.classe}<br>
    Pontuação: ${d.pontuacao ?? "-"}<br>
    Data: ${d.data ?? "-"}
  `);

  if (togglePulso.checked) aplicarPulso(marker, classe);

  return marker;
}

/* ===============================
   Pulso: aparece / desaparece
================================ */
function aplicarPulso(marker, classe) {
  const freq = pulsosFreq[classe] || 3000;
  let visivel = true;

  setInterval(() => {
    visivel = !visivel;
    marker.setStyle({
      opacity: visivel ? 1 : 0,
      fillOpacity: visivel ? 0.85 : 0
    });
  }, freq);
}

/* ===============================
   Atualizar pontos
================================ */
function atualizarPontos() {
  camadaPontos.clearLayers();

  window.CheckInfra.avaliacoes.forEach(d => {
    const c = d.classe.toLowerCase();

    if (
      (c.includes("adequado") && !fAdequado.checked) ||
      (c.includes("alerta") && !fAlerta.checked) ||
      ((c.includes("atenção") || c.includes("atencao")) && !fAtencao.checked) ||
      (c.includes("crit") && !fCritico.checked)
    ) return;

    criarPonto(d).addTo(camadaPontos);
  });
}

/* ===============================
   Eventos
================================ */
document.querySelectorAll("input").forEach(i =>
  i.addEventListener("change", atualizarPontos)
);

/* ===============================
   Inicialização
================================ */
await carregarAvaliacoes();
atualizarPontos();