// popup-counter-tetris-aligned.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        apiUrl: "https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325",
        popupId: 'counter-api-popup',
        storageKey: 'counterApiPopupHidden',
        hideDays: 7,
        showDelay: 1000,
        
        colors: {
            primary: '#FF6B6B',
            primaryDark: '#FF4757',
            secondary: '#A0522D',
            secondaryLight: '#DEB887',
            success: '#10B981',
            warning: '#F59E0B'
        }
    };
    
    // ==================== ESTADO GLOBAL ====================
    let state = {
        count: 0,
        isOnline: false,
        isLoading: false,
        hasShown: false,
        tetris: null
    };
    
    // ==================== FUNÇÕES DE API ====================
    async function getCounterValue() {
        try {
            const response = await fetch(CONFIG.apiUrl);
            
            if (!response.ok) {
                console.log('API offline, usando dados locais');
                throw new Error('API offline');
            }
            
            const data = await response.json();
            
            let count = 0;
            
            if (data && typeof data.count === 'number') {
                count = data.count;
            } else if (data && typeof data.value === 'number') {
                count = data.value;
            } else if (data && data.success && data.value) {
                count = data.value;
            }
            
            console.log('Contador da API:', count);
            return { success: true, count };
            
        } catch (error) {
            console.warn('Erro API:', error.message);
            return {
                success: false,
                count: getLocalCount()
            };
        }
    }
    
    async function incrementCounter() {
        try {
            console.log('Incrementando na API...');
            const response = await fetch(`${CONFIG.apiUrl}/up`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const updated = await getCounterValue();
            console.log('Novo valor após incremento:', updated);
            
            return {
                success: updated.success,
                count: updated.count
            };
            
        } catch (error) {
            console.warn('Falha API, usando local:', error.message);
            const newCount = incrementLocalCount();
            return {
                success: false,
                count: newCount
            };
        }
    }
    
    function getLocalCount() {
        const count = localStorage.getItem('coffee_local_count');
        return count ? parseInt(count) : 0;
    }
    
    function incrementLocalCount() {
        const current = getLocalCount();
        const newCount = current + 1;
        localStorage.setItem('coffee_local_count', newCount.toString());
        return newCount;
    }
    
    // ==================== TETRIS VERTICAL ALINHADO ====================
    class MiniTetris {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            
            // Grid original do Tetris (10x20 é padrão, mas vamos usar 10x14 para caber melhor)
            this.cols = 10;
            this.rows = 14;
            
            // Tetrominós
            this.shapes = [
                [[1,1,1,1]], // I
                [[1,1],[1,1]], // O
                [[0,1,0],[1,1,1]], // T
                [[0,1,1],[1,1,0]], // S
                [[1,1,0],[0,1,1]], // Z
                [[1,0,0],[1,1,1]], // J
                [[0,0,1],[1,1,1]]  // L
            ];
            
            this.colors = [
                '#00FFFF', // Cyan
                '#FFFF00', // Yellow
                '#800080', // Purple
                '#00FF00', // Green
                '#FF0000', // Red
                '#0000FF', // Blue
                '#FFA500'  // Orange
            ];
            
            this.board = [];
            this.currentPiece = null;
            this.gameOver = false;
            this.score = 0;
            this.lastDropTime = 0;
            this.dropInterval = 600;
            this.cellSize = 0;
            
            this.reset();
            this.setupCanvas();
            this.start();
        }
        
        setupCanvas() {
            const container = this.canvas.parentElement;
            if (!container) return;
            
            // Obtém o tamanho disponível no container
            const containerWidth = container.clientWidth - 16; // - padding
            const containerHeight = container.clientHeight - 16;
            
            // Calcula o tamanho máximo da célula baseado nas dimensões do container
            // Garantindo que o grid inteiro caiba perfeitamente
            const maxCellWidth = Math.floor(containerWidth / this.cols);
            const maxCellHeight = Math.floor(containerHeight / this.rows);
            
            // Usa o menor valor para manter proporção
            this.cellSize = Math.min(maxCellWidth, maxCellHeight);
            
            // Ajusta o canvas para que o grid termine exatamente no fim do container
            this.canvas.width = this.cols * this.cellSize;
            this.canvas.height = this.rows * this.cellSize;
            
            // Centraliza o canvas no container se necessário
            const remainingWidth = containerWidth - this.canvas.width;
            const remainingHeight = containerHeight - this.canvas.height;
            
            if (remainingWidth > 0 || remainingHeight > 0) {
                this.canvas.style.marginLeft = `${remainingWidth / 2}px`;
                this.canvas.style.marginTop = `${remainingHeight / 2}px`;
            }
            
            console.log(`Tetris Alinhado: ${this.canvas.width}x${this.canvas.height}, Célula: ${this.cellSize}px, Grid: ${this.cols}x${this.rows}`);
        }
        
        reset() {
            // Inicializa tabuleiro vazio
            this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
            this.score = 0;
            this.gameOver = false;
            
            // Gera peça inicial
            this.currentPiece = this.createRandomPiece();
        }
        
        createRandomPiece() {
            const shapeIndex = Math.floor(Math.random() * this.shapes.length);
            const shape = this.shapes[shapeIndex];
            
            return {
                shape: shape,
                color: this.colors[shapeIndex],
                row: 0,
                col: Math.floor(this.cols / 2) - Math.floor(shape[0].length / 2)
            };
        }
        
        isValidMove(piece, row, col) {
            for (let r = 0; r < piece.shape.length; r++) {
                for (let c = 0; c < piece.shape[r].length; c++) {
                    if (piece.shape[r][c]) {
                        const newRow = row + r;
                        const newCol = col + c;
                        
                        // Verifica limites
                        if (newCol < 0 || newCol >= this.cols || newRow >= this.rows) {
                            return false;
                        }
                        
                        // Verifica colisão com peças existentes
                        if (newRow >= 0 && this.board[newRow] && this.board[newRow][newCol]) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        
        mergePiece() {
            for (let r = 0; r < this.currentPiece.shape.length; r++) {
                for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                    if (this.currentPiece.shape[r][c]) {
                        const row = this.currentPiece.row + r;
                        const col = this.currentPiece.col + c;
                        
                        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                            this.board[row][col] = this.currentPiece.color;
                        }
                    }
                }
            }
        }
        
        clearLines() {
            let linesCleared = 0;
            
            for (let row = this.rows - 1; row >= 0; row--) {
                let isLineComplete = true;
                
                for (let col = 0; col < this.cols; col++) {
                    if (!this.board[row][col]) {
                        isLineComplete = false;
                        break;
                    }
                }
                
                if (isLineComplete) {
                    this.board.splice(row, 1);
                    this.board.unshift(Array(this.cols).fill(0));
                    linesCleared++;
                    row++;
                }
            }
            
            return linesCleared;
        }
        
        update() {
            if (this.gameOver) return;
            
            const currentTime = Date.now();
            if (currentTime - this.lastDropTime > this.dropInterval) {
                this.lastDropTime = currentTime;
                
                // Tenta mover para baixo
                if (this.isValidMove(this.currentPiece, this.currentPiece.row + 1, this.currentPiece.col)) {
                    this.currentPiece.row++;
                } else {
                    // Fixa a peça
                    this.mergePiece();
                    const linesCleared = this.clearLines();
                    if (linesCleared > 0) {
                        this.score += linesCleared * 100;
                    }
                    
                    // Nova peça
                    this.currentPiece = this.createRandomPiece();
                    
                    // Verifica game over
                    if (!this.isValidMove(this.currentPiece, this.currentPiece.row, this.currentPiece.col)) {
                        this.gameOver = true;
                        setTimeout(() => {
                            this.reset();
                            this.draw();
                        }, 2000);
                    }
                }
                
                this.draw();
            }
        }
        
        draw() {
            // Limpa o canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Fundo preto
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Desenha peças fixas no tabuleiro
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.board[row][col]) {
                        this.drawCell(col, row, this.board[row][col], false);
                    }
                }
            }
            
            // Desenha a peça atual
            if (this.currentPiece && !this.gameOver) {
                for (let r = 0; r < this.currentPiece.shape.length; r++) {
                    for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                        if (this.currentPiece.shape[r][c]) {
                            const col = this.currentPiece.col + c;
                            const row = this.currentPiece.row + r;
                            
                            if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                                this.drawCell(col, row, this.currentPiece.color, true);
                            }
                        }
                    }
                }
            }
            
            // Grade bem definida
            this.drawGrid();
        }
        
        drawCell(col, row, color, isCurrent) {
            const x = col * this.cellSize;
            const y = row * this.cellSize;
            const size = this.cellSize;
            
            // Célula principal
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, size, size);
            
            // Efeitos visuais
            if (!isCurrent) {
                // Sombra para peças fixas
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(x, y, size, 2);
                this.ctx.fillRect(x, y, 2, size);
                
                // Brilho para peças fixas
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(x + size - 2, y, 2, size);
                this.ctx.fillRect(x, y + size - 2, size, 2);
            } else {
                // Contorno para peça atual
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, size, size);
            }
        }
        
        drawGrid() {
            // Linhas verticais
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 0.5;
            
            for (let col = 0; col <= this.cols; col++) {
                const x = col * this.cellSize;
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
            
            // Linhas horizontais
            for (let row = 0; row <= this.rows; row++) {
                const y = row * this.cellSize;
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
            
            // Borda do grid
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        start() {
            this.lastDropTime = Date.now();
            
            const gameLoop = () => {
                this.update();
                if (!this.gameOver) {
                    requestAnimationFrame(gameLoop);
                }
            };
            
            gameLoop();
        }
        
        destroy() {
            this.gameOver = true;
        }
    }
    
    // ==================== UI ====================
    function createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* OVERLAY */
            #${CONFIG.popupId} {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                backdrop-filter: blur(4px);
            }
            
            #${CONFIG.popupId}.show {
                opacity: 1;
                visibility: visible;
            }
            
            /* CARD COMPACTO */
            .popup-card {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 380px;
                overflow: hidden;
                transform: translateY(20px) scale(0.95);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
                border: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            #${CONFIG.popupId}.show .popup-card {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            
            /* CABEÇALHO MENOR */
            .popup-header {
                background: linear-gradient(135deg, ${CONFIG.colors.primary}, ${CONFIG.colors.primaryDark});
                color: white;
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .popup-header h3 {
                margin: 0;
                font-size: 15px;
                font-weight: 600;
            }
            
            .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            /* CONTEÚDO COMPACTO */
            .popup-content {
                padding: 16px;
            }
            
            .popup-message {
                text-align: center;
                margin: 0 0 10px 0;
                font-size: 13px;
                color: #333;
                line-height: 1.4;
            }
            
            .popup-message strong {
                display: block;
                color: ${CONFIG.colors.primary};
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            /* AVISO DE CONSTRUÇÃO */
            .warning-message {
                background: rgba(255, 107, 107, 0.1);
                border: 1px solid rgba(255, 107, 107, 0.3);
                padding: 8px 10px;
                margin: 0 0 12px 0;
                border-radius: 6px;
                font-size: 11px;
                color: #666;
                line-height: 1.3;
                text-align: center;
            }
            
            .warning-message strong {
                color: ${CONFIG.colors.primary};
                font-size: 11px;
            }
            
            /* TETRIS VERTICAL ALINHADO */
            .tetris-section {
                background: #000;
                border-radius: 8px;
                overflow: hidden;
                margin: 12px 0;
                border: 2px solid #1a1a2e;
                height: 200px; /* Altura fixa para garantir espaço */
                display: flex;
                flex-direction: column;
                position: relative;
            }
            
            .tetris-header {
                padding: 6px;
                text-align: center;
                background: rgba(0, 0, 0, 0.9);
                border-bottom: 1px solid #333;
            }
            
            .tetris-header h4 {
                margin: 0;
                font-size: 11px;
                color: #4FC3F7;
                font-family: 'Courier New', monospace;
                letter-spacing: 1px;
            }
            
            .tetris-container {
                flex: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0; /* Sem padding para o grid se alinhar */
                background: #000;
                overflow: hidden;
            }
            
            #tetrisCanvas {
                display: block;
                background: #000 !important;
                /* O canvas será dimensionado pela classe MiniTetris */
            }
            
            /* BOTÕES COMPACTOS */
            .buttons-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin: 12px 0;
            }
            
            .btn {
                padding: 10px 12px;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
            }
            
            .btn-primary {
                background: ${CONFIG.colors.primary};
                color: white;
            }
            
            .btn-primary:hover {
                background: ${CONFIG.colors.primaryDark};
                transform: translateY(-1px);
            }
            
            .btn-secondary {
                background: ${CONFIG.colors.secondary};
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }
            
            .btn-secondary:hover:not(:disabled) {
                background: #8B4513;
                transform: translateY(-1px);
            }
            
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none !important;
            }
            
            /* CONTADOR PEQUENO */
            .counter-display {
                text-align: center;
                margin: 12px 0;
            }
            
            .counter-number {
                display: inline-block;
                width: 45px;
                height: 45px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${CONFIG.colors.secondaryLight}, ${CONFIG.colors.secondary});
                color: white;
                font-size: 16px;
                font-weight: 800;
                line-height: 45px;
                margin-bottom: 4px;
                transition: transform 0.3s;
            }
            
            .counter-label {
                font-size: 10px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            /* STATUS */
            .status-display {
                text-align: center;
                margin: 8px 0;
                font-size: 11px;
                color: #666;
            }
            
            .status-indicator {
                display: inline-block;
                width: 5px;
                height: 5px;
                border-radius: 50%;
                margin-right: 5px;
            }
            
            .status-online {
                background: ${CONFIG.colors.success};
                animation: pulse 2s infinite;
            }
            
            .status-offline {
                background: ${CONFIG.colors.warning};
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            /* CHECKBOX */
            .option-row {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid #eee;
                text-align: center;
            }
            
            .checkbox-label {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
                font-size: 11px;
                color: #666;
            }
            
            /* NOTIFICAÇÃO */
            .coffee-notification {
                position: fixed;
                top: 15px;
                right: 15px;
                background: ${CONFIG.colors.success};
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                font-size: 12px;
                max-width: 200px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            /* ANIMAÇÃO CAFÉ */
            .coffee-particle {
                position: fixed;
                font-size: 14px;
                z-index: 10001;
                pointer-events: none;
                animation: floatUp 1s ease-out forwards;
            }
            
            @keyframes floatUp {
                to { transform: translateY(-50px) rotate(15deg); opacity: 0; }
            }
            
            /* RESPONSIVIDADE */
            @media (max-width: 480px) {
                .popup-card {
                    width: 95%;
                    max-width: 320px;
                    border-radius: 12px;
                }
                
                .popup-header {
                    padding: 10px 14px;
                }
                
                .popup-header h3 {
                    font-size: 14px;
                }
                
                .popup-content {
                    padding: 14px;
                }
                
                .tetris-section {
                    height: 180px;
                }
                
                .tetris-header h4 {
                    font-size: 10px;
                }
                
                .warning-message {
                    font-size: 10px;
                    padding: 6px 8px;
                }
                
                .buttons-row {
                    grid-template-columns: 1fr;
                    gap: 6px;
                }
                
                .btn {
                    padding: 8px 10px;
                    font-size: 12px;
                }
                
                .counter-number {
                    width: 40px;
                    height: 40px;
                    font-size: 14px;
                    line-height: 40px;
                }
                
                .counter-label {
                    font-size: 9px;
                }
            }
            
            @media (max-width: 360px) {
                .tetris-section {
                    height: 160px;
                }
                
                .popup-card {
                    max-width: 300px;
                }
            }
            
            /* DARK MODE */
            @media (prefers-color-scheme: dark) {
                .popup-card {
                    background: #1a1a1a;
                }
                
                .popup-content {
                    color: #e0e0e0;
                }
                
                .popup-message {
                    color: #e0e0e0;
                }
                
                .warning-message {
                    background: rgba(255, 107, 107, 0.15);
                    color: #aaa;
                    border-color: rgba(255, 107, 107, 0.4);
                }
                
                .counter-label {
                    color: #aaa;
                }
                
                .option-row {
                    border-color: #333;
                }
                
                .checkbox-label {
                    color: #aaa;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    function createPopup() {
        const popupHTML = `
            <div id="${CONFIG.popupId}">
                <div class="popup-card">
                    <div class="popup-header">
                        <h3><svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/></svg> Página em Desenvolvimento</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    
                    <div class="popup-content">
                        <p class="popup-message">
                            <strong>Ajude-nos com um cafezinho! <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M18 8h1a4 4 0 0 1 0 8h-1'/><path d='M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z'/><line x1='6' y1='1' x2='6' y2='4'/><line x1='10' y1='1' x2='10' y2='4'/><line x1='14' y1='1' x2='14' y2='4'/></svg></strong>
                            Estamos trabalhando para melhorar esta página.
                        </p>
                        
                        <!-- TEXTO DE AVISO ADICIONADO -->
                        <div class="warning-message">
                            <strong><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg> ATENÇÃO:</strong> Esta funcionalidade ainda está sendo construída e testada e pode apresentar bugs, erros ou instabilidades de funcionamento.
                        </div>
                        
                        <!-- TETRIS VERTICAL -->
                        <div class="tetris-section">
                            <div class="tetris-header">
                                <h4>TETRIS AUTO</h4>
                            </div>
                            <div class="tetris-container">
                                <canvas id="tetrisCanvas"></canvas>
                            </div>
                        </div>
                        
                        <div class="buttons-row">
                            <button class="btn btn-primary" id="understandBtn">
                                Entendi
                            </button>
                            <button class="btn btn-secondary" id="sendCoffeeBtn">
                                <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M18 8h1a4 4 0 0 1 0 8h-1'/><path d='M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z'/><line x1='6' y1='1' x2='6' y2='4'/><line x1='10' y1='1' x2='10' y2='4'/><line x1='14' y1='1' x2='14' y2='4'/></svg>
                                <span>Enviar Café</span>
                            </button>
                        </div>
                        
                        <div class="counter-display">
                            <div class="counter-number" id="coffeeCounter">0</div>
                            <div class="counter-label">Total de Cafés</div>
                        </div>
                        
                        <div class="status-display">
                            <span class="status-indicator" id="statusIndicator"></span>
                            <span id="statusText">Conectando...</span>
                        </div>
                        
                        <div class="option-row">
                            <label class="checkbox-label">
                                <input type="checkbox" id="dontShowAgain">
                                Não mostrar por ${CONFIG.hideDays} dias
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        // Referências aos elementos
        return {
            popup: document.getElementById(CONFIG.popupId),
            counter: document.getElementById('coffeeCounter'),
            sendBtn: document.getElementById('sendCoffeeBtn'),
            understandBtn: document.getElementById('understandBtn'),
            closeBtn: document.querySelector('.close-btn'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            dontShowAgain: document.getElementById('dontShowAgain'),
            canvas: document.getElementById('tetrisCanvas')
        };
    }
    
    // ==================== LÓGICA DO POPUP ====================
    let elements = null;
    
    function updateStatus(online, message = '') {
        if (!elements) return;
        
        if (online) {
            elements.statusIndicator.className = 'status-indicator status-online';
            elements.statusText.textContent = message || 'API Online';
        } else {
            elements.statusIndicator.className = 'status-indicator status-offline';
            elements.statusText.textContent = message || 'Modo Offline';
        }
    }
    
    async function updateCounter() {
        try {
            console.log('Atualizando contador...');
            const result = await getCounterValue();
            
            state.count = result.count;
            state.isOnline = result.success;
            
            if (elements && elements.counter) {
                elements.counter.textContent = state.count;
                
                // Animação
                elements.counter.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    elements.counter.style.transform = 'scale(1)';
                }, 300);
            }
            
            updateStatus(result.success, 
                result.success ? `API Online - ${state.count} cafés` : 'Modo Offline');
            
            console.log('Contador atualizado:', state.count, 'Online:', result.success);
            return result.success;
            
        } catch (error) {
            console.error('Erro ao atualizar contador:', error);
            updateStatus(false, 'Erro de conexão');
            return false;
        }
    }
    
    async function sendCoffee() {
        if (state.isLoading) return;
        
        state.isLoading = true;
        const btn = elements.sendBtn;
        const originalText = btn.innerHTML;
        
        // Animação do botão
        btn.disabled = true;
        btn.innerHTML = '<span>Enviando...</span>';
        
        // Animação visual
        const rect = btn.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const coffee = document.createElement('div');
                coffee.className = 'coffee-particle';
                coffee.innerHTML = '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><path d=\'M18 8h1a4 4 0 0 1 0 8h-1\'/><path d=\'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z\'/><line x1=\'6\' y1=\'1\' x2=\'6\' y2=\'4\'/><line x1=\'10\' y1=\'1\' x2=\'10\' y2=\'4\'/><line x1=\'14\' y1=\'1\' x2=\'14\' y2=\'4\'/></svg>';
                coffee.style.left = `${rect.left + Math.random() * rect.width}px`;
                coffee.style.top = `${rect.top}px`;
                coffee.style.fontSize = `${14 + Math.random() * 8}px`;
                document.body.appendChild(coffee);
                setTimeout(() => coffee.remove(), 1000);
            }, i * 200);
        }
        
        try {
            const result = await incrementCounter();
            console.log('Resultado do incremento:', result);
            
            // Atualiza contador
            state.count = result.count;
            state.isOnline = result.success;
            
            if (elements && elements.counter) {
                elements.counter.textContent = state.count;
                
                // Animação
                elements.counter.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    elements.counter.style.transform = 'scale(1)';
                }, 300);
            }
            
            // Notificação
            showNotification(
                result.success 
                    ? 'Café enviado com sucesso!' 
                    : 'Café salvo localmente!',
                result.success ? 'success' : 'warning'
            );
            
            // Feedback no botão
            btn.innerHTML = result.success 
                ? '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#28a745\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><polyline points=\'20 6 9 17 4 12\'/></svg><span>Enviado!</span>'
                : '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'15\' height=\'15\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><rect x=\'5\' y=\'2\' width=\'14\' height=\'20\' rx=\'2\' ry=\'2\'/><line x1=\'12\' y1=\'18\' x2=\'12.01\' y2=\'18\'/></svg><span>Salvo Local</span>';
            
            updateStatus(result.success,
                result.success ? 'Café registrado!' : 'Modo Local');
            
        } catch (error) {
            console.error('Erro ao enviar café:', error);
            showNotification('Erro ao enviar', 'error');
            btn.innerHTML = '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#dc3545\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' aria-hidden=\'true\'><line x1=\'18\' y1=\'6\' x2=\'6\' y2=\'18\'/><line x1=\'6\' y1=\'6\' x2=\'18\' y2=\'18\'/></svg><span>Erro</span>';
            updateStatus(false, 'Erro ao enviar');
            
        } finally {
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                state.isLoading = false;
            }, 1500);
        }
    }
    
    function showNotification(message, type = 'success') {
        const existing = document.querySelector('.coffee-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'coffee-notification';
        notification.textContent = message;
        
        if (type === 'warning') {
            notification.style.background = CONFIG.colors.warning;
        } else if (type === 'error') {
            notification.style.background = '#EF4444';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
    
    function closePopup() {
        if (!elements) return;
        
        const hide = elements.dontShowAgain && elements.dontShowAgain.checked;
        if (hide) {
            const hideUntil = Date.now() + (CONFIG.hideDays * 24 * 60 * 60 * 1000);
            localStorage.setItem(CONFIG.storageKey, hideUntil.toString());
        }
        
        elements.popup.classList.remove('show');
        
        if (state.tetris) {
            state.tetris.destroy();
            state.tetris = null;
        }
        
        setTimeout(() => {
            if (elements.popup && elements.popup.parentNode) {
                elements.popup.remove();
                const style = document.querySelector('#counter-popup-styles');
                if (style) style.remove();
            }
            elements = null;
        }, 300);
    }
    
    function setupEventListeners() {
        if (!elements) return;
        
        elements.closeBtn.addEventListener('click', closePopup);
        elements.understandBtn.addEventListener('click', closePopup);
        elements.sendBtn.addEventListener('click', sendCoffee);
        
        elements.popup.addEventListener('click', (e) => {
            if (e.target === elements.popup) closePopup();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
        });
    }
    
    async function showPopup() {
        if (state.hasShown) return;
        
        createStyles();
        elements = createPopup();
        
        // Inicia Tetris com delay para garantir renderização
        setTimeout(() => {
            if (elements.canvas) {
                state.tetris = new MiniTetris(elements.canvas);
            }
        }, 100);
        
        // Atualiza contador da API
        await updateCounter();
        
        setupEventListeners();
        
        // Mostra o popup
        setTimeout(() => {
            if (elements && elements.popup) {
                elements.popup.classList.add('show');
                state.hasShown = true;
            }
        }, 50);
    }
    
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil);
    }
    
    // ==================== INICIALIZAÇÃO ====================
    function init() {
        if (!shouldShowPopup()) {
            console.log('Popup não deve ser mostrado agora');
            return;
        }
        
        setTimeout(showPopup, CONFIG.showDelay);
        
        // Mostra mais cedo se o usuário interagir
        const earlyShow = () => {
            if (!state.hasShown) {
                showPopup();
                ['click', 'scroll', 'mousemove'].forEach(ev => {
                    window.removeEventListener(ev, earlyShow);
                });
            }
        };
        
        ['click', 'scroll', 'mousemove'].forEach(ev => {
            window.addEventListener(ev, earlyShow, { once: true });
        });
    }
    
    // ==================== API PÚBLICA ====================
    window.coffeeCounterPopup = {
        show: () => {
            if (!state.hasShown) showPopup();
        },
        hide: closePopup,
        reset: () => {
            localStorage.removeItem(CONFIG.storageKey);
            localStorage.removeItem('coffee_local_count');
            state.hasShown = false;
            if (elements && elements.popup) {
                elements.popup.remove();
                elements = null;
            }
            init();
        },
        getCount: async () => {
            const result = await getCounterValue();
            return result.count;
        }
    };
    
    // ==================== START ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();