// kde.js
console.log('🔥 Carregando KDE (Kernel Density Estimation)...');

class KDEHandler {
  constructor() {
    this.layer = null;
    this.config = {
      radius: 20,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    };
  }
  

  calcular(criticidade = 'todos', raio = 500) {
    console.log(`🔥 Calculando KDE: ${criticidade}, raio: ${raio}m`);
    
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
    
    // Filtrar por criticidade
    let escolasFiltradas = this.filtrarPorCriticidade(escolas, criticidade);
    
    // Preparar pontos para heatmap
    const pontos = escolasFiltradas
      .filter(e => e.lat && e.lng)
      .map(e => [e.lat, e.lng, this.calcularIntensidade(e)]);
    
    if (pontos.length === 0) {
      console.warn('⚠️ Nenhum ponto para KDE');
      return;
    }
    
    // Ajustar raio baseado no parâmetro
    const radius = Math.max(10, Math.min(50, raio / 20));
    
    // Criar heatmap
    this.layer = L.heatLayer(pontos, {
      radius: radius,
      blur: this.config.blur,
      maxZoom: this.config.maxZoom,
      gradient: this.config.gradient
    });
    
    this.layer.addTo(window.map);
    console.log(`✅ KDE aplicado com ${pontos.length} pontos`);
    
    // Adicionar legenda
    this.adicionarLegenda();
  }
  
  filtrarPorCriticidade(escolas, criticidade) {
    switch(criticidade.toLowerCase()) {
      case 'critico':
        return escolas.filter(e => e.classe === 'crítico');
      case 'atencao':
        return escolas.filter(e => e.classe === 'crítico' || e.classe === 'atenção');
      case 'alerta':
        return escolas.filter(e => e.classe === 'crítico' || e.classe === 'atenção' || e.classe === 'alerta');
      default:
        return escolas;
    }
  }
  
  calcularIntensidade(escola) {
    // Intensidade baseada na criticidade
    const pesos = {
      'crítico': 1.0,
      'atenção': 0.7,
      'alerta': 0.4,
      'adequada': 0.1,
      'não avaliada': 0.05
    };
    
    return pesos[escola.classe] || 0.1;
  }
  
  adicionarLegenda() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend kde-legend');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 12px;
        min-width: 150px;
      `;
      
      div.innerHTML = `
        <strong>Densidade de Kernel</strong><br>
        <small>Intensidade por criticidade</small><br>
        <div style="margin-top: 8px;">
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: red; margin-right: 8px;"></div>
            <span>Alta (Crítico)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: yellow; margin-right: 8px;"></div>
            <span>Média (Atenção)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: lime; margin-right: 8px;"></div>
            <span>Baixa (Alerta)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: blue; margin-right: 8px;"></div>
            <span>Mínima (Adequada)</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 10px; color: #666;">
          Baseado em distância e criticidade
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
    document.querySelectorAll('.kde-legend').forEach(el => {
      el.parentNode.removeChild(el);
    });
  }
}

// Criar instância global
window.kdeHandler = new KDEHandler();
window.calcularKDE = (criticidade, raio) => window.kdeHandler.calcular(criticidade, raio);
console.log('✅ KDE carregado');