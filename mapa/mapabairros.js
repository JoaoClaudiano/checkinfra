// mapabairros.js

// Não usar import/await no top level se for script comum
// Supondo que o index.html já carregou Firebase e mapa.js

let camadaBairros = null;

// Função para carregar o GeoJSON dos bairros
async function carregarBairros() {
  const resp = await fetch("mapa/POLIGONAIS.geojson");
  const geojson = await resp.json();

  if(camadaBairros) {
    camadaBairros.clearLayers();
  }

  camadaBairros = L.geoJSON(geojson, {
    style: feature => estiloBairro(feature, avaliacoes),
    onEachFeature: feature => {
      feature.bindTooltip(tooltipBairro(feature, avaliacoes));
    }
  }).addTo(map);
}

// Função para estilo de cada bairro
function estiloBairro(feature, avals){
  const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
  const escolas = avals.filter(a => poly.getBounds().contains([a.lat,a.lng]));
  if(escolas.length===0) return { fillOpacity:0, color:"#555", weight:1 };

  const cont = { ok:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e=> cont[e.classe] = (cont[e.classe]||0)+1 );

  const total = escolas.length;
  let cor = "#4CAF50"; // padrão verde
  if(cont.critico/total>=0.5) cor="#F44336";
  else if(cont.atenção/total>=0.5) cor="#FF9800";
  else if(cont.alerta/total>=0.5) cor="#FFD700";

  return { fillColor:cor, fillOpacity:.45, color:"#555", weight:1 };
}

// Tooltip de cada bairro
function tooltipBairro(feature, avals){
  const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
  const escolas = avals.filter(a => poly.getBounds().contains([a.lat,a.lng]));
  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont = { ok:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e=> cont[e.classe] = (cont[e.classe]||0)+1 );

  const t = escolas.length;
  const p = k => Math.round((cont[k]/t)*100);

  let obs="";
  if(p("critico")>=50) obs="🔴 Problema generalizado – alto risco de impacto.";
  else if(p("atenção")>=50) obs="🟠 Problema localizado, tendência de piora.";
  else if(p("alerta")>=50) obs="🟡 Problema pontual, monitoramento recomendado.";
  else obs="🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `<strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% crítico (${cont.critico})<br>
    🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("ok")}% adequado (${cont.ok})<br>
    Observação: ${obs}`;
}

// Checkbox de ativar/desativar leitura por bairros
const toggleBairros = document.getElementById("toggleBairros");
toggleBairros.addEventListener("change", async ()=>{
  if(toggleBairros.checked){
    if(avaliacoes.length===0){
      console.log("Leitura por bairros: avaliações ainda não carregadas");
      return;
    }
    await carregarBairros();
  } else {
    if(camadaBairros) camadaBairros.remove();
  }
});