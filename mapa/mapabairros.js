let camadaBairros = L.geoJSON(null).addTo(map);

async function carregarBairros(){
  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  camadaBairros = L.geoJSON(geo,{
    style: estiloBairro,
    onEachFeature: (f,l)=> l.bindTooltip(tooltipBairro(f))
  });
}

function estiloBairro(feature){
  const escolas = avaliacoes.filter(a => {
    const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
    return poly.getBounds().contains([a.lat,a.lng]);
  });
  if(escolas.length===0) return { fillOpacity:0, color:"#999", weight:1 };

  const cont={ ok:0, alerta:0, atencao:0, critico:0 };
  escolas.forEach(e=>{
    const s=e.classe;
    cont[s] = (cont[s]||0)+1;
  });

  const total = escolas.length;
  let cor="#4CAF50"; 
  if(cont.critico/total>=0.5) cor="#F44336";
  else if(cont.atencao/total>=0.5) cor="#FF9800";
  else if(cont.alerta/total>=0.5) cor="#FFD700";

  return { fillColor:cor, fillOpacity:.45, color:"#555", weight:1 };
}

function tooltipBairro(feature){
  const escolas = avaliacoes.filter(a=>{
    const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
    return poly.getBounds().contains([a.lat,a.lng]);
  });
  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont={ ok:0, alerta:0, atencao:0, critico:0 };
  escolas.forEach(e=>{ const s=e.classe; cont[s]=(cont[s]||0)+1; });
  const t = escolas.length;
  const p = k=>Math.round((cont[k]/t)*100);

  let obs="";
  if(p("critico")>=50) obs="🔴 Problema generalizado – alto risco de impacto.";
  else if(p("atencao")>=50) obs="🟠 Problema localizado, tendência de piora.";
  else if(p("alerta")>=50) obs="🟡 Problema pontual, monitoramento recomendado.";
  else obs="🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `
    <strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% crítico (${cont.critico})<br>
    🟠 ${p("atencao")}% atenção (${cont.atencao})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("ok")}% adequado (${cont.ok})<br>
    Observação: ${obs}
  `;
}

document.getElementById("toggleBairros").addEventListener("change",e=>{
  if(e.target.checked) camadaBairros.addTo(map);
  else map.removeLayer(camadaBairros);
});

await carregarBairros();