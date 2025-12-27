import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= MAPA ================= */
const map = L.map("map").setView([-3.7319, -38.5267], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let avaliacoes = [];
let camadaPontos = L.layerGroup().addTo(map);

/* ================= CORES ================= */
const statusCores = {
  "adequado": "#4CAF50",
  "alerta": "#FFD700",
  "atenção": "#FF9800",
  "critico": "#F44336",
  "crítico": "#F44336"
};

/* ================= PULSO ================= */
const pulsosFreq = {
  "critico": 2400,
  "crítico": 2400,
  "atenção": 3600,
  "alerta": 3600,
  "adequado": 4800
};

const pulsosCor = {
  "critico": "#F44336",
  "crítico": "#F44336",
  "atenção": "#FF9800",
  "alerta": "#FFD700",
  "adequado": "#4CAF50"
};

/* ================= CARREGAR AVALIAÇÕES ================= */
/* -> pega SOMENTE a avaliação mais recente por escola */
async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  const ultimas = {};

  snap.forEach(doc => {
    const d = doc.data();

    if (d.lat && d.lng && d.classe && d.timestamp) {
      const id = d.escola || doc.id;

      if (!ultimas[id] || d.timestamp > ultimas[id].timestamp) {
        ultimas[id] = d;
      }
    }
  });

  avaliacoes = Object.values(ultimas);
}

/* ================= CRIAR PONTO ================= */
function criarPonto(d) {
  const classe = (d.classe || "").toLowerCase();

  let observacao = "";
  if (classe === "critico" || classe === "crítico")
    observacao = "🔴 Problema grave – intervenção imediata recomendada.";
  else if (classe === "atenção")
    observacao = "🟠 Problema localizado, tendência de evoluir a crítico.";
  else if (classe === "alerta")
    observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else if (classe === "adequado")
    observacao = "🟢 Situação satisfatória – manutenção do acompanhamento.";

  const marker = L.circleMarker([d.lat, d.lng], {
    radius: 8,
    color: statusCores[classe],
    fillColor: statusCores[classe],
    fillOpacity: 0.8
  }).bindPopup(`
    <strong>${d.escola || "Escola"}</strong><br>
    Classe: ${d.classe}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Data: ${d.data || "-"}<br><br>
    ${observacao}
  `);

  if (document.getElementById("togglePulso").checked) {
    aplicarPulso(marker, classe);
  }

  return marker;
}

/* ================= PULSO ================= */
function aplicarPulso(marker, classe) {
  const freq = pulsosFreq[classe] || 3600;
  const cor = pulsosCor[classe] || "#000";
  let grow = true;

  setInterval(() => {
    marker.setStyle({
      radius: grow ? 18 : 8,
      color: cor,
      fillColor: cor
    });
    grow = !grow;
  }, freq);
}

/* ================= ATUALIZAR MAPA ================= */
function atualizarPontos() {
  camadaPontos.clearLayers();

  avaliacoes.forEach(d => {
    const c = d.classe.toLowerCase();

    if (
      (c === "adequado" && !fAdequado.checked) ||
      (c === "alerta" && !fAlerta.checked) ||
      (c === "atenção" && !fAtencao.checked) ||
      ((c === "critico" || c === "crítico") && !fCritico.checked)
    ) return;

    criarPonto(d).addTo(camadaPontos);
  });
}

/* ================= EVENTOS ================= */
document.querySelectorAll("input").forEach(el => {
  el.addEventListener("change", atualizarPontos);
});

/* ================= INICIALIZAÇÃO ================= */
document.getElementById("togglePulso").checked = true;
document.getElementById("fAdequado").checked = true;
document.getElementById("fAlerta").checked = true;
document.getElementById("fAtencao").checked = true;
document.getElementById("fCritico").checked = true;

await carregarAvaliacoes();
atualizarPontos();