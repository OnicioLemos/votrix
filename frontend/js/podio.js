const alerta = document.getElementById('alerta');
const podioEl = document.getElementById('podio');

// Link de volta conforme quem está vendo
const destinoVoltar = Sessao.ler('ADMIN') ? 'admin.html' : Sessao.ler('ELEITOR') ? 'votar.html' : null;
document.getElementById('topoDir').innerHTML = destinoVoltar
  ? `<a class="btn btn-fantasma btn-pequeno" href="${destinoVoltar}">Voltar</a>`
  : '<a class="btn btn-fantasma btn-pequeno" href="index.html">Entrar</a>';

function pct(valor) {
  return `${valor.toFixed(1).replace('.', ',')}%`;
}

function degrau(lugar, projetos) {
  // Empate (RN31): mais de um projeto pode dividir a mesma posição
  if (!projetos || projetos.length === 0) {
    return `
      <div class="degrau degrau-${lugar} vazio">
        <span class="nome texto-2">—</span>
        <div class="bloco">${lugar}º</div>
      </div>`;
  }
  const nomes = projetos.map((p) => escapar(p.nome)).join(' & ');
  const equipes = projetos.map((p) => escapar(p.equipe)).join(' · ');
  const { votos, percentual } = projetos[0];
  return `
    <div class="degrau degrau-${lugar}">
      <span class="nome">${nomes}</span>
      <span class="equipe">${equipes}</span>
      <span class="dados">${votos} voto${votos === 1 ? '' : 's'} · ${pct(percentual)}</span>
      <div class="bloco">${lugar}º</div>
    </div>`;
}

async function carregar() {
  try {
    const { podio, totalVotos, encerradaEm } = await api('/podio');
    document.getElementById('carregando').classList.add('oculto');

    if (podio.length === 0) {
      return mostrarAlerta(alerta, 'A votação foi encerrada sem nenhum voto registrado.', 'info');
    }

    // Agrupa por posição (1, 2, 3)
    const porPosicao = { 1: [], 2: [], 3: [] };
    podio.forEach((p) => porPosicao[p.posicao]?.push(p));

    // RN32: mostra só as posições preenchidas; ordem visual 2º, 1º, 3º
    podioEl.innerHTML = [2, 1, 3].map((l) => degrau(l, porPosicao[l])).join('');
    podioEl.classList.remove('oculto');
    document.getElementById('base').classList.remove('oculto');

    const rodape = document.getElementById('rodape');
    rodape.textContent = `${totalVotos} votos no total · encerrada em ${formatarDataHora(encerradaEm)}`;
    rodape.classList.remove('oculto');
  } catch (err) {
    document.getElementById('carregando').classList.add('oculto');
    if (err.status === 403) {
      mostrarAlerta(alerta, 'O pódio aparece assim que o administrador encerrar a votação. Esta página confere sozinha a cada 10 segundos.', 'info');
      setTimeout(carregar, 10000);
    } else {
      mostrarAlerta(alerta, err.message);
    }
  }
}

carregar();
