// popup-glow-responsive.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        popupId: 'glow-popup',
        storageKey: 'glowPopupHiddenUntil',
        hideDays: 7,
        showDelay: 3000, // ms antes de mostrar automaticamente
        colors: {
            primary: '#7C3AED',
            primaryDark: '#5B21B6',
            secondary: '#F9FAFB',
            textPrimary: '#1F2937',
            textSecondary: '#6B7280'
        },
        animations: {
            glowPulse: '3s ease-in-out infinite',
            cardSlideIn: '0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fadeIn: '0.4s ease-out'
        }
    };
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CRIAÇÃO DO CSS ====================
    const style = document.createElement('style');
    style.textContent = `
        /* OVERLAY */
        .glow-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(3px);
            animation: glowOverlayFadeIn ${CONFIG.animations.fadeIn};
        }
        
        @keyframes glowOverlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* CARD COM GLOW */
        .glow-popup-card {
            background: white;
            border-radius: 16px;
            width: 92%;
            max-width: 420px;
            overflow: hidden;
            position: relative;
            z-index: 1;
            animation: glowCardSlideIn ${CONFIG.animations.cardSlideIn};
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 
                0 10px 40px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        /* EFEITO GLOW EXTERNO COM RESPIRAÇÃO */
        .glow-popup-card::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(
                45deg,
                ${CONFIG.colors.primary},
                #8B5CF6,
                ${CONFIG.colors.primary}
            );
            border-radius: 18px;
            z-index: -1;
            opacity: 0.3;
            filter: blur(12px);
            animation: glowPulseEffect ${CONFIG.animations.glowPulse};
        }
        
        @keyframes glowCardSlideIn {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes glowPulseEffect {
            0%, 100% {
                opacity: 0.3;
                transform: scale(1);
            }
            50% {
                opacity: 0.5;
                transform: scale(1.01);
            }
        }
        
        /* EFEITO HOVER */
        .glow-popup-card:hover {
            transform: translateY(-2px);
            box-shadow: 
                0 15px 50px rgba(0, 0, 0, 0.15),
                0 0 0 1px rgba(255, 255, 255, 0.2);
        }
        
        .glow-popup-card:hover::before {
            opacity: 0.4;
        }
        
        /* CABEÇALHO */
        .glow-popup-header {
            background: linear-gradient(135deg, ${CONFIG.colors.primary} 0%, ${CONFIG.colors.primaryDark} 100%);
            color: white;
            padding: 20px 24px;
            position: relative;
            overflow: hidden;
        }
        
        .glow-popup-header::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                to right,
                transparent,
                rgba(255, 255, 255, 0.1),
                transparent
            );
            transform: rotate(30deg);
            animation: glowShine 6s infinite linear;
        }
        
        @keyframes glowShine {
            0% { transform: translateX(-100%) rotate(30deg); }
            100% { transform: translateX(100%) rotate(30deg); }
        }
        
        .glow-header-content {
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
            z-index: 1;
        }
        
        .glow-popup-icon {
            font-size: 20px;
            background: rgba(255, 255, 255, 0.15);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glow-popup-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            line-height: 1.4;
            flex: 1;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .glow-close-btn {
            background: rgba(255, 255, 255, 0.15);
            border: none;
            color: white;
            font-size: 20px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            flex-shrink: 0;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            z-index: 1;
        }
        
        .glow-close-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: scale(1.1) rotate(90deg);
        }
        
        /* CONTEÚDO */
        .glow-popup-content {
            padding: 24px;
            color: ${CONFIG.colors.textPrimary};
            line-height: 1.5;
            background: ${CONFIG.colors.secondary};
        }
        
        .glow-popup-message {
            margin: 0 0 20px 0;
            font-size: 14px;
            text-align: center;
        }
        
        .glow-popup-message strong {
            display: block;
            color: ${CONFIG.colors.textPrimary};
            font-size: 15px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        /* PROGRESS DOTS */
        .glow-progress-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            margin: 20px 0;
        }
        
        .glow-progress-dots {
            display: flex;
            gap: 8px;
        }
        
        .glow-progress-dot {
            width: 8px;
            height: 8px;
            background: ${CONFIG.colors.primary};
            border-radius: 50%;
            opacity: 0.3;
            animation: glowDotPulse 2s infinite;
        }
        
        .glow-progress-dot:nth-child(1) { animation-delay: 0s; }
        .glow-progress-dot:nth-child(2) { animation-delay: 0.2s; }
        .glow-progress-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes glowDotPulse {
            0%, 100% { 
                opacity: 0.3;
                transform: scale(0.9);
            }
            50% { 
                opacity: 0.8;
                transform: scale(1.1);
            }
        }
        
        .glow-progress-text {
            font-size: 12px;
            color: ${CONFIG.colors.textSecondary};
            text-align: center;
        }
        
        /* RODAPÉ E BOTÕES */
        .glow-popup-footer {
            padding: 0 24px 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .glow-popup-btn {
            padding: 14px 20px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .glow-popup-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        
        .glow-popup-btn:hover::before {
            width: 300px;
            height: 300px;
        }
        
        .glow-primary-btn {
            background: linear-gradient(135deg, ${CONFIG.colors.primary} 0%, ${CONFIG.colors.primaryDark} 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
        }
        
        .glow-primary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
        }
        
        .glow-secondary-btn {
            background: white;
            color: ${CONFIG.colors.textPrimary};
            border: 1px solid #E5E7EB;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .glow-secondary-btn:hover {
            background: #F9FAFB;
            border-color: #D1D5DB;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        /* OPÇÕES */
        .glow-popup-options {
            padding: 0 24px 20px;
            text-align: center;
        }
        
        .glow-option-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: ${CONFIG.colors.textSecondary};
            font-size: 12px;
            transition: color 0.2s;
        }
        
        .glow-option-label:hover {
            color: ${CONFIG.colors.textPrimary};
        }
        
        .glow-option-checkbox {
            width: 14px;
            height: 14px;
            border-radius: 4px;
            border: 1.5px solid #D1D5DB;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            flex-shrink: 0;
        }
        
        .glow-option-checkbox:checked {
            background: ${CONFIG.colors.primary};
            border-color: ${CONFIG.colors.primary};
        }
        
        .glow-option-checkbox:checked::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 4px;
            width: 4px;
            height: 8px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
        
        /* ============================= */
        /* RESPONSIVIDADE - TELAS PEQUENAS */
        /* ============================= */
        
        /* Para telas até 480px */
        @media (max-width: 480px) {
            .glow-popup-card {
                width: 95%;
                max-width: 350px;
                margin: 0 12px;
                border-radius: 14px;
            }
            
            .glow-popup-header {
                padding: 18px 20px;
            }
            
            .glow-header-content {
                gap: 10px;
            }
            
            .glow-popup-icon {
                width: 36px;
                height: 36px;
                font-size: 18px;
            }
            
            .glow-popup-header h3 {
                font-size: 15px;
            }
            
            .glow-close-btn {
                width: 32px;
                height: 32px;
                font-size: 18px;
            }
            
            .glow-popup-content {
                padding: 20px;
            }
            
            .glow-popup-message {
                font-size: 13px;
            }
            
            .glow-popup-message strong {
                font-size: 14px;
            }
            
            .glow-popup-footer {
                padding: 0 20px 20px;
                gap: 10px;
            }
            
            .glow-popup-btn {
                padding: 12px 18px;
                font-size: 13px;
            }
            
            .glow-popup-options {
                padding: 0 20px 18px;
            }
            
            .glow-popup-card::before {
                filter: blur(8px);
            }
            
            @keyframes glowPulseEffect {
                0%, 100% {
                    opacity: 0.2;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.3;
                    transform: scale(1.01);
                }
            }
        }
        
        /* Para telas muito pequenas (até 360px) */
        @media (max-width: 360px) {
            .glow-popup-card {
                width: 98%;
                max-width: 320px;
                margin: 0 8px;
                border-radius: 12px;
            }
            
            .glow-popup-header {
                padding: 16px 18px;
            }
            
            .glow-popup-header h3 {
                font-size: 14px;
            }
            
            .glow-popup-content {
                padding: 18px;
            }
            
            .glow-popup-btn {
                padding: 11px 16px;
            }
        }
        
        /* Para telas em modo paisagem */
        @media (max-height: 500px) and (orientation: landscape) {
            .glow-popup-card {
                max-width: 380px;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .glow-popup-content {
                padding: 16px 24px;
            }
            
            .glow-popup-footer {
                padding: 0 24px 16px;
            }
        }
        
        /* ANIMAÇÃO DE SAÍDA */
        @keyframes glowFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        /* ACESSIBILIDADE */
        @media (prefers-reduced-motion: reduce) {
            .glow-popup-card,
            .glow-popup-card::before,
            .glow-popup-header::after,
            .glow-progress-dot,
            .glow-close-btn,
            .glow-popup-btn {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== CRIAÇÃO DO HTML ====================
    const popupHTML = `
        <div id="${CONFIG.popupId}" class="glow-popup-overlay">
            <div class="glow-popup-card">
                <div class="glow-popup-header">
                    <div class="glow-header-content">
                        <div class="glow-popup-icon">⚠️</div>
                        <h3>Página em Desenvolvimento</h3>
                        <button class="glow-close-btn" aria-label="Fechar">&times;</button>
                    </div>
                </div>
                
                <div class="glow-popup-content">
                    <div class="glow-popup-message">
                        <strong>Estamos trabalhando nas melhorias</strong>
                        Esta seção do site está em desenvolvimento ativo. Algumas funcionalidades podem estar temporariamente indisponíveis enquanto implementamos as atualizações.
                    </div>
                    
                    <div class="glow-progress-container">
                        <div class="glow-progress-dots">
                            <div class="glow-progress-dot"></div>
                            <div class="glow-progress-dot"></div>
                            <div class="glow-progress-dot"></div>
                        </div>
                        <div class="glow-progress-text">Em progresso • Agradecemos sua paciência</div>
                    </div>
                </div>
                
                <div class="glow-popup-footer">
                    <button class="glow-popup-btn glow-primary-btn" id="glowUnderstandBtn">
                        Entendi, obrigado!
                    </button>
                    <button class="glow-popup-btn glow-secondary-btn" id="glowFeedbackBtn">
                        Receber atualizações
                    </button>
                </div>
                
                <div class="glow-popup-options">
                    <label class="glow-option-label">
                        <input type="checkbox" class="glow-option-checkbox" id="glowDontShowAgain">
                        Não mostrar novamente por 7 dias
                    </label>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // ==================== LÓGICA DO POPUP ====================
    const popup = document.getElementById(CONFIG.popupId);
    let popupShown = false;
    
    // Função para verificar se deve mostrar
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    // Mostra o popup
    function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        popup.style.display = 'flex';
        
        // Foco no botão principal
        setTimeout(() => {
            const understandBtn = document.getElementById('glowUnderstandBtn');
            if (understandBtn) understandBtn.focus();
        }, 400);
        
        // Adiciona eventos
        setupEventListeners();
        
        // Log para debug (opcional)
        if (console && typeof console.log === 'function') {
            console.log('Popup glow mostrado - Largura:', window.innerWidth + 'px');
        }
    }
    
    
    
    // Fecha o popup
    function closePopup() {
        popup.style.animation = 'glowFadeOut 0.3s ease-out forwards';
        
        // Salva preferência
        const dontShowAgain = document.getElementById('glowDontShowAgain');
        if (dontShowAgain && dontShowAgain.checked) {
            const hideUntil = Date.now() + (CONFIG.hideDays * 24 * 60 * 60 * 1000);
            localStorage.setItem(CONFIG.storageKey, hideUntil.toString());
        }
        
        // Remove eventos
        document.removeEventListener('keydown', handleKeyboard);
        popup.removeEventListener('click', closeOnOutsideClick);
        
        // Esconde após animação
        setTimeout(() => {
            popup.style.display = 'none';
            popup.style.animation = '';
        }, 300);
    }
    
    // Handler para teclado
    function handleKeyboard(event) {
        // ESC fecha o popup
        if (event.key === 'Escape') {
            closePopup();
        }
        
        // Navegação por Tab dentro do popup
        else if (event.key === 'Tab') {
            const focusableElements = popup.querySelectorAll(
                'button, input, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }
    
    // Fecha ao clicar fora
    function closeOnOutsideClick(event) {
        if (event.target === popup) {
            closePopup();
        }
    }
    
    // Feedback interativo
    function showFeedback() {
        const feedbackBtn = document.getElementById('glowFeedbackBtn');
        if (!feedbackBtn) return;
        
        const originalText = feedbackBtn.textContent;
        feedbackBtn.textContent = 'Inscrito ✓';
        feedbackBtn.disabled = true;
        
        // Muda a aparência do botão
        feedbackBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        feedbackBtn.style.color = 'white';
        feedbackBtn.style.border = 'none';
        
        setTimeout(() => {
            closePopup();
        }, 1500);
    }
    
    // Configura todos os event listeners
    function setupEventListeners() {
        const closeBtn = popup.querySelector('.glow-close-btn');
        const understandBtn = document.getElementById('glowUnderstandBtn');
        const feedbackBtn = document.getElementById('glowFeedbackBtn');
        
        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        if (understandBtn) understandBtn.addEventListener('click', closePopup);
        if (feedbackBtn) feedbackBtn.addEventListener('click', showFeedback);
        
        document.addEventListener('keydown', handleKeyboard);
        popup.addEventListener('click', closeOnOutsideClick);
    }
    
    // Estratégia de exibição inteligente
    function initPopup() {
        // Função para mostrar na interação
        const showOnInteraction = () => {
            if (!popupShown) showPopup();
        };
        
        // Eventos de interação (mostra imediatamente)
        const interactionEvents = ['scroll', 'mousemove', 'click', 'touchstart'];
        interactionEvents.forEach(event => {
            window.addEventListener(event, showOnInteraction, { 
                once: true,
                passive: true 
            });
        });
        
        // Fallback após delay
        setTimeout(() => {
            if (!popupShown) showPopup();
        }, CONFIG.showDelay);
        
        // Monitora redimensionamento da tela
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                // Recalcula layout se necessário
                if (popupShown && popup.style.display === 'flex') {
                    // Força um reflow para ajustar responsividade
                    popup.style.display = 'none';
                    setTimeout(() => {
                        popup.style.display = 'flex';
                    }, 10);
                }
            }, 250);
        }, { passive: true });
    }
    
    // ==================== INICIALIZAÇÃO ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPopup);
    } else {
        initPopup();
    }
    
    // ==================== API PÚBLICA ====================
    window.glowPopup = {
        show: function() {
            showPopup();
        },
        hide: function() {
            closePopup();
        },
        reset: function() {
            localStorage.removeItem(CONFIG.storageKey);
            popupShown = false;
            showPopup();
        },
        updateConfig: function(newConfig) {
            Object.assign(CONFIG, newConfig);
        },
        isVisible: function() {
            return popupShown && popup.style.display === 'flex';
        }
    };
    
})();