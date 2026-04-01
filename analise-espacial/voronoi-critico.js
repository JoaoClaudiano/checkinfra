// voronoi-critico.js - Sistema Inteligente de Voronoi por Criticidade
console.log('🧩 Carregando Voronoi Crítico v1.0...');

class VoronoiCritico {
  constructor() {
    this.sementes = [];
    this.poligonos = [];
    this.poligonosLayer = null;
    this.sementesLayer = null;
    this.config = {
      maxSementes: 10,
      classesPrioritarias: ['crítico', 'atenção', 'alerta'],
      raioInfluencia: 1000,
      atualizacaoAutomatica: true,
      corPoligonos: '#1f4fd8',
      corSementes: '#dc3545'
    };
    
    this.estatisticas = {
      totalSementes: 0,
      escolasCobertas: 0,
      areaTotal: 0,
      ultimaAtualizacao: null
    };
    
    this.inicializado = false;
  }
  
  // Inicializar o sistema
  inicializar() {
    if (this.inicializado) return;
    
    console.log('🚀 Inicializando Voronoi Crítico...');
    
    // Verificar dependências
    if (typeof L === 'undefined') {
      console.error('❌ Leaflet não carregado');
      return false;
    }
    
    if (!window.dadosManager) {
      console.error('❌ DadosManager não disponível');
      return false;
    }
    
    // Configurar eventos
    this.configurarEventos();
    
    this.inicializado = true;
    console.log('✅ Voronoi Crítico inicializado');
    
    return true;
  }
  
  // Configurar eventos automáticos
  configurarEventos() {
    // Escutar atualizações de dados
    if (window.dadosManager) {
      window.dadosManager.adicionarListener('dados_atualizados', (dados) => {
        if (this.config.atualizacaoAutomatica && this.sementes.length > 0) {
          console.log('🔄 Dados atualizados, recalculando Voronoi...');
          this.recalcularComMesmosParametros();
        }
      });
    }
    
    // Escutar evento de atualização manual
    document.addEventListener('atualizar_voronoi', () => {
      this.recalcularComMesmosParametros();
    });
  }
  
  // Gerar diagrama de Voronoi
  gerar(numSementes = 5, filtroClasse = 'critico') {
    console.log(`🧩 Gerando Voronoi: ${numSementes} sementes, filtro: ${filtroClasse}`);
    
    if (!window.map || !(window.map instanceof L.Map)) {
  console.warn('⏳ Mapa Leaflet ainda não pronto. Voronoi adiado.');
  return;
}
    
    // Validar parâmetros
    if (numSementes < 2) {
      console.warn('⚠️ Mínimo 2 sementes para Voronoi');
      return null;
    }
    
    // Verificar mapa
    if (!window.map) {
      console.error('❌ Mapa não inicializado');
      return null;
    }
    
    // Limpar visualização anterior
    this.limparVisualizacao();
    
    try {
      // 1. Selecionar sementes por criticidade
      this.sementes = this.selecionarSementes(numSementes, filtroClasse);
      
      if (this.sementes.length < 2) {
        console.warn('⚠️ Sementes insuficientes após filtro');
        return null;
      }
      
      // 2. Calcular polígonos de Voronoi
      this.poligonos = this.calcularPoligonos(this.sementes);
      
      // 3. Visualizar no mapa
      this.visualizarNoMapa();
      
      // 4. Calcular estatísticas
      this.calcularEstatisticas();
      
      // 5. Atualizar interface
      this.atualizarInterface();
      
      console.log(`✅ Voronoi gerado com sucesso: ${this.sementes.length} sementes`);
      
      // Disparar evento de conclusão
      document.dispatchEvent(new CustomEvent('voronoi_gerado', {
        detail: this.estatisticas
      }));
      
      return this.estatisticas;
      
    } catch (error) {
      console.error('❌ Erro ao gerar Voronoi:', error);
      return null;
    }
  }
  
