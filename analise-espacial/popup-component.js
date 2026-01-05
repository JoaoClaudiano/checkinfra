// popup-counter-optimized.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        // API
        apiUrl: "https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325",
        apiToken: "ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN",
        
        // Popup
        popupId: 'counter-api-popup',
        storageKey: 'counterApiPopupHidden',
        hideDays: 7,
        showDelay: 2000,
        
        // Design
        colors: {
            primary: '#FF6B6B',
            primaryDark: '#FF4757',
            secondary: '#A0522D',
            secondaryLight: '#DEB887',
            success: '#10B981',
            warning: '#F59E0B',
            background: '#ffffff',
            text: '#333333'
        },
        
        // Animations
        animationDuration: 300
    };
    
    // ==================== ELEMENTOS GLOBAIS ====================
    let elements = {};
    let state = {
        count: 0,
        isOnline: false,
        isLoading: false,
        hasShown: false
    };
    
    // ==================== FUNÇÕES DE API ====================
    async function getCounterValue() {
        try {
            const response = await fetch(CONFIG.apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${CONFIG.apiToken}`
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const count = data?.count || data?.value || data || 0;
            
            return { success: true, count };
            
        } catch (error) {
            console.warn('API offline, usando contador local:', error.message);
            return {
                success: false,
                count: getLocalCount()
            };
        }
    }
    
    async function incrementCounter() {
        try {
            const response = await fetch(`${CONFIG.apiUrl}/up`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.apiToken}`
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            // Recarrega o valor atualizado
            const updated = await getCounterValue();
            return {
                success: true,
                count: updated.count
            };
            
        } catch (error) {
            const newCount = incrementLocalCount();
            return {
                success: false,
                count: newCount
            };
        }
    }
    
    function getLocalCount() {
        try {
            const saved = localStorage.getItem('coffeeCounter');
            return saved ? parseInt(saved) : 0;
        } catch {
            return 0;
        }
    }
    
    function incrementLocalCount() {
        try {
            const current = getLocalCount();
            const newCount = current + 1;
            localStorage.setItem('coffeeCounter', newCount.toString());
            return newCount;
        } catch {
            return 1;
        }
    }
    
    // ==================== UI HELPERS ====================
    function createElement(tag, className, content = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (content) el.innerHTML = content;
        return el;
    }
    
    function showNotification(message, type = 'success') {
        const notification = createElement('div', 'notification');
        notification.textContent = message;
        notification.style.backgroundColor = type === 'success' ? CONFIG.colors.success : CONFIG.colors.warning;
        
        document.body.appendChild(notification);
        
        // Anima entrada
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    function createCoffeeAnimation(x, y) {
        const coffee = createElement('div', 'coffee-particle', '☕');
        
        // Posiciona próximo ao botão
        coffee.style.left = `${x + Math.random() * 20 - 10}px`;
        coffee.style.top = `${y + Math.random() * 20 - 10}px`;
        coffee.style.fontSize = `${16 + Math.random() * 10}px`;
        
        document.body.appendChild(coffee);
        
        // Anima
        setTimeout(() => {
            coffee.style.transform = `translateY(-100px) rotate(${Math.random() * 360}deg)`;
            coffee.style.opacity = '0';
        }, 10);
        
        // Remove após animação
        setTimeout(() => coffee.remove(), 1000);
    }
    
    // ==================== POPUP LOGIC ====================
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(CONFIG.storageKey);
        return !hideUntil || Date.now() > parseInt(hideUntil);
    }
    
    function hidePopup(days = CONFIG.hideDays) {
        const popup = elements.popup;
        popup.classList.remove('show');
        
        if (elements.dontShowAgain?.checked) {
            const hideUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
            localStorage.setItem(CONFIG.storageKey, hideUntil.toString());
        }
        
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
                document.querySelector('#counter-popup-styles')?.remove();
            }
        }, CONFIG.animationDuration);
    }
    
    // ==================== API INTERACTIONS ====================
    async function updateCounterDisplay() {
        if (!elements.counter) return;
        
        const result = await getCounterValue();
        state.count = result.count;
        state.isOnline = result.success;
        
        // Atualiza display
        elements.counter.textContent = state.count;
        elements.status.textContent = state.isOnline ? 'Online' : 'Offline';
        elements.status.className = `status ${state.isOnline ? 'online' : 'offline'}`;
    }
    
    async function sendCoffee(event) {
        if (state.isLoading) return;
        
        state.isLoading = true;
        const button = elements.sendBtn;
        const originalText = button.textContent;
        
        // Animação do botão
        button.disabled = true;
        button.textContent = 'Enviando...';
        button.classList.add('loading');
        
        // Animação visual
        if (event) {
            const rect = button.getBoundingClientRect();
            for (let i = 0; i < 5; i++) {
                setTimeout(() => createCoffeeAnimation(rect.left, rect.top), i * 100);
            }
        }
        
        try {
            const result = await incrementCounter();
            
            if (result.success) {
                showNotification('☕ Café enviado com sucesso!', 'success');
            } else {
                showNotification('☕ Café salvo localmente', 'warning');
            }
            
            // Atualiza contador com animação
            elements.counter.style.transform = 'scale(1.2)';
            setTimeout(() => {
                elements.counter.style.transform = 'scale(1)';
            }, 300);
            
            // Recarrega display
            await updateCounterDisplay();
            
        } catch (error) {
            console.error('Erro ao enviar café:', error);
            showNotification('❌ Erro ao enviar', 'warning');
        } finally {
            // Restaura botão
            button.disabled = false;
            button.textContent = originalText;
            button.classList.remove('loading');
            state.isLoading = false;
        }
    }
    
    // ==================== POPUP CREATION ====================
    function createStyles() {
        const styles = `
            #${CONFIG.popupId} {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: opacity ${CONFIG.animationDuration}ms ease, visibility ${CONFIG.animationDuration}ms ease;
                backdrop-filter: blur(4px);
            }
            
            #${CONFIG.popupId}.show {
                opacity: 1;
                visibility: visible;
            }
            
            .popup-container {
                background: ${CONFIG.colors.background};
                border-radius: 20px;
                width: 90%;
                max-width: 400px;
                overflow: hidden;
                transform: translateY(30px) scale(0.95);
                opacity: 0;
                transition: all ${CONFIG.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            #${CONFIG.popupId}.show .popup-container {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            
            .popup-header {
                background: linear-gradient(135deg, ${CONFIG.colors.primary}, ${CONFIG.colors.primaryDark});
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .popup-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .popup-content {
                padding: 25px;
                color: ${CONFIG.colors.text};
            }
            
            .counter-display {
                text-align: center;
                margin: 25px 0;
            }
            
            .counter-number {
                font-size: 48px;
                font-weight: 800;
                color: ${CONFIG.colors.secondary};
                display: block;
                transition: transform 0.3s ease;
            }
            
            .counter-label {
                font-size: 14px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 5px;
            }
            
            .buttons-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 25px 0;
            }
            
            .btn {
                padding: 14px 20px;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: inherit;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, ${CONFIG.colors.primary}, ${CONFIG.colors.primaryDark});
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
            }
            
            .btn-secondary {
                background: linear-gradient(135deg, ${CONFIG.colors.secondary}, ${CONFIG.colors.secondaryLight});
                color: white;
            }
            
            .btn-secondary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
            }
            
            .btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none !important;
            }
            
            .btn.loading {
                position: relative;
                color: transparent;
            }
            
            .btn.loading::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                border: 2px solid white;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 0.8s linear infinite;
                top: 50%;
                left: 50%;
                margin-left: -8px;
                margin-top: -8px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .status-display {
                text-align: center;
                margin-top: 15px;
                font-size: 13px;
                color: #666;
            }
            
            .status {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 6px;
            }
            
            .status.online {
                background: ${CONFIG.colors.success};
                animation: pulse 2s infinite;
            }
            
            .status.offline {
                background: ${CONFIG.colors.warning};
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .option-row {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
            }
            
            .checkbox-label {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 13px;
                color: #666;
            }
            
            .checkbox-label input {
                width: 16px;
                height: 16px;
            }
            
            /* Notification */
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${CONFIG.colors.success};
                color: white;
                padding: 12px 20px;
                border-radius: 10px;
                z-index: 10000;
                transform: translateX(100%);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                max-width: 300px;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            /* Coffee animation */
            .coffee-particle {
                position: fixed;
                font-size: 20px;
                z-index: 10000;
                pointer-events: none;
                transition: transform 1s ease-out, opacity 1s ease-out;
            }
            
            /* Responsive */
            @media (max-width: 480px) {
                .popup-container {
                    width: 95%;
                    max-width: 350px;
                }
                
                .buttons-row {
                    grid-template-columns: 1fr;
                }
                
                .counter-number {
                    font-size: 40px;
                }
            }
            
            @media (prefers-color-scheme: dark) {
                .popup-container {
                    background: #1a1a1a;
                    color: #e0e0e0;
                }
                
                .popup-content {
                    color: #e0e0e0;
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
        
        const styleEl = createElement('style', null, styles);
        styleEl.id = 'counter-popup-styles';
        document.head.appendChild(styleEl);
    }
    
    function createPopup() {
        const popup = createElement('div', null);
        popup.id = CONFIG.popupId;
        
        popup.innerHTML = `
            <div class="popup-container">
                <div class="popup-header">
                    <h3>🚧 Página em Desenvolvimento</h3>
                    <button class="close-btn" aria-label="Fechar">&times;</button>
                </div>
                
                <div class="popup-content">
                    <p style="text-align: center; margin: 0 0 15px 0;">
                        Estamos trabalhando para melhorar esta página.<br>
                        <strong>Ajude-nos com um cafezinho! ☕</strong>
                    </p>
                    
                    <div class="counter-display">
                        <span class="counter-number" id="coffeeCounter">0</span>
                        <span class="counter-label">Total de Cafés</span>
                    </div>
                    
                    <div class="buttons-row">
                        <button class="btn btn-primary" id="understandBtn">
                            Entendi
                        </button>
                        <button class="btn btn-secondary" id="sendCoffeeBtn">
                            ☕ Enviar Café
                        </button>
                    </div>
                    
                    <div class="status-display">
                        <span class="status" id="apiStatus"></span>
                        <span id="statusText">Conectando...</span>
                    </div>
                    
                    <div class="option-row">
                        <label class="checkbox-label">
                            <input type="checkbox" id="dontShowAgain">
                            Não mostrar novamente por ${CONFIG.hideDays} dias
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Store references
        elements = {
            popup: popup,
            counter: document.getElementById('coffeeCounter'),
            sendBtn: document.getElementById('sendCoffeeBtn'),
            understandBtn: document.getElementById('understandBtn'),
            closeBtn: popup.querySelector('.close-btn'),
            status: document.getElementById('apiStatus'),
            statusText: document.getElementById('statusText'),
            dontShowAgain: document.getElementById('dontShowAgain')
        };
        
        // Event listeners
        elements.closeBtn.addEventListener('click', () => hidePopup());
        elements.understandBtn.addEventListener('click', () => hidePopup());
        elements.sendBtn.addEventListener('click', sendCoffee);
        
        popup.addEventListener('click', (e) => {
            if (e.target === popup) hidePopup();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hidePopup();
        });
    }
    
    // ==================== INITIALIZATION ====================
    async function init() {
        if (!shouldShowPopup() || state.hasShown) return;
        
        // Create and show
        createStyles();
        createPopup();
        
        // Update counter
        await updateCounterDisplay();
        
        // Show with delay
        setTimeout(() => {
            if (elements.popup && elements.popup.parentNode) {
                elements.popup.classList.add('show');
                state.hasShown = true;
            }
        }, CONFIG.showDelay);
        
        // Early show on interaction
        const earlyShow = () => {
            if (!state.hasShown && elements.popup) {
                elements.popup.classList.add('show');
                state.hasShown = true;
                ['click', 'scroll', 'mousemove'].forEach(ev => {
                    window.removeEventListener(ev, earlyShow);
                });
            }
        };
        
        ['click', 'scroll', 'mousemove'].forEach(ev => {
            window.addEventListener(ev, earlyShow, { once: true });
        });
    }
    
    // ==================== PUBLIC API ====================
    window.coffeeCounterPopup = {
        show: () => {
            if (!state.hasShown) {
                elements?.popup?.classList.add('show');
                state.hasShown = true;
            }
        },
        hide: () => hidePopup(0),
        reset: () => {
            localStorage.removeItem(CONFIG.storageKey);
            localStorage.removeItem('coffeeCounter');
            state.hasShown = false;
            if (elements.popup && elements.popup.parentNode) {
                elements.popup.remove();
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