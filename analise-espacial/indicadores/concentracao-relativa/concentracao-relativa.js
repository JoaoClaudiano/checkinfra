// concentracao-relativa.js
console.log('📈 Carregando Concentração Relativa...');

class ConcentracaoRelativaHandler {
  constructor() {
    this.layer = null;
    this.config = {
      raioCluster: 1000, // metros
      corCluster: '#9b59b6'
    };
  }

  calcular() {
    console.log('📈 Calculando Concentração Relativa...');
    
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
    
    // Encontrar clusters de escolas críticas
    const escolasCriticas = escolas.filter(e => e.classe === 'crítico');
    const clusters = this.identificarClusters(escolasCriticas);
    
    if (clusters.length === 0) {
      console.warn('⚠️ Nenhum cluster crítico encontrado');
      return;
    }
    
    // Criar visualização dos clusters
    const elementos = clusters.map((cluster, index) => {
      // Círculo representando o cluster
      const circulo = L.circle(cluster.centro, {
        radius: cluster.raio * 1000, // converter para metros
        color: this.config.corCluster,
        fillColor: this.config.corCluster,
        fillOpacity: 0.2,
        weight: 2
      });
      
      // Marcador no centro
      const marcador = L.circleMarker(cluster.centro, {
        radius: 8,
        fillColor: this.config.corCluster,
        color: '#fff',
        weight: 2
      });
      
      // Linhas conectando escolas do cluster
      const linhas = [];
      for (let i = 0; i < cluster.escolas.length; i++) {
        for (let j = i + 1; j < cluster.escolas.length; j++) {
          linhas.push(L.polyline([
            [cluster.escolas[i].lat, cluster.escolas[i].lng],
            [cluster.escolas[j].lat, cluster.escolas[j].lng]
          ], {
            color: this.config.corCluster,
            weight: 1,
            opacity: 0.5,
            dashArray: '3,3'
          }));
        }
      }
      
      return L.layerGroup([circulo, marcador, ...linhas]).bindPopup(`
        <div style="min-width: 200px;">
          <h4>📈 Cluster Crítico #${index + 1}</h4>
          <p><strong>Escolas no cluster:</strong> ${cluster.escolas.length}</p>
          <p><strong>Raio:</strong> ${cluster.raio.toFixed(2)} km</p>
          <p><strong>Densidade:</strong> ${(cluster.escolas.length / (Math.PI * cluster.raio * cluster.raio)).toFixed(2)} escolas/km²</p>
          <ul style="margin: 5px 0; padding-left: 15px; font-size: 11px;">
            ${cluster.escolas.slice(0, 3).map(e => `<li>${e.nome}</li>`).join('')}
            ${cluster.escolas.length > 3 ? '<li>...</li>' : ''}
          </ul>
        </div>
      `);
    });
    
    this.layer = L.layerGroup(elementos);
    this.layer.addTo(window.map);
    
    console.log(`✅ ${clusters.length} clusters identificados`);
    this.adicionarLegenda();
  }
  
  identificarClusters(escolas) {
    if (escolas.length < 2) return [];
    
    const clusters = [];
    const visitadas = new Set();
    const raioKm = this.config.raioCluster / 1000;
    
    escolas.forEach((escola, i) => {
      if (visitadas.has(i)) return;
      
      const cluster = [escola];
      visitadas.add(i);
      
      // Buscar escolas próximas
      for (let j = i + 1; j < escolas.length; j++) {
        if (!visitadas.has(j)) {
          const distancia = this.calcularDistancia(
            escola.lat, escola.lng,
            escolas[j].lat, escolas[j].lng
          );
          
          if (distancia < raioKm) {
            cluster.push(escolas[j]);
            visitadas.add(j);
          }
        }
      }
      
      if (cluster.length >= 2) {
        const centro = this.calcularCentro(cluster);
        const raio = this.calcularRaioCluster(cluster, centro);
        
        clusters.push({
          escolas: cluster,
          centro: centro,
          raio: raio
        });
      }
    });
    
    return clusters.sort((a, b) => b.escolas.length - a.escolas.length);
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
  
  calcularCentro(escolas) {
    const lat = escolas.reduce((sum, e) => sum + e.lat, 0) / escolas.length;
    const lng = escolas.reduce((sum, e) => sum + e.lng, 0) / escolas.length;
    return { lat, lng };
  }
  
  calcularRaioCluster(escolas, centro) {
    const distancias = escolas.map(e => 
      this.calcularDistancia(centro.lat, centro.lng, e.lat, e.lng)
    );
    return Math.max(...distancias);
  }
  
  adicionarLegenda() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend concentracao-legend');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 12px;
        min-width: 150px;
      `;
      
      div.innerHTML = `
        <strong>📈 Concentração Relativa</strong><br>
        <small>Clusters de escolas críticas</small><br>
        <div style="margin-top: 8px;">
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 12px; height: 12px; background: #9b59b6; border-radius: 50%; margin-right: 8px;"></div>
            <span>Centro do cluster</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #9b59b6; opacity: 0.2; margin-right: 8px;"></div>
            <span>Área de influência</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 2px; background: #9b59b6; opacity: 0.5; margin-right: 8px; border-top: 1px dashed #9b59b6;"></div>
            <span>Conexões entre escolas</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 10px; color: #666;">
          Raio: ${this.config.raioCluster}m
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
    document.querySelectorAll('.concentracao-legend').forEach(el => {
      el.parentNode.removeChild(el);
    });
  }
}

// Criar instância global
window.concentracaoRelativaHandler = new ConcentracaoRelativaHandler();
window.calcularConcentracaoRelativa = () => window.concentracaoRelativaHandler.calcular();
console.log('✅ Concentração Relativa carregada');