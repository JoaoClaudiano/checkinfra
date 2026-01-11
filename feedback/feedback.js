// feedback.js - VERSÃO CORRIGIDA
(function() {
  'use strict';
  
  // Variáveis globais para reutilização
  let fab, modal, closeBtn, form, status, submitBtn;
  
  // Função para inicializar quando o DOM estiver pronto
  function initFeedback() {
    // Buscar elementos
    fab = document.getElementById("feedback-fab");
    modal = document.getElementById("feedback-modal");
    closeBtn = document.getElementById("feedback-close");
    form = document.getElementById("feedback-form");
    status = document.getElementById("feedback-status");
    submitBtn = document.getElementById("feedback-submit");
    
    // Se algum elemento essencial não existir, sair
    if (!modal) return;
    
    /* abrir / fechar */
    if (fab) {
      fab.onclick = () => modal.classList.remove("hidden");
    }
    
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add("hidden");
    }
    
    /* capturar URL automaticamente */
    const pageUrlInput = document.getElementById("page-url");
    if (pageUrlInput) {
      pageUrlInput.value = window.location.href;
    }
    
    /* capturar rating */
    document.querySelectorAll(".rating input").forEach(input => {
      input.addEventListener("change", () => {
        if (submitBtn) {
          submitBtn.dataset.rating = input.value;
        }
      });
    });
    
    /* SUBMIT ASSÍNCRONO - Web3Form */
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // limpar status
        if (status) {
          status.textContent = "";
          status.className = "";
        }
        
        if (submitBtn) {
          submitBtn.classList.add("loading");
          submitBtn.textContent = "Enviando…";
          submitBtn.disabled = true;
        }

        const formData = new FormData(form);
        formData.append("access_key", "dda02135-5247-43ee-b75c-5b259ae11f5b");

        try {
          const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
          });

          const data = await response.json();

          if (response.ok) {
            if (status) {
              status.textContent = "✅ Obrigado! Seu feedback foi enviado! ☁️";
              status.classList.add("success");
            }
            
            if (form) form.reset();

            setTimeout(() => {
              if (modal) modal.classList.add("hidden");
              if (status) status.textContent = "";
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Enviar feedback";
                submitBtn.classList.remove("loading");
              }
            }, 1800);

          } else {
            if (status) {
              status.textContent = "⚠️ Erro: " + (data.message || "Tente novamente.");
              status.classList.add("error");
            }
          }

        } catch (error) {
          if (status) {
            status.textContent = "⚠️ Falha de conexão. Tente novamente.";
            status.classList.add("error");
          }
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Enviar feedback";
          submitBtn.classList.remove("loading");
        }
      });
    }
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeedback);
  } else {
    // DOM já carregado
    initFeedback();
  }
  
  // Alternativa: inicializar com delay para garantir que o HTML foi inserido
  setTimeout(initFeedback, 1000);
})();
