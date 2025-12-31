// popup-desenvolvimento.js
(function() {
    // Verifica se já existe um popup ou se o usuário optou por não ver novamente
    if (document.getElementById('devPopup') || !shouldShowPopup()) {
        return;
    }

    // =============================================
    // 1. ADICIONA CSS DINAMICAMENTE
    // =============================================
    const style = document.createElement('style');
    style.textContent = `
        .popup-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .popup-card {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            border: 1px solid #ddd;
        }

        .popup-header {
            background: linear-gradient(to right, #E52521, #ff6b6b);
            color: white;
            padding: 25px;
            text-align: center;
            position: relative;
        }

        .popup-header h2 {
            margin: 0;
            font-size: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }

        .popup-icon {
            font-size: 32px;
        }

        .close-btn {
            position: absolute;
            top: 20px; right: 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 28px;
            width: 40px; height: 40px;
            border-radius: 50%;
            cursor: pointer;
            line-height: 1;
            transition: background 0.3s;
        }

        .close-btn:hover {
            background: rgba(255,255,255,0.3);
        }

        .animation-container {
            background: linear-gradient(to bottom, #87CEEB 50%, #f4f4f4 50%);
            height: 200px;
            position: relative;
            overflow: hidden;
            margin: 0;
        }

        .scrolling-background {
            position: absolute;
            width: 200%;
            height: 100%;
            top: 0; left: 0;
            animation: scrollBackground 6s linear infinite;
        }

        .cloud-layer {
            position: absolute;
            width: 100%;
            height: 40%;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40"><path d="M40,20 Q50,5 60,20 T80,20" fill="white" opacity="0.7"/><path d="M100,15 Q110,0 120,15 T140,15" fill="white" opacity="0.7"/><path d="M160,25 Q170,10 180,25 T200,25" fill="white" opacity="0.7"/></svg>');
            background-repeat: repeat-x;
            animation: scrollClouds 30s linear infinite;
        }

        .ground-layer {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 30px;
            background: #8B4513;
            border-top: 3px solid #654321;
        }

        .mario-character {
            position: absolute;
            bottom: 30px;
            left: 80px;
            width: 60px; height: 90px;
            z-index: 10;
            animation: marioJump 1.2s ease-in-out infinite;
        }

        .mario-head {
            position: absolute;
            width: 50px; height: 40px;
            background: #E52521;
            border-radius: 50% 50% 40% 40%;
            top: 0; left: 5px;
            border: 2px solid #000;
        }

        .mario-face {
            position: absolute;
            width: 40px; height: 25px;
            background: #FFCCAA;
            border-radius: 40%;
            top: 10px; left: 5px;
            border: 1px solid #000;
        }

        .mario-hat {
            position: absolute;
            width: 60px; height: 15px;
            background: #E52521;
            border-radius: 50% 50% 0 0;
            top: -8px; left: 0;
            border: 2px solid #000;
        }

        .mario-body {
            position: absolute;
            width: 50px; height: 40px;
            background: #2150E5;
            top: 40px; left: 5px;
            border-radius: 10px;
            border: 2px solid #000;
        }

        .popup-content {
            padding: 25px;
            line-height: 1.6;
            color: #333;
            text-align: center;
        }

        .popup-content p {
            margin: 15px 0;
        }

        .popup-footer {
            padding: 20px 25px 25px;
            display: flex;
            gap: 15px;
        }

        .popup-footer button {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }

        .primary-btn {
            background: linear-gradient(to right, #3498db, #2980b9);
            color: white;
        }

        .primary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }

        .secondary-btn {
            background: #ecf0f1;
            color: #2c3e50;
            border: 2px solid #bdc3c7;
        }

        .secondary-btn:hover {
            background: #d5dbdb;
        }

        .popup-options {
            text-align: center;
            padding: 0 25px 20px;
            color: #7f8c8d;
            font-size: 14px;
        }

        .popup-options label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
        }

        @keyframes marioJump {
            0%, 100% { 
                bottom: 30px; 
                transform: scale(1, 1);
            }
            50% { 
                bottom: 120px; 
                transform: scale(1.05, 0.95);
            }
        }

        @keyframes scrollBackground {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }

        @keyframes scrollClouds {
            0% { background-position: 0 0; }
            100% { background-position: 200px 0; }
        }

        @media (max-width: 600px) {
            .popup-card {
                width: 95%;
            }
            .popup-footer {
                flex-direction: column;
            }
            .mario-character {
                transform: scale(0.8);
                left: 50px;
            }
        }
    `;
    document.head.appendChild(style);

    // =============================================
    // 2. CRIA O HTML DO POPUP DINAMICAMENTE
    // =============================================
    const popupHTML = `
        <div id="devPopup" class="popup-overlay">
            <div class="popup-card">
                <div class="popup-header">
                    <h2><span class="popup-icon">🚧</span> Página em Desenvolvimento</h2>
                    <button class="close-btn" aria-label="Fechar">&times;</button>
                </div>

                <div class="animation-container">
                    <div class="scrolling-background">
                        <div class="cloud-layer"></div>
                        <div class="ground-layer"></div>
                    </div>
                    
                    <div class="mario-character">
                        <div class="mario-hat"></div>
                        <div class="mario-head">
                            <div class="mario-face"></div>
                        </div>
                        <div class="mario-body"></div>
                    </div>
                </div>

                <div class="popup-content">
                    <p><strong>Estamos trabalhando para melhorar sua experiência!</strong></p>
                    <p>Algumas funcionalidades desta página ainda estão sendo finalizadas. Agradecemos sua paciência e compreensão.</p>
                </div>

                <div class="popup-footer">
                    <button class="primary-btn" id="understandBtn">Entendi, obrigado!</button>
                    <button class="secondary-btn" id="feedbackBtn">Enviar Feedback</button>
                </div>

                <div class="popup-options">
                    <label>
                        <input type="checkbox" id="dontShowAgain">
                        Não mostrar este aviso novamente por 7 dias
                    </label>
                </div>
            </div>
        </div>
    `;

    // Insere o popup no final do body
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // =============================================
    // 3. ADICIONA A LÓGICA DO POPUP
    // =============================================
    const popup = document.getElementById('devPopup');
    const closeBtn = popup.querySelector('.close-btn');
    const understandBtn = document.getElementById('understandBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const dontShowAgain = document.getElementById('dontShowAgain');

    // Função para verificar se deve mostrar o popup
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem('devPopupHideUntil');
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil);
    }

    // Mostra o popup
    function showPopup() {
        setTimeout(() => {
            popup.style.display = 'flex';
            // Adiciona eventos de fechamento
            document.addEventListener('keydown', closeOnEscape);
            popup.addEventListener('click', closeOnOutsideClick);
        }, 1000); // Delay de 1 segundo
    }

    // Fecha o popup
    function closePopup() {
        popup.style.display = 'none';
        document.removeEventListener('keydown', closeOnEscape);
        popup.removeEventListener('click', closeOnOutsideClick);
        
        // Salva preferência se marcado
        if (dontShowAgain.checked) {
            const hideUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
            localStorage.setItem('devPopupHideUntil', hideUntil.toString());
        }
    }

    // Fecha com tecla ESC
    function closeOnEscape(event) {
        if (event.key === 'Escape') closePopup();
    }

    // Fecha ao clicar fora
    function closeOnOutsideClick(event) {
        if (event.target === popup) closePopup();
    }

    // Adiciona event listeners
    closeBtn.addEventListener('click', closePopup);
    understandBtn.addEventListener('click', closePopup);
    feedbackBtn.addEventListener('click', function() {
        // Aqui você pode redirecionar para um formulário ou abrir modal
        alert('Obrigado pelo interesse em nos ajudar a melhorar!');
        closePopup();
    });

    // Inicia o popup
    showPopup();

    // =============================================
    // 4. EXPORTA FUNÇÕES PARA USO EXTERNO (OPCIONAL)
    // =============================================
    window.devPopup = {
        show: showPopup,
        hide: closePopup,
        reset: function() {
            localStorage.removeItem('devPopupHideUntil');
            showPopup();
        }
    };

})();