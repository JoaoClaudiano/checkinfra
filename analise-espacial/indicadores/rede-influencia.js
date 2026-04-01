// rede-influencia.js
console.log('🔗 Carregando Rede de Influência...');

class RedeInfluenciaHandler {
  constructor() {
    this.layer = null;
    this.config = {
      raioMaximo: 2000, // metros
      corConexao: '#3498db',
      corNo: '#2c3e50'
    };
  }

  gerar() {
    console.log('🔗 Gerando Rede de Influência...');
    
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
    
    // Filtrar escolas críticas e de atenção
    const escolasInfluentes = escolas.filter(e => 
      e.classe === 'crítico' || e.classe === 'atenção'
    );
    
    if (escolasInfluentes.length < 2) {
      console.warn('⚠️ Poucas escolas para rede de influência');
      return;
    }
    
    // Criar nós (escolas influentes)
    const nos = escolasInfluentes.map(escola => {
      const raio = this.calcularRaioInfluencia(escola);
      const intensidade = this.calcularIntensidade(escola);
      
      return L.circle([escola.lat, escola.lng], {
        radius: raio,
        color: this.config.corConexao,
        fillColor: this.config.corConexao,
        fillOpacity: 0.1,
        weight: 1
      }).bindPopup(`
        <div style="min-width: 220px;">
          <h4>${escola.nome}</h4>
          <p><strong>Nó de Influência:</strong> ${escola.classe.toUpperCase()}</p>
          <p><strong>Raio de influência:</strong> ${raio}m</p>
          <p><strong>Intensidade:</strong> ${intensidade.toFixed(2)}</p>
          <p><strong>Pontuação:</strong> ${escola.pontuacao || 'N/A'}</p>
        </div>
      `);
    });
    
    // Criar conexões entre nós próximos
    const conexoes = [];
    const raioKm = this.config.raioMaximo / 1000;
    
    for (let i = 0; i < escolasInfluentes.length; i++) {
      for (let j = i + 1; j < escolasInfluentes.length; j++) {
        const distancia = this.calcularDistancia(
          escolasInfluentes[i].lat, escolasInfluentes[i].lng,
          escolasInfluentes[j].lat, escolasInfluentes[j].lng
        );
        
        if (distancia < raioKm) {
          // Espessura baseada na criticidade
          const peso = this.calcularPesoConexao(
            escolasInfluentes[i], 
            escolasInfluentes[j]
          );
          
          conexoes.push(L.polyline([
            [escolasInfluentes[i].lat, escolasInfluentes[i].lng],
            [escolasInfluentes[j].lat, escolasInfluentes[j].lng]
          ], {
            color: this.config.corConexao,
            weight: peso,
            opacity: 0.6,
            dashArray: peso > 2 ? 'none' : '5,5'
          }).bindPopup(`
            <div style="min-width: 200px;">
              <h4>Conexão de Influência</h4>
              <p><strong>Escola A:</strong> ${escolasInfluentes[i].nome}</p>
              <p><strong>Escola B:</strong> ${escolasInfluentes[j].nome}</p>
              <p><strong>Distância:</strong> ${(distancia * 1000).toFixed(0)}m</p>
              <p><strong>Força da conexão:</strong> ${peso.toFixed(1)}</p>
              <p><strong>Risco combinado:</strong> ${this.calcularRiscoCombinado(
                escolasInfluentes[i], escolasInfluentes[j]
              ).toFixed(2)}</p>
            </div>
          `));
        }
      }
    }
    
    // Criar marcadores centrais
    const marcadores = escolasInfluentes.map(escola => {
      return L.circleMarker([escola.lat, escola.lng], {
        radius: 6,
        fillColor: this.config.corNo,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      }).bindTooltip(escola.nome);
    });
    
    this.layer = L.layerGroup([...nos, ...conexoes, ...marcadores]);
    this.layer.addTo(window.map);
    
    console.log(`✅ Rede gerada: ${nos.length} nós, ${conexoes.length} conexões`);
    this.adicionarLegenda();
  }
  
  calcularRaioInfluencia(escola) {
    switch(escola.classe) {
      case 'crítico': return 1000;  // 1km
      case 'atenção': return 600;   // 600m
      case 'alerta': return 300;    // 300m
      default: return 200;
    }
  }
  
  calcularIntensidade(escola) {
    const pesos = {
      'crítico': 1.0,
      'atenção': 0.7,
      'alerta': 0.4,
      'adequada': 0.1
    };
    
    return pesos[escola.classe] || 0.1;
  }
  
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  calcularPesoConexao(escola1, escola2) {
    const pesos = {
      'crítico': 3,
      'atenção': 2,
      'alerta': 1,
      'adequada': 0.5
    };
    
    const peso1 = pesos[escola1.classe] || 0.5;
    const peso2 = pesos[escola2.classe] || 0.5;
    
    return (peso1 + peso2) / 2;
  }
  
  calcularRiscoCombinado(escola1, escola2) {
    const risco1 = this.calcularIntensidade(escola1);
    const risco2 = this.calcularIntensidade(escola2);
    
    return (risco1 + risco2) / 2;
  }
  
  adicionarLegenda() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend rede-legend');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 12px;
        min-width: 150px;
      `;
      
      div.innerHTML = `
        <strong>Rede de Influência</strong><br>
        <small>Conexões entre pontos críticos</small><br>
        <div style="margin-top: 8px;">
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 12px; height: 12px; background: #2c3e50; border-radius: 50%; margin-right: 8px;"></div>
            <span>Nó (Escola)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 2px; background: #3498db; margin-right: 8px;"></div>
            <span>Conexão forte</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 2px; background: #3498db; opacity: 0.5; margin-right: 8px; border-top: 1px dashed #3498db;"></div>
            <span>Conexão fraca</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid #3498db; background: rgba(52, 152, 219, 0.1); margin-right: 8px;"></div>
            <span>Área de influência</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 10px; color: #666;">
          Distância máxima: ${this.config.raioMaximo}m
        </div>
      `;
      
      return div;
    }.bind(this);
    
    legend.addTo(window.map);
  }
  
  remover() {
    if (this.layer) {
      window.map.removeLayer(this.layer);
      this.layer = null;
    }
    
    // Remover legenda
    document.querySelectorAll('.rede-legend').forEach(el => {
      el.parentNode.removeChild(el);
    });
  }
}

// Criar instância global
window.redeInfluenciaHandler = new RedeInfluenciaHandler();
window.gerarRedeInfluencia = () => window.redeInfluenciaHandler.gerar();
console.log('✅ Rede de Influência carregada');