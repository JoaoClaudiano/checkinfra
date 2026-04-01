/**
 * mapabairros.js
 * Sistema de Inteligência Territorial - CheckInfra
 */

function iniciarModuloBairros() {
  const map = window._checkinfraMap;
  if (!map) return;

  const cores = { ok:"#4CAF50", alerta:"#FFD700", atencao:"#FF9800", critico:"#F44336" };
  let camadaGeoBairros = null;

  // Cache de escolas por bairro
  const cacheEscolasBairro = new Map();

  // Função para calcular escolas e atualizar estilo
  function precalcularEscolas() {
    if(!camadaGeoBairros || !document.getElementById("toggleBairros").checked) return;
    const avaliacoes = window.avaliacoes || [];

    camadaGeoBairros.eachLayer(layer => {
      const feature = layer.feature;

      // Se não tiver cache, calcular
      let escolasNoBairro = cacheEscolasBairro.get(feature.properties.nome);
      if(!escolasNoBairro) {
        escolasNoBairro = avaliacoes.filter(a => {
          const pt = turf.point([a.lng, a.lat]);
          return turf.booleanPointInPolygon(pt, feature.geometry);
        });
        cacheEscolasBairro.set(feature.properties.nome, escolasNoBairro);
      }

      // Aplicar filtros do painel
      escolasNoBairro = escolasNoBairro.filter(a => {
        const s = a.classe;
        const checkEl = document.getElementById(
          s === "ok" ? "fAdequado" :
          s === "alerta" ? "fAlerta" :
          s === "atencao" ? "fAtencao" : "fCritico"
        );
        return checkEl ? checkEl.checked : true;
      });

      const cont = { ok:0, alerta:0, atencao:0, critico:0 };
      escolasNoBairro.forEach(e => { if(cont[e.classe] !== undefined) cont[e.classe]++; });

      const total = escolasNoBairro.length;
      const perc = k => total ? Math.round((cont[k]/total)*100) : 0;

      // Detectar se existe ao menos uma escola crítica
      const existeCritico = escolasNoBairro.some(e => e.classe === "critico");

      // Lógica de criticidade dominante (50%)
      let classeDominante = "ok";
      if(perc("critico") >= 50) classeDominante = "critico";
      else if(perc("atencao") >= 50) classeDominante = "atencao";
      else if(perc("alerta") >= 50) classeDominante = "alerta";
      else if(perc("ok") >= 50) classeDominante = "ok";
      else { // fallback: pega a classe máxima presente
        if(cont["critico"]>0) classeDominante="critico";
        else if(cont["atencao"]>0) classeDominante="atencao";
        else if(cont["alerta"]>0) classeDominante="alerta";
        else classeDominante="ok";
      }

      // Última data de avaliação do bairro
      let ultimaDataBairro = "-";
      if(total > 0){
        const datas = escolasNoBairro
          .map(e => e.createdAt?.toDate ? e.createdAt.toDate() : null)
          .filter(d => d != null);
        if(datas.length > 0){
          const maisRecente = new Date(Math.max.apply(null, datas));
          ultimaDataBairro = maisRecente.toLocaleDateString('pt-BR');
        }
      }

      // Observação principal
      let obs = total === 0 ? "Sem dados disponíveis." :
                classeDominante === "critico" ? "<span style='display:inline-block;width:9px;height:9px;border-radius:50%;background:#dc3545;vertical-align:middle;margin-right:3px;'></span> Problema generalizado." :
                classeDominante === "atencao" ? "<span style='display:inline-block;width:9px;height:9px;border-radius:50%;background:#fd7e14;vertical-align:middle;margin-right:3px;'></span> Tendência de piora." :
                classeDominante === "alerta" ? "<span style='display:inline-block;width:9px;height:9px;border-radius:50%;background:#ffc107;vertical-align:middle;margin-right:3px;'></span> Atenção pontual." :
                "<span style='display:inline-block;width:9px;height:9px;border-radius:50%;background:#28a745;vertical-align:middle;margin-right:3px;'></span> Situação sob controle.";

      // Aviso de situação crítica pontual
      if(existeCritico && classeDominante !== "critico") {
        obs += " <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg> Existe ao menos uma escola crítica neste bairro.";
      }

      // Aplicar estilo visual do bairro
      layer.setStyle({
        fillColor: total > 0 ? cores[classeDominante] : "transparent",
        fillOpacity: total > 0 ? 0.35 : 0,
        opacity: 1,
        weight: 1,
        color: "#666"
      });

      // Template do popup
      const html = `
        <div style="font-size:13px; line-height:1.4; min-width:180px; position:relative;">
          <strong>${feature.properties.nome || "Bairro"}</strong><br>
          <small>${total} escolas monitoradas</small><br>
          <small>Última avaliação: ${ultimaDataBairro}</small>
          <hr style="margin:4px 0">
          ${total > 0 ? ["critico","atencao","alerta","ok"].map(c => `
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
              <span style="width:10px; height:10px; border-radius:50%; background:${cores[c]}; display:inline-block;"></span>
              <span>${c === "ok" ? "Adequado" : c.charAt(0).toUpperCase()+c.slice(1)}: ${perc(c)}% (${cont[c]})</span>
            </div>`).join("") : "Nenhuma escola ativa neste setor."}
          <div style="margin-top:6px; font-size:11px; border-top:1px solid #eee; padding-top:4px;"><em>${obs}</em></div>
        </div>`;

      layer.bindPopup(html, { maxWidth: 250 });
    });
  }

  // Carregamento do GeoJSON
  fetch('POLIGONAIS.geojson')
    .then(res => { if(!res.ok) throw new Error("Erro ao carregar GeoJSON"); return res.json(); })
    .then(geojson => {
      camadaGeoBairros = L.geoJSON(geojson, {
        style: { color:"#666", weight:1, fillOpacity:0, opacity:0 },
        onEachFeature: (feature, layer) => {
          layer.on('mouseover', () => {
            if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight:2, color:"#000", fillOpacity:0.1 });
          });
          layer.on('mouseout', () => {
            if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight:1, color:"#666", fillOpacity:0.35 });
          });
        }
      }).addTo(map);

      // Aguarda dados do Firebase
      if(window.avaliacoes && window.avaliacoes.length > 0) {
        precalcularEscolas();
      } else {
        const checkData = setInterval(() => {
          if(window.avaliacoes && window.avaliacoes.length > 0) {
            precalcularEscolas();
            clearInterval(checkData);
          }
        }, 500);
      }
    })
    .catch(err => console.error("Falha no módulo de bairros:", err));

  // Listeners
  document.getElementById("toggleBairros").addEventListener("change", function(){
    if(this.checked){
      precalcularEscolas();
    } else {
      if(camadaGeoBairros) camadaGeoBairros.setStyle({fillOpacity:0, opacity:0});
    }
  });

  document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico").forEach(el => {
    el.addEventListener("change", () => {
      if(document.getElementById("toggleBairros").checked) precalcularEscolas();
    });
  });
}

// Vigia de inicialização do mapa
if(window._checkinfraMap) {
  iniciarModuloBairros();
} else {
  const aguardarMapa = setInterval(() => {
    if(window._checkinfraMap) {
      iniciarModuloBairros();
      clearInterval(aguardarMapa);
    }
  }, 100);
}