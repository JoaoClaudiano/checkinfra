// popup-counter-api-documentacao.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO DA API (SEGUNDO SUA DOCUMENTAÇÃO) ====================
    const API_CONFIG = {
        // Base Endpoint exatamente como na documentação
        baseUrl: "https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325",
        // Seu token de API
        apiToken: "ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN"
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
            warning: '#F59E0B'
        }
    };
    
    // ==================== FUNÇÕES DE API SEGUINDO A DOCUMENTAÇÃO ====================
    
    // Função para buscar o valor do contador (GET)
    // Documentação: curl https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325 -H "Authorization: Bearer YOUR_API_KEY"
    async function getCounterValue() {
        try {
            console.log('Buscando valor do contador...');
            
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.apiToken}`
                },
                mode: 'cors'
            });
            
            console.log('Status da resposta:', response.status);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Dados recebidos:', data);
            
            // Baseado na documentação da CounterAPI, vamos tentar extrair o valor
            let count = 0;
            
            // A CounterAPI geralmente retorna { count: number } ou { value: number }
            if (data && typeof data.count === 'number') {
                count = data.count;
            } else if (data && typeof data.value === 'number') {
                count = data.value;
            } else if (typeof data === 'number') {
                count = data;
            } else if (data && data.data && typeof data.data.count === 'number') {
                count = data.data.count;
            } else {
                console.warn('Formato de resposta inesperado:', data);
                // Se não conseguimos extrair, retornamos 0
                count = 0;
            }
            
            return {
                success: true,
                count: count,
                rawData: data
            };
            
        } catch (error) {
            console.error('Erro ao buscar contador:', error);
            return {
                success: false,
                count: getLocalCount(),
                error: error.message
            };
        }
    }
    
    // Função para incrementar o contador (POST /up)
    // Documentação: curl https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325/up -H "Authorization: Bearer YOUR_API_KEY"
    async function incrementCounter() {
        try {
            console.log('Incrementando contador via POST /up...');
            
            const response = await fetch(`${API_CONFIG.baseUrl}/up`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.apiToken}`
                },
                mode: 'cors'
            });
            
            console.log('Status do incremento:', response.status);
            
            if (!response.ok) {
                // Vamos tentar ver se há uma mensagem de erro
                let errorMsg = `Erro HTTP: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = `${errorMsg} - ${JSON.stringify(errorData)}`;
                } catch (e) {
                    // Ignora se não conseguir parsear JSON
                }
                throw new Error(errorMsg);
            }
            
            const data = await response.json();
            console.log('Resposta do incremento:', data);
            
            // Após incrementar, busca o novo valor
            const updatedCount = await getCounterValue();
            
            return {
                success: true,
                newCount: updatedCount.success ? updatedCount.count : 0,
                rawData: data
            };
            
        } catch (error) {
            console.error('Erro ao incrementar contador:', error);
            
            // Fallback local
            const newCount = incrementLocalCount();
            return {
                success: false,
                newCount: newCount,
                error: error.message
            };
        }
    }
    
    // Função para obter estatísticas (GET /stats) - Opcional
    // Documentação: curl https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325/stats -H "Authorization: Bearer YOUR_API_KEY"
    async function getCounterStats() {
        try {
            console.log('Buscando estatísticas...');
            
            const response = await fetch(`${API_CONFIG.baseUrl}/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.apiToken}`
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Estatísticas:', data);
            
            return {
                success: true,
                stats: data
            };
            
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Funções de fallback local
    function getLocalCount() {
        try {
            const localData = JSON.parse(localStorage.getItem('coffeeCount') || '{"count": 0}');
            return localData.count || 0;
        } catch (e) {
            return 0;
        }
    }
    
    function incrementLocalCount() {
        try {
            const localData = JSON.parse(localStorage.getItem('coffeeCount') || '{"count": 0}');
            localData.count = (localData.count || 0) + 1;
            localStorage.setItem('coffeeCount', JSON.stringify(localData));
            return localData.count;
        } catch (e) {
            return 1;
        }
    }
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(POPUP_CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CSS DO POPUP ====================
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
            max-width: 500px;
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
        
        /* JOGO TETRIS */
        .tetris-card {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 15px;
            margin: 20px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-family: 'Courier New', monospace;
            color: white;
            text-align: center;
            border: 2px solid #333;
        }
        
        .tetris-card h3 { 
            margin: 0 0 10px 0; 
            font-size: 1.2rem; 
            color: #ffeb3b; 
            text-shadow: 0 0 10px rgba(255, 235, 59, 0.5);
        }
        
        .tetris-card canvas {
            border: 2px solid #333;
            background: #000;
            display: block;
            margin: 0 auto;
            width: 100%;
            max-width: 200px;
            height: 200px;
            image-rendering: pixelated;
        }
        
        .tetris-card p {
            font-size: 10px; 
            color: #888;
            margin: 8px 0 0 0;
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
        
        .status-indicator.error {
            background: #EF4444;
        }
        
        @keyframes statusBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* DEBUG INFO */
        .debug-info {
            font-size: 10px;
            color: #999;
            text-align: center;
            margin-top: 10px;
            font-family: monospace;
            background: #f5f5f5;
            padding: 5px;
            border-radius: 4px;
            display: none; /* Oculto por padrão */
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
                max-width: 350px;
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
            
            .tetris-card canvas {
                max-width: 180px;
                height: 180px;
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
            
            .counter-circle {
                border-color: #1E1E1E;
            }
            
            .counter-label {
                color: #AAA;
            }
            
            .counter-option {
                border-color: #444;
            }
            
            .debug-info {
                background: #2D2D2D;
                color: #AAA;
            }
        }
        
        @media (prefers-reduced-motion: reduce) {
            .counter-popup-card,
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
                    <div class="tetris-card" id="tetrisCard">
                        <h3>MINI TETRIS</h3>
                        <canvas width="200" height="200" id="game-canvas"></canvas>
                        <p>Use as setas para jogar</p>
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
                    
                    <!-- INFO DE DEBUG (oculto por padrão) -->
                    <div class="debug-info" id="debugInfo">
                        Endpoint: ${API_CONFIG.baseUrl}
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
    const apiStatusIndicator = document.getElementById('apiStatusIndicator');
    const apiStatusText = document.getElementById('apiStatusText');
    const debugInfo = document.getElementById('debugInfo');
    
    let currentCount = 0;
    let popupShown = false;
    let apiConnected = false;
    let tetrisGame = null;
    
    // ==================== JOGO TETRIS (integrando sua função) ====================
    function createTetrisGame() {
        const container = document.getElementById('tetrisCard');
        const canvas = document.getElementById('game-canvas');
        const context = canvas.getContext('2d');
        const grid = 20;
        const tetrominoSequence = [];
        const playfield = [];
        
        // 1. Inicializar campo de jogo
        for (let row = -2; row < 10; row++) {
            playfield[row] = [];
            for (let col = 0; col < 10; col++) {
                playfield[row][col] = 0;
            }
        }
        
        // 2. Definir tetrominós
        const tetrominos = {
            'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            'J': [[1,0,0],[1,1,1],[0,0,0]],
            'L': [[0,0,1],[1,1,1],[0,0,0]],
            'O': [[1,1],[1,1]],
            'S': [[0,1,1],[1,1,0],[0,0,0]],
            'Z': [[1,1,0],[0,1,1],[0,0,0]],
            'T': [[0,1,0],[1,1,1],[0,0,0]]
        };
        
        const colors = {
            'I': '#00f0f0',
            'O': '#f0f000',
            'T': '#a000f0',
            'S': '#00f000',
            'Z': '#f00000',
            'J': '#0000f0',
            'L': '#f0a000'
        };
        
        // 3. Funções auxiliares
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        function generateSequence() {
            const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
            while (sequence.length) {
                const rand = getRandomInt(0, sequence.length - 1);
                tetrominoSequence.push(sequence.splice(rand, 1)[0]);
            }
        }
        
        function getNextTetromino() {
            if (tetrominoSequence.length === 0) {
                generateSequence();
            }
            const name = tetrominoSequence.pop();
            const matrix = tetrominos[name];
            const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
            const row = name === 'I' ? -1 : -2;
            return { name, matrix, row, col };
        }
        
        function rotate(matrix) {
            const N = matrix.length;
            const result = [];
            for (let i = 0; i < N; i++) {
                result[i] = [];
                for (let j = 0; j < N; j++) {
                    result[i][j] = matrix[N - j - 1][i];
                }
            }
            return result;
        }
        
        function isValidMove(matrix, cellRow, cellCol) {
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c] && (
                        cellCol + c < 0 ||
                        cellCol + c >= playfield[0].length ||
                        cellRow + r >= playfield.length ||
                        (cellRow + r >= 0 && playfield[cellRow + r][cellCol + c])
                    )) {
                        return false;
                    }
                }
            }
            return true;
        }
        
        function placeTetromino() {
            for (let r = 0; r < tetromino.matrix.length; r++) {
                for (let c = 0; c < tetromino.matrix[r].length; c++) {
                    if (tetromino.matrix[r][c]) {
                        if (tetromino.row + r < 0) {
                            showGameOver();
                            return;
                        }
                        playfield[tetromino.row + r][tetromino.col + c] = tetromino.name;
                    }
                }
            }
            
            // Verificar linhas completas
            for (let row = playfield.length - 1; row >= 0; ) {
                if (playfield[row].every(cell => !!cell)) {
                    for (let r = row; r >= 0; r--) {
                        for (let c = 0; c < playfield[0].length; c++) {
                            playfield[r][c] = r > 0 ? playfield[r-1][c] : 0;
                        }
                    }
                } else {
                    row--;
                }
            }
            
            tetromino = getNextTetromino();
        }
        
        function showGameOver() {
            if (rAF) {
                cancelAnimationFrame(rAF);
                rAF = null;
            }
            
            context.fillStyle = 'rgba(0,0,0,0.75)';
            context.fillRect(0, canvas.height / 2 - 20, canvas.width, 40);
            
            context.fillStyle = 'white';
            context.font = '16px monospace';
            context.textAlign = 'center';
            context.fillText('FIM DE JOGO', canvas.width / 2, canvas.height / 2 + 5);
            
            // Reinicia após 3 segundos
            setTimeout(() => {
                restartGame();
            }, 3000);
        }
        
        function restartGame() {
            // Limpa campo
            for (let row = -2; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    playfield[row][col] = 0;
                }
            }
            
            // Reseta sequência
            tetrominoSequence.length = 0;
            
            // Reseta tetrominó atual
            tetromino = getNextTetromino();
            
            // Reinicia animação
            if (!rAF) {
                rAF = requestAnimationFrame(loop);
            }
        }
        
        // 4. Variáveis do jogo
        let count = 0;
        let tetromino = getNextTetromino();
        let rAF = null;
        let gameOver = false;
        
        // 5. Loop do jogo
        function loop() {
            rAF = requestAnimationFrame(loop);
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Desenha o campo
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    if (playfield[r] && playfield[r][c]) {
                        context.fillStyle = colors[playfield[r][c]];
                        context.fillRect(c * grid, r * grid, grid-1, grid-1);
                    }
                }
            }
            
            // Desenha o tetrominó atual
            if (tetromino) {
                if (++count > 25) {
                    tetromino.row++;
                    count = 0;
                    
                    if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                        tetromino.row--;
                        placeTetromino();
                    }
                }
                
                context.fillStyle = colors[tetromino.name];
                for (let r = 0; r < tetromino.matrix.length; r++) {
                    for (let c = 0; c < tetromino.matrix[r].length; c++) {
                        if (tetromino.matrix[r][c]) {
                            context.fillRect(
                                (tetromino.col + c) * grid,
                                (tetromino.row + r) * grid,
                                grid-1,
                                grid-1
                            );
                        }
                    }
                }
            }
        }
        
        // 6. Controles
        const keydownHandler = (e) => {
            if (!rAF) return;
            
            // Esquerda
            if (e.keyCode === 37) {
                const col = tetromino.col - 1;
                if (isValidMove(tetromino.matrix, tetromino.row, col)) {
                    tetromino.col = col;
                }
            }
            // Direita
            else if (e.keyCode === 39) {
                const col = tetromino.col + 1;
                if (isValidMove(tetromino.matrix, tetromino.row, col)) {
                    tetromino.col = col;
                }
            }
            // Cima (rotacionar)
            else if (e.keyCode === 38) {
                const matrix = rotate(tetromino.matrix);
                if (isValidMove(matrix, tetromino.row, tetromino.col)) {
                    tetromino.matrix = matrix;
                }
            }
            // Baixo (descer rápido)
            else if (e.keyCode === 40) {
                const row = tetromino.row + 1;
                if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
                    tetromino.row = row - 1;
                    placeTetromino();
                    return;
                }
                tetromino.row = row;
            }
        };
        
        // Inicia o jogo
        document.addEventListener('keydown', keydownHandler);
        rAF = requestAnimationFrame(loop);
        
        // Retorna função para limpar
        return {
            cleanup: () => {
                if (rAF) {
                    cancelAnimationFrame(rAF);
                    rAF = null;
                }
                document.removeEventListener('keydown', keydownHandler);
            },
            restart: restartGame
        };
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
            apiStatusIndicator.className = 'status-indicator';
            
            switch(status) {
                case 'connected':
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.success;
                    apiStatusText.textContent = message || 'API Conectada';
                    break;
                case 'connecting':
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.warning;
                    apiStatusText.textContent = message || 'Conectando...';
                    break;
                case 'offline':
                    apiStatusIndicator.classList.add('offline');
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.warning;
                    apiStatusText.textContent = message || 'Modo Offline';
                    break;
                case 'error':
                    apiStatusIndicator.classList.add('error');
                    apiStatusIndicator.style.background = '#EF4444';
                    apiStatusText.textContent = message || 'Erro na API';
                    break;
                default:
                    apiStatusText.textContent = message || 'Desconectado';
            }
        }
    }
    
    // Busca e atualiza o contador
    async function updateCoffeeCounter() {
        try {
            updateApiStatus('connecting', 'Buscando dados...');
            
            const result = await getCounterValue();
            if (result.success) {
                currentCount = result.count;
                totalCountElement.textContent = currentCount;
                
                updateApiStatus('connected', `API Online (${currentCount} cafés)`);
                
                // Efeito visual
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
            // Efeito visual
            createCoffeeFloats();
            
            // Envia para a API
            updateApiStatus('connecting', 'Enviando café...');
            const result = await incrementCounter();
            
            if (result.success) {
                // Atualiza o contador
                currentCount = result.newCount;
                totalCountElement.textContent = currentCount;
                
                // Efeito visual
                totalCountElement.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
                
                // Mostra notificação
                showNotification('☕ Café enviado com sucesso!');
                
                // Efeito no botão
                sendBtn.innerHTML = '<span class="coffee-icon">✅</span><span>Enviado!</span>';
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.success} 0%, #0DA271 100%)`;
                
                updateApiStatus('connected', `Café enviado! Total: ${currentCount}`);
                
            } else {
                // Fallback local
                currentCount = result.newCount;
                totalCountElement.textContent = currentCount;
                
                // Efeito visual
                totalCountElement.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
                
                showNotification('☕ Café salvo localmente!');
                
                sendBtn.innerHTML = '<span class="coffee-icon">☕</span><span>Salvo Local</span>';
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.warning} 0%, #D97706 100%)`;
                
                updateApiStatus('offline', 'Modo Local Ativo');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            showNotification('⚠️ Erro ao enviar café');
            
            sendBtn.innerHTML = '<span class="coffee-icon">❌</span><span>Erro</span>';
            sendBtn.style.background = `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`;
            
            updateApiStatus('error', 'Erro ao enviar');
            
        } finally {
            // Restaura o botão após 2 segundos
            setTimeout(() => {
                sendBtn.disabled = false;
                sendBtn.innerHTML = originalText;
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%)`;
            }, 2000);
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
        
        // Para o jogo Tetris
        if (tetrisGame && tetrisGame.cleanup) {
            tetrisGame.cleanup();
        }
        
        popup.style.animation = 'overlayFade 0.3s ease-out reverse forwards';
        setTimeout(() => {
            popup.style.display = 'none';
            popup.style.animation = '';
        }, 300);
    }
    
    // Mostra o popup
    async function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        popup.style.display = 'flex';
        
        // Inicia o jogo Tetris
        tetrisGame = createTetrisGame();
        
        // Carrega o contador atual
        await updateCoffeeCounter();
        
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
        });
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
            localStorage.removeItem('coffeeCount');
            popupShown = false;
            showPopup();
        },
        getCount: async () => {
            const result = await getCounterValue();
            return result.success ? result.count : getLocalCount();
        },
        sendCoffee: handleSendCoffee,
        
        // Debug - mostra informações úteis
        debug: {
            showInfo: function() {
                debugInfo.style.display = 'block';
                console.log('=== DEBUG INFO ===');
                console.log('Base URL:', API_CONFIG.baseUrl);
                console.log('Token:', API_CONFIG.apiToken ? 'Presente' : 'Ausente');
                console.log('Token (primeiros 10 chars):', API_CONFIG.apiToken ? API_CONFIG.apiToken.substring(0, 10) + '...' : 'N/A');
            },
            
            testApi: async function() {
                console.log('=== TESTANDO API ===');
                console.log('1. Testando GET (buscar valor)...');
                const getResult = await getCounterValue();
                console.log('Resultado GET:', getResult);
                
                console.log('2. Testando POST /up (incrementar)...');
                const postResult = await incrementCounter();
                console.log('Resultado POST /up:', postResult);
                
                console.log('3. Testando GET /stats (estatísticas)...');
                const statsResult = await getCounterStats();
                console.log('Resultado GET /stats:', statsResult);
                
                return { getResult, postResult, statsResult };
            },
            
            // Função para testar manualmente com fetch
            testManual: async function() {
                console.log('=== TESTE MANUAL ===');
                
                // Teste GET
                try {
                    console.log('Testando GET com fetch...');
                    const response = await fetch(API_CONFIG.baseUrl, {
                        headers: {
                            'Authorization': `Bearer ${API_CONFIG.apiToken}`
                        }
                    });
                    console.log('Status GET:', response.status);
                    console.log('Headers GET:', Object.fromEntries(response.headers.entries()));
                    const text = await response.text();
                    console.log('Texto GET:', text);
                    try {
                        console.log('JSON GET:', JSON.parse(text));
                    } catch {
                        console.log('GET não retornou JSON válido');
                    }
                } catch (error) {
                    console.error('Erro no GET:', error);
                }
                
                // Teste POST /up
                try {
                    console.log('Testando POST /up com fetch...');
                    const response = await fetch(`${API_CONFIG.baseUrl}/up`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${API_CONFIG.apiToken}`
                        }
                    });
                    console.log('Status POST /up:', response.status);
                    console.log('Headers POST /up:', Object.fromEntries(response.headers.entries()));
                    const text = await response.text();
                    console.log('Texto POST /up:', text);
                    try {
                        console.log('JSON POST /up:', JSON.parse(text));
                    } catch {
                        console.log('POST /up não retornou JSON válido');
                    }
                } catch (error) {
                    console.error('Erro no POST /up:', error);
                }
            }
        }
    };
    
    // Para facilitar o debug, expõe as funções de API
    window.coffeeCounterAPI = {
        getCounterValue,
        incrementCounter,
        getCounterStats
    };
    
})();