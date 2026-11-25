const form = document.getElementById('formLogin');
const alerta = document.getElementById('alerta');
const btnEntrar = document.getElementById('btnEntrar');

aplicarMascaraCpf(document.getElementById('cpf'));

function irParaPainel(usuario) {
  location.href = usuario.perfil === 'ADMIN' ? 'admin.html' : 'votar.html';
}

// Eleitor já logado NESTA guia? Vai direto para a votação.
// O admin nunca é redirecionado daqui: uma guia nova (ou duplicada) usada
// por visitantes não pode cair na dashboard.
if (Sessao.ler('ELEITOR')?.token) location.href = 'votar.html';

async function carregarStatus() {
  try {
    const { status } = await api('/votacao/status');
    document.getElementById('statusVotacao').innerHTML = badgeStatus(status);
    if (status === 'ENCERRADA') {
      // RN09: sem novos cadastros; pódio público (RN30)
      document.getElementById('rodape').classList.add('oculto');
      document.getElementById('linkPodio').classList.remove('oculto');
    }
  } catch (err) {
    mostrarAlerta(alerta, err.message);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconder(alerta);

  const cpf = form.cpf.value.trim();
  const senha = form.senha.value;
  if (!cpf || !senha) {
    return mostrarAlerta(alerta, 'Informe CPF e senha');
  }

  botaoCarregando(btnEntrar, true, 'Entrando...');
  try {
    const { token, usuario } = await api('/auth/login', { metodo: 'POST', corpo: { cpf, senha } });
    Sessao.salvar(token, usuario);
    irParaPainel(usuario);
  } catch (err) {
    mostrarAlerta(alerta, err.message);
    botaoCarregando(btnEntrar, false);
  }
});

carregarStatus();
