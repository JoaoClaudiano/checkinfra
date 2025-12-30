
/* =========================
   MAPA PRINCIPAL
========================= */
const map = L.map("map").setView([-3.7319, -38.5267], 12);

// TileLayer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/* =========================
   CAMADAS
========================= */
const camadaHeatmap = L.heatLayer([], {
  radius: 35,
  blur: 25,
  minOpacity: 0.35
}).addTo(map);

const camadaZonas = L.layerGroup().addTo(map);

/* =========================
   VARIÁVEIS GLOBAIS
========================= */
let dadosOriginais = [];
let modoIndicador = 1;

/* =========================
   FUNÇÃO DE DEBUG
========================= */
function logDados() {
  console.log("Dados originais:", dadosOriginais);
}

/* =========================
   CARREGAMENTO DE DADOS
========================= */
const API_URL = "https://script.google.com/macros/s/AKfycbyt4wD8LQ67NOD-Zz7EEvfc7RuYEhKDYE50gkK7rp-47idg6STKUGqk5pYVDclamentdQ/exec";

fetch(API_URL)
  .then(r => r.json())
  .then(d => {
    dadosOriginais = d;
    logDados();
    
    // Chamar função de recalculo que agora está em recalculos.js
    if (typeof recalcularMapa === 'function') {
      recalcularMapa(dadosOriginais);
    } else {
      console.error("Erro: função recalcularMapa não encontrada!");
      // Fallback básico
      d.forEach(e => {
        if (e.lat && e.lng) {
          camadaHeatmap.addLatLng([e.lat, e.lng, 0.5]);
        }
      });
    }
  })
  .catch(err => console.error("Erro ao carregar dados:", err));

// REMOVIDO: funções gerarGrid e recalcularMapa duplicadas
// (elas já existem em recalculos.js)

/* =========================
   EVENTOS DO MAPA
========================= */
// Recalcular ao mover/zoom o mapa
map.on("moveend", () => {
  if (typeof recalcularMapa === 'function') {
    recalcularMapa(dadosOriginais);
  }
});

// Mudança de indicador (removido - agora está em eventos.js)
// Toggle zonas prioritárias (removido - agora está em eventos.js)

