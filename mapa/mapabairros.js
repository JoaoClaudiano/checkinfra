let camadaBairros = L.geoJSON(null);

async function carregarBairros(map, avaliacoes){
  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  camadaBairros = L.geoJSON(geo,{
    style: estiloBairro,
    onEachFeature: (f,l) => l.bindTooltip(tooltipBairro(f))
  });
}

function estiloBairro(feature){
  const escolas = avaliacoes.filter(a=>{
    const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
    return poly.getBounds().contains([a.lat,a.lng]);
  });

  if(escolas.length===0) return { fillOpacity:0, color:"#999", weight:1 };

  const cont={ adequado:0, alerta:0, atenção:0, crítico:0 };
  escolas.forEach(e=>{
    const s = normalizeStatus(e.status);
    if(s.includes("adequado")) cont.adequado++;
    else if(s.includes("alerta")) cont.alerta++;
    else if(s.includes("atenção")) cont.atenção++;
    else cont.crítico++;
  });

  const total = escolas.length;
  const pCrit = cont.crítico/total;
  const pAtencao = cont.atenção/total;
  const pAlerta = cont.alerta/total;

  let cor = "#4CAF50";
  if(pCrit >= 0.5) cor="#F44336";
  else if(pCrit < 0.5 && pAtencao >= 0.5) cor="#FF9800";
  else if(pCrit === 0 && pAtencao < 0.5 && pAlerta >= 0.5) cor="#FFD700";

  return { fillColor: cor, fillOpacity: 0.45, color:"#555", weight:1 };
}

function tooltipBairro(feature){
  const escolas = avaliacoes.filter(a=>{
    const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
    return poly.getBounds().contains([a.lat,a.lng]);
  });

  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont={ adequado:0, alerta:0, atenção:0, crítico:0 };
  escolas.forEach(e=>{
    const s = normalizeStatus(e.status);
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
    🔴 ${p("crítico")}% crítico (${cont.crítico})<br>
    🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("adequado")}% adequado (${cont.adequado})<br>
    Observação: ${observacao}
  `;
}

// Checkbox "Leitura por bairro"
document.getElementById("toggleBairros").addEventListener("change", async ()=>{
  if(document.getElementById("toggleBairros").checked){
    await carregarBairros(map, avaliacoes);
    camadaBairros.addTo(map);
  } else {
    if(camadaBairros) map.removeLayer(camadaBairros);
  }
});
