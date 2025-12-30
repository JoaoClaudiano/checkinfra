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
let dadosOriginais = []; // dados vindos do API
let modoIndicador = 1;   // 1 = Densidade Crítica, 2 = Concentração Relativa

/* =========================
   FUNÇÃO DE DEBUG
========================= */
function logDados() {
  console.log("Dados originais:", dadosOriginais);
}

/* =========================
   FUNÇÃO DE GRID
========================= */
function gerarGrid(bounds, tamanho) {
  const grid = [];
  for (let lat = bounds.getSouth(); lat < bounds.getNorth(); lat += tamanho) {
    for (let lng = bounds.getWest(); lng < bounds.getEast(); lng += tamanho) {
      grid.push({ bounds: [[lat, lng], [lat + tamanho, lng + tamanho]], peso: 0 });
    }
  }
  return grid;
}

/* =========================
   FUNÇÃO PRINCIPAL: RECALCULAR MAPA
========================= */
function recalcularMapa(dados) {
  camadaZonas.clearLayers();
  camadaHeatmap.setLatLngs([]);

  const bounds = map.getBounds();
  const grid = gerarGrid(bounds, 0.01);
  let maxPeso = 0;

  dados.forEach(e => {
    if (!e.lat || !e.lng) return; // ignora pontos sem coordenadas

    let peso = 0;
    if (modoIndicador === 1) peso = e.status.includes("crítica") ? 1.5 : e.status.includes("alerta") ? 1.0 : 0.3;
    if (modoIndicador === 2) peso = e.status.includes("crítica") ? 1.2 : e.status.includes("alerta") ? 0.8 : 0.3;

    // adiciona ao heatmap
    camadaHeatmap.addLatLng([e.lat, e.lng, peso]);

    // adiciona ao grid para zonas prioritárias
    grid.forEach(c => {
      const [[a, b], [c2, d]] = c.bounds;
      if (e.lat >= a && e.lat < c2 && e.lng >= b && e.lng < d) c.peso += peso;
      maxPeso = Math.max(maxPeso, c.peso);
    });
  });

  // Ranking top 5
  const ranking = grid
    .filter(c => c.peso > 0)
    .sort((a, b) => b.peso - a.peso)
    .slice(0, 5);

  const lista = document.getElementById("listaRanking");
  lista.innerHTML = "";

  ranking.forEach((c, i) => {
    const indice = Math.round((c.peso / maxPeso) * 100);
    lista.innerHTML += `<li>Zona ${i + 1} — Índice Territorial: ${indice}</li>`;

    // adiciona retângulo ao mapa
    L.rectangle(c.bounds, {
      color: "#de2d26",
      fillOpacity: 0.4,
      weight: 1
    }).addTo(camadaZonas);
  });
}

/* =========================
   EVENTOS DO MAPA
========================= */
// Fetch de dados da API
const API_URL = "https://script.google.com/macros/s/AKfycbyt4wD8LQ67NOD-Zz7EEvfc7RuYEhKDYE50gkK7rp-47idg6STKUGqk5pYVDclamentdQ/exec";

fetch(API_URL)
  .then(r => r.json())
  .then(d => {
    dadosOriginais = d;
    logDados(); // debug
    recalcularMapa(dadosOriginais);
  })
  .catch(err => console.error("Erro ao carregar dados:", err));

// Mudança de indicador
document.getElementById("seletorIndicador").addEventListener("change", e => {
  modoIndicador = Number(e.target.value);
  recalcularMapa(dadosOriginais);
});

// Toggle zonas prioritárias
document.getElementById("toggleZonas").addEventListener("change", e => {
  e.target.checked ? map.addLayer(camadaZonas) : map.removeLayer(camadaZonas);
});

/* =========================
   FUNÇÕES DE AJUSTE
========================= */
// Caso queira atualizar o mapa ao mover/zoom
map.on("moveend", () => recalcularMapa(dadosOriginais));