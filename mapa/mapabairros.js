// mapabairros.js
// Não inicializa Firebase nem mapa (já está no index.html)

let camadaBairros = L.layerGroup();
let camadaAtiva = false;

const coresBairro = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  critico: "#F44336"
};

// Função para definir estilo do bairro com base nas avaliações dentro do polígono
function estiloBairro(feature, avaliacoes){
  const poly = L.polygon(feature.geometry.coordinates[0].map(c => [c[1], c[0]]));
  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat, a.lng]));
  if(escolas.length===0) return { fillOpacity:0, color:"#555", weight:1 };

  const cont = { ok:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e => cont[e.classe] = (cont[e.classe]||0)+1 );

  const total = escolas.length;
  let cor = "#4CAF50"; // padrão verde
  if(cont.critico/total>=0.5) cor="#F44336";
  else if(cont.atenção/total>=0.5) cor="#FF9800";
  else if(cont.alerta/total>=0.5) cor="#FFD700";

  return { fillColor:cor, fillOpacity:.45, color:"#555", weight:1 };
}

// Tooltip do bairro
function tooltipBairro(feature, avaliacoes){
  const poly = L.polygon(feature.geometry.coordinates[0].map(c => [c[1], c[0]]));
  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat, a.lng]));
  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont = { ok:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e => cont[e.classe] = (cont[e.classe]||0)+1 );

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

// Ativar/desativar leitura por bairros
export async function ativarLeituraPorBairros(aval){
  if(camadaAtiva){
    map.removeLayer(camadaBairros);
    camadaAtiva=false;
    return;
  }
  if(!aval || aval.length===0){
    console.log("Leitura por bairros: avaliações ainda não carregadas");
    return;
  }

  // Carregar geojson de bairros
  const resp = await fetch("./mapa/POLIGONAIS.geojson");
  const geojson = await resp.json();

  camadaBairros = L.geoJSON(geojson, {
    style: feature => estiloBairro(feature, aval),
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(tooltipBairro(feature, aval), {sticky:true});
    }
  }).addTo(map);

  camadaAtiva = true;
}