  // Selecionar sementes baseado em criticidade
  selecionarSementes(numSementes, filtroClasse) {
    if (!window.dadosManager) return [];
    
    const todasEscolas = window.dadosManager.getEscolas();
    
    // Filtrar escolas baseado no critério
    let escolasFiltradas = [];
    
    switch(filtroClasse.toLowerCase()) {
      case 'critico':
        escolasFiltradas = todasEscolas.filter(e => e.classe === 'crítico');
        break;
      case 'atencao':
        escolasFiltradas = todasEscolas.filter(e => 
          e.classe === 'crítico' || e.classe === 'atenção'
        );
        break;
      case 'alerta':
        escolasFiltradas = todasEscolas.filter(e => 
          e.classe === 'crítico' || e.classe === 'atenção' || e.classe === 'alerta'
        );
        break;
      default:
        escolasFiltradas = todasEscolas;
    }
    
    // Se não houver escolas suficientes com o filtro, usar as mais críticas disponíveis
    if (escolasFiltradas.length < numSementes) {
      console.warn(`⚠️ Apenas ${escolasFiltradas.length} escolas no filtro, usando as mais críticas...`);
      
      // Ordenar todas as escolas por criticidade e pegar as N mais críticas
      escolasFiltradas = [...todasEscolas]
        .sort((a, b) => this.calcularScoreCriticidade(b) - this.calcularScoreCriticidade(a))
        .slice(0, numSementes);
    }
    
    // Ordenar por criticidade (score)
    escolasFiltradas.sort((a, b) => {
      const scoreA = this.calcularScoreCriticidade(a);
      const scoreB = this.calcularScoreCriticidade(b);
      
      // Criticidade primeiro
      if (scoreB !== scoreA) return scoreB - scoreA;
      
      // Recência depois
      const dataA = a.updatedAt || a.createdAt || new Date(0);
      const dataB = b.updatedAt || b.createdAt || new Date(0);
      return new Date(dataB) - new Date(dataA);
    });
    
    // Pegar as N primeiras
    return escolasFiltradas.slice(0, Math.min(numSementes, escolasFiltradas.length));
  }
  
  // Calcular score de criticidade
  calcularScoreCriticidade(escola) {
    const pesosClasse = {
      'crítico': 100,
      'atenção': 70,
      'alerta': 40,
      'adequada': 10,
      'não avaliada': 0
    };
    
    const pesoBase = pesosClasse[escola.classe] || 0;
    const pesoPontuacao = escola.pontuacao || 0;
    const pesoRecencia = this.calcularPesoRecencia(escola);
    
    return pesoBase + (pesoPontuacao * 0.1) + pesoRecencia;
  }
  
  // Calcular peso baseado na recência
  calcularPesoRecencia(escola) {
    if (!escola.updatedAt && !escola.createdAt) return 0;
    
    const data = escola.updatedAt || escola.createdAt;
    const diasDesdeAtualizacao = (new Date() - new Date(data)) / (1000 * 60 * 60 * 24);
    
    // Maior peso para atualizações mais recentes (últimos 30 dias)
    if (diasDesdeAtualizacao <= 7) return 30;
    if (diasDesdeAtualizacao <= 30) return 20;
    if (diasDesdeAtualizacao <= 90) return 10;
    return 0;
  }
  
