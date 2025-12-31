// popup-component.js - Copie este código TODO
(function() {
  // CSS embutido
  const style = document.createElement('style');
  style.textContent = `
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(3px);
      animation: fadeIn 0.3s ease-out;
    }
    
    .popup-card {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      animation: slideUp 0.4s ease-out;
      border: 1px solid #e1e5e9;
    }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    
    .popup-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
    }
    
    .popup-icon {
      font-size: 28px;
      background: rgba(255, 255, 255, 0.2);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .popup-header h3 {
      margin: 0;
      font-size: 22px;
      flex-grow: 1;
    }
    
    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }
    
    .popup-content {
      padding: 28px;
      color: #333;
      line-height: 1.6;
    }
    
    .popup-content p {
      margin: 10px 0;
    }
    
    .popup-footer {
      padding: 0 28px 28px;
      display: flex;
      gap: 12px;
    }
    
    .primary-btn, .secondary-btn {
      padding: 14px 28px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
    }
    
    .primary-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    
    .secondary-btn {
      background: #f1f5f9;
      color: #64748b;
      border: 2px solid #e2e8f0;
    }
    
    .secondary-btn:hover {
      background: #e2e8f0;
    }
    
    .popup-options {
      padding: 0 28px 24px;
      text-align: center;
    }
    
    .popup-options label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #64748b;
      font-size: 14px;
      cursor: pointer;
    }
    
    @media (max-width: 480px) {
      .popup-card { width: 95%; }
      .popup-footer { flex-direction: column; }
      .popup-header { padding: 18px; }
      .popup-content { padding: 20px; }
    }
  `;
  document.head.appendChild(style);
  
  // HTML embutido
  const popupHTML = `
    <div id="dev-popup" class="popup-overlay" style="display: none;">
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-icon">🚧</span>
          <h3>Atenção!</h3>
          <button class="close-btn" aria-label="Fechar">&times;</button>
        </div>
        
        <div class="popup-content">
          <p><strong>Esta página está em desenvolvimento</strong></p>
          <p>Alguns recursos podem não estar disponíveis ou conter informações incompletas. Agradecemos sua compreensão!</p>
        </div>
        
        <div class="popup-footer">
          <button class="primary-btn">Entendi</button>
          <button class="secondary-btn">Reportar problema</button>
        </div>
        
        <div class="popup-options">
          <label>
            <input type="checkbox" id="dont-show-again">
            Não mostrar novamente por 7 dias
          </label>
        </div>
      </div>
    </div>
  `;
  
  // Injeta o HTML
  document.body.insertAdjacentHTML('beforeend', popupHTML);
  
  // Lógica do popup
  document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('dev-popup');
    const closeBtn = document.querySelector('.close-btn');
    const primaryBtn = document.querySelector('.primary-btn');
    const secondaryBtn = document.querySelector('.secondary-btn');
    const dontShowAgain = document.getElementById('dont-show-again');
    
    function shouldShowPopup() {
      const hideUntil = localStorage.getItem('hideDevPopupUntil');
      if (!hideUntil) return true;
      return new Date().getTime() > parseInt(hideUntil);
    }
    
    if (shouldShowPopup()) {
      setTimeout(() => {
        popup.style.display = 'flex';
        
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closePopup();
        });
        
        popup.addEventListener('click', (e) => {
          if (e.target === popup) closePopup();
        });
      }, 500);
    }
    
    function closePopup() {
      popup.style.animation = 'fadeOut 0.3s ease-out forwards';
      if (dontShowAgain.checked) {
        const hideUntil = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('hideDevPopupUntil', hideUntil);
      }
      setTimeout(() => {
        popup.style.display = 'none';
      }, 300);
    }
    
    closeBtn.addEventListener('click', closePopup);
    primaryBtn.addEventListener('click', closePopup);
    secondaryBtn.addEventListener('click', () => {
      alert('Obrigado pelo interesse em reportar um problema!');
      closePopup();
    });
  });
})();