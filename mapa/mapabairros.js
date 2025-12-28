// mapabairros.js

// Variáveis do mapa já inicializado no index.html
let camadaBairros = L.layerGroup().addTo(map);
let bairrosGeoJSON = null;

// Função para carregar o GeoJSON dos bairros
async function carregarBairros() {
  if (bairrosGeoJSON) return bairrosGeoJSON; // já carregado
  const resp = await fetch("mapa/POLIGONAIS.geojson");
  bairrosGeoJSON = await resp.json();
  return bairrosGeoJSON;
}

// Função que calcula a cor do bairro conforme metodologia
function estiloBairro(feature, avaliacoes) {
  const poly = L.polygon(feature.geometry.coordinates[0].map(c => [c[1], c[0]]));
  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat, a.lng]));
  if (escolas.length === 0) return { fillOpacity: 0, color: "#555", weight: 1 };

  const cont = { ok: 0, alerta: 0, atenção: 0, critico: 0 };
  escolas.forEach(e => cont[e.classe] = (cont[e.classe] || 0) + 1);

  const total = escolas.length;
  let cor = "#4CAF50"; // verde padrão
  if (cont.critico / total >= 0.5) cor = "#F44336";
  else if (cont.atenção / total >= 0.5) cor = "#FF9800";
  else if (cont.alerta / total >= 0.5) cor = "#FFD700";

  return { fillColor: cor, fillOpacity: 0.45, color: "#555", weight: 1 };
}

// Função para tooltip do bairro
function tooltipBairro(feature, avaliacoes) {
  const poly = L.polygon(feature.geometry.coordinates[0].map(c => [c[1], c[0]]));
  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat, a.lng]));
  if (escolas.length === 0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont = { ok: 0, alerta: 0, atenção: 0, critico: 0 };
  escolas.forEach(e => cont[e.classe] = (cont[e.classe] || 0) + 1);

  const t = escolas.length;
  const p = k => Math.round((cont[k] / t) * 100);

  let obs = "";
  if (p("critico") >= 50) obs = "🔴 Problema generalizado – alto risco de impacto.";
  else if (p("atenção") >= 50) obs = "🟠 Problema localizado, tendência de piora.";
  else if (p("alerta") >= 50) obs = "🟡 Problema pontual, monitoramento recomendado.";
  else obs = "🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `<strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% crítico (${cont.critico})<br>
    🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("ok")}% adequado (${cont.ok})<br>
    Observação: ${obs}`;
}

// Ativar ou desativar leitura por bairros
export async function ativarLeituraPorBairros() {
  camadaBairros.clearLayers();
  if (!document.getElementById("toggleBairros").checked) return;

  const geojson = await carregarBairros();
  L.geoJSON(geojson, {
    style: feature => estiloBairro(feature, avaliacoes),
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(tooltipBairro(feature, avaliacoes));
    }
  }).addTo(camadaBairros);
}

// Listener do checkbox
document.getElementById("toggleBairros").addEventListener("change", ativarLeituraPorBairros);

// Inicialização: não bloquear outros scripts, a camada é adicionada quando checkbox ativado