  // Calcular polígonos de Voronoi usando Delaunay triangulation
  calcularPoligonos(sementes) {
    console.log('📐 Calculando polígonos de Voronoi...');
    
    if (sementes.length < 2) {
      console.warn('⚠️ Sementes insuficientes para Voronoi');
      return [];
    }
    
    // Converter coordenadas para pixels
    const pontosPixels = sementes.map(semente => {
      const point = window.map.latLngToContainerPoint([semente.lat, semente.lng]);
      return { x: point.x, y: point.y, escola: semente };
    });
    
    // Calcular bounding box
    const bbox = this.calcularBoundingBoxPixels(pontosPixels);
    
    // Usar Delaunay triangulation para Voronoi
    const poligonos = [];
    
    // Para cada ponto, criar um polígono aproximado
    pontosPixels.forEach((ponto, index) => {
      const poligonoPixels = this.criarPoligonoVoronoiAproximado(ponto, pontosPixels, bbox);
      
      if (poligonoPixels && poligonoPixels.length > 2) {
        // Converter pixels de volta para lat/lng
        const poligonoLatLng = poligonoPixels.map(pixel => 
          window.map.containerPointToLatLng(L.point(pixel.x, pixel.y))
        );
        
        poligonos.push({
          id: `voronoi-${ponto.escola.id}`,
          semente: ponto.escola,
          vertices: poligonoLatLng,
          area: this.calcularAreaPoligono(poligonoLatLng),
          escolasDentro: this.contarEscolasNoPoligono(poligonoLatLng)
        });
      }
    });
    
    console.log(`✅ ${poligonos.length} polígonos calculados`);
    return poligonos;
  }
  
  // Criar polígono de Voronoi aproximado
  criarPoligonoVoronoiAproximado(pontoCentral, todosPontos, bbox) {
    // Número de direções para amostrar
    const numDirecoes = 36; // 10 graus cada
    const vertices = [];
    
    for (let i = 0; i < numDirecoes; i++) {
      const angulo = (i * 2 * Math.PI) / numDirecoes;
      
      // Encontrar o ponto mais próximo na direção do ângulo
      let pontoMaisProximo = this.encontrarPontoMaisProximoNaDirecao(
        pontoCentral, todosPontos, angulo, bbox
      );
      
      if (pontoMaisProximo) {
        vertices.push(pontoMaisProximo);
      }
    }
    
    return vertices.length > 2 ? vertices : null;
  }
  
  // Encontrar ponto mais próximo em uma direção específica
  encontrarPontoMaisProximoNaDirecao(pontoCentral, todosPontos, angulo, bbox) {
    let pontoMaisProximo = null;
    let distanciaMinima = Infinity;
    
    // Vetor direção
    const dirX = Math.cos(angulo);
    const dirY = Math.sin(angulo);
    
    todosPontos.forEach(ponto => {
      if (ponto === pontoCentral) return;
      
      // Vetor do ponto central ao ponto atual
      const vecX = ponto.x - pontoCentral.x;
      const vecY = ponto.y - pontoCentral.y;
      
      // Projeção na direção
      const projecao = (vecX * dirX + vecY * dirY) / Math.sqrt(dirX * dirX + dirY * dirY);
      
      if (projecao > 0) {
        // Distância perpendicular
        const distancia = Math.sqrt(vecX * vecX + vecY * vecY - projecao * projecao);
        
        // Ponto médio entre os pontos
        const pontoMedio = {
          x: pontoCentral.x + dirX * (projecao / 2),
          y: pontoCentral.y + dirY * (projecao / 2)
        };
        
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          pontoMaisProximo = pontoMedio;
        }
      }
    });
    
    // Se não encontrou ponto próximo, usar limite do bounding box
    if (!pontoMaisProximo) {
      // Intersecção com bounding box
      const intersecao = this.calcularIntersecaoBbox(pontoCentral, dirX, dirY, bbox);
      pontoMaisProximo = intersecao;
    }
    
