/* =========================
   ANÁLISE DE IMPACTO POR VORONOI
   Dados reais do CheckInfra
========================= */

class AnaliseVoronoi {
    constructor(escolas) {
        this.escolas = escolas;
        this.RAIO_TERRA_KM = 6371;
    }
    
    gerarPoligonosVoronoi() {
        console.log('🔺 Gerando polígonos de Voronoi com dados reais...');
        
        // Usar apenas escolas críticas
        const escolasCriticas = this.obterEscolasCriticasFiltradas();
        
        if (escolasCriticas.length < 3) {
            console.warn(`⚠️ Insuficientes escolas críticas para Voronoi: ${escolasCriticas.length}`);
            return { 
                poligonos: [], 
                metricas: [],
                tipo: 'voronoi',
                mensagem: 'Mínimo 3 escolas críticas necessário'
            };
        }
        
        // Converter para pontos com lat/lng
        const pontos = escolasCriticas.map((escola, index) => ({
            x: escola.lng,
            y: escola.lat,
            escola: escola,
            id: escola.id || `crit_${index}`,
            originalIndex: index
        }));
        
        // Gerar triangulação de Delaunay usando método alternativo
        const poligonos = this.gerarVoronoiSimples(pontos);
        
        // Calcular métricas de impacto
        const metricas = this.calcularMetricasImpacto(poligonos);
        
        return {
            poligonos: poligonos,
            metricas: metricas,
            tipo: 'voronoi',
            estatisticas: {
                totalEscolasCriticas: escolasCriticas.length,
                poligonosGerados: poligonos.length,
                areaTotal: metricas.reduce((sum, m) => sum + parseFloat(m.areaKm2), 0).toFixed(2),
                impactoMedio: (metricas.reduce((sum, m) => sum + m.impactoTotal, 0) / metricas.length).toFixed(1)
            }
        };
    }
    
    gerarVoronoiSimples(pontos) {
        const poligonos = [];
        
        pontos.forEach((ponto, i) => {
            // Encontrar os 3 vizinhos mais próximos
            const vizinhos = pontos
                .filter((_, j) => j !== i)
                .map(v => ({
                    ponto: v,
                    distancia: this.distanciaPontos(ponto, v)
                }))
                .sort((a, b) => a.distancia - b.distancia)
                .slice(0, 3);
            
            if (vizinhos.length >= 2) {
                // Criar polígono baseado nos vizinhos
                const vertices = this.calcularVerticesPoligono(ponto, vizinhos);
                poligonos.push({
                    pontoCentro: ponto,
                    vertices: vertices,
                    vizinhos: vizinhos.map(v => v.ponto.escola.id),
                    areaKm2: this.calcularAreaPoligono(vertices)
                });
            }
        });
        
        return poligonos;
    }
    
    calcularVerticesPoligono(centro, vizinhos) {
        const vertices = [];
        
        vizinhos.forEach(vizinho => {
            // Calcular ponto médio entre centro e vizinho
            const pontoMedio = {
                lat: (centro.y + vizinho.ponto.y) / 2,
                lng: (centro.x + vizinho.ponto.x) / 2
            };
            vertices.push(pontoMedio);
        });
        
        // Adicionar pontos intermediários para completar polígono
        if (vizinhos.length >= 3) {
            // Ordenar vértices em sentido horário
            return this.ordenarVerticesSentidoHorario(vertices, centro);
        }
        
        return vertices;
    }
    
