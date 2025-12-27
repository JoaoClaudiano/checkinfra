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
   MAPA BASE
================================ */
const map = L.map("map").setView([-3.7319, -38.5267], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/* ===============================
   CAMADAS
================================ */
let camadaPulsos = L.layerGroup().addTo(map);
let avaliacoes = [];

/* ===============================
   CORES POR CLASSE (FONTE ÚNICA)
================================ */
const coresPorClasse = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  critico: "#F44336"
};

/* ===============================
   FREQUÊNCIA DOS PULSOS (ms)
================================ */
const pulsoTempo = {
  critico: 1200,
  alerta: 2400,
  atenção: 2400,
  ok: 4800
};

/* ===============================
   CARREGAR AVALIAÇÕES
   → mantém apenas a MAIS RECENTE
================================ */
async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));

  const porEscola = {};

  snap.forEach(doc => {
    const d = doc.data();

    if (!d.escola || !d.lat || !d.lng || !d.classe || !d.data) return;

    const atual = porEscola[d.escola];

    if (
      !atual ||
      d.data.toDate() > atual.data.toDate()
    ) {
      porEscola[d.escola] = d;
    }
  });

  avaliacoes = Object.values(porEscola);
}

/* ===============================
   CRIAR PULSO (SEM PONTO FIXO)
================================ */
function criarPulso(d) {
  const classe = d.classe;
  const cor = coresPorClasse[classe];
  const tempo = pulsoTempo[classe];

  const pulseIcon = L.divIcon({
    className: "pulse-wrapper",
    iconSize: [20, 20],
    html: `
      <div class="pulse"
           style="
             background:${cor};
             animation-duration:${tempo}ms;
           ">
      </div>
    `
  });

  const marker = L.marker([d.lat, d.lng], {
    icon: pulseIcon,
    interactive: true
  });

  marker.bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status || "-"}<br>
    Classe: ${d.classe}<br>
    Pontuação: ${d.pontuacao ?? "-"}<br>
    Última avaliação: ${
      d.data?.toDate
        ? d.data.toDate().toLocaleDateString("pt-BR")
        : "-"
    }
  `);

  return marker;
}

/* ===============================
   ATUALIZAR MAPA
================================ */
function atualizarMapa() {
  camadaPulsos.clearLayers();

  const pulsoAtivo = document.getElementById("togglePulso").checked;

  avaliacoes.forEach(d => {
    const classe = d.classe;

    if (
      (classe === "ok" && !fAdequado.checked) ||
      (classe === "alerta" && !fAlerta.checked) ||
      (classe === "atenção" && !fAtencao.checked) ||
      (classe === "critico" && !fCritico.checked)
    ) return;

    if (pulsoAtivo) {
      criarPulso(d).addTo(camadaPulsos);
    }
  });
}

/* ===============================
   EVENTOS
================================ */
document
  .querySelectorAll(
    "#fAdequado, #fAlerta, #fAtencao, #fCritico, #togglePulso"
  )
  .forEach(el => {
    el.addEventListener("change", atualizarMapa);
  });

/* ===============================
   INICIALIZAÇÃO
================================ */
await carregarAvaliacoes();
atualizarMapa();