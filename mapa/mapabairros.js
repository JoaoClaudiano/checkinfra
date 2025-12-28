// mapabairros.js

// Referências globais do index
const map = window._checkinfraMap;
const avaliacoes = window.avaliacoes;

// Layer para os bairros
const camadaBairros = L.layerGroup().addTo(map);

// Cores por classe
const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

// Mapear classes do Firebase para cores/metodologia
const classeMap = { ok:"ok", alerta:"alerta", atencao:"atenção", critico:"critico" };

// Carregar GeoJSON dos bairros
fetch('./mapa/POLIGONAIS.geojson')
  .then(res => res.json())
  .then(geojson => {
    window.geoBairros = L.geoJSON(geojson, {
      style: { color:"#666", weight:1, fillOpacity:0.1 },
      onEachFeature: (feature, layer) => {
        layer.on('mouseover', () => layer.setStyle({ fillOpacity:0.2 }));
        layer.on('mouseout', () => layer.setStyle({ fillOpacity:0.1 }));
      }
    }).addTo(camadaBairros);
    atualizarBairros();
  });

// Função para atualizar bairros e calcular classe dominante
function atualizarBairros() {
  camadaBairros.clearLayers();
  
  if(!window.geoBairros) return;

  window.geoBairros.eachLayer(layer => {
    const feature = layer.feature;
    
    // Filtrar escolas dentro do bairro usando turf
    const escolasNoBairro = avaliacoes.filter(a => {
      const s = classeMap[a.classe] || a.classe;
      // Respeita filtros do painel
      if((s==="ok" && !fAdequado.checked) ||
         (s==="alerta" && !fAlerta.checked) ||
         (s==="atenção" && !fAtencao.checked) ||
         (s==="critico" && !fCritico.checked)) return false;
      return turf.booleanPointInPolygon([a.lng, a.lat], feature);
    });

    // Calcular contagem por classe
    const cont = { ok:0, alerta:0, atenção:0, critico:0 };
    escolasNoBairro.forEach(e => cont[classeMap[e.classe] || e.classe]++);

    const total = escolasNoBairro.length;
    const perc = k => total ? Math.round((cont[k]/total)*100) : 0;

    // Determinar classe dominante
    let classeDominante = "ok";
    if(perc("critico") >= 50) classeDominante = "critico";
    else if(perc("atenção") >= 50) classeDominante = "atenção";
    else if(perc("alerta") >= 50) classeDominante = "alerta";

    // Tooltip do bairro
    const obs = classeDominante==="critico" ? "🔴 Problema generalizado – alto risco." :
                classeDominante==="atenção" ? "🟠 Problema localizado, tendência de piora." :
                classeDominante==="alerta" ? "🟡 Problema pontual, monitoramento." :
                "🟢 Situação controlada – acompanhamento rotineiro.";

    layer.setStyle({ fillColor: cores[classeDominante], fillOpacity:0.3, weight:1 });
    layer.bindTooltip(`
      <strong>${feature.properties.nome}</strong><br>
      🔴 ${perc("critico")}% crítico (${cont.critico})<br>
      🟠 ${perc("atenção")}% atenção (${cont.atenção})<br>
      🟡 ${perc("alerta")}% alerta (${cont.alerta})<br>
      🟢 ${perc("ok")}% adequado (${cont.ok})<br>
      <em>${obs}</em>
    `);
    camadaBairros.addLayer(layer);
  });
}

// Atualiza em tempo real quando os filtros do painel mudam
document.querySelectorAll("#fAdequado,#fAlerta,#fAtencao,#fCritico").forEach(el => {
  el.addEventListener("change", atualizarBairros);
});

// Atualiza quando o checkbox de bairros é alterado
document.getElementById("toggleBairros").addEventListener("change", function(){
  if(this.checked) atualizarBairros();
  else camadaBairros.clearLayers();
});