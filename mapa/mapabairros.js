let camadaBairros = null;

const toggleBairros = document.getElementById("toggleBairros");

/* ===============================
   Escuta ANTES de testar
================================ */
window.addEventListener("avaliacoesProntas", () => {
  if (toggleBairros.checked) ativarLeituraPorBairros();
});

/* ===============================
   Checkbox
================================ */
toggleBairros.addEventListener("change", e => {
  if (e.target.checked) {
    ativarLeituraPorBairros();
  } else {
    removerLeituraPorBairros();
  }
});

/* ===============================
   Ativar leitura por bairros
================================ */
async function ativarLeituraPorBairros() {
  if (!window.CheckInfra.prontas) {
    console.warn("Leitura por bairros: aguardando avaliações…");
    return;
  }

  if (camadaBairros) return;

  const res = await fetch("./dados/bairros.geojson");
  const geojson = await res.json();

  camadaBairros = L.geoJSON(geojson, {
    style: feature => {
      const d = calcularIndicadores(feature);
      return {
        color: "#333",
        weight: 1,
        fillOpacity: d.total === 0 ? 0 : 0.6,
        fillColor: d.cor
      };
    },
    onEachFeature: (feature, layer) => {
      const d = calcularIndicadores(feature);
      layer.bindTooltip(`
        <strong>${feature.properties.nome}</strong><br>
        Avaliações: ${d.total}<br>
        Crítico: ${d.critico}<br>
        Atenção: ${d.atencao}<br>
        Alerta: ${d.alerta}<br>
        Adequado: ${d.adequado}
      `);
    }
  }).addTo(window.map);
}

/* ===============================
   Remover
================================ */
function removerLeituraPorBairros() {
  if (camadaBairros) {
    window.map.removeLayer(camadaBairros);
    camadaBairros = null;
  }
}

/* ===============================
   Cálculo por bairro
================================ */
function calcularIndicadores(feature) {
  const pts = window.CheckInfra.avaliacoes.filter(a =>
    turf.booleanPointInPolygon(
      turf.point([a.lng, a.lat]),
      feature
    )
  );

  const d = {
    total: pts.length,
    adequado: 0,
    alerta: 0,
    atencao: 0,
    critico: 0,
    cor: "transparent"
  };

  pts.forEach(p => {
    const c = p.classe.toLowerCase();
    if (c.includes("adequado")) d.adequado++;
    else if (c.includes("alerta")) d.alerta++;
    else if (c.includes("atenção") || c.includes("atencao")) d.atencao++;
    else if (c.includes("crit")) d.critico++;
  });

  if (d.critico) d.cor = "#F44336";
  else if (d.atencao) d.cor = "#FF9800";
  else if (d.alerta) d.cor = "#FFD700";
  else if (d.adequado) d.cor = "#4CAF50";

  return d;
}