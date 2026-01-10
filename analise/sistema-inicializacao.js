// sistema-inicializacao.js - Sistema de Inicialização Unificado
console.log('🚀 Sistema de Inicialização v2.0');

class SistemaInicializacao {
  constructor() {
    this.etapas = {
      firebase: { status: 'pendente', progresso: 0 },
      dados: { status: 'pendente', progresso: 0 },
      mapa: { status: 'pendente', progresso: 0 },
      indicadores: { status: 'pendente', progresso: 0 }
    };
    
    this.modulosCarregados = new Set();
    this.erros = [];
    this.debug = true;
  }
  
  // Método principal de inicialização
  async iniciar() {
    console.log('🎬 Iniciando sistema CheckInfra...');
    this.mostrarLoading(true);
    
    try {
      // Etapa 1: Firebase (1s)
      await this.etapa1_Firebase();
      
      // Etapa 2: Dados (2s)
      await this.etapa2_Dados();
      
      // Etapa 3: Mapa (1s)
      await this.etapa3_Mapa();
      
      // Etapa 4: Indicadores (2s)
      await this.etapa4_Indicadores();
      
      // Finalizar
      await this.finalizar();
      
      console.log('✅ Sistema inicializado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro crítico na inicialização:', error);
      this.mostrarErro(error);
    }
  }
  
  // ==================== ETAPA 1: FIREBASE ====================
  async etapa1_Firebase() {
    this.log('FIREBASE', 'Iniciando conexão...');
    this.atualizarProgresso('firebase', 10, 'Conectando ao Firebase...');
    
    try {
      // Aguardar Firebase estar disponível
      await this.aguardarModulo(() => window.firebaseManager, 'Firebase', 3000);
      this.atualizarProgresso('firebase', 50, 'Firebase conectado');
      
      // Testar conexão
      if (window.firebaseManager.testarConexao) {
        const conectado = await window.firebaseManager.testarConexao();
        this.log('FIREBASE', `Conexão ${conectado ? 'OK' : 'FALHOU'}`);
      }
      
      this.atualizarProgresso('firebase', 100, '✅ Firebase pronto');
      this.etapas.firebase.status = 'concluido';
      
    } catch (error) {
      this.log('FIREBASE', 'Modo offline - usando dados locais');
      this.atualizarProgresso('firebase', 100, '⚠️ Modo offline');
      this.etapas.firebase.status = 'offline';
    }
  }
  
  // ==================== ETAPA 2: DADOS ====================
  async etapa2_Dados() {
    this.log('DADOS', 'Carregando dados...');
    this.atualizarProgresso('dados', 10, 'Inicializando DadosManager...');
    
    try {
      // Aguardar DadosManager
      await this.aguardarModulo(() => window.dadosManager, 'DadosManager', 5000);
      this.atualizarProgresso('dados', 30, 'DadosManager carregado');
      
      // Inicializar dados
      this.log('DADOS', 'Executando inicializar()...');
      await window.dadosManager.inicializar();
      this.atualizarProgresso('dados', 70, 'Dados processados');
      
      // Verificar dados carregados
      const escolas = window.dadosManager.getEscolas();
      const metricas = window.dadosManager.getMetricas();
      
      this.log('DADOS', `${escolas.length} escolas carregadas`);
      this.log('DADOS', 'Métricas:', metricas);
      
      this.atualizarProgresso('dados', 100, `✅ ${escolas.length} escolas`);
      this.etapas.dados.status = 'concluido';
      
      return { escolas, metricas };
      
    } catch (error) {
      this.erros.push({ etapa: 'dados', erro: error });
      throw new Error('Falha ao carregar dados: ' + error.message);
    }
  }
  
  // ==================== ETAPA 3: MAPA ====================
  async etapa3_Mapa() {
    this.log('MAPA', 'Inicializando mapa Leaflet...');
    this.atualizarProgresso('mapa', 10, 'Criando mapa...');
    
    try {
      // Verificar Leaflet
      if (typeof L === 'undefined') {
        throw new Error('Leaflet não carregado');
      }
      
      // Remover mapa existente
      if (window.map) {
        window.map.remove();
      }
      
      this.atualizarProgresso('mapa', 30, 'Configurando camadas...');
      
      // Criar mapa único e definitivo
      window.map = L.map('map').setView([-3.7319, -38.5267], 12);
      
      // ✅ CRIAR ALIAS PARA COMPATIBILIDADE
      window.mapa = window.map;
      
      this.atualizarProgresso('mapa', 60, 'Adicionando tiles...');
      
      // Adicionar tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(window.map);
      
      // Adicionar escala
      L.control.scale().addTo(window.map);
      
      this.atualizarProgresso('mapa', 90, 'Plotando escolas...');
      
      // Plotar escolas
      const escolas = window.dadosManager.getEscolas();
      this.plotarEscolasIniciais(escolas);
      
      this.atualizarProgresso('mapa', 100, '✅ Mapa pronto');
      this.etapas.mapa.status = 'concluido';
      
      // 🔥 DISPARAR EVENTO DE MAPA PRONTO
      document.dispatchEvent(new Event('mapa_pronto'));
      this.log('MAPA', '📢 Evento "mapa_pronto" disparado');
      
    } catch (error) {
      this.erros.push({ etapa: 'mapa', erro: error });
      throw new Error('Falha ao criar mapa: ' + error.message);
    }
  }
  
