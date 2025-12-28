// mapabairros.js
// Usando o db e map já inicializados no index.html
let camadaBairros = L.layerGroup().addTo(map);
let bairrosAtivos = false;

// Função para carregar bairros
async function carregarBairros() {
  const resp = await fetch("./mapa/POLIGONAIS.geojson");
  const geojson = await resp.json();

  geojson.features.forEach(feature => {
    const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
    poly.options.fillOpacity = 0;
    poly.options.color = "#555";

    poly.bindTooltip(feature.properties.nome, {sticky:true});
    poly.addTo(camadaBairros);
  });

  bairrosAtivos = true;
}

// Checkbox para ativar leitura por bairros
document.getElementById("toggleBairros").addEventListener("change", async function(){
  if(this.checked){
    if(!bairrosAtivos){
      await carregarBairros();
    }
    camadaBairros.addTo(map);
  } else {
    camadaBairros.remove();
  }
});