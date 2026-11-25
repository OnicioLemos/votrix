const form = document.getElementById('formCadastro');
const alerta = document.getElementById('alerta');
const btn = document.getElementById('btnCadastrar');

aplicarMascaraCpf(document.getElementById('cpf'));

// Validação do CPF no front só para dar retorno rápido (a API valida de novo)
function cpfValido(cpf) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const digito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(n.slice(0, 9)) === Number(n[9]) && digito(n.slice(0, 10)) === Number(n[10]);
}

// RN09: cadastro bloqueado após o encerramento
api('/votacao/status')
  .then(({ status }) => {
    if (status === 'ENCERRADA') {
      mostrarAlerta(alerta, 'A votação foi encerrada. Novos cadastros não são aceitos.', 'info');
      form.querySelectorAll('input, button').forEach((el) => (el.disabled = true));
    }
  })
  .catch((err) => mostrarAlerta(alerta, err.message));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconder(alerta);

  const nome = form.nome.value.trim();
  const cpf = form.cpf.value;
  const senha = form.senha.value;

  if (nome.length < 3) return mostrarAlerta(alerta, 'O nome deve ter pelo menos 3 caracteres');
  if (!cpfValido(cpf)) return mostrarAlerta(alerta, 'CPF inválido');
  if (senha.length < 6) return mostrarAlerta(alerta, 'A senha deve ter no mínimo 6 caracteres');
  if (senha !== form.confirmar.value) return mostrarAlerta(alerta, 'As senhas não conferem');

  botaoCarregando(btn, true, 'Cadastrando...');
  try {
    const { token, usuario } = await api('/auth/cadastro', {
      metodo: 'POST',
      corpo: { nome, cpf, senha },
    });
    Sessao.salvar(token, usuario);
    location.href = 'votar.html';
  } catch (err) {
    mostrarAlerta(alerta, err.message);
    botaoCarregando(btn, false);
  }
});