    calcularMetricasImpacto(poligonos) {
        const dadosFiltrados = this.obterDadosFiltrados();
        
        return poligonos.map(poligono => {
            const centro = poligono.pontoCentro.escola;
            const vertices = poligono.vertices;
            
            // 1. Área de Influência (km²)
            const areaKm2 = poligono.areaKm2;
            
            // 2. Raio Médio de Influência
            const distancias = vertices.map(v => 
                this.distanciaKm(centro, v)
            );
            const raioMedio = distancias.reduce((a, b) => a + b, 0) / distancias.length;
            
            // 3. Escolas dentro do polígono
            const escolasNaArea = this.encontrarEscolasNaArea(vertices, dadosFiltrados);
            
            // 4. Matrículas na área
            const totalAlunos = escolasNaArea.reduce((sum, e) => sum + (e.matriculas || 200), 0);
            const densidadeAlunos = areaKm2 > 0 ? Math.round(totalAlunos / areaKm2) : 0;
            
            // 5. Vulnerabilidade (% críticas na área)
            const escolasCriticasNaArea = escolasNaArea.filter(e => e.status === 'crítica').length;
            const vulnerabilidade = escolasNaArea.length > 0 ? 
                (escolasCriticasNaArea / escolasNaArea.length) * 100 : 0;
            
            // 6. Índice de Impacto Total (0-100)
            const impacto = this.calcularImpactoTotal(
                areaKm2, 
                densidadeAlunos, 
                vulnerabilidade, 
                escolasNaArea.length
            );
            
            return {
                escola: centro,
                areaKm2: areaKm2.toFixed(2),
                raioMedioKm: raioMedio.toFixed(2),
                densidadeAlunos: densidadeAlunos,
                vulnerabilidade: vulnerabilidade.toFixed(1) + '%',
                impactoTotal: Math.min(Math.round(impacto), 100),
                escolasNaArea: escolasNaArea.length,
                escolasCriticasNaArea: escolasCriticasNaArea,
                vertices: vertices,
                nivelImpacto: this.classificarImpacto(impacto),
                detalhes: {
                    alunosAfetados: totalAlunos,
                    raioMaximo: Math.max(...distancias).toFixed(2),
                    proporcaoCriticas: escolasNaArea.length > 0 ? 
                        (escolasCriticasNaArea / escolasNaArea.length).toFixed(2) : 0
                }
            };
        }).filter(m => m.impactoTotal > 0);
    }
    
    calcularImpactoTotal(area, densidade, vulnerabilidade, numEscolas) {
        let impacto = 0;
        
        // Componente de área (até 25 pontos)
        impacto += Math.min(area * 3, 25);
        
        // Componente de densidade (até 25 pontos)
        impacto += Math.min(densidade / 20, 25);
        
        // Componente de vulnerabilidade (até 30 pontos)
        impacto += (vulnerabilidade / 100) * 30;
        
        // Componente de quantidade de escolas (até 20 pontos)
        impacto += Math.min(numEscolas * 2, 20);
        
        return impacto;
    }
    
    classificarImpacto(impacto) {
        if (impacto >= 80) return 'Impacto Crítico';
        if (impacto >= 60) return 'Impacto Alto';
        if (impacto >= 40) return 'Impacto Moderado';
        if (impacto >= 20) return 'Impacto Baixo';
        return 'Impacto Mínimo';
    }
    
