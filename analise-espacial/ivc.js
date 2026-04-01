// ivc.js - Índice de Vulnerabilidade Composta
console.log('🎯 IVC - Índice de Vulnerabilidade Composta v1.0');

class IndiceVulnerabilidadeComposta {
  constructor() {
    // Pesos dos componentes (somam 1.0)
    this.pesos = {
      criticidade: 0.40,        // 40% - Mais importante
      densidadePop: 0.25,      // 25%
      acessibilidade: 0.20,    // 20%
      infraestrutura: 0.15     // 15%
    };
    
    this.resultados = [];
    this.layerIVC = null;
    this.inicializado = false;
  }
  
  inicializar() {
    if (this.inicializado) return true;
    
    console.log('🚀 Inicializando IVC...');
    
    if (!window.map) {
      console.error('❌ Mapa não disponível');
      return false;
    }
    
    this.inicializado = true;
    console.log('✅ IVC inicializado');
    return true;
  }
  
  // ==================== CALCULAR IVC ====================
  calcular() {
    console.log('🎯 Calculando Índice de Vulnerabilidade Composta...');
    
    if (!window.dadosManager) {
      console.error('❌ DadosManager não disponível');
      return null;
    }
    
    const escolas = window.dadosManager.getEscolas();
    
    if (escolas.length === 0) {
      console.warn('⚠️ Nenhuma escola para análise');
      return null;
    }
    
    // Calcular IVC para cada escola
    this.resultados = escolas.map(escola => {
      const componentes = this.calcularComponentes(escola, escolas);
      const ivc = this.calcularIVCTotal(componentes);
      
      return {
        escola: escola,
        ivc: ivc,
        componentes: componentes,
        classificacao: this.classificarIVC(ivc),
        prioridade: this.definirPrioridade(ivc)
      };
    });
    
    // Ordenar por IVC (mais vulneráveis primeiro)
    this.resultados.sort((a, b) => b.ivc - a.ivc);
    
    // Visualizar
    this.visualizar();
    
    // Estatísticas
    const stats = this.gerarEstatisticas();
    
    console.log('✅ IVC calculado:', stats);
    
    return {
      resultados: this.resultados,
      estatisticas: stats
    };
  }
  
  // ==================== CALCULAR COMPONENTES ====================
  calcularComponentes(escola, todasEscolas) {
    return {
      // 1. CRITICIDADE (0-100)
      criticidade: this.calcularCriticidade(escola),
      
      // 2. DENSIDADE POPULACIONAL (0-100)
      // Baseado em matriculas + escolas próximas
      densidadePop: this.calcularDensidadePopulacional(escola, todasEscolas),
      
      // 3. ACESSIBILIDADE (0-100)
      // Distância a outras escolas e isolamento
      acessibilidade: this.calcularAcessibilidade(escola, todasEscolas),
      
      // 4. INFRAESTRUTURA (0-100)
      // Baseado em pontuação e recursos disponíveis
      infraestrutura: this.calcularInfraestrutura(escola)
    };
  }
  
  // 1. CRITICIDADE
  calcularCriticidade(escola) {
    const pesos = {
      'crítico': 100,
      'atenção': 70,
      'alerta': 40,
      'adequada': 10,
      'não avaliada': 50 // Incerteza = risco médio
    };
    
    let score = pesos[escola.status] || 50;
    
    // Ajustar por pontuação se disponível
    if (escola.pontuacao > 0) {
      // Pontuação baixa = maior criticidade
      score = score * (1 - (escola.pontuacao / 100) * 0.3);
    }
    
    return Math.min(score, 100);
  }
  
  // 2. DENSIDADE POPULACIONAL
  calcularDensidadePopulacional(escola, todasEscolas) {
    // Número de alunos da escola
    const alunosEscola = escola.matriculas || 200;
    
    // Contar escolas num raio de 1km
    const raioKm = 1;
    const escolasProximas = todasEscolas.filter(outra => {
      if (outra.id === escola.id) return false;
      const dist = this.calcularDistanciaKm(escola, outra);
      return dist <= raioKm;
    });
    
    const alunosProximos = escolasProximas.reduce(
      (sum, e) => sum + (e.matriculas || 200), 
      0
    );
    
    const totalAlunos = alunosEscola + alunosProximos;
    
    // Normalizar (assumindo max 5000 alunos no raio)
    const score = Math.min((totalAlunos / 5000) * 100, 100);
    
    return score;
  }
  
