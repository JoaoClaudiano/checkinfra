// ===============================
// LEITURA TERRITORIAL POR BAIRROS
// ===============================

let camadaBairros = null;
let bairrosAtivos = false;

// Checkbox
const toggleBairros = document.getElementById("toggleBairros");
toggleBairros.addEventListener("change", () => {
  if (toggleBairros.checked) {
    ativarLeituraPorBairros();
  } else {
    desativarLeituraPorBairros();
  }
});

async function ativarLeituraPorBairros() {
  if (!window.avaliacoes || window.avaliacoes.length === 0) {
    console.warn("Leitura por bairros: avaliações ainda não carregadas");
    return;
  }

  if (camadaBairros) {
    map.addLayer(camadaBairros);
    bairrosAtivos = true;
    return;
  }

  try {
    const resp = await fetch("./POLIGONAIS.geojson");
    const geojson = await resp.json();

    camadaBairros = L.geoJSON(geojson, {
      style: feature => estiloBairro(feature, window.avaliacoes),
      onEachFeature: (feature, layer) => {
        const html = tooltipBairro(feature, window.avaliacoes);
        layer.bindTooltip(html, { sticky: true });
      }
    });

    camadaBairros.addTo(map);
    bairrosAtivos = true;

  } catch (e) {
    console.error("Erro ao carregar POLIGONAIS.geojson", e);
  }
}

function desativarLeituraPorBairros() {
  if (camadaBairros) {
    map.removeLayer(camadaBairros);
  }
  bairrosAtivos = false;
}

// ===============================
// METODOLOGIA DE COR DO BAIRRO
// ===============================

function estiloBairro(feature, avaliacoes) {

  const poly = turf.polygon(feature.geometry.coordinates);
  const escolas = avaliacoes.filter(a => {
    const pt = turf.point([a.lng, a.lat]);
    return turf.booleanPointInPolygon(pt, poly);
  });

  // Sem escolas avaliadas
  if (escolas.length === 0) {
    return {
      fillOpacity: 0,
      color: "#777",
      weight: 1
    };
  }

  const cont = {
    ok: 0,
    alerta: 0,
    atenção: 0,
    critico: 0
  };

  escolas.forEach(e => {
    if (cont[e.classe] !== undefined) {
      cont[e.classe]++;
    }
  });

  const total = escolas.length;

  let cor = "#4CAF50"; // verde padrão

  if (cont.critico / total >= 0.5) cor = "#F44336";
  else if (cont.atenção / total >= 0.5) cor = "#FF9800";
  else if (cont.alerta / total >= 0.5) cor = "#FFD700";

  return {
    fillColor: cor,
    fillOpacity: 0.45,
    color: "#555",
    weight: 1
  };
}

// ===============================
// TOOLTIP DO BAIRRO
// ===============================

function tooltipBairro(feature, avaliacoes) {

  const poly = turf.polygon(feature.geometry.coordinates);
  const escolas = avaliacoes.filter(a => {
    const pt = turf.point([a.lng, a.lat]);
    return turf.booleanPointInPolygon(pt, poly);
  });

  if (escolas.length === 0) {
    return `
      <strong>${feature.properties.nome}</strong><br>
      ⚪ Sem dados – avaliação necessária.
    `;
  }

  const cont = {
    ok: 0,
    alerta: 0,
    atenção: 0,
    critico: 0
  };

  escolas.forEach(e => {
    if (cont[e.classe] !== undefined) {
      cont[e.classe]++;
    }
  });

  const total = escolas.length;
  const p = k => Math.round((cont[k] / total) * 100);

  let obs = "";
  if (p("critico") >= 50) obs = "🔴 Problema generalizado – alto risco territorial.";
  else if (p("atenção") >= 50) obs = "🟠 Problema predominante – tendência de agravamento.";
  else if (p("alerta") >= 50) obs = "🟡 Problema pontual – monitoramento recomendado.";
  else obs = "🟢 Situação controlada – acompanhamento rotineiro.";

  return `
    <strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% crítico (${cont.critico})<br>
    🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("ok")}% adequado (${cont.ok})<br>
    <em>${obs}</em>
  `;
}