import { map, avaliacoes } from './mapa.js';

let camadaBairros = L.geoJSON(null);

const statusCores = {
  "adequado":"#4CAF50",
  "alerta":"#FFD700",
  "atenção":"#FF9800",
  "critico":"#F44336",
  "crítico":"#F44336"
};

const bola = {
  adequado: "🟢",
  alerta: "🟡",
  atenção: "🟠",
  crítico: "🔴"
};

// Função para definir estilo do bairro baseado nas escolas dentro dele
function estiloBairro(feature){
  const escolas = avaliacoes.filter(a =>
    feature.geometry &&
    turf.booleanPointInPolygon(turf.point([a.lng,a.lat]), feature)
  );

  if(escolas.length===0) return { fillOpacity:0, color:"#999", weight:1 };

  const cont={ adequado:0, alerta:0, atenção:0, crítico:0 };
  escolas.forEach(e=>{
    const s=(e.status||"").toLowerCase();
    if(s.includes("adequado")) cont.adequado++;
    else if(s.includes("alerta")) cont.alerta++;
    else if(s.includes("atenção")) cont.atenção++;
    else cont.crítico++;
  });

  const total = escolas.length;
  const pCrit = cont.crítico/total;
  const pAtencao = cont.atenção/total;
  const pAlerta = cont.alerta/total;

  let cor = "#4CAF50"; // verde
  if(pCrit >= 0.5) cor="#F44336";          // 🔴 ≥50% crítico
  else if(pCrit < 0.5 && pAtencao >= 0.5) cor="#FF9800"; // 🟠 atenção ≥50%
  else if(pCrit === 0 && pAtencao < 0.5 && pAlerta >= 0.5) cor="#FFD700"; // 🟡 alerta ≥50%

  return { fillColor:cor, fillOpacity:.45, color:"#555", weight:1 };
}

// Tooltip do bairro com observação automática
function tooltipBairro(feature){
  const escolas = avaliacoes.filter(a =>
    feature.geometry &&
    turf.booleanPointInPolygon(turf.point([a.lng,a.lat]), feature)
  );

  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont={ adequado:0, alerta:0, atenção:0, crítico:0 };
  escolas.forEach(e=>{
    const s=(e.status||"").toLowerCase();
    if(s.includes("adequado")) cont.adequado++;
    else if(s.includes("alerta")) cont.alerta++;
    else if(s.includes("atenção")) cont.atenção++;
    else cont.crítico++;
  });

  const t = escolas.length;
  const p = k => Math.round((cont[k]/t)*100);

  let observacao = "";
  if(p("crítico")>=50) observacao = "🔴 Problema generalizado – alto risco de impacto.";
  else if(p("atenção")>=50) observacao = "🟠 Problema localizado, tendência de piora.";
  else if(p("alerta")>=50) observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else observacao = "🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `
    <strong>${feature.properties.nome}</strong><br>
    ${bola.crítico} ${p("crítico")}% crítico (${cont.crítico})<br>
    ${bola.atenção} ${p("atenção")}% atenção (${cont.atenção})<br>
    ${bola.alerta} ${p("alerta")}% alerta (${cont.alerta})<br>
    ${bola.adequado} ${p("adequado")}% adequado (${cont.adequado})<br>
    Observação: ${observacao}
  `;
}

// Carrega o GeoJSON de bairros
export async function carregarBairros(){
  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  camadaBairros = L.geoJSON(geo,{
    style: estiloBairro,
    onEachFeature: (f,l) => l.bindTooltip(tooltipBairro(f))
  });
}

// Função para ativar/desativar a camada de bairros
export function toggleBairrosLayer(ativo){
  if(ativo){
    camadaBairros.addTo(map);
  } else {
    map.removeLayer(camadaBairros);
  }
}