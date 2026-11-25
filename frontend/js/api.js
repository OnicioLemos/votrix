// Funções compartilhadas por todas as telas

// Sessão POR GUIA (sessionStorage) e separada por perfil.
// Assim o administrador fica logado na guia da dashboard enquanto
// eleitores entram, se cadastram e votam em outra guia do mesmo navegador,
// sem que um login sobrescreva o outro.
const Sessao = {
  contexto: null, // perfil usado pela página atual: 'ADMIN' ou 'ELEITOR'

  chave(perfil) {
    return perfil === 'ADMIN' ? 'votrix_sessao_admin' : 'votrix_sessao_eleitor';
  },
  ler(perfil) {
    try {
      return JSON.parse(sessionStorage.getItem(this.chave(perfil)));
    } catch {
      return null;
    }
  },
  salvar(token, usuario) {
    sessionStorage.setItem(this.chave(usuario.perfil), JSON.stringify({ token, usuario }));
    this.contexto = usuario.perfil;
  },
  token() {
    return this.contexto ? this.ler(this.contexto)?.token || null : null;
  },
  usuario() {
    return this.contexto ? this.ler(this.contexto)?.usuario || null : null;
  },
  // Sai só da sessão da página atual (a do outro perfil continua)
  sair() {
    if (this.contexto) sessionStorage.removeItem(this.chave(this.contexto));
    location.href = 'index.html';
  },
  // Usado nas páginas protegidas: define o perfil da página e exige login nele
  exigir(perfil) {
    this.contexto = perfil;
    const sessao = this.ler(perfil);
    if (!sessao?.token) {
      location.href = 'index.html';
      return null;
    }
    return sessao.usuario;
  },
};

// Limpa o login antigo (versão que guardava no localStorage, compartilhado entre guias)
localStorage.removeItem('votrix_token');
localStorage.removeItem('votrix_usuario');

// Chamada à API com token e tratamento do formato { erro }
async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Sessao.token();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error('Não foi possível falar com o servidor. Confira se a API está rodando.');
  }

  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => ({}));

  // Token vencido em rota protegida: volta para o login
  if (resposta.status === 401 && token && !caminho.startsWith('/auth/')) {
    Sessao.sair();
  }

  if (!resposta.ok) {
    const erro = new Error(dados.erro || `Erro ${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

// ---------- Utilidades de interface ----------

function mascaraCpf(valor) {
  const n = valor.replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function aplicarMascaraCpf(input) {
  input.addEventListener('input', () => {
    input.value = mascaraCpf(input.value);
  });
}

function toast(mensagem, tipo = 'ok') {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = mensagem;
  el.classList.toggle('erro', tipo === 'erro');
  el.classList.add('visivel');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('visivel'), 3500);
}

function mostrarAlerta(elemento, mensagem, tipo = 'erro') {
  elemento.className = `alerta alerta-${tipo}`;
  elemento.textContent = mensagem;
  elemento.classList.remove('oculto');
}

function esconder(elemento) {
  elemento.classList.add('oculto');
}

// Evita injeção de HTML ao montar cards com dados digitados
function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function iniciais(nome) {
  return String(nome)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// Imagem 16:9 do projeto ou placeholder com as iniciais
function imagemProjeto(projeto) {
  if (!projeto.imagemUrl) {
    return `<div class="placeholder-img" aria-hidden="true">${escapar(iniciais(projeto.nome))}</div>`;
  }
  // Se a imagem não carregar, troca pelo placeholder
  return `<img src="${escapar(projeto.imagemUrl)}" alt="Imagem do projeto ${escapar(projeto.nome)}"
    loading="lazy" data-iniciais="${escapar(iniciais(projeto.nome))}" onerror="trocarPorPlaceholder(this)">`;
}

function trocarPorPlaceholder(img) {
  const div = document.createElement('div');
  div.className = 'placeholder-img';
  div.textContent = img.dataset.iniciais || '?';
  img.replaceWith(div);
}

const NOMES_STATUS = {
  NAO_INICIADA: 'NÃO INICIADA',
  ABERTA: 'ABERTA',
  ENCERRADA: 'ENCERRADA',
};

function badgeStatus(status) {
  return `<span class="status status-${status}">${NOMES_STATUS[status] || status}</span>`;
}

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

function botaoCarregando(botao, carregando, texto) {
  if (carregando) {
    botao.dataset.texto = botao.textContent;
    botao.textContent = texto || 'Aguarde...';
    botao.disabled = true;
  } else {
    botao.textContent = botao.dataset.texto || botao.textContent;
    botao.disabled = false;
  }
}