    simularFechamento(escolaId, poligonos, metricas) {
        console.log(`🧪 Simulando fechamento da escola ${escolaId}...`);
        
        const metrica = metricas.find(m => m.escola.id === escolaId);
        if (!metrica) {
            console.error('Escola não encontrada para simulação');
            return null;
        }
        
        const centro = metrica.escola;
        const vertices = metrica.vertices;
        const dadosFiltrados = this.obterDadosFiltrados();
        
        // Encontrar escolas na área (excluindo a que será fechada)
        const escolasNaArea = this.encontrarEscolasNaArea(vertices, dadosFiltrados)
            .filter(e => e.id !== escolaId);
        
        // Calcular distâncias e capacidades
        const escolasReceptoras = escolasNaArea.map(escola => ({
            escola: escola,
            distancia: this.distanciaKm(centro, escola),
            capacidade: this.calcularCapacidadeDisponivel(escola),
            ocupacaoAtual: escola.matriculas || 200
        })).sort((a, b) => a.distancia - b.distancia);
        
        // Alunos a realocar
        const alunosDeslocados = centro.matriculas || 200;
        const capacidadeTotal = escolasReceptoras.reduce((sum, e) => sum + e.capacidade, 0);
        
        // Distribuir alunos proporcionalmente
        let alunosRestantes = alunosDeslocados;
        const sobrecargaPorEscola = [];
        
        escolasReceptoras.slice(0, 5).forEach(receptora => {
            const proporcao = receptora.capacidade / capacidadeTotal;
            const alunosAlocados = Math.min(
                alunosRestantes,
                Math.round(alunosDeslocados * proporcao)
            );
            
            if (alunosAlocados > 0) {
                sobrecargaPorEscola.push({
                    escola: receptora.escola,
                    alunosAlocados: alunosAlocados,
                    sobrecargaPercentual: (alunosAlocados / receptora.capacidade) * 100,
                    novaOcupacao: receptora.ocupacaoAtual + alunosAlocados,
                    capacidadeOriginal: receptora.ocupacaoAtual + receptora.capacidade,
                    distancia: receptora.distancia.toFixed(2) + ' km'
                });
                
                alunosRestantes -= alunosAlocados;
            }
        });
        
        const capacidadeSuficiente = capacidadeTotal >= alunosDeslocados;
        const deficit = Math.max(0, alunosDeslocados - capacidadeTotal);
        
        return {
            escolaFechada: centro,
            alunosDeslocados: alunosDeslocados,
            capacidadeTotal: capacidadeTotal,
            capacidadeSuficiente: capacidadeSuficiente,
            deficit: deficit,
            escolasReceptoras: sobrecargaPorEscola,
            raioAfetacao: Math.max(...escolasReceptoras.map(e => e.distancia)),
            estatisticas: {
                totalEscolasReceptoras: escolasReceptoras.length,
                mediaSobrecarga: sobrecargaPorEscola.length > 0 ? 
                    sobrecargaPorEscola.reduce((sum, e) => sum + e.sobrecargaPercentual, 0) / sobrecargaPorEscola.length : 0,
                escolaMaisSobrecarregada: sobrecargaPorEscola.length > 0 ? 
                    sobrecargaPorEscola.sort((a, b) => b.sobrecargaPercentual - a.sobrecargaPercentual)[0] : null
            },
            recomendacao: capacidadeSuficiente ? 
                `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#28a745' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><polyline points='20 6 9 17 4 12'/></svg> Viável: ${escolasReceptoras.length} escolas podem absorver ${alunosDeslocados} alunos` :
                `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#dc3545' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg> Crítico: Déficit de ${deficit} vagas. Necessário ${Math.ceil(deficit / 200)} nova(s) sala(s)`
        };
    }
    
    /* ========================
       FUNÇÕES AUXILIARES
    ========================= */
    
    obterEscolasCriticasFiltradas() {
        const filtros = {
            critico: document.getElementById('fCritico')?.checked || true,
            atencao: document.getElementById('fAtencao')?.checked || true,
            alerta: document.getElementById('fAlerta')?.checked || true
        };
        
        return dadosOriginais.filter(escola => {
            if (escola.status !== 'crítica') return false;
            return filtros.critico;
        });
    }
    
    obterDadosFiltrados() {
        const filtros = {
            critico: document.getElementById('fCritico')?.checked || true,
            atencao: document.getElementById('fAtencao')?.checked || true,
            alerta: document.getElementById('fAlerta')?.checked || true,
            adequado: document.getElementById('fAdequado')?.checked || true
        };
        
        return dadosOriginais.filter(escola => {
            if (escola.status === 'crítica') return filtros.critico;
            if (escola.status === 'alerta') return filtros.atencao || filtros.alerta;
            if (escola.status === 'ok') return filtros.adequado;
            return true;
        });
    }
    
    distanciaPontos(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    distanciaKm(ponto1, ponto2) {
        const dLat = (ponto2.lat - ponto1.lat) * Math.PI / 180;
        const dLon = (ponto2.lng - ponto1.lng) * Math.PI / 180;
        const lat1 = ponto1.lat * Math.PI / 180;
        const lat2 = ponto2.lat * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return this.RAIO_TERRA_KM * c;
    }
    
    calcularAreaPoligono(vertices) {
        if (vertices.length < 3) return 0.01; // área mínima
        
        let area = 0;
        const n = vertices.length;
        
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += vertices[i].lng * vertices[j].lat;
            area -= vertices[j].lng * vertices[i].lat;
        }
        
        area = Math.abs(area) / 2;
        
        // Converter graus² para km² (aproximação para latitude de Fortaleza)
        const areaKm2 = area * 111 * 111 * Math.cos(-3.7 * Math.PI / 180);
        
        return Math.max(areaKm2, 0.01); // Mínimo 0.01 km²
    }
    
