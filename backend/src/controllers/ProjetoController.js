const ProjetoModel = require('../models/ProjetoModel');
const VotacaoModel = require('../models/VotacaoModel');
const ErroApp = require('../utils/ErroApp');

function textoOpcional(valor) {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  const t = String(valor).trim();
  return t === '' ? null : t;
}

// RN19: valida os campos do projeto. "parcial" = edição (só confere o que veio)
function validarProjeto(body, parcial = false) {
  const dados = {};

  if (!parcial || body.nome !== undefined) {
    const nome = String(body.nome ?? '').trim();
    if (!nome) throw new ErroApp(400, 'O nome do projeto é obrigatório');
    if (nome.length > 80) throw new ErroApp(400, 'O nome do projeto deve ter até 80 caracteres');
    dados.nome = nome;
  }

  if (!parcial || body.equipe !== undefined) {
    const equipe = String(body.equipe ?? '').trim();
    if (!equipe) throw new ErroApp(400, 'Informe a equipe/integrantes');
    if (equipe.length > 200) throw new ErroApp(400, 'A equipe deve ter até 200 caracteres');
    dados.equipe = equipe;
  }

  const descricao = textoOpcional(body.descricao);
  if (descricao !== undefined) {
    if (descricao && descricao.length > 500) {
      throw new ErroApp(400, 'A descrição deve ter até 500 caracteres');
    }
    dados.descricao = descricao;
  }

  const estande = textoOpcional(body.estande);
  if (estande !== undefined) {
    if (estande && estande.length > 20) throw new ErroApp(400, 'O estande deve ter até 20 caracteres');
    dados.estande = estande;
  }

  const imagemUrl = textoOpcional(body.imagemUrl);
  if (imagemUrl !== undefined) {
    if (imagemUrl && !/^https?:\/\/.+/i.test(imagemUrl)) {
      throw new ErroApp(400, 'A URL da imagem deve começar com http:// ou https://');
    }
    if (imagemUrl && imagemUrl.length > 500) throw new ErroApp(400, 'URL da imagem muito longa');
    dados.imagemUrl = imagemUrl;
  }

  if (body.ativo !== undefined) {
    if (typeof body.ativo !== 'boolean') throw new ErroApp(400, 'O campo ativo deve ser true ou false');
    dados.ativo = body.ativo;
  }

  return dados;
}

function idDaRota(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ErroApp(400, 'ID inválido');
  return id;
}

function formatar(p) {
  const { _count, ...resto } = p;
  return { ...resto, votos: _count ? _count.votos : 0 };
}

const ProjetoController = {
  // GET /projetos  (RF03: eleitor vê só os ativos)
  async listarAtivos(req, res) {
    res.json(await ProjetoModel.listarAtivos());
  },

  // GET /admin/projetos
  async listarTodos(req, res) {
    const projetos = await ProjetoModel.listarTodos();
    res.json(projetos.map(formatar));
  },

  // POST /admin/projetos  (RN18, RN19, RN21)
  async criar(req, res) {
    const votacao = await VotacaoModel.obter();
    if (votacao.status !== 'NAO_INICIADA') {
      // RN21: com a votação aberta não entram projetos novos
      throw new ErroApp(403, 'Projetos novos só podem ser cadastrados antes de abrir a votação');
    }

    const dados = validarProjeto(req.body || {});

    if (await ProjetoModel.buscarPorNome(dados.nome)) {
      throw new ErroApp(409, 'Já existe um projeto com esse nome');
    }

    try {
      const projeto = await ProjetoModel.criar(dados);
      res.status(201).json(formatar(projeto));
    } catch (err) {
      if (err.code === 'P2002') throw new ErroApp(409, 'Já existe um projeto com esse nome');
      throw err;
    }
  },

  // PUT /admin/projetos/:id  (RN19–RN21: editar textos ou desativar)
  async atualizar(req, res) {
    const id = idDaRota(req);
    const atual = await ProjetoModel.buscarPorId(id);
    if (!atual) throw new ErroApp(404, 'Projeto não encontrado');

    const votacao = await VotacaoModel.obter();
    if (votacao.status === 'ENCERRADA') {
      throw new ErroApp(403, 'A votação foi encerrada; os projetos estão congelados');
    }

    const dados = validarProjeto(req.body || {}, true);
    if (Object.keys(dados).length === 0) {
      throw new ErroApp(400, 'Nada para atualizar');
    }

    // Com a votação aberta, reativar um projeto equivale a incluir um novo (RN21)
    if (votacao.status === 'ABERTA' && dados.ativo === true && !atual.ativo) {
      throw new ErroApp(403, 'Não é possível reativar projetos com a votação aberta');
    }

    if (dados.nome && dados.nome !== atual.nome) {
      const outro = await ProjetoModel.buscarPorNome(dados.nome);
      if (outro) throw new ErroApp(409, 'Já existe um projeto com esse nome');
    }

    try {
      const projeto = await ProjetoModel.atualizar(id, dados);
      res.json({ ...projeto, votos: atual._count.votos });
    } catch (err) {
      if (err.code === 'P2002') throw new ErroApp(409, 'Já existe um projeto com esse nome');
      throw err;
    }
  },

  // DELETE /admin/projetos/:id  (RN20: só exclui se não houver votos)
  async excluir(req, res) {
    const id = idDaRota(req);
    const projeto = await ProjetoModel.buscarPorId(id);
    if (!projeto) throw new ErroApp(404, 'Projeto não encontrado');

    if (projeto._count.votos > 0) {
      throw new ErroApp(409, 'Este projeto já recebeu votos. Desative-o em vez de excluir');
    }

    const votacao = await VotacaoModel.obter();
    if (votacao.status === 'ENCERRADA') {
      throw new ErroApp(403, 'A votação foi encerrada; os projetos estão congelados');
    }

    await ProjetoModel.excluir(id);
    res.status(204).end();
  },
};

module.exports = ProjetoController;
