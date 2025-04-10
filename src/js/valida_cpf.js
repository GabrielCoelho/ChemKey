// Função para validar o CPF
function validarCPF(cpf) {
  // Remove caracteres não numéricos - by Claude.AI
  cpf = cpf.replace(/[^\d]/g, "");

  // Verifica se o CPF tem 11 dígitos
  if (cpf.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (caso inválido) - by Claude.AI
  if (/^(\d)\1+$/.test(cpf)) {
    return false;
  }

  // Cálculo do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = soma % 11;
  let digitoVerificador1 = resto < 2 ? 0 : 11 - resto;

  // Verifica o primeiro dígito verificador
  if (digitoVerificador1 !== parseInt(cpf.charAt(9))) {
    return false;
  }

  // Cálculo do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = soma % 11;
  let digitoVerificador2 = resto < 2 ? 0 : 11 - resto;

  // Verifica o segundo dígito verificador
  if (digitoVerificador2 !== parseInt(cpf.charAt(10))) {
    return false;
  }

  return true;
}

// Função para formatar o CPF enquanto o usuário digita - by Claude.AI
function formatarCPF(cpf) {
  cpf = cpf.replace(/\D/g, ""); // Remove caracteres não numéricos
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca um ponto entre o terceiro e o quarto dígitos
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca um ponto entre o sexto e o sétimo dígitos
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca um hífen entre o nono e o décimo dígitos
  return cpf;
}

// Adicionar os eventos ao formulário quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", function () {
  const cpfInput = document.getElementById("cpf");
  const form = document.getElementById("contact-form");

  // Adiciona formatação ao digitar - by Claude.AI
  cpfInput.addEventListener("input", function () {
    this.value = formatarCPF(this.value);
  });

  // Adiciona validação ao enviar o formulário
  form.addEventListener("submit", function (event) {
    // Se o campo CPF estiver preenchido, valida-o
    if (cpfInput.value.trim() !== "") {
      if (!validarCPF(cpfInput.value)) {
        event.preventDefault(); // Impede o envio do formulário

        // Cria uma mensagem de erro se não existir
        let errorMessage = document.getElementById("cpf-error");
        if (!errorMessage) {
          errorMessage = document.createElement("div");
          errorMessage.id = "cpf-error";
          errorMessage.className = "invalid-feedback d-block";
          errorMessage.textContent = "Please insert a valid CPF value";
          cpfInput.parentNode.appendChild(errorMessage);
        }

        // Adiciona classe para indicar campo inválido
        cpfInput.classList.add("is-invalid");
      } else {
        // Remove mensagem de erro e classe de inválido se o CPF for válido
        const errorMessage = document.getElementById("cpf-error");
        if (errorMessage) {
          errorMessage.remove();
        }
        cpfInput.classList.remove("is-invalid");
        cpfInput.classList.add("is-valid");
      }
    }
  });
});

// Mostrar o erro ao passar para próximo conteúdo do formulário - by Claude.AI
document.addEventListener("DOMContentLoaded", function () {
  const cpfInput = document.getElementById("cpf");

  cpfInput.addEventListener("blur", function () {
    if (this.value.trim() !== "") {
      if (!validarCPF(this.value)) {
        // Adiciona classe e mensagem de erro
        this.classList.add("is-invalid");
        let errorMessage = document.getElementById("cpf-error");
        if (!errorMessage) {
          errorMessage = document.createElement("div");
          errorMessage.id = "cpf-error";
          errorMessage.className = "invalid-feedback d-block";
          errorMessage.textContent = "Please, insert a valid CPF value";
          this.parentNode.appendChild(errorMessage);
        }
      } else {
        // Remove classe e mensagem de erro
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
        const errorMessage = document.getElementById("cpf-error");
        if (errorMessage) {
          errorMessage.remove();
        }
      }
    }
  });
});
