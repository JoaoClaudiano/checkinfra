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

window.map = map;

/* ================= CAMADA ================= */
window.avaliacoes = [];
const camadaPontos = L.layerGroup().addTo(map);
window.camadaPontos = camadaPontos;

/* ================= CORES ================= */
const cores = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  critico: "#F44336"
};

/* ================= CARREGAR AVALIAÇÕES ================= */
async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  const porEscola = {};

  snap.forEach(doc => {
    const d = doc.data();
    if (!d.lat || !d.lng || !d.classe || !d.timestamp) return;

    const id = d.escola || doc.id;

    if (!porEscola[id] || d.timestamp > porEscola[id].timestamp) {
      porEscola[id] = d;
    }
  });

  window.avaliacoes = Object.values(porEscola);
}

/* ================= PULSO ================= */
function aplicarPulso(marker, classe) {
  let visivel = true;
  const freq = 2400;

  setInterval(() => {
    visivel = !visivel;
    marker.setStyle({
      opacity: visivel ? 1 : 0,
      fillOpacity: visivel ? 0.8 : 0
    });
  }, freq);
}

/* ================= CRIAR PONTO ================= */
function criarPonto(d) {
  const classe = d.classe;

  const marker = L.circleMarker([d.lat, d.lng], {
    radius: 8,
    color: cores[classe],
    fillColor: cores[classe],
    fillOpacity: 0.8
  }).bindPopup(`
    <strong>${d.escola || "-"}</strong><br>
    Classe: ${classe}<br>
    Pontuação: ${d.pontuacao ?? "-"}<br>
    Data: ${d.data ?? "-"}
  `);

  if (togglePulso.checked) aplicarPulso(marker, classe);

  return marker;
}

/* ================= ATUALIZAR PONTOS ================= */
function atualizarPontos() {
  camadaPontos.clearLayers();

  window.avaliacoes.forEach(d => {
    if (
      (d.classe === "ok" && !fAdequado.checked) ||
      (d.classe === "alerta" && !fAlerta.checked) ||
      (d.classe === "atenção" && !fAtencao.checked) ||
      (d.classe === "critico" && !fCritico.checked)
    ) return;

    criarPonto(d).addTo(camadaPontos);
  });
}

/* ================= EVENTOS ================= */
document.querySelectorAll("input").forEach(el =>
  el.addEventListener("change", atualizarPontos)
);

/* ================= INICIALIZAÇÃO ================= */
await carregarAvaliacoes();
atualizarPontos();

/* AVISA O MAPA DE BAIRROS */
window.dispatchEvent(new Event("avaliacoesCarregadas"));
