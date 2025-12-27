import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   FIREBASE
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===============================
   MAPA
================================ */
const map = L.map("map").setView([-3.7319, -38.5267], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let avaliacoes = [];
let camadaPontos = L.layerGroup().addTo(map);

/* ===============================
   CORES E FREQUÊNCIAS (CLASSE)
================================ */
const coresClasse = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  critico: "#F44336"
};

const pulsoFreq = {
  critico: 1200,
  atenção: 2400,
  alerta: 2400,
  ok: 4800
};

/* ===============================
   CARREGAR AVALIAÇÕES
   → mantém apenas a MAIS RECENTE
================================ */
async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  const ultimas = {};

  snap.forEach(doc => {
    const d = doc.data();
    if (!d.lat || !d.lng || !d.classe || !d.escola) return;

    const ts = d.timestamp?.seconds || 0;

    if (!ultimas[d.escola] || ts > ultimas[d.escola].timestamp) {
      ultimas[d.escola] = {
        ...d,
        timestamp: ts
      };
    }
  });

  avaliacoes = Object.values(ultimas);
}

/* ===============================
   PULSO (APARECE / DESAPARECE)
================================ */
function aplicarPulso(latlng, classe) {
  const freq = pulsoFreq[classe] || 2400;
  const cor = coresClasse[classe];

  setInterval(() => {
    const pulso = L.circleMarker(latlng, {
      radius: 8,
      color: cor,
      fillColor: cor,
      fillOpacity: 0.85
    }).addTo(camadaPontos);

    setTimeout(() => {
      camadaPontos.removeLayer(pulso);
    }, 700);
  }, freq);
}

/* ===============================
   CRIAR PONTO
================================ */
function criarPonto(d) {
  const classe = d.classe;
  const cor = coresClasse[classe];
  if (!cor) return null;

  const latlng = [d.lat, d.lng];

  const popup = `
    <strong>${d.escola}</strong><br>
    Classe: ${classe}<br>
    Status: ${d.status || "-"}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}
  `;

  // MAPA VIVO
  if (togglePulso.checked) {
    aplicarPulso(latlng, classe);
    return null;
  }

  // MAPA ESTÁTICO
  return L.circleMarker(latlng, {
    radius: 8,
    color: cor,
    fillColor: cor,
    fillOpacity: 0.85
  }).bindPopup(popup);
}

/* ===============================
   ATUALIZAR PONTOS
================================ */
function atualizarPontos() {
  camadaPontos.clearLayers();

  avaliacoes.forEach(d => {
    const c = d.classe;

    if (
      (c === "ok" && !fAdequado.checked) ||
      (c === "alerta" && !fAlerta.checked) ||
      (c === "atenção" && !fAtencao.checked) ||
      (c === "critico" && !fCritico.checked)
    ) return;

    const marker = criarPonto(d);
    if (marker) marker.addTo(camadaPontos);
  });
}

/* ===============================
   EVENTOS
================================ */
[
  fAdequado,
  fAlerta,
  fAtencao,
  fCritico,
  togglePulso
].forEach(el => {
  el.addEventListener("change", atualizarPontos);
});

/* ===============================
   INIT
================================ */
await carregarAvaliacoes();
atualizarPontos();