  // 3. ACESSIBILIDADE
  calcularAcessibilidade(escola, todasEscolas) {
    // Encontrar as 3 escolas mais próximas
    const distancias = todasEscolas
      .filter(outra => outra.id !== escola.id)
      .map(outra => this.calcularDistanciaKm(escola, outra))
      .sort((a, b) => a - b)
      .slice(0, 3);
    
    if (distancias.length === 0) {
      return 100; // Completamente isolada
    }
    
    // Média das 3 mais próximas
    const distanciaMedia = distancias.reduce((a, b) => a + b, 0) / distancias.length;
    
    // Quanto mais longe, pior a acessibilidade (mais vulnerável)
    // >2km = 100 (muito vulnerável)
    const score = Math.min((distanciaMedia / 2) * 100, 100);
    
    return score;
  }
  
  // 4. INFRAESTRUTURA
  calcularInfraestrutura(escola) {
    // Baseado na pontuação (se disponível)
    if (escola.pontuacao > 0) {
      // Inverter: pontuação baixa = infraestrutura ruim = vulnerável
      return 100 - escola.pontuacao;
    }
    
    // Se não tem pontuação, usar status
    const scoresPorStatus = {
      'crítico': 90,
      'atenção': 65,
      'alerta': 40,
      'adequada': 15,
      'não avaliada': 50
    };
    
    return scoresPorStatus[escola.status] || 50;
  }
  
  // ==================== CALCULAR IVC TOTAL ====================
  calcularIVCTotal(componentes) {
    const ivc = 
      componentes.criticidade * this.pesos.criticidade +
      componentes.densidadePop * this.pesos.densidadePop +
      componentes.acessibilidade * this.pesos.acessibilidade +
      componentes.infraestrutura * this.pesos.infraestrutura;
    
    return Math.round(ivc);
  }
  
  // ==================== CLASSIFICAÇÃO ====================
  classificarIVC(ivc) {
    if (ivc >= 80) return 'Vulnerabilidade Extrema';
    if (ivc >= 60) return 'Vulnerabilidade Alta';
    if (ivc >= 40) return 'Vulnerabilidade Moderada';
    if (ivc >= 20) return 'Vulnerabilidade Baixa';
    return 'Vulnerabilidade Mínima';
  }
  
  definirPrioridade(ivc) {
    if (ivc >= 80) return 1; // Prioridade máxima
    if (ivc >= 60) return 2;
    if (ivc >= 40) return 3;
    if (ivc >= 20) return 4;
    return 5; // Prioridade mínima
  }
  
  getCorPorIVC(ivc) {
    if (ivc >= 80) return '#8B0000'; // Vermelho escuro
    if (ivc >= 60) return '#DC143C'; // Vermelho
    if (ivc >= 40) return '#FF8C00'; // Laranja
    if (ivc >= 20) return '#FFD700'; // Amarelo
    return '#32CD32'; // Verde
  }
  
  // ==================== VISUALIZAÇÃO ====================
  visualizar() {
    if (!window.map) return;
    
    console.log('🗺️ Visualizando IVC no mapa...');
    
    // Remover camada anterior
    if (this.layerIVC) {
      window.map.removeLayer(this.layerIVC);
    }
    
    // Criar marcadores com tamanho proporcional ao IVC
    const marcadores = this.resultados.map(resultado => {
      const escola = resultado.escola;
      const ivc = resultado.ivc;
      const cor = this.getCorPorIVC(ivc);
      
      // Raio proporcional ao IVC
      const raio = 8 + (ivc / 100) * 12; // 8-20px
      
      const marcador = L.circleMarker([escola.lat, escola.lng], {
        radius: raio,
        fillColor: cor,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8,
        className: 'ivc-marker'
      });
      
      // Popup detalhado
      marcador.bindPopup(this.criarPopup(resultado));
      
      // Tooltip com IVC
      marcador.bindTooltip(`${escola.nome}<br>IVC: ${ivc}/100`, {
        direction: 'top'
      });
      
      return marcador;
    });
    
    this.layerIVC = L.layerGroup(marcadores);
    this.layerIVC.addTo(window.map);
    
    // Adicionar legenda
    this.adicionarLegenda();
    
    console.log(`✅ ${marcadores.length} escolas visualizadas com IVC`);
  }
  
