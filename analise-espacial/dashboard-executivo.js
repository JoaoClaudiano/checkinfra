// dashboard-executivo.js - Decisão Estratégica
console.log('📊 Dashboard Executivo v1.0');

class DashboardExecutivo {
  constructor() {
    this.analises = {};
    this.recomendacoes = [];
    this.inicializado = false;
  }
  
  async inicializar() {
    if (this.inicializado) return true;
    
    console.log('🚀 Inicializando Dashboard Executivo...');
    this.inicializado = true;
    return true;
  }
  
  // ==================== ANÁLISE COMPLETA ====================
  async analisarOndeCostruir(opcoes = {}) {
    console.log('🎯 Executando análise completa para nova escola...');
    
    const config = {
      raioMinimo: opcoes.raioMinimo || 1.5, // km - distância mínima de escolas existentes
      capacidadeAlvo: opcoes.capacidadeAlvo || 400, // alunos
      prioridadeStatus: opcoes.prioridadeStatus || ['crítico', 'atenção'],
      ...opcoes
    };
    
    // ETAPA 1: Executar análises individuais
    console.log('📊 Etapa 1/4: Coletando análises...');
    await this.executarAnalises();
    
    // ETAPA 2: Identificar lacunas na cobertura
    console.log('🔍 Etapa 2/4: Identificando lacunas...');
    const lacunas = this.identificarLacunas(config);
    
    // ETAPA 3: Calcular scores compostos
    console.log('🧮 Etapa 3/4: Calculando scores...');
    const candidatos = this.calcularScoresCandidatos(lacunas, config);
    
    // ETAPA 4: Gerar recomendações
    console.log('💡 Etapa 4/4: Gerando recomendações...');
    this.recomendacoes = this.gerarRecomendacoes(candidatos, config);
    
    // Visualizar
    this.visualizarRecomendacoes();
    
    // Relatório
    const relatorio = this.gerarRelatorioExecutivo(config);
    
    console.log('✅ Análise completa concluída');
    
    return relatorio;
  }
  
  // ==================== EXECUTAR ANÁLISES ====================
  async executarAnalises() {
    const promessas = [];
    
    // Voronoi
    if (window.voronoiCritico && window.voronoiCritico.inicializado) {
      promessas.push(
        Promise.resolve(window.gerarVoronoiCritico(5, 'critico'))
          .then(resultado => {
            this.analises.voronoi = resultado;
            console.log('  ✅ Voronoi');
          })
          .catch(e => console.warn('  ⚠️ Voronoi falhou:', e))
      );
    }
    
    // KDE
    if (window.kdeHandler && window.kdeHandler.inicializado) {
      promessas.push(
        Promise.resolve(window.calcularKDE('critico', 500))
          .then(resultado => {
            this.analises.kde = resultado;
            console.log('  ✅ KDE');
          })
          .catch(e => console.warn('  ⚠️ KDE falhou:', e))
      );
    }
    
    // Location Quotient
    if (window.locationQuotientHandler && window.locationQuotientHandler.inicializado) {
      promessas.push(
        Promise.resolve(window.calcularLocationQuotient('crítico'))
          .then(resultado => {
            this.analises.lq = resultado;
            console.log('  ✅ LQ');
          })
          .catch(e => console.warn('  ⚠️ LQ falhou:', e))
      );
    }
    
    // IVC
    if (window.ivcHandler && window.ivcHandler.inicializado) {
      promessas.push(
        Promise.resolve(window.calcularIVC())
          .then(resultado => {
            this.analises.ivc = resultado;
            console.log('  ✅ IVC');
          })
          .catch(e => console.warn('  ⚠️ IVC falhou:', e))
      );
    }
    
    await Promise.allSettled(promessas);
  }
  
