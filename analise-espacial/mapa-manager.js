// mapa-manager.js - ÚNICO GERENCIADOR DO MAPA
console.log('🗺️ Carregando Mapa Manager v1.0');

class MapaManager {
  constructor() {
    // Singleton pattern - apenas uma instância
    if (MapaManager.instance) {
      return MapaManager.instance;
    }
    MapaManager.instance = this;
    
    this.mapa = null;
    this.camadas = new Map();
    this.marcadores = new Map();
    this.legenda = null;
    this.controlLayers = null;
  }
  
  // ==================== INICIALIZAÇÃO ====================
  inicializar(containerId = 'map', centro = [-3.7319, -38.5267], zoom = 12) {
    if (this.mapa) {
      console.warn('⚠️ Mapa já inicializado');
      this.redimensionar();
      return this.mapa;
    }
    
    console.log('🗺️ Inicializando mapa...');
    
    try {
      // Criar mapa
      this.mapa = L.map(containerId).setView(centro, zoom);
      
      // Tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.mapa);
      
      // Controles básicos
      L.control.scale().addTo(this.mapa);
      
      // Configurar eventos
      this.configurarEventos();
      
      // Criar legenda
      this.criarLegenda();
      
      console.log('✅ Mapa inicializado com sucesso');
      
      return this.mapa;
      
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
      return null;
    }
  }
  
  // ==================== GERENCIAMENTO DE CAMADAS ====================
  adicionarCamada(nome, layer, visivel = true) {
    if (!this.mapa) {
      console.error('❌ Mapa não inicializado');
      return false;
    }
    
    // Remover camada existente com mesmo nome
    if (this.camadas.has(nome)) {
      this.removerCamada(nome);
    }
    
    // Armazenar camada
    this.camadas.set(nome, layer);
    
    // Adicionar ao mapa se visível
    if (visivel) {
      layer.addTo(this.mapa);
    }
    
    // Atualizar controle de camadas
    this.atualizarControleCamadas();
    
    console.log(`✅ Camada "${nome}" adicionada`);
    return true;
  }
  
  removerCamada(nome) {
    if (!this.camadas.has(nome)) return false;
    
    const layer = this.camadas.get(nome);
    
    // Remover do mapa
    if (this.mapa.hasLayer(layer)) {
      this.mapa.removeLayer(layer);
    }
    
    // Remover do registro
    this.camadas.delete(nome);
    
    // Atualizar controle
    this.atualizarControleCamadas();
    
    console.log(`🗑️ Camada "${nome}" removida`);
    return true;
  }
  
  alternarCamada(nome, visivel) {
    if (!this.camadas.has(nome)) return false;
    
    const layer = this.camadas.get(nome);
    
    if (visivel && !this.mapa.hasLayer(layer)) {
      layer.addTo(this.mapa);
    } else if (!visivel && this.mapa.hasLayer(layer)) {
      this.mapa.removeLayer(layer);
    }
    
    return true;
  }
  
  // ==================== PLOTAGEM DE ESCOLAS ====================
  plotarEscolas(escolas) {
    if (!this.mapa) {
      console.error('❌ Mapa não inicializado');
      return false;
    }
    
    // Remover marcadores existentes
    this.limparMarcadores();
    
    // Agrupar por status para performance
    const escolasPorStatus = {
      'crítico': [], 'critico': [],
      'atenção': [], 'atencao': [],
      'alerta': [],
      'adequada': [],
      'não avaliada': [], 'nao avaliada': []
    };
    
    // Classificar escolas
    escolas.forEach(escola => {
      const status = this.normalizarStatus(escola.status || escola.classe);
      escolasPorStatus[status]?.push(escola);
    });
    
    // Criar camadas agrupadas
    Object.entries(escolasPorStatus).forEach(([status, lista]) => {
      if (lista.length === 0) return;
      
      const cor = this.getCorPorStatus(status);
      const layerGroup = L.layerGroup();
      
      lista.forEach(escola => {
        if (!escola.lat || !escola.lng) return;
        
        // Criar marcador
        const marker = L.circleMarker([escola.lat, escola.lng], {
          radius: 8,
          fillColor: cor,
          color: '#333',
          weight: 1,
          fillOpacity: 0.7
        });
        
        // Tooltip
        const nome = escola.nome || escola.escola || `Escola ${escola.id}`;
        marker.bindTooltip(nome);
        
        // Popup
        marker.bindPopup(this.criarPopupEscola(escola, cor));
        
        // Adicionar ao grupo
        marker.addTo(layerGroup);
        
        // Armazenar para referência
        this.marcadores.set(`${escola.id}-${status}`, marker);
      });
      
      // Adicionar camada ao mapa
      this.adicionarCamada(`Escolas - ${status}`, layerGroup, true);
    });
    
    // Ajustar view para mostrar todos os marcadores
    if (escolas.length > 0) {
      this.ajustarView(escolas);
    }
    
    console.log(`✅ ${escolas.length} escolas plotadas`);
    return true;
  }
  
  limparMarcadores() {
    this.marcadores.forEach(marker => {
      if (this.mapa.hasLayer(marker)) {
        this.mapa.removeLayer(marker);
      }
    });
    this.marcadores.clear();
  }
  
