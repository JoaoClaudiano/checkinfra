function gerarGrid(bounds, tamanho) {
  const grid = [];
  for (let lat=bounds.getSouth(); lat<bounds.getNorth(); lat+=tamanho){
    for (let lng=bounds.getWest(); lng<bounds.getEast(); lng+=tamanho){
      grid.push({ bounds:[[lat,lng],[lat+tamanho,lng+tamanho]], peso:0 });
    }
  }
  return grid;
}

function recalcularMapa(dados){
  camadaZonas.clearLayers();
  camadaHeatmap.setLatLngs([]);
  const grid = gerarGrid(map.getBounds(),0.01);
  let maxPeso = 0;

  dados.forEach(e=>{
    if(!e.lat||!e.lng) return;
    let peso = 0.3;
    if(modoIndicador===1) peso = e.status.includes("crítica")?1.5:e.status.includes("alerta")?1.0:0.3;
    if(modoIndicador===2) peso = e.status.includes("crítica")?1.2:e.status.includes("alerta")?0.8:0.3;

    camadaHeatmap.addLatLng([e.lat,e.lng,peso]);

    grid.forEach(c=>{
      const [[a,b],[c2,d]] = c.bounds;
      if(e.lat>=a && e.lat<c2 && e.lng>=b && e.lng<d) c.peso += peso;
      maxPeso = Math.max(maxPeso,c.peso);
    });
  });

  const ranking = grid.filter(c=>c.peso>0).sort((a,b)=>b.peso-a.peso).slice(0,5);
  const lista = document.getElementById("listaRanking");
  lista.innerHTML = "";
  ranking.forEach((c,i)=>{
    const indice = Math.round((c.peso/maxPeso)*100);
    lista.innerHTML += `<li>Zona ${i+1} — Índice Territorial: ${indice}</li>`;
    L.rectangle(c.bounds,{ color:"#de2d26", fillOpacity:0.4, weight:1 }).addTo(camadaZonas);
  });
}