  // ==================== IDENTIFICAR LACUNAS ====================
  identificarLacunas(config) {
    console.log('🔍 Buscando áreas com lacunas de cobertura...');
    
    const escolas = window.dadosManager.getEscolas();
    
    // Criar grid de análise
    const grid = this.criarGridAnalise(escolas, 0.02); // ~2km
    
    // Analisar cada célula
    const lacunas = grid.map(celula => {
      // Contar escolas próximas
      const escolasProximas = this.contarEscolasProximas(
        celula.centro, 
        escolas, 
        config.raioMinimo
      );
      
      // Verificar se é uma lacuna
      const ehLacuna = escolasProximas.total === 0 || 
                       (escolasProximas.criticas >= 2 && escolasProximas.adequadas === 0);
      
      if (!ehLacuna) return null;
      
      // Calcular demanda estimada
      const demandaEstimada = this.estimarDemanda(celula.centro, escolas);
      
      return {
        centro: celula.centro,
        escolasProximas: escolasProximas,
        demandaEstimada: demandaEstimada,
        areaKm2: this.calcularAreaCelula(0.02)
      };
    }).filter(Boolean);
    
    console.log(`  ✅ ${lacunas.length} lacunas identificadas`);
    
    return lacunas;
  }
  
  // ==================== CALCULAR SCORES ====================
  calcularScoresCandidatos(lacunas, config) {
    console.log('🧮 Calculando scores dos candidatos...');
    
    return lacunas.map(lacuna => {
      // Componentes do score (0-100 cada)
      const scores = {
        // 1. Demanda (40%)
        demanda: this.scoreDemanda(lacuna),
        
        // 2. Vulnerabilidade da região (30%)
        vulnerabilidade: this.scoreVulnerabilidade(lacuna),
        
        // 3. Acessibilidade (20%)
        acessibilidade: this.scoreAcessibilidade(lacuna),
        
        // 4. Cobertura atual (10%)
        cobertura: this.scoreCobertura(lacuna)
      };
      
      // Score composto (ponderado)
      const scoreTotal = 
        scores.demanda * 0.40 +
        scores.vulnerabilidade * 0.30 +
        scores.acessibilidade * 0.20 +
        scores.cobertura * 0.10;
      
      return {
        localizacao: lacuna.centro,
        scoreTotal: Math.round(scoreTotal),
        scores: scores,
        demandaEstimada: lacuna.demandaEstimada,
        prioridade: this.classificarPrioridade(scoreTotal),
        recomendacao: this.gerarRecomendacaoCandidato(lacuna, scoreTotal)
      };
    }).sort((a, b) => b.scoreTotal - a.scoreTotal);
  }
  
  // ==================== SCORES INDIVIDUAIS ====================
  scoreDemanda(lacuna) {
    // Demanda estimada em alunos
    const demanda = lacuna.demandaEstimada;
    
    // Normalizar (400 alunos = 50%, 800+ = 100%)
    return Math.min((demanda / 800) * 100, 100);
  }
  
  scoreVulnerabilidade(lacuna) {
    // Usar dados do IVC se disponível
    if (this.analises.ivc && this.analises.ivc.resultados) {
      // Encontrar escolas próximas e pegar média de IVC
      const escolasProximas = window.dadosManager.getEscolas().filter(e => {
        const dist = this.calcularDistanciaKm(lacuna.centro, e);
        return dist <= 2;
      });
      
      if (escolasProximas.length > 0) {
        const ivcs = escolasProximas
          .map(e => this.analises.ivc.resultados.find(r => r.escola.id === e.id))
          .filter(Boolean)
          .map(r => r.ivc);
        
        if (ivcs.length > 0) {
          return ivcs.reduce((a, b) => a + b, 0) / ivcs.length;
        }
      }
    }
    
    // Fallback: baseado em escolas críticas próximas
    const propCriticas = lacuna.escolasProximas.criticas / 
                         Math.max(lacuna.escolasProximas.total, 1);
    
    return propCriticas * 100;
  }
  
