// ================= MAPA =================
const map = L.map("map").setView([-3.7319, -38.5267], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

window.map = map;

// ================= CAMADA =================
const camadaPontos = L.layerGroup().addTo(map);

// ================= CORES =================
const cores = {
  adequado: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  critico: "#F44336"
};

// ================= FIREBASE =================
firebase.initializeApp({
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
});

const db = firebase.firestore();

// ================= DADOS =================
window.avaliacoes = [];

db.collection("avaliacoes").get().then(snapshot => {
  const ultimas = {};

  snapshot.forEach(doc => {
    const d = doc.data();
    if (!d.lat || !d.lng || !d.classe) return;

    const classe = d.classe === "ok" ? "adequado" : d.classe;
    const chave = d.escola || doc.id;

    if (!ultimas[chave] || d.timestamp > ultimas[chave].timestamp) {
      ultimas[chave] = { ...d, classe };
    }
  });

  window.avaliacoes = Object.values(ultimas);
  desenharPontos();
});

// ================= DESENHO =================
function desenharPontos() {
  camadaPontos.clearLayers();

  window.avaliacoes.forEach(d => {
    const cor = cores[d.classe];

    L.circleMarker([d.lat, d.lng], {
      radius: 8,
      fillColor: cor,
      color: cor,
      fillOpacity: 0.85
    })
    .bindPopup(`<strong>${d.escola}</strong><br>${d.classe}`)
    .addTo(camadaPontos);
  });

  console.log("Pontos carregados:", window.avaliacoes.length);
}