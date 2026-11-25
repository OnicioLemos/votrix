const usuario = Sessao.exigir('ELEITOR');

const alerta = document.getElementById('alerta');
const carregando = document.getElementById('carregando');
const secaoComprovante = document.getElementById('secaoComprovante');
const secaoProjetos = document.getElementById('secaoProjetos');
const grade = document.getElementById('gradeProjetos');
const modal = document.getElementById('modalConfirmar');
const btnConfirmar = document.getElementById('btnConfirmar');

let statusAtual = null;
let projetoEscolhido = null;

document.getElementById('nomeUsuario').textContent = usuario?.nome || '';
document.getElementById('btnSair').addEventListener('click', () => Sessao.sair());

function mostrarComprovante(voto) {
  secaoProjetos.classList.add('oculto');
  document.getElementById('projetoVotado').textContent = voto.projeto.nome;
  document.getElementById('horaVoto').textContent = `em ${formatarDataHora(voto.criadoEm)}`;
  const encerrada = statusAtual === 'ENCERRADA';
  document.getElementById('btnPodio').classList.toggle('oculto', !encerrada);
  document.getElementById('avisoResultado').textContent = encerrada
    ? 'A votação foi encerrada. Confira o resultado no pódio.'
    : 'O voto é definitivo. O resultado sai quando a votação for encerrada.';
  secaoComprovante.classList.remove('oculto');
  iniciarSaidaAutomatica();
}

// Estação compartilhada: depois de votar, a sessão do eleitor é encerrada
// sozinha para o próximo visitante não usar o login de quem acabou de votar.
const SEGUNDOS_SAIDA = 20;
let timerSaida = null;

function iniciarSaidaAutomatica() {
  if (timerSaida) return;
  let resta = SEGUNDOS_SAIDA;
  const info = document.getElementById('saidaAuto');
  const tic = () => {
    info.textContent = `Saindo automaticamente em ${resta} s`;
    if (resta-- <= 0) Sessao.sair();
  };
  tic();
  timerSaida = setInterval(tic, 1000);
}

document.getElementById('btnProximo').addEventListener('click', () => Sessao.sair());

function renderizarProjetos(projetos) {
  const podeVotar = statusAtual === 'ABERTA';
  document.getElementById('qtdProjetos').textContent = `${projetos.length} projetos`;

  if (projetos.length === 0) {
    grade.innerHTML = '<p class="texto-2">Nenhum projeto cadastrado ainda.</p>';
    return;
  }

  grade.innerHTML = projetos
    .map(
      (p) => `
      <article class="card-projeto">
        ${imagemProjeto(p)}
        <div class="card-corpo">
          ${p.estande ? `<span class="estande">ESTANDE ${escapar(p.estande)}</span>` : ''}
          <h3>${escapar(p.nome)}</h3>
          <span class="equipe">${escapar(p.equipe)}</span>
          <p class="descricao">${escapar(p.descricao || '')}</p>
          <button class="btn btn-bloco" data-id="${p.id}" data-nome="${escapar(p.nome)}" ${podeVotar ? '' : 'disabled'}>
            ${podeVotar ? 'Votar neste projeto' : 'Votação fechada'}
          </button>
        </div>
      </article>`
    )
    .join('');
}

grade.addEventListener('click', (e) => {
  const botao = e.target.closest('button[data-id]');
  if (!botao) return;
  projetoEscolhido = { id: Number(botao.dataset.id), nome: botao.dataset.nome };
  document.getElementById('nomeConfirmar').textContent = projetoEscolhido.nome;
  modal.showModal();
});

document.getElementById('btnCancelar').addEventListener('click', () => modal.close());

btnConfirmar.addEventListener('click', async () => {
  if (!projetoEscolhido) return;
  botaoCarregando(btnConfirmar, true, 'Registrando...');
  try {
    const { voto } = await api('/votos', { metodo: 'POST', corpo: { projetoId: projetoEscolhido.id } });
    modal.close();
    toast('Voto registrado com sucesso!');
    mostrarComprovante(voto);
  } catch (err) {
    modal.close();
    toast(err.message, 'erro');
    if (err.status === 409 || err.status === 403) carregar(); // já votou ou votação fechou
  } finally {
    botaoCarregando(btnConfirmar, false);
  }
});

async function carregar() {
  esconder(alerta);
  try {
    const [{ status }, meu] = await Promise.all([api('/votacao/status'), api('/votos/meu')]);
    statusAtual = status;
    document.getElementById('statusVotacao').innerHTML = badgeStatus(status);
    carregando.classList.add('oculto');

    if (meu.votou) return mostrarComprovante(meu.voto);

    if (status === 'NAO_INICIADA') {
      mostrarAlerta(alerta, 'A votação ainda não começou. Conheça os projetos; os botões liberam quando ela abrir.', 'info');
    } else if (status === 'ENCERRADA') {
      mostrarAlerta(alerta, 'A votação foi encerrada.', 'info');
      alerta.innerHTML += ' <a href="podio.html">Ver o pódio →</a>';
    }

    const projetos = await api('/projetos');
    renderizarProjetos(projetos);
    secaoProjetos.classList.remove('oculto');
  } catch (err) {
    carregando.classList.add('oculto');
    mostrarAlerta(alerta, err.message);
  }
}

if (usuario) {
  carregar();
  // Enquanto não abriu, confere a cada 15 s para liberar os botões sozinho
  setInterval(() => {
    if (statusAtual === 'NAO_INICIADA') carregar();
  }, 15000);
}