  scoreAcessibilidade(lacuna) {
    // Quanto mais isolado, melhor (precisa de escola)
    const distanciaMedia = this.calcularDistanciaMediaEscolas(
      lacuna.centro, 
      window.dadosManager.getEscolas()
    );
    
    // >3km = 100 (muito isolado, precisa urgente)
    return Math.min((distanciaMedia / 3) * 100, 100);
  }
  
  scoreCobertura(lacuna) {
    // Inverso: quanto menos cobertura, maior o score
    const cobertura = lacuna.escolasProximas.total;
    
    // 0 escolas = 100%, 5+ escolas = 0%
    return Math.max(100 - (cobertura * 20), 0);
  }
  
  // ==================== GERAR RECOMENDAÇÕES ====================
  gerarRecomendacoes(candidatos, config) {
    console.log('💡 Gerando recomendações estratégicas...');
    
    return candidatos.slice(0, 10).map((candidato, index) => {
      return {
        ranking: index + 1,
        localizacao: candidato.localizacao,
        scoreTotal: candidato.scoreTotal,
        prioridade: candidato.prioridade,
        capacidadeSugerida: this.sugerirCapacidade(candidato),
        investimentoEstimado: this.estimarInvestimento(candidato),
        impactoEsperado: this.estimarImpacto(candidato),
        justificativa: this.gerarJustificativa(candidato),
        proximosPassos: this.gerarProximosPassos(candidato),
        riscos: this.identificarRiscos(candidato)
      };
    });
  }
  
  gerarJustificativa(candidato) {
    const razoes = [];
    
    if (candidato.scores.demanda > 70) {
      razoes.push(`Alta demanda estimada (${candidato.demandaEstimada} alunos)`);
    }
    
    if (candidato.scores.vulnerabilidade > 70) {
      razoes.push('Região com alta vulnerabilidade social');
    }
    
    if (candidato.scores.acessibilidade > 70) {
      razoes.push('Área isolada com baixa cobertura escolar');
    }
    
    if (candidato.scores.cobertura > 80) {
      razoes.push('Lacuna significativa na rede escolar');
    }
    
    return razoes.length > 0 ? razoes : ['Ponto estratégico para expansão'];
  }
  
  sugerirCapacidade(candidato) {
    const demanda = candidato.demandaEstimada;
    
    // Arredondar para múltiplos de 200
    const capacidade = Math.ceil(demanda / 200) * 200;
    
    // Mínimo 200, máximo 600
    return Math.max(200, Math.min(600, capacidade));
  }
  
  estimarInvestimento(candidato) {
    const capacidade = this.sugerirCapacidade(candidato);
    
    // R$ 2.000 por aluno (estimativa)
    const custoBase = capacidade * 2000;
    
    // Adicionar infraestrutura
    const custoInfraestrutura = custoBase * 0.3;
    
    const total = custoBase + custoInfraestrutura;
    
    return {
      total: total,
      porAluno: total / capacidade,
      formatado: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(total)
    };
  }
  
  estimarImpacto(candidato) {
    const capacidade = this.sugerirCapacidade(candidato);
    
    return {
      alunosAtendidos: capacidade,
      escolasDesafogadas: Math.min(candidato.demandaEstimada / 100, 5),
      raioCobertura: '1.5 km',
      reducaoVulnerabilidade: `${Math.round(candidato.scores.vulnerabilidade * 0.6)}%`
    };
  }
  
  gerarProximosPassos(candidato) {
    return [
      '1. Estudo de viabilidade técnica do terreno',
      '2. Consulta à comunidade local',
      '3. Análise ambiental e urbanística',
      '4. Elaboração de projeto arquitetônico',
      '5. Captação de recursos orçamentários',
      '6. Licitação e início das obras'
    ];
  }
  
