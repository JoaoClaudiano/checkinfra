let camadaBairros = null;

/* ================= ESTILO ================= */
function estiloBairro(feature) {
  const escolas = window.avaliacoes.filter(a =>
    turf.booleanPointInPolygon(
      turf.point([a.lng, a.lat]),
      feature
    )
  );

  if (escolas.length === 0) {
    return { fillOpacity: 0, color: "#555", weight: 1 };
  }

  const cont = { ok: 0, alerta: 0, atenção: 0, critico: 0 };
  escolas.forEach(e => cont[e.classe]++);

  const total = escolas.length;
  let cor = "#4CAF50";

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

/* ================= TOOLTIP ================= */
function tooltipBairro(feature) {
  const escolas = window.avaliacoes.filter(a =>
    turf.booleanPointInPolygon(
      turf.point([a.lng, a.lat]),
      feature
    )
  );

  if (escolas.length === 0) {
    return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados.`;
  }

  const cont = { ok: 0, alerta: 0, atenção: 0, critico: 0 };
  escolas.forEach(e => cont[e.classe]++);

  const t = escolas.length;
  const p = k => Math.round((cont[k] / t) * 100);

  let obs = "🟢 Situação controlada.";
  if (p("critico") >= 50) obs = "🔴 Problema generalizado.";
  else if (p("atenção") >= 50) obs = "🟠 Tendência de agravamento.";
  else if (p("alerta") >= 50) obs = "🟡 Monitoramento necessário.";

  return `
    <strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% crítico (${cont.critico})<br>
    🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("ok")}% adequado (${cont.ok})<br>
    ${obs}
  `;
}

/* ================= ATIVAR ================= */
async function ativarLeituraPorBairros() {
  if (camadaBairros) return;

  const res = await fetch("./POLIGONAIS.geojson");
  const geojson = await res.json();

  camadaBairros = L.geoJSON(geojson, {
    style: f => estiloBairro(f),
    onEachFeature: (f, l) => {
      l.bindTooltip(tooltipBairro(f), { sticky: true });
    }
  }).addTo(window.map);
}

/* ================= DESATIVAR ================= */
function desativarLeituraPorBairros() {
  if (camadaBairros) {
    window.map.removeLayer(camadaBairros);
    camadaBairros = null;
  }
}

/* ================= CHECKBOX ================= */
toggleBairros.addEventListener("change", () => {
  if (toggleBairros.checked) {
    if (window.avaliacoes.length > 0) {
      ativarLeituraPorBairros();
    } else {
      console.warn("Aguardando avaliações...");
    }
  } else {
    desativarLeituraPorBairros();
  }
});

/* ================= SINCRONIZAÇÃO ================= */
window.addEventListener("avaliacoesCarregadas", () => {
  if (toggleBairros.checked) ativarLeituraPorBairros();
});