    return pontoMaisProximo;
  }
  
  // Calcular interseção com bounding box
  calcularIntersecaoBbox(ponto, dirX, dirY, bbox) {
    const { minX, minY, maxX, maxY } = bbox;
    
    // Calcular interseções com cada borda
    const intersecoes = [];
    
    // Borda esquerda (x = minX)
    if (dirX !== 0) {
      const t = (minX - ponto.x) / dirX;
      if (t > 0) {
        const y = ponto.y + dirY * t;
        if (y >= minY && y <= maxY) {
          intersecoes.push({ x: minX, y: y, t: t });
        }
      }
    }
    
    // Borda direita (x = maxX)
    if (dirX !== 0) {
      const t = (maxX - ponto.x) / dirX;
      if (t > 0) {
        const y = ponto.y + dirY * t;
        if (y >= minY && y <= maxY) {
          intersecoes.push({ x: maxX, y: y, t: t });
        }
      }
    }
    
    // Borda superior (y = minY)
    if (dirY !== 0) {
      const t = (minY - ponto.y) / dirY;
      if (t > 0) {
        const x = ponto.x + dirX * t;
        if (x >= minX && x <= maxX) {
          intersecoes.push({ x: x, y: minY, t: t });
        }
      }
    }
    
    // Borda inferior (y = maxY)
    if (dirY !== 0) {
      const t = (maxY - ponto.y) / dirY;
      if (t > 0) {
        const x = ponto.x + dirX * t;
        if (x >= minX && x <= maxX) {
          intersecoes.push({ x: x, y: maxY, t: t });
        }
      }
    }
    
    // Retornar a interseção mais próxima
    if (intersecoes.length > 0) {
      intersecoes.sort((a, b) => a.t - b.t);
      return { x: intersecoes[0].x, y: intersecoes[0].y };
    }
    
    // Fallback: ponto na borda
    return { x: ponto.x + dirX * 1000, y: ponto.y + dirY * 1000 };
  }
  
  // Calcular bounding box em pixels
  calcularBoundingBoxPixels(pontos) {
    const xs = pontos.map(p => p.x);
    const ys = pontos.map(p => p.y);
    
    return {
      minX: Math.min(...xs) - 50,
      minY: Math.min(...ys) - 50,
      maxX: Math.max(...xs) + 50,
      maxY: Math.max(...ys) + 50
    };
  }
  
  // Calcular área de um polígono em metros quadrados
  calcularAreaPoligono(vertices) {
    if (vertices.length < 3) return 0;
    
    let area = 0;
    const n = vertices.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].lng * vertices[j].lat;
      area -= vertices[j].lng * vertices[i].lat;
    }
    
    area = Math.abs(area) / 2;
    
    // Converter graus² para metros² (aproximado para Fortaleza)
    const metrosPorGrauLat = 111320; // 1 grau de latitude ≈ 111.32 km
    const metrosPorGrauLng = 111320 * Math.cos(3.717 * Math.PI / 180); // Ajuste para latitude de Fortaleza
    
    return area * metrosPorGrauLat * metrosPorGrauLng;
  }
  
  // Contar escolas dentro de um polígono
  contarEscolasNoPoligono(vertices) {
    if (!window.dadosManager || vertices.length < 3) return 0;
    
    const escolas = window.dadosManager.getEscolas();
    let count = 0;
    
    escolas.forEach(escola => {
      if (this.pontoDentroPoligono(escola.lat, escola.lng, vertices)) {
        count++;
      }
    });
    
    return count;
  }
  
  // Verificar se ponto está dentro do polígono
  pontoDentroPoligono(lat, lng, vertices) {
    let dentro = false;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const vi = vertices[i];
      const vj = vertices[j];
      
      if (((vi.lat > lat) !== (vj.lat > lat)) &&
          (lng < (vj.lng - vi.lng) * (lat - vi.lat) / (vj.lat - vi.lat) + vi.lng)) {
        dentro = !dentro;
      }
    }
    
    return dentro;
  }
  
  // Visualizar no mapa
  visualizarNoMapa() {
    if (!window.map || this.poligonos.length === 0) return;
    
    // Limpar camadas anteriores
    if (this.poligonosLayer) {
      window.map.removeLayer(this.poligonosLayer);
    }
    
    if (this.sementesLayer) {
      window.map.removeLayer(this.sementesLayer);
    }
    
    // Criar camada de polígonos
    const poligonosFeatures = this.poligonos.map(poligono => {
      // Calcular cor baseada na criticidade da semente
      const cor = this.getCorPorCriticidade(poligono.semente.classe);
      const opacidade = 0.3;
      
      return L.polygon(poligono.vertices, {
        color: cor,
        weight: 2,
        opacity: 0.8,
        fillColor: cor,
        fillOpacity: opacidade,
        className: 'voronoi-polygon'
      }).bindPopup(`
        <div class="voronoi-popup">
          <h4>Área de Influência</h4>
          <p><strong>Semente:</strong> ${poligono.semente.nome}</p>
          <p><strong>Criticidade:</strong> ${poligono.semente.classe}</p>
          <p><strong>Pontuação:</strong> ${poligono.semente.pontuacao || 0}</p>
          <p><strong>Área:</strong> ${(poligono.area / 1000000).toFixed(2)} km²</p>
          <p><strong>Escolas na área:</strong> ${poligono.escolasDentro}</p>
          <p><strong>Densidade:</strong> ${poligono.area > 0 ? 
            (poligono.escolasDentro / (poligono.area / 1000000)).toFixed(2) : 0} escolas/km²</p>
        </div>
      `);
    });
    
    this.poligonosLayer = L.layerGroup(poligonosFeatures);
    this.poligonosLayer.addTo(window.map);
    
    // Criar camada de sementes
    const sementesFeatures = this.sementes.map(semente => {
      const cor = this.getCorPorCriticidade(semente.classe);
      
      return L.circleMarker([semente.lat, semente.lng], {
        radius: 10,
        fillColor: cor,
        color: '#fff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
        className: 'voronoi-seed'
      }).bindTooltip(`
        <strong>${semente.nome}</strong><br>
        ${semente.classe} | Score: ${this.calcularScoreCriticidade(semente).toFixed(1)}
      `);
    });
    
    this.sementesLayer = L.layerGroup(sementesFeatures);
    this.sementesLayer.addTo(window.map);
    
    // Ajustar view para mostrar todos os polígonos
    if (this.poligonos.length > 0) {
      const bounds = L.latLngBounds(this.poligonos.flatMap(p => p.vertices));
      window.map.fitBounds(bounds.pad(0.1));
    }
    
    console.log('🗺️ Voronoi visualizado no mapa');
  }
  
  // Obter cor baseada na criticidade
  getCorPorCriticidade(classe) {
    const cores = {
      'crítico': '#dc3545',
      'atenção': '#fd7e14',
      'alerta': '#ffc107',
      'adequada': '#28a745',
      'não avaliada': '#6c757d'
    };
    
    return cores[classe] || '#6c757d';
  }
  
  // Calcular estatísticas
  calcularEstatisticas() {
    const totalEscolas = window.dadosManager ? window.dadosManager.getEscolas().length : 0;
    const escolasCobertas = this.poligonos.reduce((total, p) => total + p.escolasDentro, 0);
    const areaTotal = this.poligonos.reduce((total, p) => total + p.area, 0);
    const areaMedia = areaTotal / this.poligonos.length;
    
    this.estatisticas = {
      totalSementes: this.sementes.length,
      escolasCobertas,
      coberturaPercentual: totalEscolas > 0 ? ((escolasCobertas / totalEscolas) * 100).toFixed(1) + '%' : '0%',
      areaTotal: (areaTotal / 1000000).toFixed(2) + ' km²',
      areaMedia: (areaMedia / 1000000).toFixed(2) + ' km²',
      densidadeMedia: areaTotal > 0 ? (escolasCobertas / (areaTotal / 1000000)).toFixed(2) + ' escolas/km²' : '0',
      classesSementes: [...new Set(this.sementes.map(s => s.classe))],
      ultimaAtualizacao: new Date().toISOString()
    };
    
    console.log('📊 Estatísticas do Voronoi:', this.estatisticas);
  }
  
  // Atualizar interface com resultados
  atualizarInterface() {
    // Atualizar container do Voronoi se existir
    const container = document.getElementById('voronoi-container');
    if (container) {
      container.innerHTML = `
        <div class="resultado-voronoi">
          <h5>Diagrama de Voronoi Gerado</h5>
          <div class="estatisticas-voronoi">
            <p><strong>Sementes:</strong> ${this.estatisticas.totalSementes} escolas críticas</p>
            <p><strong>Cobertura:</strong> ${this.estatisticas.coberturaPercentual} das escolas</p>
            <p><strong>Área total:</strong> ${this.estatisticas.areaTotal}</p>
            <p><strong>Densidade:</strong> ${this.estatisticas.densidadeMedia}</p>
            <p><strong>Atualizado:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          <div class="acoes-voronoi">
            <button onclick="window.voronoiCritico.limpar()" class="btn-voronoi">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Limpar Visualização
            </button>
            <button onclick="window.voronoiCritico.exportarDados()" class="btn-voronoi">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Exportar Dados
            </button>
          </div>
        </div>
      `;
    }
    
    // Atualizar dashboard se existir
    this.atualizarDashboard();
  }
  
  // Atualizar dashboard
  atualizarDashboard() {
    const metricasElement = document.querySelector('.metric-card.voronoi');
    if (metricasElement) {
      const valorElement = metricasElement.querySelector('.metric-value');
      const labelElement = metricasElement.querySelector('.metric-label');
      
      if (valorElement) {
        valorElement.textContent = this.estatisticas.totalSementes;
      }
      
      if (labelElement) {
        labelElement.textContent = 'Sementes Voronoi';
      }
    }
  }
  
  // Recalcular com os mesmos parâmetros
  recalcularComMesmosParametros() {
    if (this.sementes.length === 0) return;
    
    const numSementes = this.sementes.length;
    const filtro = 'critico'; // Default
    
    console.log(`🔄 Recalculando Voronoi com ${numSementes} sementes...`);
    this.gerar(numSementes, filtro);
  }
  
  // Limpar visualização
  limpar() {
    this.limparVisualizacao();
    this.sementes = [];
    this.poligonos = [];
    this.estatisticas = {
      totalSementes: 0,
      escolasCobertas: 0,
      areaTotal: 0,
      ultimaAtualizacao: null
    };
    
    console.log('🗑️ Voronoi limpo');
    
    // Atualizar interface
    const container = document.getElementById('voronoi-container');
    if (container) {
      container.innerHTML = '<p>Voronoi não gerado</p>';
    }
  }
  
  // Limpar visualização do mapa
  limparVisualizacao() {
    if (this.poligonosLayer) {
      window.map.removeLayer(this.poligonosLayer);
      this.poligonosLayer = null;
    }
    
    if (this.sementesLayer) {
      window.map.removeLayer(this.sementesLayer);
      this.sementesLayer = null;
    }
  }
  
  // Exportar dados do Voronoi
  exportarDados() {
    const dados = {
      sementes: this.sementes.map(s => ({
        nome: s.nome,
        lat: s.lat,
        lng: s.lng,
        classe: s.classe,
        pontuacao: s.pontuacao,
        score: this.calcularScoreCriticidade(s)
      })),
      poligonos: this.poligonos.map(p => ({
        semente: p.semente.nome,
        area: p.area,
        escolasDentro: p.escolasDentro,
        vertices: p.vertices.map(v => ({ lat: v.lat, lng: v.lng }))
      })),
      estatisticas: this.estatisticas,
      timestamp: new Date().toISOString()
    };
    
    // Criar JSON para download
    const jsonStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `voronoi-critico-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log('📥 Dados do Voronoi exportados');
  }
  
  // Obter estatísticas atualizadas
  getEstatisticas() {
    return this.estatisticas;
  }
  
  // Verificar se está ativo
  isAtivo() {
    return this.poligonosLayer !== null;
  }
}

// Criar e inicializar instância global
const voronoiCritico = new VoronoiCritico();

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    voronoiCritico.inicializar();
  }, 2000);
});

// Exportar funções globais
window.voronoiCritico = voronoiCritico;
window.gerarVoronoiCritico = (sementes, filtro) => voronoiCritico.gerar(sementes, filtro);

console.log('✅ Voronoi Crítico carregado e pronto para uso');