  identificarRiscos(candidato) {
    const riscos = [];
    
    if (candidato.scores.acessibilidade > 80) {
      riscos.push({
        tipo: 'Logístico',
        descricao: 'Região muito isolada - dificuldade de acesso',
        mitigacao: 'Garantir infraestrutura de transporte adequada'
      });
    }
    
    if (candidato.demandaEstimada < 200) {
      riscos.push({
        tipo: 'Demanda',
        descricao: 'Demanda pode não justificar nova unidade',
        mitigacao: 'Considerar escola menor ou anexo de unidade existente'
      });
    }
    
    return riscos;
  }
  
  classificarPrioridade(score) {
    if (score >= 80) return 'MÁXIMA';
    if (score >= 60) return 'ALTA';
    if (score >= 40) return 'MÉDIA';
    return 'BAIXA';
  }
  
  // ==================== VISUALIZAÇÃO ====================
  visualizarRecomendacoes() {
    if (!window.map || this.recomendacoes.length === 0) return;
    
    console.log('🗺️ Visualizando recomendações no mapa...');
    
    // Remover camada anterior
    if (this.layerRecomendacoes) {
      window.map.removeLayer(this.layerRecomendacoes);
    }
    
    // Criar marcadores
    const marcadores = this.recomendacoes.slice(0, 5).map(rec => {
      const cor = this.getCorPorPrioridade(rec.prioridade);
      
      // Estrela para indicar local recomendado
      const icon = L.divIcon({
        className: 'recomendacao-icon',
        html: `
          <div style="
            background: ${cor};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            ${rec.ranking}
          </div>
        `,
        iconSize: [30, 30]
      });
      
      const marcador = L.marker(
        [rec.localizacao.lat, rec.localizacao.lng],
        { icon: icon }
      );
      
      // Popup com informações
      marcador.bindPopup(this.criarPopupRecomendacao(rec));
      
      return marcador;
    });
    
    this.layerRecomendacoes = L.layerGroup(marcadores);
    this.layerRecomendacoes.addTo(window.map);
    
    console.log(`✅ ${marcadores.length} recomendações visualizadas`);
  }
  
  criarPopupRecomendacao(rec) {
    const cor = this.getCorPorPrioridade(rec.prioridade);
    
    return `
      <div style="min-width: 300px; font-family: Arial, sans-serif;">
        <h4 style="margin: 0 0 10px 0; color: ${cor};">
          Local Recomendado #${rec.ranking}
        </h4>
        
        <div style="background: ${cor}20; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
          <div style="font-size: 28px; font-weight: bold; text-align: center; color: ${cor};">
            ${rec.scoreTotal}/100
          </div>
          <div style="text-align: center; font-size: 12px; margin-top: 5px;">
            Prioridade: ${rec.prioridade}
          </div>
        </div>
        
        <div style="font-size: 12px;">
          <strong>Scores:</strong><br>
          <div style="margin: 5px 0;">
            • Demanda: ${rec.scores.demanda.toFixed(0)}/100<br>
            • Vulnerabilidade: ${rec.scores.vulnerabilidade.toFixed(0)}/100<br>
            • Acessibilidade: ${rec.scores.acessibilidade.toFixed(0)}/100<br>
            • Cobertura: ${rec.scores.cobertura.toFixed(0)}/100
          </div>
          
          <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">
          
          <strong>Estimativas:</strong><br>
          • Investimento: ${rec.investimentoEstimado.formatado}<br>
          • Capacidade: ${rec.capacidadeSugerida} alunos<br>
          • Impacto: ${rec.impactoEsperado.alunosAtendidos} alunos atendidos
          
          <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">
          
          <strong>Justificativa:</strong><br>
          <ul style="margin: 5px 0; padding-left: 20px; font-size: 11px;">
            ${rec.justificativa.slice(0, 3).map(j => `<li>${j}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }
  
  getCorPorPrioridade(prioridade) {
    const cores = {
      'MÁXIMA': '#DC143C',
      'ALTA': '#FF8C00',
      'MÉDIA': '#FFD700',
      'BAIXA': '#32CD32'
    };
    return cores[prioridade] || '#6c757d';
  }
  
