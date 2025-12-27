/* ================= FIREBASE ================= */

firebase.initializeApp({
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
});

const db = firebase.firestore();

/* ================= MAPA ================= */

const map = L.map("map").setView([-3.7319, -38.5267], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

const camadaPontos = L.layerGroup().addTo(map);

/* ================= CORES ================= */

const cores = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  atencao: "#FF9800",
  critico: "#F44336"
};

/* ================= MAPA VIVO ================= */

function aplicarPulso(marker, tempo) {
  let visivel = true;
  setInterval(() => {
    visivel = !visivel;
    marker.setStyle({
      opacity: visivel ? 1 : 0,
      fillOpacity: visivel ? 0.8 : 0
    });
  }, tempo);
}

/* ================= CARREGAR AVALIAÇÕES ================= */

function carregarAvaliacoes() {
  db.collection("avaliacoes").get().then(snap => {
    const ultimas = {};

    snap.forEach(doc => {
      const d = doc.data();
      if (!d.lat || !d.lng || !d.classe || !d.timestamp) return;

      if (!ultimas[d.escola] || d.timestamp > ultimas[d.escola].timestamp) {
        ultimas[d.escola] = d;
      }
    });

    desenharPontos(Object.values(ultimas));
  });
}

/* ================= DESENHAR ================= */

function desenharPontos(avaliacoes) {
  camadaPontos.clearLayers();

  avaliacoes.forEach(d => {
    const c = d.classe.toLowerCase();
    const cor = cores[c];
    if (!cor) return;

    if (
      (c === "ok" && !fAdequado.checked) ||
      (c === "alerta" && !fAlerta.checked) ||
      ((c === "atenção" || c === "atencao") && !fAtencao.checked) ||
      (c === "critico" && !fCritico.checked)
    ) return;

    const marker = L.circleMarker([d.lat, d.lng], {
      radius: 7,
      color: cor,
      fillColor: cor,
      fillOpacity: 0.8
    }).bindPopup(`
      <strong>${d.escola}</strong><br>
      Classe: ${d.classe}<br>
      Data: ${d.data || "-"}
    `);

    if (togglePulso.checked) {
      aplicarPulso(marker, c === "critico" ? 1200 : 2400);
    }

    marker.addTo(camadaPontos);
  });
}

/* ================= EVENTOS ================= */

document.querySelectorAll(".painel input").forEach(i =>
  i.addEventListener("change", carregarAvaliacoes)
);

/* ================= INIT ================= */

carregarAvaliacoes();