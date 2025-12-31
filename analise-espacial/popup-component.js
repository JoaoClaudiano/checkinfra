// popup-counter-api-tetris.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO DA API ====================
    const API_CONFIG = {
        baseUrl: "https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325",
        apiToken: "ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN",
        headers: {
            'Authorization': 'Bearer ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN',
            'Content-Type': 'application/json'
        }
    };
    
    // ==================== CONFIGURAÇÃO DO POPUP ====================
    const POPUP_CONFIG = {
        popupId: 'counter-api-popup',
        storageKey: 'counterApiPopupHidden',
        hideDays: 7,
        showDelay: 1500,
        
        // CORES
        colors: {
            primary: '#FF6B6B',
            primaryDark: '#FF4757',
            cafeBrown: '#A0522D',
            cafeLight: '#DEB887',
            success: '#10B981',
            warning: '#F59E0B',
            tetrisBlue: '#3498db',
            tetrisGreen: '#2ecc71',
            tetrisRed: '#e74c3c',
            tetrisYellow: '#f1c40f',
            tetrisPurple: '#9b59b6',
            tetrisCyan: '#1abc9c',
            tetrisOrange: '#e67e22'
        }
    };
    
    // ==================== SISTEMA DE API ====================
    
    // Testa a conexão com a API
    async function testApiConnection() {
        try {
            console.log('Testando conexão com API...');
            
            // Primeiro, vamos testar sem CORS para ver se a API responde
            const testUrl = 'https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325';
            
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN'
                }
            });
            
            console.log('Status da API:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Dados da API:', data);
                return { success: true, data: data };
            } else {
                console.error('API retornou erro:', response.status);
                return { 
                    success: false, 
                    error: `API Error: ${response.status} ${response.statusText}` 
                };
            }
            
        } catch (error) {
            console.error('Erro ao testar API:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
    
    // Função para buscar o total de cafés
    async function fetchCoffeeCount() {
        try {
            console.log('Buscando total de cafés...');
            
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                headers: API_CONFIG.headers,
                mode: 'cors',
                credentials: 'omit'
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                // Vamos tentar sem o Content-Type header
                console.log('Tentando sem Content-Type header...');
                const simpleResponse = await fetch(API_CONFIG.baseUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': API_CONFIG.headers.Authorization
                    },
                    mode: 'cors'
                });
                
                if (!simpleResponse.ok) {
                    throw new Error(`API Error: ${simpleResponse.status} ${simpleResponse.statusText}`);
                }
                
                const data = await simpleResponse.json();
                console.log('Resposta simples da API:', data);
                
                let count = extractCountFromData(data);
                return {
                    success: true,
                    count: count,
                    data: data
                };
            }
            
            const data = await response.json();
            console.log('Resposta da API:', data);
            
            // Extrai o valor do contador
            let count = extractCountFromData(data);
            
            return {
                success: true,
                count: count,
                data: data
            };
            
        } catch (error) {
            console.error('Erro ao buscar contador:', error);
            return {
                success: false,
                count: 0,
                error: error.message
            };
        }
    }
    
    // Função para extrair contador
    function extractCountFromData(data) {
        if (data && typeof data.count === 'number') {
            return data.count;
        } else if (data && data.value !== undefined) {
            return data.value;
        } else if (typeof data === 'number') {
            return data;
        } else if (data && data.data && typeof data.data.count === 'number') {
            return data.data.count;
        }
        return 0;
    }
    
    // Função para enviar um café
    async function sendCoffee() {
        try {
            console.log('Enviando café para API...');
            
            // Primeiro testamos a conexão
            const testResult = await testApiConnection();
            if (!testResult.success) {
                throw new Error(`API não está acessível: ${testResult.error}`);
            }
            
            // Tenta diferentes métodos
            const endpoints = [
                { url: `${API_CONFIG.baseUrl}/up`, method: 'POST' },
                { url: API_CONFIG.baseUrl, method: 'PUT' }
            ];
            
            let lastError;
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Tentando ${endpoint.method} ${endpoint.url}`);
                    
                    const response = await fetch(endpoint.url, {
                        method: endpoint.method,
                        headers: {
                            'Authorization': API_CONFIG.headers.Authorization,
                            'Content-Type': 'application/json'
                        },
                        body: endpoint.method === 'PUT' ? JSON.stringify({ value: 1 }) : null,
                        mode: 'cors',
                        credentials: 'omit'
                    });
                    
                    console.log(`${endpoint.method} Status:`, response.status);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`${endpoint.method} Success:`, data);
                        
                        // Busca o novo total
                        const updated = await fetchCoffeeCount();
                        
                        return {
                            success: true,
                            newCount: updated.success ? updated.count : 0,
                            method: endpoint.method,
                            data: data
                        };
                    } else {
                        lastError = new Error(`${endpoint.method} failed: ${response.status}`);
                        console.warn(lastError.message);
                    }
                    
                } catch (error) {
                    lastError = error;
                    console.warn(`Erro no ${endpoint.method}:`, error);
                }
            }
            
            throw lastError || new Error('Todos os métodos falharam');
            
        } catch (error) {
            console.error('Erro ao enviar café:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(POPUP_CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CSS COM TETRIS REAL ====================
    const style = document.createElement('style');
    style.textContent = `
        /* OVERLAY */
        .counter-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(8px);
            animation: overlayFade 0.3s ease-out;
        }
        
        @keyframes overlayFade {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* CARD PRINCIPAL */
        .counter-popup-card {
            background: white;
            border-radius: 24px;
            width: 90%;
            max-width: 450px;
            overflow: hidden;
            animation: cardSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
            position: relative;
        }
        
        @keyframes cardSlide {
            0% {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        /* CABEÇALHO */
        .counter-popup-header {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.primary} 0%, ${POPUP_CONFIG.colors.primaryDark} 100%);
            color: white;
            padding: 20px 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
        }
        
        .counter-header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
        }
        
        .counter-popup-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            flex: 1;
        }
        
        .counter-close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 24px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        
        .counter-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }
        
        /* CONTEÚDO */
        .counter-popup-content {
            padding: 25px;
            color: #333;
            line-height: 1.5;
        }
        
        .counter-message {
            margin: 0 0 20px 0;
            font-size: 15px;
            text-align: center;
        }
        
        .counter-message strong {
            display: block;
            color: ${POPUP_CONFIG.colors.primary};
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        /* JOGO TETRIS - GRADE E PEÇAS */
        .tetris-game-container {
            height: 150px;
            background: #0a0a1a;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            margin: 20px 0;
            border: 3px solid #1a1a2e;
            box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .tetris-grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-template-rows: repeat(8, 1fr);
            gap: 1px;
            padding: 2px;
            box-sizing: border-box;
        }
        
        .tetris-cell {
            background: rgba(30, 30, 46, 0.3);
            border-radius: 2px;
        }
        
        .tetris-cell.filled {
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.2);
        }
        
        /* PEÇAS DO TETRIS */
        .tetris-piece {
            position: absolute;
            display: grid;
            gap: 0;
            z-index: 10;
        }
        
        .tetris-block {
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.2);
        }
        
        /* ANIMAÇÃO DA PEÇA VINDO DA DIREITA */
        @keyframes slideFromRight {
            0% {
                transform: translateX(120%) translateY(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateX(-120%) translateY(0);
                opacity: 0;
            }
        }
        
        /* ANIMAÇÃO DE ENCAIXE */
        @keyframes snapIntoPlace {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
            }
        }
        
        /* LINHAS COMPLETAS */
        .tetris-row-complete {
            animation: rowComplete 0.5s ease-out;
        }
        
        @keyframes rowComplete {
            0% {
                background: white;
                transform: scaleY(1);
            }
            50% {
                background: gold;
                transform: scaleY(1.2);
            }
            100% {
                background: transparent;
                transform: scaleY(1);
            }
        }
        
        /* BOTÕES LADO A LADO */
        .counter-buttons-row {
            display: flex;
            gap: 12px;
            margin: 25px 0 20px 0;
        }
        
        .counter-buttons-row button {
            flex: 1;
        }
        
        .primary-counter-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.primary} 0%, ${POPUP_CONFIG.colors.primaryDark} 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 14px 20px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
        }
        
        .primary-counter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
        }
        
        .primary-counter-btn:active {
            transform: translateY(0);
        }
        
        .coffee-action-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 14px 20px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .coffee-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
        }
        
        .coffee-action-btn:active {
            transform: translateY(0);
        }
        
        .coffee-action-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .coffee-icon {
            font-size: 18px;
            animation: coffeeSteam 2s infinite;
        }
        
        @keyframes coffeeSteam {
            0%, 100% { transform: translateY(0); opacity: 0.8; }
            50% { transform: translateY(-3px); opacity: 1; }
        }
        
        /* CONTADOR EM CÍRCULO PEQUENO */
        .coffee-counter-mini {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 15px 0 5px 0;
        }
        
        .counter-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeLight} 0%, ${POPUP_CONFIG.colors.cafeBrown} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: 800;
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
            margin-bottom: 5px;
            border: 3px solid white;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .counter-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* STATUS DA API */
        .api-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${POPUP_CONFIG.colors.success};
            animation: statusBlink 2s infinite;
        }
        
        .status-indicator.offline {
            background: ${POPUP_CONFIG.colors.warning};
        }
        
        @keyframes statusBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* OPÇÃO NÃO MOSTRAR */
        .counter-option {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px dashed #E0E0E0;
            text-align: center;
        }
        
        .counter-option-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #666;
            font-size: 13px;
        }
        
        .counter-checkbox {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 2px solid #DEE2E6;
            cursor: pointer;
        }
        
        .counter-checkbox:checked {
            background: ${POPUP_CONFIG.colors.primary};
            border-color: ${POPUP_CONFIG.colors.primary};
        }
        
        /* EFEITO DE CAFÉ FLUTUANTE */
        .coffee-float {
            position: fixed;
            font-size: 24px;
            z-index: 10000;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
        }
        
        @keyframes floatUp {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(20deg);
                opacity: 0;
            }
        }
        
        /* NOTIFICAÇÃO */
        .coffee-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${POPUP_CONFIG.colors.success};
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            font-size: 14px;
            max-width: 300px;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* RESPONSIVIDADE */
        @media (max-width: 480px) {
            .counter-popup-card {
                width: 95%;
                max-width: 320px;
                border-radius: 20px;
            }
            
            .counter-popup-content {
                padding: 20px;
            }
            
            .counter-buttons-row {
                flex-direction: column;
                gap: 10px;
            }
            
            .counter-circle {
                width: 50px;
                height: 50px;
                font-size: 18px;
            }
            
            .tetris-game-container {
                height: 120px;
            }
            
            .counter-popup-header {
                padding: 15px 20px;
            }
        }
        
        /* DARK MODE */
        @media (prefers-color-scheme: dark) {
            .counter-popup-card {
                background: #1E1E1E;
                color: #E0E0E0;
                border-color: #333;
            }
            
            .counter-popup-content {
                color: #E0E0E0;
            }
            
            .counter-message strong {
                color: #FF8585;
            }
            
            .tetris-game-container {
                background: #0a0a0a;
                border-color: #333;
            }
            
            .tetris-cell {
                background: rgba(50, 50, 50, 0.3);
            }
            
            .counter-circle {
                border-color: #1E1E1E;
            }
            
            .counter-label {
                color: #AAA;
            }
            
            .counter-option {
                border-color: #444;
            }
        }
        
        @media (prefers-reduced-motion: reduce) {
            .counter-popup-card,
            .tetris-piece,
            .coffee-icon,
            .counter-circle,
            .coffee-action-btn,
            .primary-counter-btn,
            .status-indicator {
                animation: none !important;
                transition: none !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== CRIAÇÃO DO HTML ====================
    const popupHTML = `
        <div id="${POPUP_CONFIG.popupId}" class="counter-popup-overlay">
            <div class="counter-popup-card">
                <div class="counter-popup-header">
                    <div class="counter-header-content">
                        <h3>🚧 Página em Desenvolvimento</h3>
                        <button class="counter-close-btn" aria-label="Fechar">&times;</button>
                    </div>
                </div>
                
                <div class="counter-popup-content">
                    <div class="counter-message">
                        <strong>Ajude-nos com um cafezinho! ☕</strong>
                        Estamos trabalhando duro para melhorar esta página. Cada café nos dá mais energia para continuar!
                    </div>
                    
                    <!-- JOGO TETRIS -->
                    <div class="tetris-game-container">
                        <div class="tetris-grid" id="tetrisGrid"></div>
                        <div id="tetrisPiecesContainer"></div>
                    </div>
                    
                    <!-- BOTÕES LADO A LADO -->
                    <div class="counter-buttons-row">
                        <button class="primary-counter-btn" id="understandBtn">
                            Obrigado!
                        </button>
                        <button class="coffee-action-btn" id="sendCoffeeBtn">
                            <span class="coffee-icon">☕</span>
                            <span>Enviar Café</span>
                        </button>
                    </div>
                    
                    <!-- CONTADOR EM CÍRCULO PEQUENO -->
                    <div class="coffee-counter-mini">
                        <div class="counter-circle" id="totalCoffeeCount">0</div>
                        <div class="counter-label">Total de Cafés</div>
                    </div>
                    
                    <!-- STATUS DA API -->
                    <div class="api-status">
                        <span class="status-indicator" id="apiStatusIndicator"></span>
                        <span id="apiStatusText">Conectando à API...</span>
                    </div>
                    
                    <div class="counter-option">
                        <label class="counter-option-label">
                            <input type="checkbox" class="counter-checkbox" id="dontShowAgain">
                            Não mostrar novamente por 7 dias
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // ==================== LÓGICA DO POPUP ====================
    const popup = document.getElementById(POPUP_CONFIG.popupId);
    const sendBtn = document.getElementById('sendCoffeeBtn');
    const understandBtn = document.getElementById('understandBtn');
    const closeBtn = popup.querySelector('.counter-close-btn');
    const totalCountElement = document.getElementById('totalCoffeeCount');
    const tetrisGrid = document.getElementById('tetrisGrid');
    const tetrisPiecesContainer = document.getElementById('tetrisPiecesContainer');
    const apiStatusIndicator = document.getElementById('apiStatusIndicator');
    const apiStatusText = document.getElementById('apiStatusText');
    
    let currentCount = 0;
    let popupShown = false;
    let apiConnected = false;
    let tetrisInterval;
    let filledCells = [];
    
    // ==================== JOGO TETRIS ====================
    
    // Definições das peças do Tetris
    const TETROMINOS = [
        {
            // I-piece
            shape: [[1, 1, 1, 1]],
            color: POPUP_CONFIG.colors.tetrisCyan,
            name: 'I'
        },
        {
            // O-piece
            shape: [[1, 1], [1, 1]],
            color: POPUP_CONFIG.colors.tetrisYellow,
            name: 'O'
        },
        {
            // T-piece
            shape: [[0, 1, 0], [1, 1, 1]],
            color: POPUP_CONFIG.colors.tetrisPurple,
            name: 'T'
        },
        {
            // S-piece
            shape: [[0, 1, 1], [1, 1, 0]],
            color: POPUP_CONFIG.colors.tetrisGreen,
            name: 'S'
        },
        {
            // Z-piece
            shape: [[1, 1, 0], [0, 1, 1]],
            color: POPUP_CONFIG.colors.tetrisRed,
            name: 'Z'
        },
        {
            // J-piece
            shape: [[1, 0, 0], [1, 1, 1]],
            color: POPUP_CONFIG.colors.tetrisBlue,
            name: 'J'
        },
        {
            // L-piece
            shape: [[0, 0, 1], [1, 1, 1]],
            color: POPUP_CONFIG.colors.tetrisOrange,
            name: 'L'
        }
    ];
    
    // Cria a grade do Tetris
    function createTetrisGrid() {
        if (!tetrisGrid) return;
        
        tetrisGrid.innerHTML = '';
        const rows = 8;
        const cols = 12;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'tetris-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                tetrisGrid.appendChild(cell);
            }
        }
    }
    
    // Gera uma peça aleatória
    function getRandomTetromino() {
        const randomIndex = Math.floor(Math.random() * TETROMINOS.length);
        return { ...TETROMINOS[randomIndex] };
    }
    
    // Cria uma peça animada que vem da direita
    function createAnimatedPiece() {
        const tetromino = getRandomTetromino();
        const piece = document.createElement('div');
        piece.className = 'tetris-piece';
        
        // Define o grid interno da peça
        const shape = tetromino.shape;
        const rows = shape.length;
        const cols = shape[0].length;
        
        piece.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        piece.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        piece.style.gap = '0';
        piece.style.width = `${cols * 25}px`;
        piece.style.height = `${rows * 18}px`;
        
        // Cria os blocos da peça
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const block = document.createElement('div');
                    block.className = 'tetris-block';
                    block.style.background = tetromino.color;
                    block.style.borderRadius = '3px';
                    piece.appendChild(block);
                }
            }
        }
        
        // Posiciona a peça à direita (fora da tela)
        const containerHeight = 150; // Altura do container
        const maxRow = 8 - rows; // Máxima linha possível
        const startRow = Math.floor(Math.random() * maxRow);
        
        piece.style.position = 'absolute';
        piece.style.right = '-100px';
        piece.style.top = `${startRow * (containerHeight / 8)}px`;
        
        tetrisPiecesContainer.appendChild(piece);
        
        // Animação: vem da direita, move para esquerda
        piece.style.animation = `slideFromRight ${1.5 + Math.random() * 0.5}s linear forwards`;
        
        // Quando a animação termina, "encaixa" a peça
        setTimeout(() => {
            // Remove a peça animada
            piece.remove();
            
            // Adiciona a peça à grade (encaxa)
            addPieceToGrid(tetromino, startRow);
            
            // Cria uma nova peça após um delay
            setTimeout(createAnimatedPiece, 500);
        }, 1500 + Math.random() * 500);
    }
    
    // Adiciona uma peça à grade (encaxa)
    function addPieceToGrid(tetromino, startRow) {
        const shape = tetromino.shape;
        const rows = shape.length;
        const cols = shape[0].length;
        
        // Escolhe uma coluna para encaixar (entre 0 e 12-cols)
        const startCol = Math.floor(Math.random() * (12 - cols));
        
        // Adiciona cada bloco à grade
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const cellRow = startRow + r;
                    const cellCol = startCol + c;
                    
                    if (cellRow >= 0 && cellRow < 8 && cellCol >= 0 && cellCol < 12) {
                        const cellIndex = cellRow * 12 + cellCol;
                        const cell = tetrisGrid.children[cellIndex];
                        
                        if (cell) {
                            cell.classList.add('filled');
                            cell.style.background = tetromino.color;
                            cell.style.boxShadow = `inset 0 0 10px ${tetromino.color}`;
                            
                            // Animação de encaixe
                            cell.style.animation = 'snapIntoPlace 0.3s ease-out';
                            
                            // Remove a animação após terminar
                            setTimeout(() => {
                                cell.style.animation = '';
                            }, 300);
                            
                            // Adiciona à lista de células preenchidas
                            filledCells.push({ row: cellRow, col: cellCol });
                        }
                    }
                }
            }
        }
        
        // Verifica se alguma linha está completa
        checkCompleteRows();
    }
    
    // Verifica linhas completas
    function checkCompleteRows() {
        for (let row = 7; row >= 0; row--) {
            let rowComplete = true;
            
            for (let col = 0; col < 12; col++) {
                const cellIndex = row * 12 + col;
                const cell = tetrisGrid.children[cellIndex];
                
                if (!cell.classList.contains('filled')) {
                    rowComplete = false;
                    break;
                }
            }
            
            if (rowComplete) {
                // Anima a linha completa
                for (let col = 0; col < 12; col++) {
                    const cellIndex = row * 12 + col;
                    const cell = tetrisGrid.children[cellIndex];
                    cell.classList.add('tetris-row-complete');
                    
                    setTimeout(() => {
                        cell.classList.remove('tetris-row-complete');
                        cell.classList.remove('filled');
                        cell.style.background = '';
                        cell.style.boxShadow = '';
                    }, 500);
                }
                
                // Remove as células da lista
                filledCells = filledCells.filter(cell => cell.row !== row);
                
                // Move as linhas acima para baixo
                for (let r = row - 1; r >= 0; r--) {
                    for (let c = 0; c < 12; c++) {
                        const cellIndex = r * 12 + c;
                        const cell = tetrisGrid.children[cellIndex];
                        
                        if (cell.classList.contains('filled')) {
                            // Move para baixo
                            const newRow = r + 1;
                            const newCellIndex = newRow * 12 + c;
                            const newCell = tetrisGrid.children[newCellIndex];
                            
                            // Copia estilo
                            newCell.classList.add('filled');
                            newCell.style.background = cell.style.background;
                            newCell.style.boxShadow = cell.style.boxShadow;
                            
                            // Limpa célula original
                            cell.classList.remove('filled');
                            cell.style.background = '';
                            cell.style.boxShadow = '';
                            
                            // Atualiza lista
                            const cellIndexInList = filledCells.findIndex(
                                item => item.row === r && item.col === c
                            );
                            if (cellIndexInList !== -1) {
                                filledCells[cellIndexInList].row = newRow;
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Inicia o jogo Tetris
    function startTetrisGame() {
        createTetrisGrid();
        filledCells = [];
        
        // Limpa peças existentes
        tetrisPiecesContainer.innerHTML = '';
        
        // Inicia a primeira peça
        createAnimatedPiece();
    }
    
    // ==================== FUNÇÕES AUXILIARES ====================
    
    // Verifica se deve mostrar o popup
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(POPUP_CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    // Atualiza status da API
    function updateApiStatus(status, message = '') {
        apiConnected = status === 'connected';
        
        if (apiStatusIndicator && apiStatusText) {
            switch(status) {
                case 'connected':
                    apiStatusIndicator.className = 'status-indicator';
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.success;
                    apiStatusText.textContent = message || 'API Conectada';
                    break;
                case 'connecting':
                    apiStatusIndicator.className = 'status-indicator';
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.warning;
                    apiStatusText.textContent = message || 'Conectando...';
                    break;
                case 'error':
                    apiStatusIndicator.className = 'status-indicator offline';
                    apiStatusIndicator.style.background = '#EF4444';
                    apiStatusText.textContent = message || 'Erro na API';
                    break;
                case 'offline':
                    apiStatusIndicator.className = 'status-indicator offline';
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.warning;
                    apiStatusText.textContent = message || 'Modo Local';
                    break;
                default:
                    apiStatusIndicator.className = 'status-indicator';
                    apiStatusText.textContent = message || 'Desconectado';
            }
        }
    }
    
    // Busca e atualiza o contador
    async function updateCoffeeCounter() {
        try {
            updateApiStatus('connecting', 'Buscando dados...');
            
            const result = await fetchCoffeeCount();
            if (result.success) {
                currentCount = result.count;
                totalCountElement.textContent = currentCount;
                
                updateApiStatus('connected', `API Online (${currentCount} cafés)`);
                
                // Efeito visual ao atualizar
                totalCountElement.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
            } else {
                updateApiStatus('offline', 'Usando dados locais');
            }
        } catch (error) {
            console.error('Erro ao atualizar contador:', error);
            updateApiStatus('error', 'Erro de conexão');
        }
    }
    
    // Envia um café
    async function handleSendCoffee() {
        if (sendBtn.disabled) return;
        
        // Desabilita o botão durante o envio
        sendBtn.disabled = true;
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<span class="coffee-icon">⏳</span><span>Enviando...</span>';
        
        try {
            // Efeito visual de cafés flutuantes
            createCoffeeFloats();
            
            // Efeito especial no Tetris
            createTetrisExplosion();
            
            // Envia para a API
            updateApiStatus('connecting', 'Enviando café...');
            const result = await sendCoffee();
            
            if (result.success) {
                // Atualiza o contador
                await updateCoffeeCounter();
                
                // Mostra notificação
                showNotification('☕ Café enviado com sucesso!');
                
                // Efeito de confirmação no botão
                sendBtn.innerHTML = '<span class="coffee-icon">✅</span><span>Enviado!</span>';
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.success} 0%, #0DA271 100%)`;
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Erro:', error);
            showNotification('⚠️ Usando modo offline - café salvo localmente');
            
            // Fallback local
            currentCount++;
            totalCountElement.textContent = currentCount;
            
            // Efeito visual
            totalCountElement.style.transform = 'scale(1.5)';
            setTimeout(() => {
                totalCountElement.style.transform = 'scale(1)';
            }, 300);
            
            // Salva localmente
            try {
                const localData = JSON.parse(localStorage.getItem('localCoffeeCount') || '{"count": 0}');
                localData.count = (localData.count || 0) + 1;
                localStorage.setItem('localCoffeeCount', JSON.stringify(localData));
            } catch (e) {
                console.error('Erro ao salvar localmente:', e);
            }
            
            sendBtn.innerHTML = '<span class="coffee-icon">☕</span><span>Salvo Local</span>';
            sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.warning} 0%, #D97706 100%)`;
            
            updateApiStatus('offline', 'Modo Local Ativo');
            
        } finally {
            // Restaura o botão após 2 segundos
            setTimeout(() => {
                sendBtn.disabled = false;
                sendBtn.innerHTML = originalText;
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%)`;
            }, 2000);
        }
    }
    
    // Efeito especial no Tetris ao enviar café
    function createTetrisExplosion() {
        // Cria várias peças simultaneamente
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const tetromino = getRandomTetromino();
                const piece = document.createElement('div');
                piece.className = 'tetris-piece';
                
                const shape = tetromino.shape;
                const rows = shape.length;
                const cols = shape[0].length;
                
                piece.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
                piece.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
                piece.style.gap = '0';
                piece.style.width = `${cols * 25}px`;
                piece.style.height = `${rows * 18}px`;
                
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (shape[r][c]) {
                            const block = document.createElement('div');
                            block.className = 'tetris-block';
                            block.style.background = tetromino.color;
                            block.style.borderRadius = '3px';
                            piece.appendChild(block);
                        }
                    }
                }
                
                piece.style.position = 'absolute';
                piece.style.right = '-100px';
                piece.style.top = `${Math.random() * 100}px`;
                
                tetrisPiecesContainer.appendChild(piece);
                
                // Animação mais rápida para o efeito
                piece.style.animation = `slideFromRight ${0.8 + Math.random() * 0.4}s linear forwards`;
                
                setTimeout(() => {
                    piece.remove();
                }, 1200);
            }, i * 200);
        }
    }
    
    // Cria efeito de cafés flutuantes
    function createCoffeeFloats() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const coffee = document.createElement('div');
                coffee.textContent = '☕';
                coffee.className = 'coffee-float';
                coffee.style.left = `${40 + Math.random() * 20}%`;
                coffee.style.top = '50%';
                coffee.style.fontSize = `${20 + Math.random() * 15}px`;
                coffee.style.color = POPUP_CONFIG.colors.cafeBrown;
                coffee.style.textShadow = '0 0 10px rgba(160, 82, 45, 0.5)';
                coffee.style.zIndex = '10001';
                document.body.appendChild(coffee);
                
                setTimeout(() => coffee.remove(), 1000);
            }, i * 150);
        }
    }
    
    // Mostra notificação
    function showNotification(message) {
        // Remove notificação anterior se existir
        const existing = document.querySelector('.coffee-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'coffee-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Fecha o popup
    function closePopup() {
        // Salva preferência se marcado
        const dontShowAgain = document.getElementById('dontShowAgain');
        if (dontShowAgain && dontShowAgain.checked) {
            const hideUntil = Date.now() + (POPUP_CONFIG.hideDays * 24 * 60 * 60 * 1000);
            localStorage.setItem(POPUP_CONFIG.storageKey, hideUntil.toString());
        }
        
        popup.style.animation = 'overlayFade 0.3s ease-out reverse forwards';
        setTimeout(() => {
            popup.style.display = 'none';
            popup.style.animation = '';
        }, 300);
        
        // Limpa o intervalo do Tetris
        if (tetrisInterval) {
            clearInterval(tetrisInterval);
        }
    }
    
    // Mostra o popup
    async function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        popup.style.display = 'flex';
        
        // Inicia o jogo Tetris
        startTetrisGame();
        
        // Carrega o contador atual
        await updateCoffeeCounter();
        
        // Carrega contador local se existir
        try {
            const localData = JSON.parse(localStorage.getItem('localCoffeeCount') || '{"count": 0}');
            if (localData.count > 0) {
                currentCount += localData.count;
                totalCountElement.textContent = currentCount;
            }
        } catch (e) {
            console.error('Erro ao carregar dados locais:', e);
        }
        
        // Configura eventos
        setupEventListeners();
    }
    
    // Configura event listeners
    function setupEventListeners() {
        sendBtn.addEventListener('click', handleSendCoffee);
        understandBtn.addEventListener('click', closePopup);
        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        
        // Fecha ao clicar fora
        popup.addEventListener('click', (e) => {
            if (e.target === popup) closePopup();
        });
        
        // Fecha com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
            if (e.key === 'Enter' && e.target === sendBtn) handleSendCoffee();
        });
        
        // Reinicia Tetris a cada 30 segundos para evitar muita acumulação
        tetrisInterval = setInterval(() => {
            if (filledCells.length > 30) { // Se muitas células preenchidas
                createTetrisGrid();
                filledCells = [];
                tetrisPiecesContainer.innerHTML = '';
                setTimeout(createAnimatedPiece, 500);
            }
        }, 30000);
    }
    
    // Inicialização
    function init() {
        // Mostra após delay
        setTimeout(showPopup, POPUP_CONFIG.showDelay);
        
        // Mostra mais cedo se houver interação
        const earlyShow = () => {
            if (!popupShown) {
                showPopup();
                ['click', 'scroll', 'mousemove'].forEach(event => {
                    window.removeEventListener(event, earlyShow);
                });
            }
        };
        
        ['click', 'scroll', 'mousemove'].forEach(event => {
            window.addEventListener(event, earlyShow, { once: true });
        });
    }
    
    // ==================== INICIALIZAÇÃO ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ==================== API PÚBLICA ====================
    window.coffeeCounterPopup = {
        show: showPopup,
        hide: closePopup,
        reset: function() {
            localStorage.removeItem(POPUP_CONFIG.storageKey);
            localStorage.removeItem('localCoffeeCount');
            popupShown = false;
            showPopup();
        },
        getCount: async () => {
            const result = await fetchCoffeeCount();
            const localData = JSON.parse(localStorage.getItem('localCoffeeCount') || '{"count": 0}');
            return (result.success ? result.count : 0) + (localData.count || 0);
        },
        sendCoffee: handleSendCoffee,
        
        // Debug functions
        debug: {
            testApi: async function() {
                console.log('=== Testando API CounterAPI ===');
                
                // Test GET
                try {
                    const response = await fetch('https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325', {
                        headers: {
                            'Authorization': 'Bearer ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN'
                        }
                    });
                    console.log('GET Response:', response);
                    if (response.ok) {
                        const data = await response.json();
                        console.log('GET Data:', data);
                    }
                } catch (error) {
                    console.error('GET Error:', error);
                }
                
                // Test POST
                try {
                    const response = await fetch('https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325/up', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN'
                        }
                    });
                    console.log('POST Response:', response);
                    if (response.ok) {
                        const data = await response.json();
                        console.log('POST Data:', data);
                    }
                } catch (error) {
                    console.error('POST Error:', error);
                }
            },
            
            clearLocalData: function() {
                localStorage.removeItem('localCoffeeCount');
                console.log('Dados locais limpos');
            }
        }
    };
    
})();