  // ==================== UTILITÁRIOS ====================
  normalizarStatus(status) {
    if (!status) return 'não avaliada';
    
    const s = status.toString().toLowerCase().trim();
    
    if (s.includes('crit')) return 'crítico';
    if (s.includes('aten')) return 'atenção';
    if (s.includes('alert')) return 'alerta';
    if (s.includes('adequ') || s === 'ok') return 'adequada';
    
    return 'não avaliada';
  }
  
  getCorPorStatus(status) {
    const cores = {
      'crítico': '#dc3545',
      'atenção': '#fd7e14',
      'alerta': '#ffc107',
      'adequada': '#28a745',
      'não avaliada': '#6c757d'
    };
    return cores[status] || '#6c757d';
  }
  
  criarPopupEscola(escola, cor) {
    const nome = escola.nome || escola.escola || `Escola ${escola.id}`;
    const status = this.normalizarStatus(escola.status || escola.classe);
    
    return `
      <div style="min-width: 250px; font-family: Arial, sans-serif;">
        <h4 style="margin: 0 0 10px 0; color: ${cor}; border-bottom: 1px solid #eee; padding-bottom: 5px;">
          <i class="fas fa-school"></i> ${nome}
        </h4>
        <p><strong>Status:</strong> <span style="color: ${cor}; font-weight: bold;">${status.toUpperCase()}</span></p>
        ${escola.pontuacao ? `<p><strong>Pontuação:</strong> ${escola.pontuacao}</p>` : ''}
        ${escola.endereco ? `<p><strong>Endereço:</strong> ${escola.endereco}</p>` : ''}
        ${escola.data_avaliacao ? `<p><strong>Data:</strong> ${escola.data_avaliacao}</p>` : ''}
        <div style="margin-top: 12px; font-size: 11px; color: #888;">
          <i class="fas fa-info-circle"></i> Clique fora para fechar
        </div>
      </div>
    `;
  }
  
  ajustarView(escolas) {
    if (escolas.length === 0) return;
    
    const pontos = escolas
      .filter(e => e.lat && e.lng)
      .map(e => [e.lat, e.lng]);
    
    if (pontos.length > 0) {
      const bounds = L.latLngBounds(pontos);
      this.mapa.fitBounds(bounds.pad(0.1));
    }
  }
  
  // ==================== INTERFACE ====================
  criarLegenda() {
    if (this.legenda) {
      this.legenda.remove();
    }
    
    this.legenda = L.control({ position: 'bottomleft' });
    
    this.legenda.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: 12px;
        min-width: 150px;
      `;
      
      div.innerHTML = `
        <div class="legend-title"><strong>Legenda</strong></div>
        ${Object.entries({
          'Crítico': '#dc3545',
          'Atenção': '#fd7e14',
          'Alerta': '#ffc107',
          'Adequada': '#28a745',
          'Não avaliada': '#6c757d'
        }).map(([label, cor]) => `
          <div class="legend-item" style="display: flex; align-items: center; margin: 4px 0;">
            <div class="legend-color" style="width: 14px; height: 14px; background: ${cor}; border-radius: 3px; margin-right: 8px; border: 1px solid #fff;"></div>
            <div class="legend-label" style="font-size: 11px;">${label}</div>
          </div>
        `).join('')}
      `;
      
      return div;
    };
    
    this.legenda.addTo(this.mapa);
  }
  
  atualizarControleCamadas() {
    if (this.controlLayers) {
      this.controlLayers.remove();
    }
    
    const overlays = {};
    this.camadas.forEach((layer, nome) => {
      overlays[nome] = layer;
    });
    
    this.controlLayers = L.control.layers(null, overlays, { collapsed: false });
    this.controlLayers.addTo(this.mapa);
  }
  
  configurarEventos() {
    // Redimensionar quando a janela mudar de tamanho
    window.addEventListener('resize', () => this.redimensionar());
    
    // Atualizar controles quando o mapa mudar de zoom
    this.mapa.on('zoomend', () => {
      console.log(`🔍 Zoom atual: ${this.mapa.getZoom()}`);
    });
  }
  
  redimensionar() {
    if (this.mapa) {
      setTimeout(() => this.mapa.invalidateSize(), 100);
    }
  }
  
  // ==================== API PÚBLICA ====================
  getMapa() {
    return this.mapa;
  }
  
  getCamadas() {
    return Array.from(this.camadas.keys());
  }
  
  limparTudo() {
    this.limparMarcadores();
    this.camadas.forEach((layer, nome) => {
      this.removerCamada(nome);
    });
    this.camadas.clear();
  }
}

// ==================== INSTÂNCIA GLOBAL ====================
window.mapaManager = new MapaManager();

// Funções de compatibilidade (para módulos existentes)
window.inicializarMapa = (containerId) => window.mapaManager.inicializar(containerId);
window.plotarEscolasNoMapa = (escolas) => window.mapaManager.plotarEscolas(escolas);
window.getMapa = () => window.mapaManager.getMapa();

console.log('✅ Mapa Manager carregado e pronto');