    ordenarVerticesSentidoHorario(vertices, centro) {
        return vertices.sort((a, b) => {
            const anguloA = Math.atan2(a.lat - centro.y, a.lng - centro.x);
            const anguloB = Math.atan2(b.lat - centro.y, b.lng - centro.x);
            return anguloA - anguloB;
        });
    }
    
    encontrarEscolasNaArea(vertices, escolas) {
        // Filtro simples: escolas dentro do bounding box do polígono
        const bounds = {
            minLat: Math.min(...vertices.map(v => v.lat)),
            maxLat: Math.max(...vertices.map(v => v.lat)),
            minLng: Math.min(...vertices.map(v => v.lng)),
            maxLng: Math.max(...vertices.map(v => v.lng))
        };
        
        return escolas.filter(escola => {
            // Verificação rápida por bounding box
            const dentroBB = escola.lat >= bounds.minLat && 
                           escola.lat <= bounds.maxLat &&
                           escola.lng >= bounds.minLng && 
                           escola.lng <= bounds.maxLng;
            
            if (!dentroBB) return false;
            
            // Verificação mais precisa por ponto no polígono
            return this.pontoNoPoligono(escola, vertices);
        });
    }
    
    pontoNoPoligono(ponto, vertices) {
        let dentro = false;
        const x = ponto.lng;
        const y = ponto.lat;
        
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].lng;
            const yi = vertices[i].lat;
            const xj = vertices[j].lng;
            const yj = vertices[j].lat;
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect) dentro = !dentro;
        }
        
        return dentro;
    }
    
    calcularCapacidadeDisponivel(escola) {
        // Capacidade baseada no tipo de escola e matrículas atuais
        const capacidades = {
            'EMEI': 150,
            'EMEF': 300,
            'EMEIEF': 250,
            'default': 200
        };
        
        const capacidadeBase = capacidades[escola.tipo] || capacidades.default;
        const ocupacaoAtual = escola.matriculas || 150;
        const disponivel = Math.max(capacidadeBase - ocupacaoAtual, 0);
        
        // Adicionar margem de segurança (10%)
        return Math.floor(disponivel * 0.9);
    }
}

/* =========================
   FUNÇÕES DE INTERFACE VORONOI
========================= */

function analisePorVoronoi() {
    if (!dadosOriginais || dadosOriginais.length === 0) {
        console.warn('⚠️ Nenhum dado disponível para análise Voronoi');
        return { poligonos: [], metricas: [], tipo: 'voronoi' };
    }
    
    const analise = new AnaliseVoronoi(dadosOriginais);
    const resultado = analise.gerarPoligonosVoronoi();
    
    // Atualizar tabela de impacto
    if (resultado.metricas && resultado.metricas.length > 0) {
        atualizarTabelaImpacto(resultado.metricas);
    }
    
    return resultado;
}