  // ==================== RELATÓRIO EXECUTIVO ====================
  gerarRelatorioExecutivo(config) {
    const top3 = this.recomendacoes.slice(0, 3);
    
    const relatorio = {
      timestamp: new Date().toISOString(),
      configuracao: config,
      
      resumoExecutivo: {
        locaisAnalisados: this.recomendacoes.length,
        investimentoTotal: top3.reduce(
          (sum, r) => sum + r.investimentoEstimado.total, 0
        ),
        impactoTotal: top3.reduce(
          (sum, r) => sum + r.impactoEsperado.alunosAtendidos, 0
        )
      },
      
      recomendacoes: this.recomendacoes,
      
      analisesPorIndicador: {
        voronoi: this.analises.voronoi?.estatisticas || null,
        kde: this.analises.kde?.estatisticas || null,
        lq: this.analises.lq?.estatisticas || null,
        ivc: this.analises.ivc?.estatisticas || null
      }
    };
    
    console.log('📊 Relatório executivo gerado');
    
    return relatorio;
  }
  
  // ==================== AUXILIARES ====================
  criarGridAnalise(escolas, tamanho) {
    const lats = escolas.map(e => e.lat);
    const lngs = escolas.map(e => e.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const grid = [];
    for (let lat = minLat; lat <= maxLat; lat += tamanho) {
      for (let lng = minLng; lng <= maxLng; lng += tamanho) {
        grid.push({
          centro: { lat: lat + tamanho/2, lng: lng + tamanho/2 }
        });
      }
    }
    
    return grid;
  }
  
  contarEscolasProximas(ponto, escolas, raio) {
    const proximas = escolas.filter(e => {
      const dist = this.calcularDistanciaKm(ponto, e);
      return dist <= raio;
    });
    
    return {
      total: proximas.length,
      criticas: proximas.filter(e => e.status === 'crítico').length,
      adequadas: proximas.filter(e => e.status === 'adequada').length
    };
  }
  
  estimarDemanda(ponto, escolas) {
    // Demanda baseada em escolas críticas num raio de 2km
    const escolasCriticas = escolas.filter(e => {
      if (e.status !== 'crítico') return false;
      const dist = this.calcularDistanciaKm(ponto, e);
      return dist <= 2;
    });
    
    // Assumir 200 alunos por escola crítica que precisa desafogar
    return escolasCriticas.length * 200;
  }
  
  calcularDistanciaKm(ponto1, ponto2) {
    const R = 6371;
    const dLat = (ponto2.lat - ponto1.lat) * Math.PI / 180;
    const dLon = (ponto2.lng - ponto1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(ponto1.lat * Math.PI / 180) * Math.cos(ponto2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  calcularDistanciaMediaEscolas(ponto, escolas) {
    if (escolas.length === 0) return 0;
    
    const distancias = escolas.map(e => this.calcularDistanciaKm(ponto, e));
    return distancias.reduce((a, b) => a + b, 0) / distancias.length;
  }
  
  calcularAreaCelula(tamanho) {
    // Aproximação para Fortaleza
    return (tamanho * 111) * (tamanho * 111 * Math.cos(-3.7 * Math.PI / 180));
  }
  
  // ==================== EXPORTAR ====================
  exportarRelatorio() {
    const relatorio = this.gerarRelatorioExecutivo({});
    
    const json = JSON.stringify(relatorio, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-executivo-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log('📥 Relatório exportado');
  }
}

// ==================== INSTÂNCIA GLOBAL ====================
window.dashboardExecutivo = new DashboardExecutivo();

window.ondeCostruir = async (opcoes) => {
  return await window.dashboardExecutivo.analisarOndeCostruir(opcoes);
};

console.log('✅ Dashboard Executivo carregado');