  // ==================== ETAPA 4: INDICADORES ====================
  async etapa4_Indicadores() {
    this.log('INDICADORES', 'Inicializando módulos de análise...');
    this.atualizarProgresso('indicadores', 10, 'Carregando indicadores...');
    
    const indicadores = [
      { nome: 'Voronoi Crítico', objeto: 'voronoiCritico' },
      { nome: 'KDE Handler', objeto: 'kdeHandler' },
      { nome: 'Zonas de Risco', objeto: 'zonasRiscoHandler' },
      { nome: 'Densidade Crítica', objeto: 'densidadeCriticaHandler' },
      { nome: 'Concentração Relativa', objeto: 'concentracaoRelativaHandler' },
      { nome: 'Gini Espacial', objeto: 'giniEspacialHandler' },
      { nome: 'Rede Influência', objeto: 'redeInfluenciaHandler' },
      { nome: 'Análise Inteligente', objeto: 'analiseInteligente' }
    ];
    
    let carregados = 0;
    const total = indicadores.length;
    
    for (const indicador of indicadores) {
      try {
        // Aguardar módulo (com timeout mais curto)
        await this.aguardarModulo(
          () => window[indicador.objeto], 
          indicador.nome, 
          2000,
          false // não lançar erro se falhar
        );
        
        // Inicializar se tiver método
        if (window[indicador.objeto]?.inicializar) {
          await window[indicador.objeto].inicializar();
        }
        
        carregados++;
        this.modulosCarregados.add(indicador.nome);
        this.log('INDICADORES', `✅ ${indicador.nome} OK`);
        
      } catch (error) {
        this.log('INDICADORES', `⚠️ ${indicador.nome} não disponível`);
      }
      
      // Atualizar progresso
      const progresso = Math.round((carregados / total) * 100);
      this.atualizarProgresso('indicadores', progresso, `${carregados}/${total} carregados`);
    }
    
    this.atualizarProgresso('indicadores', 100, `✅ ${carregados} indicadores`);
    this.etapas.indicadores.status = 'concluido';
    
    this.log('INDICADORES', `${carregados} de ${total} indicadores carregados`);
  }
  
  // ==================== PLOTAR ESCOLAS INICIAIS ====================
  plotarEscolasIniciais(escolas) {
    if (!window.map || escolas.length === 0) return;
    
    // Criar layer group
    if (window.layerEscolas) {
      window.layerEscolas.clearLayers();
    } else {
      window.layerEscolas = L.layerGroup().addTo(window.map);
    }
    
    const coresStatus = {
      'critico': '#F44336',
      'atencao': '#FF9800',
      'alerta': '#FFD700',
      'ok': '#4CAF50',
      'adequada': '#4CAF50',
      'não avaliada': '#6c757d'
    };
    
    escolas.forEach((escola, index) => {
      if (!escola.lat || !escola.lng) return;
      
      // Normalizar status
      let status = (escola.clase || escola.status || escola.classe || '').toLowerCase().trim();
      
      // Fallback se vazio
      if (!status || status === '') {
        status = 'não avaliada';
      }
      
      const cor = coresStatus[status] || '#6c757d';
      const nomeEscola = escola.escola || escola.nome || `Escola ${index + 1}`;
      
      // Criar marcador
      const marker = L.circleMarker([escola.lat, escola.lng], {
        radius: 8,
        fillColor: cor,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8,
        opacity: 1
      });
      
      // Popup
      marker.bindPopup(`
        <div style="min-width: 200px; font-family: Arial, sans-serif;">
          <h4 style="margin: 0 0 8px 0; color: ${cor};">
            <i class="fas fa-school"></i> ${nomeEscola}
          </h4>
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Status:</strong> 
            <span style="color: ${cor}; font-weight: bold;">${status}</span>
          </p>
          ${escola.pontuacao ? `
            <p style="margin: 4px 0; font-size: 13px;">
              <strong>Pontuação:</strong> ${escola.pontuacao}
            </p>
          ` : ''}
        </div>
      `);
      
      // Tooltip
      marker.bindTooltip(nomeEscola, {
        direction: 'top',
        offset: [0, -8]
      });
      
      // Adicionar ao layer
      marker.addTo(window.layerEscolas);
    });
    
    this.log('MAPA', `${escolas.length} escolas plotadas`);
  }
  
