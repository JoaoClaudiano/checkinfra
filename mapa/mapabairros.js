import { map } from "./mapa.js";

/* ===== FUNÇÃO PONTO DENTRO DO POLÍGONO ===== */
function pontoDentroPoligono(point, vs) {
  let x = point[0], y = point[1];
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];

    let intersect =
      ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }
  return inside;
}

/* ===== CARREGAR BAIRROS ===== */
fetch("./bairros.geojson")
.then(r=>r.json())
.then(geojson=>{
  geojson.features.forEach(f=>{
    const poligono = f.geometry.coordinates[0];

    L.polygon(
      poligono.map(p=>[p[1],p[0]]),
      { color:"#888", weight:1, fillOpacity:0.05 }
    )
    .bindTooltip(f.properties.nome)
    .addTo(map);
  });
});