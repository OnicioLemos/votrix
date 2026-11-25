const usuario = Sessao.exigir('ADMIN');

const alerta = document.getElementById('alerta');
const btnAbrir = document.getElementById('btnAbrir');
const btnEncerrar = document.getElementById('btnEncerrar');
const modalProjeto = document.getElementById('modalProjeto');
const formProjeto = document.getElementById('formProjeto');
const alertaProjeto = document.getElementById('alertaProjeto');
const modalEncerrar = document.getElementById('modalEncerrar');
const confirmaTexto = document.getElementById('confirmaTexto');
const btnConfirmarEncerrar = document.getElementById('btnConfirmarEncerrar');

// Tons de ciano a violeta (identidade visual)
const CORES = ['#22D3EE', '#A78BFA', '#38BDF8', '#C4B5FD', '#06B6D4', '#8B5CF6', '#67E8F9', '#7C3AED', '#0891B2', '#DDD6FE'];

let statusAtual = null;
let projetos = [];
let editandoId = null;
let grafico = null;

document.getElementById('nomeUsuario').textContent = usuario?.nome || '';
document.getElementById('btnSair').addEventListener('click', () => Sessao.sair());

// ---------- Status e botões ----------
function atualizarStatus(status) {
  statusAtual = status;
  document.getElementById('statusVotacao').innerHTML = badgeStatus(status);
  btnAbrir.classList.toggle('oculto', status !== 'NAO_INICIADA');
  btnEncerrar.classList.toggle('oculto', status !== 'ABERTA');
  document.getElementById('btnVerPodio').classList.toggle('oculto', status !== 'ENCERRADA');
  document.getElementById('btnNovo').disabled = status !== 'NAO_INICIADA';
  document.getElementById('avisoNovo').classList.toggle('oculto', status !== 'ABERTA');
}

// ---------- Gráfico (RN24, RN25) ----------
function desenharGrafico(itens, totalVotos) {
  const area = document.getElementById('areaGrafico');
  const vazio = document.getElementById('graficoVazio');
  const comVoto = itens.filter((p) => p.votos > 0);

  if (totalVotos === 0) {
    area.classList.add('oculto');
    vazio.classList.remove('oculto');
    return;
  }
  area.classList.remove('oculto');
  vazio.classList.add('oculto');

  if (typeof Chart === 'undefined') {
    // Chart.js ainda carregando pelo CDN: tenta de novo em 1 s
    setTimeout(() => desenharGrafico(itens, totalVotos), 1000);
    return;
  }

  const dados = {
    labels: comVoto.map((p) => p.nome),
    datasets: [{
      data: comVoto.map((p) => p.votos),
      backgroundColor: comVoto.map((p) => CORES[itens.indexOf(p) % CORES.length]),
      borderColor: '#111827',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  if (grafico) {
    grafico.data = dados;
    grafico.update();
    return;
  }

  grafico = new Chart(document.getElementById('grafico'), {
    type: 'doughnut',
    data: dados,
    options: {
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
              const pct = Math.round((ctx.raw / total) * 1000) / 10;
              return ` ${ctx.raw} voto(s) · ${pct.toFixed(1).replace('.', ',')}%`;
            },
          },
        },
      },
    },
  });
}

function desenharLegenda(itens) {
  const legenda = document.getElementById('legenda');
  if (itens.length === 0) {
    legenda.innerHTML = '<li class="texto-2">Nenhum projeto cadastrado.</li>';
    return;
  }
  legenda.innerHTML = itens
    .map((p, i) => `
      <li>
        <span class="cor" style="background:${CORES[i % CORES.length]}"></span>
        <span>${escapar(p.nome)}${p.ativo ? '' : '<span class="inativo">(inativo)</span>'}</span>
        <span class="num">${p.votos} · ${p.percentual.toFixed(1).replace('.', ',')}%</span>
      </li>`)
    .join('');
}

