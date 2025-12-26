// mapabairros.js
import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/+esm';

let camadaBairros = null;

export async function exibirBairros(map, avaliacoes){
    const res = await fetch("./POLIGONAIS.geojson");
    const geo = await res.json();

    // Criar camada com estilo baseado nas avaliações
    camadaBairros = L.geoJSON(geo, {
        style: feature => {
            const escolas = avaliacoes.filter(a =>
                turf.booleanPointInPolygon(
                    turf.point([a.lng, a.lat]),
                    feature
                )
            );

            if(escolas.length === 0) return { fillOpacity:0, color:"#999", weight:1 };

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

            return { fillColor: cor, fillOpacity: 0.45, color: "#555", weight:1 };
        },
        onEachFeature: feature => {
            const escolas = avaliacoes.filter(a =>
                turf.booleanPointInPolygon(
                    turf.point([a.lng, a.lat]),
                    feature
                )
            );

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
            else if(t>0) observacao = "🟢 Situação controlada – continuar acompanhamento rotineiro.";
            else observacao = "⚪ Sem dados – avaliação necessária.";

            const tooltip = `
                <strong>${feature.properties.nome}</strong><br>
                🟢 ${p("adequado")}% adequado (${cont.adequado})<br>
                🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
                🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
                🔴 ${p("crítico")}% crítico (${cont.crítico})<br>
                Observação: ${observacao}
            `;

            L.geoJSON(feature).bindTooltip(tooltip).addTo(map);
        }
    }).addTo(map);
}

export function removerBairros(){
    if(camadaBairros){
        camadaBairros.remove();
        camadaBairros = null;
    }
}