  // ==================== FINALIZAÇÃO ====================
  async finalizar() {
    this.log('SISTEMA', 'Finalizando inicialização...');
    
    // Ocultar loading
    this.mostrarLoading(false);
    
    // Atualizar dashboard
    this.atualizarDashboardInicial();
    
    // Configurar event listeners
    this.configurarEventListeners();
    
    // Mostrar resumo
    this.mostrarResumo();
    
    // Disparar evento de sistema pronto
    document.dispatchEvent(new CustomEvent('sistema_pronto', {
      detail: {
        etapas: this.etapas,
        modulos: Array.from(this.modulosCarregados),
        erros: this.erros
      }
    }));
  }
  
  // ==================== FUNÇÕES AUXILIARES ====================
  
  async aguardarModulo(verificador, nome, timeout = 5000, lancarErro = true) {
    const inicio = Date.now();
    
    while (!verificador()) {
      if (Date.now() - inicio > timeout) {
        const msg = `Timeout aguardando ${nome}`;
        if (lancarErro) {
          throw new Error(msg);
        } else {
          this.log('TIMEOUT', msg);
          return false;
        }
      }
      await this.sleep(100);
    }
    
    return true;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  atualizarProgresso(etapa, progresso, texto) {
    this.etapas[etapa].progresso = progresso;
    
    // Atualizar UI se existir
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = texto;
    }
    
    this.log('PROGRESSO', `${etapa}: ${progresso}% - ${texto}`);
  }
  
  mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.toggle('active', mostrar);
    }
  }
  
  mostrarErro(erro) {
    alert(`❌ Erro ao inicializar sistema:\n\n${erro.message}\n\nVerifique o console para mais detalhes.`);
    this.mostrarLoading(false);
  }
  
  atualizarDashboardInicial() {
    if (!window.dadosManager) return;
    
    const metricas = window.dadosManager.getMetricas();
    
    // Atualizar métricas
    const metricasElements = {
      'metric-total': metricas.totalEscolas || 0,
      'metric-criticas': metricas.escolasCriticas || 0,
      'metric-avaliadas': metricas.escolasAvaliadas || 0,
      'metric-pontuacao': metricas.pontuacaoMedia || '0.0'
    };
    
    Object.entries(metricasElements).forEach(([id, valor]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    });
    
    this.log('DASHBOARD', 'Métricas atualizadas');
  }
  
  configurarEventListeners() {
    // Botão de atualizar
    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', async () => {
        this.log('SISTEMA', 'Reinicializando por solicitação do usuário...');
        await this.iniciar();
      });
    }
    
    // Botão aplicar análise
    const btnAplicar = document.getElementById('btn-aplicar');
    if (btnAplicar) {
      btnAplicar.addEventListener('click', () => {
        this.aplicarAnalise();
      });
    }
  }
  
  aplicarAnalise() {
    this.log('ANÁLISE', 'Aplicando análise com parâmetros...');
    
    // Coletar parâmetros
    const params = {
      criticidade: document.getElementById('param-criticidade')?.value || 'todos',
      sementes: parseInt(document.getElementById('param-sementes')?.value || 3),
      raio: parseInt(document.getElementById('param-raio')?.value || 500)
    };
    
    // Verificar camadas ativas
    const camadasAtivas = [];
    document.querySelectorAll('.toggle-item.active').forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox?.checked) {
        camadasAtivas.push(checkbox.id.replace('toggle-', ''));
      }
    });
    
    this.log('ANÁLISE', 'Parâmetros:', params);
    this.log('ANÁLISE', 'Camadas ativas:', camadasAtivas);
    
    // Aplicar cada camada
    camadasAtivas.forEach(camada => {
      this.ativarCamada(camada, params);
    });
  }
  
  ativarCamada(camada, params) {
    this.log('CAMADA', `Ativando: ${camada}`);
    
    switch(camada) {
      case 'kde':
        if (window.calcularKDE) {
          window.calcularKDE(params.criticidade, params.raio);
        }
        break;
        
      case 'voronoi':
        if (window.gerarVoronoiCritico) {
          window.gerarVoronoiCritico(params.sementes, params.criticidade);
        }
        break;
        
      case 'zonas':
        if (window.gerarZonasRisco) {
          window.gerarZonasRisco();
        }
        break;
        
      // Adicionar outros conforme necessário
    }
  }
  
  mostrarResumo() {
    console.group('📊 RESUMO DA INICIALIZAÇÃO');
    console.log('Etapas:', this.etapas);
    console.log('Módulos carregados:', Array.from(this.modulosCarregados));
    console.log('Erros:', this.erros.length > 0 ? this.erros : 'Nenhum');
    console.log('Escolas no sistema:', window.dadosManager?.getEscolas().length || 0);
    console.log('Mapa disponível:', !!window.map);
    console.groupEnd();
  }
  
  log(modulo, mensagem, dados = null) {
    if (!this.debug) return;
    
    const prefixo = `[${modulo}]`;
    if (dados) {
      console.log(prefixo, mensagem, dados);
    } else {
      console.log(prefixo, mensagem);
    }
  }
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================

// Criar instância global
window.sistemaInit = new SistemaInicializacao();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.sistemaInit.iniciar();
  });
} else {
  // DOM já carregado
  window.sistemaInit.iniciar();
}

console.log('✅ Sistema de Inicialização carregado');
