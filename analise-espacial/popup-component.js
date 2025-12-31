// popup-glow-intenso.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO INTENSA ====================
    const CONFIG = {
        popupId: 'glow-intenso-popup',
        storageKey: 'glowIntensoPopupHidden',
        hideDays: 7,
        showDelay: 2000,
        
        // CORES VIBRANTES E INTENSAS
        colors: {
            primary: '#FF6B6B',      // Vermelho vibrante
            primaryDark: '#FF4757',  // Vermelho mais intenso
            secondary: '#FFD93D',    // Amarelo dourado
            accent: '#6BC5FF',       // Azul neon
            glowLight: '#FF9E6D',    // Laranja para glow
            glowDark: '#FF2E63',     // Rosa neon
            textPrimary: '#FFFFFF',
            textSecondary: '#F0F0F0'
        },
        
        // ANIMAÇÕES MAIS RÁPIDAS E MARCANTES
        animations: {
            glowPulse: '2s ease-in-out infinite',
            cardSlideIn: '0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fadeIn: '0.4s ease-out',
            shake: '0.5s ease-in-out'
        },
        
        // GLOW MAIS INTENSO
        glow: {
            blur: '25px',
            intensity: '0.8',
            spread: '15px'
        }
    };
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CSS COM EFEITOS INTENSOS ====================
    const style = document.createElement('style');
    style.textContent = `
        /* OVERLAY COM GRADIENTE DINÂMICO */
        .glow-intenso-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                135deg,
                rgba(0, 0, 0, 0.9) 0%,
                rgba(30, 30, 60, 0.9) 100%
            );
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(10px);
            animation: overlayGradientShift 10s ease infinite;
        }
        
        @keyframes overlayGradientShift {
            0%, 100% {
                background: linear-gradient(
                    135deg,
                    rgba(0, 0, 0, 0.9) 0%,
                    rgba(30, 30, 60, 0.9) 100%
                );
            }
            50% {
                background: linear-gradient(
                    135deg,
                    rgba(20, 10, 40, 0.9) 0%,
                    rgba(50, 20, 60, 0.9) 100%
                );
            }
        }
        
        /* CARD COM GLOW MUITO INTENSO */
        .glow-intenso-card {
            background: linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.95),
                rgba(255, 255, 255, 0.85)
            );
            border-radius: 20px;
            width: 92%;
            max-width: 440px;
            overflow: hidden;
            position: relative;
            z-index: 1;
            animation: intenseCardEntrance ${CONFIG.animations.cardSlideIn};
            border: 1px solid rgba(255, 255, 255, 0.3);
            
            /* Sombra estática já intensa */
            box-shadow: 
                0 0 30px ${CONFIG.colors.primary},
                0 0 60px rgba(255, 107, 107, 0.3),
                0 20px 60px rgba(0, 0, 0, 0.4);
            
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        /* EFEITO GLOW EXTERNO MUITO FORTE */
        .glow-intenso-card::before {
            content: '';
            position: absolute;
            top: -${CONFIG.glow.spread};
            left: -${CONFIG.glow.spread};
            right: -${CONFIG.glow.spread};
            bottom: -${CONFIG.glow.spread};
            background: linear-gradient(
                45deg,
                ${CONFIG.colors.primary},
                ${CONFIG.colors.secondary},
                ${CONFIG.colors.accent},
                ${CONFIG.colors.glowLight},
                ${CONFIG.colors.primary}
            );
            background-size: 400% 400%;
            border-radius: 25px;
            z-index: -1;
            opacity: ${CONFIG.glow.intensity};
            filter: blur(${CONFIG.glow.blur});
            animation: intenseGlowPulse ${CONFIG.animations.glowPulse},
                       gradientShift 6s ease infinite;
        }
        
        /* ANIMAÇÃO DE ENTRADA DRAMÁTICA */
        @keyframes intenseCardEntrance {
            0% {
                opacity: 0;
                transform: translateY(40px) scale(0.8) rotateX(-10deg);
            }
            70% {
                transform: translateY(-10px) scale(1.05) rotateX(2deg);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1) rotateX(0);
            }
        }
        
        /* PULSAÇÃO INTENSA DO GLOW */
        @keyframes intenseGlowPulse {
            0%, 100% {
                opacity: 0.6;
                transform: scale(1);
            }
            25% {
                opacity: 0.8;
                transform: scale(1.02);
            }
            50% {
                opacity: 1;
                transform: scale(1.05);
            }
            75% {
                opacity: 0.8;
                transform: scale(1.02);
            }
        }
        
        /* ANIMAÇÃO DO GRADIENTE */
        @keyframes gradientShift {
            0%, 100% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
        }
        
        /* EFEITO HOVER MUITO DRAMÁTICO */
        .glow-intenso-card:hover {
            transform: 
                translateY(-8px) 
                scale(1.02) 
                rotateX(5deg);
            box-shadow: 
                0 0 50px ${CONFIG.colors.secondary},
                0 0 80px rgba(255, 217, 61, 0.4),
                0 30px 80px rgba(0, 0, 0, 0.5);
        }
        
        .glow-intenso-card:hover::before {
            opacity: 1;
            filter: blur(35px);
            animation-duration: 1.5s, 4s;
        }
        
        /* CABEÇALHO COM NEON INTENSO */
        .glow-intenso-header {
            background: linear-gradient(
                135deg, 
                ${CONFIG.colors.primary} 0%, 
                ${CONFIG.colors.glowDark} 100%
            );
            color: ${CONFIG.colors.textPrimary};
            padding: 24px;
            position: relative;
            overflow: hidden;
            border-bottom: 2px solid rgba(255, 255, 255, 0.3);
            
            /* EFEITO NEON NO CABEÇALHO */
            box-shadow: 
                inset 0 0 20px rgba(255, 255, 255, 0.3),
                0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        /* EFEITO DE PARTÍCULAS NO CABEÇALHO */
        .glow-intenso-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
                radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
                radial-gradient(circle at 40% 50%, rgba(255, 255, 255, 0.4) 3px, transparent 3px);
            background-size: 100px 100px, 150px 150px, 200px 200px;
            animation: particlesFloat 20s linear infinite;
            opacity: 0.5;
        }
        
        @keyframes particlesFloat {
            0% {
                background-position: 0 0, 0 0, 0 0;
            }
            100% {
                background-position: 100px 100px, 150px 150px, 200px 200px;
            }
        }
        
        .intenso-header-content {
            display: flex;
            align-items: center;
            gap: 16px;
            position: relative;
            z-index: 2;
        }
        
        /* ÍCONE PISCANTE */
        .glow-intenso-icon {
            font-size: 24px;
            background: rgba(255, 255, 255, 0.25);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.4);
            animation: iconPulse 2s infinite, iconFloat 3s ease-in-out infinite;
            box-shadow: 
                0 0 15px ${CONFIG.colors.accent},
                inset 0 0 10px rgba(255, 255, 255, 0.5);
        }
        
        @keyframes iconPulse {
            0%, 100% {
                box-shadow: 
                    0 0 15px ${CONFIG.colors.accent},
                    inset 0 0 10px rgba(255, 255, 255, 0.5);
                transform: scale(1);
            }
            50% {
                box-shadow: 
                    0 0 30px ${CONFIG.colors.accent},
                    0 0 40px ${CONFIG.colors.primary},
                    inset 0 0 15px rgba(255, 255, 255, 0.8);
                transform: scale(1.1);
            }
        }
        
        @keyframes iconFloat {
            0%, 100% {
                transform: translateY(0) rotate(0deg);
            }
            33% {
                transform: translateY(-5px) rotate(5deg);
            }
            66% {
                transform: translateY(5px) rotate(-5deg);
            }
        }
        
        .glow-intenso-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            line-height: 1.3;
            flex: 1;
            text-shadow: 
                0 2px 4px rgba(0, 0, 0, 0.5),
                0 0 10px rgba(255, 255, 255, 0.5);
            letter-spacing: 0.5px;
        }
        
        /* BOTÃO FECHAR COM EFEITO ESPECIAL */
        .glow-intenso-close {
            background: rgba(255, 255, 255, 0.25);
            border: none;
            color: ${CONFIG.colors.textPrimary};
            font-size: 24px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            flex-shrink: 0;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.4);
            position: relative;
            z-index: 2;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        
        .glow-intenso-close:hover {
            background: rgba(255, 255, 255, 0.4);
            transform: 
                scale(1.2) 
                rotate(180deg);
            box-shadow: 
                0 0 20px ${CONFIG.colors.primary},
                0 0 30px rgba(255, 107, 107, 0.5);
        }
        
        /* CONTEÚDO COM BACKGROUND GRADIENTE */
        .glow-intenso-content {
            padding: 30px;
            color: #2D3436;
            line-height: 1.6;
            background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.95) 0%,
                rgba(248, 249, 250, 0.9) 100%
            );
            position: relative;
            overflow: hidden;
        }
        
        .glow-intenso-content::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                45deg,
                transparent 30%,
                rgba(255, 107, 107, 0.05) 50%,
                transparent 70%
            );
            animation: contentShimmer 8s linear infinite;
        }
        
        @keyframes contentShimmer {
            0% { transform: rotate(0deg) translateX(-25%); }
            100% { transform: rotate(360deg) translateX(-25%); }
        }
        
        .intenso-message {
            margin: 0 0 30px 0;
            font-size: 16px;
            text-align: center;
            position: relative;
            z-index: 1;
        }
        
        .intenso-message strong {
            display: block;
            color: ${CONFIG.colors.primary};
            font-size: 22px;
            margin-bottom: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* ANIMAÇÃO DE LOADING ESPECTACULAR */
        .intenso-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            margin: 30px 0;
            position: relative;
            z-index: 1;
        }
        
        .loading-spinner {
            width: 80px;
            height: 80px;
            position: relative;
        }
        
        .spinner-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 4px solid transparent;
            animation: spinnerRotate 2s linear infinite;
        }
        
        .spinner-ring:nth-child(1) {
            border-top: 4px solid ${CONFIG.colors.primary};
            animation-delay: 0s;
        }
        
        .spinner-ring:nth-child(2) {
            border-right: 4px solid ${CONFIG.colors.secondary};
            animation-delay: 0.2s;
        }
        
        .spinner-ring:nth-child(3) {
            border-bottom: 4px solid ${CONFIG.colors.accent};
            animation-delay: 0.4s;
        }
        
        .spinner-ring:nth-child(4) {
            border-left: 4px solid ${CONFIG.colors.glowDark};
            animation-delay: 0.6s;
        }
        
        @keyframes spinnerRotate {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }
        
        .loading-text {
            font-size: 14px;
            color: #636E72;
            text-align: center;
            font-weight: 600;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
            animation: textGlow 3s ease-in-out infinite;
        }
        
        @keyframes textGlow {
            0%, 100% {
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
            }
            50% {
                text-shadow: 
                    0 0 10px ${CONFIG.colors.accent},
                    0 0 20px rgba(107, 197, 255, 0.3);
            }
        }
        
        /* BOTÕES COM EFEITOS ESPECIAIS */
        .glow-intenso-footer {
            padding: 0 30px 30px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            position: relative;
            z-index: 1;
        }
        
        .intenso-btn {
            padding: 18px 24px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: inherit;
            text-align: center;
            position: relative;
            overflow: hidden;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        
        .intenso-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.4),
                transparent
            );
            transition: left 0.7s ease;
        }
        
        .intenso-btn:hover::before {
            left: 100%;
        }
        
        .intenso-primary-btn {
            background: linear-gradient(
                135deg,
                ${CONFIG.colors.primary} 0%,
                ${CONFIG.colors.glowDark} 100%
            );
            color: ${CONFIG.colors.textPrimary};
            box-shadow: 
                0 6px 20px rgba(255, 107, 107, 0.4),
                0 0 15px rgba(255, 107, 107, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .intenso-primary-btn:hover {
            transform: 
                translateY(-5px) 
                scale(1.05);
            box-shadow: 
                0 12px 30px rgba(255, 107, 107, 0.6),
                0 0 25px rgba(255, 107, 107, 0.5),
                inset 0 0 15px rgba(255, 255, 255, 0.2);
            background: linear-gradient(
                135deg,
                ${CONFIG.colors.glowDark} 0%,
                ${CONFIG.colors.primary} 100%
            );
        }
        
        .intenso-secondary-btn {
            background: linear-gradient(
                135deg,
                ${CONFIG.colors.accent} 0%,
                #4D96FF 100%
            );
            color: ${CONFIG.colors.textPrimary};
            box-shadow: 
                0 6px 20px rgba(107, 197, 255, 0.4),
                0 0 15px rgba(107, 197, 255, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .intenso-secondary-btn:hover {
            transform: 
                translateY(-5px) 
                scale(1.05);
            box-shadow: 
                0 12px 30px rgba(107, 197, 255, 0.6),
                0 0 25px rgba(107, 197, 255, 0.5),
                inset 0 0 15px rgba(255, 255, 255, 0.2);
            background: linear-gradient(
                135deg,
                #4D96FF 0%,
                ${CONFIG.colors.accent} 100%
            );
        }
        
        /* CHECKBOX COM ANIMAÇÃO */
        .glow-intenso-options {
            padding: 0 30px 25px;
            text-align: center;
        }
        
        .intenso-option-label {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            color: #636E72;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            padding: 8px 16px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.8);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .intenso-option-label:hover {
            background: rgba(255, 255, 255, 0.95);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
        
        .intenso-option-checkbox {
            width: 20px;
            height: 20px;
            border-radius: 6px;
            border: 2px solid ${CONFIG.colors.primary};
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            flex-shrink: 0;
            background: white;
        }
        
        .intenso-option-checkbox:checked {
            background: ${CONFIG.colors.primary};
            border-color: ${CONFIG.colors.primary};
            box-shadow: 0 0 10px ${CONFIG.colors.primary};
        }
        
        .intenso-option-checkbox:checked::after {
            content: '✓';
            position: absolute;
            color: white;
            font-size: 14px;
            font-weight: bold;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: checkPop 0.3s ease-out;
        }
        
        @keyframes checkPop {
            0% { transform: translate(-50%, -50%) scale(0); }
            70% { transform: translate(-50%, -50%) scale(1.2); }
            100% { transform: translate(-50%, -50%) scale(1); }
        }
        
        /* ============================= */
        /* RESPONSIVIDADE INTENSA */
        /* ============================= */
        
        @media (max-width: 480px) {
            .glow-intenso-card {
                width: 96%;
                max-width: 360px;
                margin: 0 8px;
                border-radius: 16px;
            }
            
            .glow-intenso-header {
                padding: 20px;
            }
            
            .intenso-header-content {
                gap: 12px;
            }
            
            .glow-intenso-icon {
                width: 44px;
                height: 44px;
                font-size: 20px;
            }
            
            .glow-intenso-header h3 {
                font-size: 18px;
            }
            
            .glow-intenso-close {
                width: 40px;
                height: 40px;
                font-size: 20px;
            }
            
            .glow-intenso-content {
                padding: 24px;
            }
            
            .intenso-message {
                font-size: 14px;
            }
            
            .intenso-message strong {
                font-size: 18px;
            }
            
            .loading-spinner {
                width: 60px;
                height: 60px;
            }
            
            .glow-intenso-footer {
                padding: 0 24px 24px;
                gap: 12px;
            }
            
            .intenso-btn {
                padding: 16px 20px;
                font-size: 14px;
            }
            
            .glow-intenso-options {
                padding: 0 24px 20px;
            }
            
            /* Ajusta glow para mobile */
            .glow-intenso-card::before {
                filter: blur(15px);
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
            }
        }
        
        @media (max-width: 360px) {
            .glow-intenso-card {
                width: 98%;
                max-width: 320px;
                margin: 0 4px;
            }
            
            .glow-intenso-header h3 {
                font-size: 16px;
            }
            
            .glow-intenso-content {
                padding: 20px;
            }
            
            .intenso-btn {
                padding: 14px 18px;
            }
        }
        
        /* ANIMAÇÃO DE SAÍDA DRAMÁTICA */
        @keyframes intenseFadeOut {
            0% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            50% {
                opacity: 0.7;
                transform: translateY(-20px) scale(1.05);
            }
            100% {
                opacity: 0;
                transform: translateY(40px) scale(0.9);
            }
        }
        
        /* PERFORMANCE E ACESSIBILIDADE */
        @media (prefers-reduced-motion: reduce) {
            .glow-intenso-card,
            .glow-intenso-card::before,
            .glow-intenso-header::before,
            .glow-intenso-icon,
            .spinner-ring,
            .intenso-btn,
            .glow-intenso-close,
            .intenso-option-checkbox {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== CRIAÇÃO DO HTML INTENSO ====================
    const popupHTML = `
        <div id="${CONFIG.popupId}" class="glow-intenso-overlay">
            <div class="glow-intenso-card">
                <div class="glow-intenso-header">
                    <div class="intenso-header-content">
                        <div class="glow-intenso-icon">⚡</div>
                        <h3>🚀 DESENVOLVIMENTO EM ANDAMENTO 🚀</h3>
                        <button class="glow-intenso-close" aria-label="Fechar">&times;</button>
                    </div>
                </div>
                
                <div class="glow-intenso-content">
                    <div class="intenso-message">
                        <strong>ESTAMOS CONSTRUINDO ALGO INCRÍVEL!</strong>
                        Esta página está em desenvolvimento acelerado. Novas funcionalidades estão sendo implementadas neste momento!
                    </div>
                    
                    <div class="intenso-loading">
                        <div class="loading-spinner">
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                        </div>
                        <div class="loading-text">CARREGANDO NOVIDADES...</div>
                    </div>
                </div>
                
                <div class="glow-intenso-footer">
                    <button class="intenso-btn intenso-primary-btn" id="intensoUnderstandBtn">
                        👌 ENTENDI, CONTINUEM O BOM TRABALHO!
                    </button>
                    <button class="intenso-btn intenso-secondary-btn" id="intensoFeedbackBtn">
                        💡 DAR SUGESTÕES
                    </button>
                </div>
                
                <div class="glow-intenso-options">
                    <label class="intenso-option-label">
                        <input type="checkbox" class="intenso-option-checkbox" id="intensoDontShowAgain">
                        Não mostrar novamente por 7 dias
                    </label>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // ==================== LÓGICA DO POPUP INTENSO ====================
    const popup = document.getElementById(CONFIG.popupId);
    let popupShown = false;
    
    // Função para verificar se deve mostrar
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    // Mostra o popup com efeitos intensos
    function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        // Efeito sonoro opcional (descomente se quiser)
        // playSoundEffect();
        
        popup.style.display = 'flex';
        
        // Efeito de entrada dramática
        setTimeout(() => {
            const understandBtn = document.getElementById('intensoUnderstandBtn');
            if (understandBtn) {
                understandBtn.focus();
                // Adiciona efeito de brilho no foco
                understandBtn.style.animation = 'textGlow 2s ease-in-out infinite';
            }
        }, 500);
        
        // Configura eventos
        setupEventListeners();
        
        // Efeitos adicionais
        addExtraEffects();
    }
    
    // Fecha o popup com efeito dramático
    function closePopup() {
        // Animação de saída
        popup.style.animation = 'intenseFadeOut 0.6s ease-out forwards';
        
        // Salva preferência
        const dontShowAgain = document.getElementById('intensoDontShowAgain');
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
        }, 600);
    }
    
    // Handler para teclado com efeitos
    function handleKeyboard(event) {
        // ESC fecha o popup
        if (event.key === 'Escape') {
            // Efeito visual antes de fechar
            const card = popup.querySelector('.glow-intenso-card');
            if (card) {
                card.style.animation = 'shake 0.3s ease-in-out';
                setTimeout(() => {
                    card.style.animation = '';
                    closePopup();
                }, 300);
            } else {
                closePopup();
            }
        }
        
        // Navegação por Tab
        else if (event.key === 'Tab') {
            const focusableElements = popup.querySelectorAll(
                'button, input, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            // Efeito visual no elemento focado
            const currentElement = document.activeElement;
            if (currentElement) {
                currentElement.style.transform = 'scale(1)';
            }
            
            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                    lastElement.style.transform = 'scale(1.05)';
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                    firstElement.style.transform = 'scale(1.05)';
                }
            }
        }
    }
    
    // Fecha ao clicar fora
    function closeOnOutsideClick(event) {
        if (event.target === popup) {
            // Efeito de ondulação
            createRippleEffect(event);
            setTimeout(closePopup, 300);
        }
    }
    
    // Cria efeito de ondulação
    function createRippleEffect(event) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.pointerEvents = 'none';
        
        const rect = popup.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        // Adiciona CSS para animação
        if (!document.getElementById('ripple-style')) {
            const rippleStyle = document.createElement('style');
            rippleStyle.id = 'ripple-style';
            rippleStyle.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(rippleStyle);
        }
        
        popup.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
    
    // Feedback interativo com efeitos
    function showFeedback() {
        const feedbackBtn = document.getElementById('intensoFeedbackBtn');
        if (!feedbackBtn) return;
        
        const originalText = feedbackBtn.textContent;
        feedbackBtn.textContent = '💌 OBRIGADO PELA SUGESTÃO!';
        feedbackBtn.disabled = true;
        
        // Efeito de confete
        createConfettiEffect();
        
        // Muda aparência do botão
        feedbackBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        feedbackBtn.style.boxShadow = '0 0 30px #10B981, 0 0 50px rgba(16, 185, 129, 0.5)';
        
        setTimeout(() => {
            closePopup();
        }, 2000);
    }
    
    // Efeito de confete
    function createConfettiEffect() {
        const confettiCount = 50;
        const colors = [CONFIG.colors.primary, CONFIG.colors.secondary, CONFIG.colors.accent, CONFIG.colors.glowDark];
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = '-20px';
                confetti.style.zIndex = '10000';
                confetti.style.pointerEvents = 'none';
                confetti.style.animation = `confettiFall ${Math.random() * 1 + 1}s linear forwards`;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 2000);
            }, i * 20);
        }
        
        // Adiciona animação CSS se não existir
        if (!document.getElementById('confetti-style')) {
            const confettiStyle = document.createElement('style');
            confettiStyle.id = 'confetti-style';
            confettiStyle.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(confettiStyle);
        }
    }
    
    // Efeitos extras
    function addExtraEffects() {
        // Pisca o título
        const title = popup.querySelector('h3');
        if (title) {
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                title.style.opacity = title.style.opacity === '0.7' ? '1' : '0.7';
                blinkCount++;
                if (blinkCount > 6) {
                    clearInterval(blinkInterval);
                    title.style.opacity = '1';
                }
            }, 300);
        }
    }
    
    // Configura event listeners
    function setupEventListeners() {
        const closeBtn = popup.querySelector('.glow-intenso-close');
        const understandBtn = document.getElementById('intensoUnderstandBtn');
        const feedbackBtn = document.getElementById('intensoFeedbackBtn');
        
        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        if (understandBtn) understandBtn.addEventListener('click', closePopup);
        if (feedbackBtn) feedbackBtn.addEventListener('click', showFeedback);
        
        document.addEventListener('keydown', handleKeyboard);
        popup.addEventListener('click', closeOnOutsideClick);
        
        // Efeito hover nos botões
        const buttons = popup.querySelectorAll('.intenso-btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-3px) scale(1.03)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }
    
    // Estratégia de exibição
    function initPopup() {
        // Mostra imediatamente - os efeitos são a atração principal
        setTimeout(showPopup, CONFIG.showDelay);
        
        // Monitora interação para mostrar mais cedo
        const interactionEvents = ['click', 'scroll', 'mousemove', 'keydown'];
        const earlyShow = () => {
            if (!popupShown) {
                showPopup();
                interactionEvents.forEach(event => {
                    window.removeEventListener(event, earlyShow);
                });
            }
        };
        
        interactionEvents.forEach(event => {
            window.addEventListener(event, earlyShow, { once: true });
        });
    }
    
    // ==================== INICIALIZAÇÃO ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPopup);
    } else {
        initPopup();
    }
    
    // ==================== API PÚBLICA INTENSA ====================
    window.intensePopup = {
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
        explode: function() {
            // Efeito especial explosivo
            createConfettiEffect();
            const card = popup.querySelector('.glow-intenso-card');
            if (card) {
                card.style.animation = 'intenseFadeOut 0.5s ease-out forwards';
                setTimeout(() => {
                    popup.style.display = 'none';
                    card.style.animation = '';
                }, 500);
            }
        },
        isVisible: function() {
            return popupShown && popup.style.display === 'flex';
        },
        getConfig: function() {
            return { ...CONFIG };
        }
    };
    
})();