  criarPopup(resultado) {
    const escola = resultado.escola;
    const ivc = resultado.ivc;
    const comp = resultado.componentes;
    const cor = this.getCorPorIVC(ivc);
    
    return `
      <div style="min-width: 250px; font-family: Arial, sans-serif;">
        <h4 style="margin: 0 0 10px 0; color: ${cor};">
          ${escola.nome}
        </h4>
        
        <div style="background: ${cor}20; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
          <div style="font-size: 24px; font-weight: bold; text-align: center; color: ${cor};">
            ${ivc}/100
          </div>
          <div style="text-align: center; font-size: 12px; color: #666; margin-top: 5px;">
            ${resultado.classificacao}
          </div>
        </div>
        
        <div style="font-size: 12px;">
          <strong>Componentes do IVC:</strong><br>
          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span>Criticidade (40%):</span>
              <strong>${comp.criticidade.toFixed(1)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span><svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></svg> Densidade Pop. (25%):</span>
              <strong>${comp.densidadePop.toFixed(1)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span><svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><polygon points='3 11 22 2 13 21 11 13 3 11'/></svg> Acessibilidade (20%):</span>
              <strong>${comp.acessibilidade.toFixed(1)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span><svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/></svg> Infraestrutura (15%):</span>
              <strong>${comp.infraestrutura.toFixed(1)}</strong>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 11px;">
          <strong>Prioridade:</strong> Nível ${resultado.prioridade} (1=Máxima)
        </div>
      </div>
    `;
  }
  
  adicionarLegenda() {
    const legenda = L.control({ position: 'bottomleft' });
    
    legenda.onAdd = function() {
      const div = L.DomUtil.create('div', 'legenda-ivc');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: 12px;
      `;
      
      div.innerHTML = `
        <strong>IVC - Vulnerabilidade</strong><br>
        <small style="color: #666;">Índice composto (0-100)</small><br>
        <div style="margin-top: 8px;">
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #8B0000; margin-right: 8px;"></div>
            <span>80-100: Extrema</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #DC143C; margin-right: 8px;"></div>
            <span>60-80: Alta</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #FF8C00; margin-right: 8px;"></div>
            <span>40-60: Moderada</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #FFD700; margin-right: 8px;"></div>
            <span>20-40: Baixa</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #32CD32; margin-right: 8px;"></div>
            <span>0-20: Mínima</span>
          </div>
        </div>
      `;
      
      return div;
    };
    
    legenda.addTo(window.map);
  }
  
  // ==================== ESTATÍSTICAS ====================
  gerarEstatisticas() {
    if (this.resultados.length === 0) {
      return { total: 0, ivcMedio: 0 };
    }
    
    const ivcs = this.resultados.map(r => r.ivc);
    const ivcMedio = ivcs.reduce((a, b) => a + b, 0) / ivcs.length;
    const ivcMaximo = Math.max(...ivcs);
    
    const porPrioridade = {};
    this.resultados.forEach(r => {
      porPrioridade[r.prioridade] = (porPrioridade[r.prioridade] || 0) + 1;
    });
    
    return {
      total: this.resultados.length,
      ivcMedio: ivcMedio.toFixed(1),
      ivcMaximo: ivcMaximo,
      escolasExtremas: this.resultados.filter(r => r.ivc >= 80).length,
      escolasAltas: this.resultados.filter(r => r.ivc >= 60 && r.ivc < 80).length,
      porPrioridade: porPrioridade,
      top10: this.resultados.slice(0, 10).map(r => ({
        nome: r.escola.nome,
        ivc: r.ivc,
        prioridade: r.prioridade
      }))
    };
  }
  
  // ==================== AUXILIARES ====================
  calcularDistanciaKm(escola1, escola2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (escola2.lat - escola1.lat) * Math.PI / 180;
    const dLon = (escola2.lng - escola1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(escola1.lat * Math.PI / 180) * Math.cos(escola2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  remover() {
    if (this.layerIVC) {
      window.map.removeLayer(this.layerIVC);
      this.layerIVC = null;
    }
    
    console.log('🗑️ IVC removido do mapa');
  }
}

// ==================== INSTÂNCIA GLOBAL ====================
window.ivcHandler = new IndiceVulnerabilidadeComposta();

window.calcularIVC = () => {
  return window.ivcHandler.calcular();
};

console.log('✅ IVC carregado');