async function carregarResultado() {
  const r = await api('/admin/resultado');
  atualizarStatus(r.status);
  document.getElementById('totalVotos').textContent = r.totalVotos;
  document.getElementById('totalEleitores').textContent = r.totalEleitores;
  const part = r.totalEleitores ? Math.round((r.totalVotos / r.totalEleitores) * 100) : 0;
  document.getElementById('participacao').textContent = `${part}%`;
  desenharGrafico(r.projetos, r.totalVotos);
  desenharLegenda(r.projetos);
  document.getElementById('atualizado').textContent =
    `Atualizado às ${new Date().toLocaleTimeString('pt-BR')}` +
    (r.status === 'ABERTA' ? ' · atualiza a cada 10 s' : '');
}

// ---------- Projetos (RF06) ----------
function desenharProjetos() {
  const tbody = document.getElementById('tabelaProjetos');
  document.getElementById('projetosAtivos').textContent = projetos.filter((p) => p.ativo).length;

  if (projetos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="texto-2">Nenhum projeto. Clique em "+ Novo projeto".</td></tr>';
    return;
  }

  const encerrada = statusAtual === 'ENCERRADA';
  tbody.innerHTML = projetos
    .map((p) => {
      const podeReativar = !p.ativo && statusAtual === 'NAO_INICIADA';
      return `
      <tr>
        <td><strong>${escapar(p.nome)}</strong></td>
        <td class="texto-2">${escapar(p.equipe)}</td>
        <td>${escapar(p.estande || '–')}</td>
        <td>${p.votos}</td>
        <td><span class="etiqueta ${p.ativo ? 'etiqueta-ativo' : 'etiqueta-inativo'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <div class="acoes-linha">
            <button class="btn btn-pequeno" data-acao="editar" data-id="${p.id}" ${encerrada ? 'disabled' : ''}>Editar</button>
            ${p.ativo
              ? `<button class="btn btn-pequeno btn-fantasma" data-acao="desativar" data-id="${p.id}" ${encerrada ? 'disabled' : ''}>Desativar</button>`
              : `<button class="btn btn-pequeno btn-fantasma" data-acao="ativar" data-id="${p.id}" ${podeReativar ? '' : 'disabled'}>Ativar</button>`}
            <button class="btn btn-pequeno btn-perigo" data-acao="excluir" data-id="${p.id}"
              ${p.votos > 0 || encerrada ? 'disabled title="Projeto com votos só pode ser desativado (RN20)"' : ''}>Excluir</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

async function carregarProjetos() {
  projetos = await api('/admin/projetos');
  desenharProjetos();
}

function abrirFormulario(projeto) {
  editandoId = projeto ? projeto.id : null;
  document.getElementById('tituloModal').textContent = projeto ? 'Editar projeto' : 'Novo projeto';
  esconder(alertaProjeto);
  formProjeto.nome.value = projeto?.nome || '';
  formProjeto.equipe.value = projeto?.equipe || '';
  formProjeto.descricao.value = projeto?.descricao || '';
  formProjeto.estande.value = projeto?.estande || '';
  formProjeto.imagemUrl.value = projeto?.imagemUrl || '';
  atualizarContador();
  modalProjeto.showModal();
  formProjeto.nome.focus();
}

function atualizarContador() {
  document.getElementById('contDescricao').textContent = `${formProjeto.descricao.value.length}/500`;
}
formProjeto.descricao.addEventListener('input', atualizarContador);

document.getElementById('btnNovo').addEventListener('click', () => abrirFormulario(null));
document.getElementById('btnCancelarProjeto').addEventListener('click', () => modalProjeto.close());

formProjeto.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconder(alertaProjeto);
  const corpo = {
    nome: formProjeto.nome.value.trim(),
    equipe: formProjeto.equipe.value.trim(),
    descricao: formProjeto.descricao.value.trim(),
    estande: formProjeto.estande.value.trim(),
    imagemUrl: formProjeto.imagemUrl.value.trim(),
  };
  if (!corpo.nome || !corpo.equipe) {
    return mostrarAlerta(alertaProjeto, 'Nome e equipe são obrigatórios');
  }

  const btn = document.getElementById('btnSalvarProjeto');
  botaoCarregando(btn, true, 'Salvando...');
  try {
    if (editandoId) {
      await api(`/admin/projetos/${editandoId}`, { metodo: 'PUT', corpo });
      toast('Projeto atualizado');
    } else {
      await api('/admin/projetos', { metodo: 'POST', corpo });
      toast('Projeto cadastrado');
    }
    modalProjeto.close();
    await atualizarTudo();
  } catch (err) {
    mostrarAlerta(alertaProjeto, err.message);
  } finally {
    botaoCarregando(btn, false);
  }
});

document.getElementById('tabelaProjetos').addEventListener('click', async (e) => {
  const botao = e.target.closest('button[data-acao]');
  if (!botao) return;
  const projeto = projetos.find((p) => p.id === Number(botao.dataset.id));
  if (!projeto) return;

  try {
    switch (botao.dataset.acao) {
      case 'editar':
        return abrirFormulario(projeto);
      case 'desativar':
        if (!confirm(`Desativar "${projeto.nome}"? Ele some da tela de votação, mas os votos continuam contando.`)) return;
        await api(`/admin/projetos/${projeto.id}`, { metodo: 'PUT', corpo: { ativo: false } });
        toast('Projeto desativado');
        break;
      case 'ativar':
        await api(`/admin/projetos/${projeto.id}`, { metodo: 'PUT', corpo: { ativo: true } });
        toast('Projeto ativado');
        break;
      case 'excluir':
        if (!confirm(`Excluir "${projeto.nome}" definitivamente?`)) return;
        await api(`/admin/projetos/${projeto.id}`, { metodo: 'DELETE' });
        toast('Projeto excluído');
        break;
    }
    await atualizarTudo();
  } catch (err) {
    toast(err.message, 'erro');
  }
});

// ---------- Eleitores (RNF08) ----------
async function carregarEleitores() {
  const lista = await api('/admin/eleitores');
  const tbody = document.getElementById('tabelaEleitores');
  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="texto-2">Nenhum eleitor cadastrado ainda.</td></tr>';
    return;
  }
  tbody.innerHTML = lista
    .map((u) => `
      <tr>
        <td>${escapar(u.nome)}</td>
        <td><code>${escapar(u.cpf)}</code></td>
        <td class="texto-2">${formatarDataHora(u.criadoEm)}</td>
        <td>${u.votou ? '<span class="etiqueta etiqueta-ativo">Sim</span>' : '<span class="etiqueta etiqueta-inativo">Não</span>'}</td>
      </tr>`)
    .join('');
}

// ---------- Abrir / encerrar (RF07, RF09) ----------
btnAbrir.addEventListener('click', async () => {
  if (!confirm('Abrir a votação agora? Depois de aberta, não é possível cadastrar projetos novos.')) return;
  botaoCarregando(btnAbrir, true, 'Abrindo...');
  try {
    await api('/admin/votacao/abrir', { metodo: 'POST' });
    toast('Votação aberta!');
    await atualizarTudo();
    carregarParcial(); // inicia o ciclo de 3 minutos
  } catch (err) {
    toast(err.message, 'erro');
  } finally {
    botaoCarregando(btnAbrir, false);
  }
});

btnEncerrar.addEventListener('click', () => {
  confirmaTexto.value = '';
  btnConfirmarEncerrar.disabled = true;
  modalEncerrar.showModal();
  confirmaTexto.focus();
});
confirmaTexto.addEventListener('input', () => {
  btnConfirmarEncerrar.disabled = confirmaTexto.value.trim().toUpperCase() !== 'ENCERRAR';
});
document.getElementById('btnCancelarEncerrar').addEventListener('click', () => modalEncerrar.close());

btnConfirmarEncerrar.addEventListener('click', async () => {
  botaoCarregando(btnConfirmarEncerrar, true, 'Encerrando...');
  try {
    await api('/admin/votacao/encerrar', { metodo: 'POST', corpo: { confirmar: true } });
    modalEncerrar.close();
    toast('Votação encerrada. Pódio liberado!');
    await atualizarTudo();
    carregarParcial(); // mostra o resultado final e para o ciclo
  } catch (err) {
    toast(err.message, 'erro');
  } finally {
    botaoCarregando(btnConfirmarEncerrar, false);
  }
});

// ---------- Parcial (gráfico de barras, a cada 3 minutos) ----------
const INTERVALO_PARCIAL = 3 * 60 * 1000; // 3 minutos
let graficoParcial = null;
let proximaParcial = null;

function desenharParcial(itens, totalVotos) {
  const area = document.getElementById('areaParcial');
  const vazio = document.getElementById('parcialVazio');

  if (totalVotos === 0) {
    area.classList.add('oculto');
    vazio.classList.remove('oculto');
    return;
  }
  area.classList.remove('oculto');
  vazio.classList.add('oculto');

  if (typeof Chart === 'undefined') {
    setTimeout(() => desenharParcial(itens, totalVotos), 1000);
    return;
  }

  // Altura proporcional à quantidade de projetos (uma barra por linha)
  area.style.height = `${Math.max(160, itens.length * 46 + 40)}px`;

  const dados = {
    labels: itens.map((p) => (p.ativo ? p.nome : `${p.nome} (inativo)`)),
    datasets: [{
      data: itens.map((p) => p.votos),
      backgroundColor: itens.map((p, i) => (i === 0 && p.votos > 0 ? '#22D3EE' : 'rgba(167, 139, 250, .75)')),
      borderRadius: 4,
      barThickness: 22,
    }],
  };

  if (graficoParcial) {
    graficoParcial.data = dados;
    graficoParcial.update();
    return;
  }

  graficoParcial = new Chart(document.getElementById('graficoParcial'), {
    type: 'bar',
    data: dados,
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#94A3B8' },
          grid: { color: 'rgba(31, 42, 68, .8)' },
        },
        y: {
          ticks: { color: '#E5E7EB', font: { size: 13 } },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
              const pct = total ? Math.round((ctx.raw / total) * 1000) / 10 : 0;
              return ` ${ctx.raw} voto(s) · ${pct.toFixed(1).replace('.', ',')}%`;
            },
          },
        },
      },
    },
  });
}

async function carregarParcial() {
  try {
    const r = await api('/admin/resultado');
    desenharParcial(r.projetos, r.totalVotos);
    document.getElementById('infoParcial').dataset.hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    proximaParcial = r.status === 'ABERTA' ? Date.now() + INTERVALO_PARCIAL : null;
    atualizarInfoParcial();
  } catch (err) {
    toast(err.message, 'erro');
  }
}

// Mostra a hora da última leitura e quanto falta para a próxima
function atualizarInfoParcial() {
  const info = document.getElementById('infoParcial');
  const hora = info.dataset.hora ? `Parcial das ${info.dataset.hora}` : '';
  if (!proximaParcial) {
    info.textContent = hora;
    return;
  }
  const resta = Math.max(0, Math.ceil((proximaParcial - Date.now()) / 1000));
  const mm = String(Math.floor(resta / 60)).padStart(2, '0');
  const ss = String(resta % 60).padStart(2, '0');
  info.textContent = `${hora} · próxima em ${mm}:${ss}`;
  if (resta === 0) carregarParcial();
}

document.getElementById('btnAtualizarParcial').addEventListener('click', carregarParcial);

// ---------- Atualização ----------
async function atualizarTudo() {
  try {
    await carregarResultado(); // define statusAtual antes de desenhar a tabela
    await Promise.all([carregarProjetos(), carregarEleitores()]);
    esconder(alerta);
  } catch (err) {
    mostrarAlerta(alerta, err.message);
  }
}

if (usuario) {
  atualizarTudo();
  carregarParcial();
  setInterval(atualizarInfoParcial, 1000); // relógio da parcial; recarrega ao chegar em 00:00
  // RN26: atualização automática a cada 10 s enquanto a votação estiver aberta
  setInterval(() => {
    const algumModalAberto = modalProjeto.open || modalEncerrar.open;
    if (statusAtual === 'ABERTA' && !algumModalAberto) atualizarTudo();
  }, 10000);
}