function atualizarTabelaImpacto(metricas) {
    const tabelaImpacto = document.getElementById('tabelaImpacto');
    if (!tabelaImpacto) return;
    
    if (!metricas || metricas.length === 0) {
        tabelaImpacto.innerHTML = `
            <div class="card">
                <h4>Análise de Impacto</h4>
                <p>Nenhuma escola crítica encontrada para análise de impacto.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por impacto
    metricas.sort((a, b) => b.impactoTotal - a.impactoTotal);
    
    let html = `
        <div class="card">
            <h4>Ranking de Impacto - Fechamento de Escolas</h4>
            <p style="font-size:12px; color:#666; margin-bottom:15px;">
                ${metricas.length} escolas críticas analisadas | 
                Impacto médio: ${(metricas.reduce((sum, m) => sum + m.impactoTotal, 0) / metricas.length).toFixed(1)}/100
            </p>
            <table class="tabela-analise">
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Escola</th>
                        <th>Área (km²)</th>
                        <th>Raio (km)</th>
                        <th>Escolas na Área</th>
                        <th>Impacto</th>
                        <th>Nível</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    metricas.slice(0, 15).forEach((metrica, index) => {
        const nivel = metrica.nivelImpacto;
        let badgeClass = 'badge-ok';
        if (nivel.includes('Crítico')) badgeClass = 'badge-critico';
        else if (nivel.includes('Alto')) badgeClass = 'badge-critico';
        else if (nivel.includes('Moderado')) badgeClass = 'badge-alerta';
        else if (nivel.includes('Baixo')) badgeClass = 'badge-ok';
        
        html += `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>${metrica.escola.nome}</td>
                <td>${metrica.areaKm2}</td>
                <td>${metrica.raioMedioKm}</td>
                <td>${metrica.escolasNaArea}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px">
                        <span>${metrica.impactoTotal}/100</span>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${metrica.nivelImpacto}</span></td>
                <td>
                    <button onclick="simularFechamentoVoronoi('${metrica.escola.id}')" 
                            style="padding:4px 8px;background:#3498db;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">
                        Simular
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    tabelaImpacto.innerHTML = html;
}

function simularFechamentoVoronoi(escolaId) {
    const analise = new AnaliseVoronoi(dadosOriginais);
    const resultado = analise.gerarPoligonosVoronoi();
    const simulacao = analise.simularFechamento(escolaId, resultado.poligonos, resultado.metricas);
    
    if (!simulacao) {
        alert('Não foi possível simular o fechamento desta escola.');
        return;
    }
    
    // Exibir resultados em modal ou seção específica
    exibirResultadoSimulacao(simulacao);
}

function exibirResultadoSimulacao(simulacao) {
    const resultadoDiv = document.getElementById('simulacaoResultado');
    if (!resultadoDiv) return;
    
    resultadoDiv.style.display = 'block';
    
    resultadoDiv.innerHTML = `
        <div class="card">
            <h4>Simulação de Fechamento - ${simulacao.escolaFechada.nome}</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <h5 style="margin-top: 0;">Dados da Escola</h5>
                    <p><strong>Nome:</strong> ${simulacao.escolaFechada.nome}</p>
                    <p><strong>Alunos:</strong> ${simulacao.alunosDeslocados}</p>
                    <p><strong>Tipo:</strong> ${simulacao.escolaFechada.tipo}</p>
                    <p><strong>Status:</strong> <span class="badge badge-critico">Crítica</span></p>
                </div>
                
                <div style="background: ${simulacao.capacidadeSuficiente ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 8px;">
                    <h5 style="margin-top: 0;">${simulacao.capacidadeSuficiente ? '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#28a745\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><polyline points=\'20 6 9 17 4 12\'/></svg> Viabilidade' : '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#dc3545\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><line x1=\'18\' y1=\'6\' x2=\'6\' y2=\'18\'/><line x1=\'6\' y1=\'6\' x2=\'18\' y2=\'18\'/></svg> Viabilidade'}</h5>
                    <p><strong>Capacidade disponível:</strong> ${simulacao.capacidadeTotal}</p>
                    <p><strong>Alunos a realocar:</strong> ${simulacao.alunosDeslocados}</p>
                    <p><strong>${simulacao.capacidadeSuficiente ? '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#28a745\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><polyline points=\'20 6 9 17 4 12\'/></svg> Suficiente' : '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#dc3545\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><line x1=\'18\' y1=\'6\' x2=\'6\' y2=\'18\'/><line x1=\'6\' y1=\'6\' x2=\'18\' y2=\'18\'/></svg> Insuficiente'}</strong></p>
                    <p><em>${simulacao.recomendacao}</em></p>
                </div>
            </div>
            
            <h5>Escolas Receptoras (${simulacao.escolasReceptoras.length})</h5>
            <div style="max-height: 300px; overflow-y: auto;">
                ${simulacao.escolasReceptoras.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f1f3f4">
                                <th style="padding: 10px; text-align: left;">Escola</th>
                                <th style="padding: 10px; text-align: left;">Distância</th>
                                <th style="padding: 10px; text-align: left;">Alunos Alocados</th>
                                <th style="padding: 10px; text-align: left;">Sobrecarga</th>
                                <th style="padding: 10px; text-align: left;">Nova Ocupação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${simulacao.escolasReceptoras.map(e => `
                                <tr style="border-bottom: 1px solid #eee">
                                    <td style="padding: 10px">${e.escola.nome}</td>
                                    <td style="padding: 10px">${e.distancia}</td>
                                    <td style="padding: 10px">${e.alunosAlocados}</td>
                                    <td style="padding: 10px">
                                        <div style="display: flex; align-items: center; gap: 8px">
                                            <div style="flex: 1; height: 6px; background: #e0e0e0; border-radius: 3px">
                                                <div style="width: ${Math.min(e.sobrecargaPercentual, 100)}%; height: 100%; background: ${e.sobrecargaPercentual > 80 ? '#e74c3c' : e.sobrecargaPercentual > 60 ? '#f39c12' : '#2ecc71'}; border-radius: 3px"></div>
                                            </div>
                                            <span>${e.sobrecargaPercentual.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td style="padding: 10px">${e.novaOcupacao}/${e.capacidadeOriginal}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>Nenhuma escola receptora encontrada na área de influência.</p>'}
            </div>
            
            ${simulacao.deficit > 0 ? `
                <div style="margin-top: 20px; padding: 15px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
                    <h5><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg> Recomendações para Déficit</h5>
                    <p>Para atender o déficit de ${simulacao.deficit} vagas:</p>
                    <ul>
                        <li>Considerar construção de ${Math.ceil(simulacao.deficit / 200)} nova(s) sala(s) de aula</li>
                        <li>Ampliar capacidade das escolas existentes</li>
                        <li>Implementar sistema de turnos alternados</li>
                        <li>Transferir para escolas em bairros adjacentes</li>
                    </ul>
                </div>
            ` : ''}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <button onclick="exportarRelatorioSimulacao(${JSON.stringify(simulacao).replace(/"/g, '&quot;')})" 
                        style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer">
                    Exportar Relatório de Simulação
                </button>
                
                <button onclick="document.getElementById('simulacaoResultado').style.display = 'none'" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px">
                    Fechar
                </button>
            </div>
        </div>
    `;
}

function exportarRelatorioSimulacao(simulacao) {
    // Criar conteúdo do relatório
    let conteudo = `RELATÓRIO DE SIMULAÇÃO DE FECHAMENTO\n`;
    conteudo += `========================================\n\n`;
    conteudo += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    conteudo += `Escola: ${simulacao.escolaFechada.nome}\n`;
    conteudo += `Status: Crítica\n`;
    conteudo += `Alunos afetados: ${simulacao.alunosDeslocados}\n`;
    conteudo += `Viabilidade: ${simulacao.capacidadeSuficiente ? 'VIÁVEL' : 'CRÍTICO'}\n`;
    conteudo += `Capacidade disponível: ${simulacao.capacidadeTotal}\n`;
    conteudo += `Déficit: ${simulacao.deficit}\n\n`;
    
    if (simulacao.escolasReceptoras.length > 0) {
        conteudo += `ESCOLAS RECEPTORAS:\n`;
        conteudo += `==================\n\n`;
        simulacao.escolasReceptoras.forEach((e, i) => {
            conteudo += `${i + 1}. ${e.escola.nome}\n`;
            conteudo += `   Alunos alocados: ${e.alunosAlocados}\n`;
            conteudo += `   Sobrecarga: ${e.sobrecargaPercentual.toFixed(1)}%\n`;
            conteudo += `   Distância: ${e.distancia}\n`;
            conteudo += `   Nova ocupação: ${e.novaOcupacao}/${e.capacidadeOriginal}\n\n`;
        });
    }
    
    // Criar e fazer download
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacao-fechamento-${simulacao.escolaFechada.nome.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📤 Relatório de simulação exportado');
}
