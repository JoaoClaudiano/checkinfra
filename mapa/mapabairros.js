import * as turf from "https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js";

let camadaBairros = null;
const bairrosGeoJSON = await fetch("./data/bairros.geojson").then(r=>r.json());

function corPorStatus(status){
  if(status==="critico") return "#F44336";
  if(status==="atenção") return "#FF9800";
  if(status==="alerta") return "#FFD700";
  return "#4CAF50";
}

window.ativarBairros = function(){
  if(camadaBairros) map.removeLayer(camadaBairros);

  camadaBairros = L.geoJSON(bairrosGeoJSON,{
    style: function(feature){
      const pts = avaliacoes.filter(d=>d.lat && d.lng && turf.booleanPointInPolygon(turf.point([d.lng,d.lat]), feature));
      if(pts.length===0) return { fillOpacity:0, color:"#999", weight:1 };
      let pior="ok";
      pts.forEach(p=>{
        const s = p.classe;
        if(s==="critico") pior="critico";
        else if(s==="atenção" && pior!=="critico") pior="atenção";
        else if(s==="alerta" && !["critico","atenção"].includes(pior)) pior="alerta";
      });
      return { fillColor:corPorStatus(pior), fillOpacity:0.3, color:"#555", weight:1 };
    },
    onEachFeature: function(feature, layer){
      const pts = avaliacoes.filter(d=>d.lat && d.lng && turf.booleanPointInPolygon(turf.point([d.lng,d.lat]), feature));
      const cont={ok:0, alerta:0, atenção:0, critico:0};
      pts.forEach(d=>{ const s=d.classe; if(cont[s]!==undefined) cont[s]++; });
      let html=`<strong>${feature.properties.nome}</strong><br>`;
      html+=`Adequado: ${cont.ok}<br>`;
      html+=`Alerta: ${cont.alerta}<br>`;
      html+=`Atenção: ${cont.atenção}<br>`;
      html+=`Crítico: ${cont.critico}`;
      layer.bindTooltip(html);
    }
  }).addTo(map);
}

window.desativarBairros = function(){
  if(camadaBairros){ map.removeLayer(camadaBairros); camadaBairros=null; }
}