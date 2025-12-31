// popup-counter-api-simplificado.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO DA API V2 ====================
    const API_CONFIG = {
        // URL base da API v2 com SEU namespace específico
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
            warning: '#F59E0B'
        }
    };
    
    // ==================== SISTEMA DE API V2 SIMPLIFICADO ====================
    
    // Função para buscar o total de cafés da API
    async function fetchCoffeeCount() {
        try {
            console.log('Buscando total de cafés da API...');
            
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Resposta da API:', data);
            
            // Extrai o valor do contador
            let count = 0;
            
            if (data && typeof data.count === 'number') {
                count = data.count;
            } else if (data && data.value !== undefined) {
                count = data.value;
            } else if (typeof data === 'number') {
                count = data;
            }
            
            return {
                success: true,
                count: count
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
    
    // Função para enviar um café (incrementar contador)
    async function sendCoffee() {
        try {
            console.log('Enviando café para a API...');
            
            // Faz POST para o endpoint /up
            const response = await fetch(`${API_CONFIG.baseUrl}/up`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Café enviado com sucesso:', data);
            
            // Busca o novo total atualizado
            const updated = await fetchCoffeeCount();
            
            return {
                success: true,
                newCount: updated.success ? updated.count : 0
            };
            
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
    
    // ==================== CSS SIMPLIFICADO ====================
    const style = document.createElement('style');
    style.textContent = `
        /* OVERLAY */
        .counter-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(5px);
            animation: overlayFade 0.3s ease-out;
        }
        
        @keyframes overlayFade {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* CARD SIMPLES */
        .counter-popup-card {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 350px;
            overflow: hidden;
            animation: cardSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            text-align: center;
        }
        
        @keyframes cardSlide {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
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
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .counter-popup-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        /* CONTEÚDO */
        .counter-popup-content {
            padding: 30px 25px;
            color: #333;
            line-height: 1.5;
        }
        
        .counter-message {
            margin: 0 0 25px 0;
            font-size: 15px;
        }
        
        .counter-message strong {
            display: block;
            color: ${POPUP_CONFIG.colors.primary};
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        /* BOTÃO PRINCIPAL */
        .coffee-action-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
            margin-bottom: 15px;
        }
        
        .coffee-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(160, 82, 45, 0.4);
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
            font-size: 22px;
            animation: coffeeSteam 2s infinite;
        }
        
        @keyframes coffeeSteam {
            0%, 100% { transform: translateY(0); opacity: 0.8; }
            50% { transform: translateY(-3px); opacity: 1; }
        }
        
        /* CONTADOR SIMPLES */
        .coffee-counter {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px dashed #E0E0E0;
        }
        
        .counter-label {
            font-size: 13px;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .counter-value {
            font-size: 32px;
            font-weight: 800;
            color: ${POPUP_CONFIG.colors.cafeBrown};
            background: ${POPUP_CONFIG.colors.cafeLight}20;
            padding: 10px 20px;
            border-radius: 10px;
            display: inline-block;
            min-width: 80px;
        }
        
        /* BOTÃO FECHAR */
        .counter-close-btn {
            background: #F0F0F0;
            color: #666;
            border: none;
            border-radius: 10px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            width: 100%;
            margin-top: 10px;
        }
        
        .counter-close-btn:hover {
            background: #E0E0E0;
        }
        
        /* OPÇÃO NÃO MOSTRAR */
        .counter-option {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px dashed #E0E0E0;
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
        
        /* EFEITO DE CAFÉ */
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
                transform: translateY(-80px) rotate(20deg);
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
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* RESPONSIVO */
        @media (max-width: 480px) {
            .counter-popup-card {
                width: 95%;
                max-width: 320px;
                border-radius: 16px;
            }
            
            .counter-popup-content {
                padding: 25px 20px;
            }
            
            .counter-value {
                font-size: 28px;
                padding: 8px 16px;
            }
        }
        
        /* DARK MODE */
        @media (prefers-color-scheme: dark) {
            .counter-popup-card {
                background: #1E1E1E;
                color: #E0E0E0;
            }
            
            .counter-popup-content {
                color: #E0E0E0;
            }
            
            .counter-message strong {
                color: #FF8585;
            }
            
            .coffee-counter {
                border-color: #444;
            }
            
            .counter-label {
                color: #AAA;
            }
            
            .counter-close-btn {
                background: #2D2D2D;
                color: #CCC;
            }
            
            .counter-close-btn:hover {
                background: #3D3D3D;
            }
            
            .counter-option {
                border-color: #444;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== HTML SIMPLIFICADO ====================
    const popupHTML = `
        <div id="${POPUP_CONFIG.popupId}" class="counter-popup-overlay">
            <div class="counter-popup-card">
                <div class="counter-popup-header">
                    <h3>☕ Envie um Café!</h3>
                </div>
                
                <div class="counter-popup-content">
                    <div class="counter-message">
                        <strong>Apoie nosso trabalho</strong>
                        Cada café nos dá energia para continuar melhorando esta página!
                    </div>
                    
                    <button class="coffee-action-btn" id="sendCoffeeBtn">
                        <span class="coffee-icon">☕</span>
                        <span>Enviar Café</span>
                    </button>
                    
                    <div class="coffee-counter">
                        <div class="counter-label">Total de Cafés Recebidos</div>
                        <div class="counter-value" id="totalCoffeeCount">0</div>
                    </div>
                    
                    <button class="counter-close-btn" id="closeBtn">
                        Fechar
                    </button>
                    
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
    
    // ==================== LÓGICA SIMPLIFICADA ====================
    const popup = document.getElementById(POPUP_CONFIG.popupId);
    const sendBtn = document.getElementById('sendCoffeeBtn');
    const closeBtn = document.getElementById('closeBtn');
    const totalCountElement = document.getElementById('totalCoffeeCount');
    let currentCount = 0;
    let popupShown = false;
    
    // Verifica se deve mostrar o popup
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(POPUP_CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    // Busca e atualiza o contador
    async function updateCoffeeCounter() {
        try {
            const result = await fetchCoffeeCount();
            if (result.success) {
                currentCount = result.count;
                totalCountElement.textContent = currentCount;
                // Efeito visual ao atualizar
                totalCountElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
            }
        } catch (error) {
            console.error('Erro ao atualizar contador:', error);
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
            // Efeito visual de café flutuante
            createCoffeeFloats();
            
            // Envia para a API
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
            showNotification('⚠️ Erro ao enviar. Tente novamente.');
            sendBtn.innerHTML = '<span class="coffee-icon">❌</span><span>Erro</span>';
            sendBtn.style.background = `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`;
            
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
                document.body.appendChild(coffee);
                
                setTimeout(() => coffee.remove(), 1000);
            }, i * 150);
        }
    }
    
    // Mostra notificação
    function showNotification(message) {
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
    }
    
    // Mostra o popup
    async function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        popup.style.display = 'flex';
        
        // Carrega o contador atual
        await updateCoffeeCounter();
        
        // Configura eventos
        sendBtn.addEventListener('click', handleSendCoffee);
        closeBtn.addEventListener('click', closePopup);
        
        // Fecha ao clicar fora
        popup.addEventListener('click', (e) => {
            if (e.target === popup) closePopup();
        });
        
        // Fecha com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
            if (e.key === 'Enter' && e.target === sendBtn) handleSendCoffee();
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
                window.removeEventListener('click', earlyShow);
                window.removeEventListener('scroll', earlyShow);
            }
        };
        
        window.addEventListener('click', earlyShow, { once: true });
        window.addEventListener('scroll', earlyShow, { once: true });
    }
    
    // ==================== INICIALIZAÇÃO ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ==================== API PÚBLICA SIMPLES ====================
    window.coffeeCounter = {
        showPopup: showPopup,
        hidePopup: closePopup,
        getCount: async () => {
            const result = await fetchCoffeeCount();
            return result.success ? result.count : 0;
        },
        sendCoffee: handleSendCoffee
    };
    
})();