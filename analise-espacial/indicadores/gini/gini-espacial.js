// gini-espacial.js
console.log('⚖️ Carregando Gini Espacial...');

class GiniEspacialHandler {
  constructor() {
    this.layer = null;
    this.config = {
      numQuartis: 4,
      cores: ['#28a745', '#ffc107', '#fd7e14', '#dc3545']
    };
  }

  calcular() {
    console.log('⚖️ Calculando Gini Espacial...');
    
    if (!window.map) {
      console.error('❌ Mapa não inicializado');
      return;
    }
    
    // Limpar camada anterior
    if (this.layer) {
      window.map.removeLayer(this.layer);
    }
    
    // Obter dados
    let escolas = [];
    if (window.dadosManager) {
      escolas = window.dadosManager.getEscolas();
    } else if (window.escolasDados) {
      escolas = window.escolasDados;
    } else {
      console.error('❌ Dados não disponíveis');
      return;
    }
    
    // Calcular desigualdade espacial por grid
    const bounds = window.map.getBounds();
    const grid = this.criarGrid(bounds, 0.02); // Células maiores para análise
    
    // Distribuir escolas no grid
    escolas.forEach(escola => {
      const cell = this.encontrarCelula(grid, escola.lat, escola.lng);
      if (cell) {
        cell.escolas.push(escola);
        cell.total++;
        
        // Contar criticidade
        if (escola.classe === 'crítico') cell.criticos++;
        if (escola.classe === 'atenção') cell.atencao++;
        if (escola.classe === 'alerta') cell.alerta++;
      }
    });
    
    // Calcular índice de desigualdade para cada célula
    grid.forEach(cell => {
      if (cell.total > 0) {
        // Índice simplificado: proporção de escolas críticas
        cell.indice = cell.criticos / cell.total;
      } else {
        cell.indice = 0;
      }
    });
    
    // Classificar células por quartis
    const celulasComIndice = grid.filter(c => c.indice > 0);
    if (celulasComIndice.length === 0) {
      console.warn('⚠️ Nenhuma célula com dados para Gini');
      return;
    }
    
    celulasComIndice.sort((a, b) => a.indice - b.indice);
    
    const quartilSize = Math.ceil(celulasComIndice.length / this.config.numQuartis);
    celulasComIndice.forEach((cell, index) => {
      const quartil = Math.min(
        Math.floor(index / quartilSize),
        this.config.numQuartis - 1
      );
      cell.quartil = quartil;
    });
    
    // Criar visualização
    const retangulos = celulasComIndice.map(cell => {
      const cor = this.config.cores[cell.quartil];
      
      return L.rectangle(cell.bounds, {
        color: cor,
        fillColor: cor,
        fillOpacity: 0.5,
        weight: 1
      }).bindPopup(`
        <div style="min-width: 200px;">
          <h4>Desigualdade Espacial</h4>
          <p><strong>Nível:</strong> Quartil ${cell.quartil + 1}/4</p>
          <p><strong>Total escolas:</strong> ${cell.total}</p>
          <p><strong>Críticas:</strong> ${cell.criticos} (${(cell.indice * 100).toFixed(1)}%)</p>
          <p><strong>Atenção:</strong> ${cell.atencao}</p>
          <p><strong>Alerta:</strong> ${cell.alerta}</p>
          <p><strong>Índice Gini:</strong> ${cell.indice.toFixed(3)}</p>
        </div>
      `);
    });
    
    this.layer = L.layerGroup(retangulos);
    this.layer.addTo(window.map);
    
    console.log(`✅ Gini Espacial calculado: ${retangulos.length} células analisadas`);
    this.adicionarLegenda();
  }
  
  criarGrid(bounds, tamanho) {
    const grid = [];
    
    for (let lat = bounds.getSouth(); lat < bounds.getNorth(); lat += tamanho) {
      for (let lng = bounds.getWest(); lng < bounds.getEast(); lng += tamanho) {
        grid.push({
          bounds: [[lat, lng], [lat + tamanho, lng + tamanho]],
          escolas: [],
          total: 0,
          criticos: 0,
          atencao: 0,
          alerta: 0,
          indice: 0,
          quartil: 0
        });
      }
    }
    
    return grid;
  }
  
  encontrarCelula(grid, lat, lng) {
    return grid.find(cell => {
      const [[latMin, lngMin], [latMax, lngMax]] = cell.bounds;
      return lat >= latMin && lat < latMax && lng >= lngMin && lng < lngMax;
    });
  }
  
  adicionarLegenda() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend gini-legend');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 12px;
        min-width: 150px;
      `;
      
      div.innerHTML = `
        <strong>⚖️ Gini Espacial</strong><br>
        <small>Desigualdade na distribuição</small><br>
        <div style="margin-top: 8px;">
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #dc3545; margin-right: 8px;"></div>
            <span>Q4: Alta desigualdade</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #fd7e14; margin-right: 8px;"></div>
            <span>Q3: Desigualdade média</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #ffc107; margin-right: 8px;"></div>
            <span>Q2: Baixa desigualdade</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #28a745; margin-right: 8px;"></div>
            <span>Q1: Equilíbrio</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 10px; color: #666;">
          Baseado na concentração de escolas críticas
        </div>
      `;
      
      return div;
    };
    
    legend.addTo(window.map);
  }
  
  remover() {
    if (this.layer) {
      window.map.removeLayer(this.layer);
      this.layer = null;
    }
    
    // Remover legenda
    document.querySelectorAll('.gini-legend').forEach(el => {
      el.parentNode.removeChild(el);
    });
  }
}

// Criar instância global
window.giniEspacialHandler = new GiniEspacialHandler();
window.calcularGiniEspacial = () => window.giniEspacialHandler.calcular();
console.log('✅ Gini Espacial carregado');