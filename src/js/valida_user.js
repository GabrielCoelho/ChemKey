// Script para validar o login com credenciais específicas
document.addEventListener("DOMContentLoaded", function () {
  // Encontra o formulário de login
  const loginForm = document.querySelector(".form-signin");

  // Adiciona um evento para quando o formulário for enviado
  loginForm.addEventListener("submit", function (event) {
    // Impede o envio padrão do formulário
    event.preventDefault();

    // Obtém os valores dos campos de usuário e senha
    const userInput = document.querySelector('input[name="user"]').value;
    const passInput = document.querySelector('input[name="pass"]').value;

    // Credenciais válidas
    const validUser = "teste@teste";
    const validPass = "teste";

    // Verifica se as credenciais são válidas
    if (userInput === validUser && passInput === validPass) {
      // Mostra mensagem de sucesso
      showMessage("Login realizado com sucesso!", "success");

      // Simula um redirecionamento (descomente e substitua pela URL real de destino)
      setTimeout(function () {
        window.location.href = "app.html";
        alert("Redirecionando para a página principal...");
      }, 1500);
    } else {
      // Mostra mensagem de erro
      showMessage("Usuário ou senha incorretos!", "danger");

      // Limpa o campo de senha para nova tentativa
      document.querySelector('input[name="pass"]').value = "";
    }
  });

  // Função para mostrar mensagens de feedback
  function showMessage(message, type) {
    // Remove qualquer mensagem anterior
    const existingMessage = document.querySelector(".alert");
    if (existingMessage) {
      existingMessage.remove();
    }

    // Cria um novo elemento para a mensagem
    const messageElement = document.createElement("div");
    messageElement.className = `alert alert-${type} mt-3`;
    messageElement.role = "alert";
    messageElement.textContent = message;

    // Insere a mensagem após o botão de login
    const submitButton = document.querySelector(".btn-primary");
    submitButton.insertAdjacentElement("afterend", messageElement);

    // Configura a mensagem para desaparecer após alguns segundos
    if (type === "success") {
      setTimeout(function () {
        messageElement.remove();
      }, 1500);
    }
  }
});
