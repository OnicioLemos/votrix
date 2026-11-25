const VotacaoModel = require('../models/VotacaoModel');
const ProjetoModel = require('../models/ProjetoModel');
const ErroApp = require('../utils/ErroApp');

const VotacaoController = {
  // GET /votacao/status (público)
  async status(req, res) {
    const { status, abertaEm, encerradaEm } = await VotacaoModel.obter();
    res.json({ status, abertaEm, encerradaEm });
  },

  // POST /admin/votacao/abrir  (RF07: NAO_INICIADA -> ABERTA)
  async abrir(req, res) {
    const votacao = await VotacaoModel.obter();
    if (votacao.status !== 'NAO_INICIADA') {
      throw new ErroApp(403, 'A votação já foi aberta anteriormente');
    }

    // RN22: pelo menos 2 projetos ativos
    const ativos = await ProjetoModel.contarAtivos();
    if (ativos < 2) {
      throw new ErroApp(400, 'Cadastre pelo menos 2 projetos ativos antes de abrir a votação');
    }

    const { status, abertaEm, encerradaEm } = await VotacaoModel.abrir();
    res.json({ status, abertaEm, encerradaEm });
  },

  // POST /admin/votacao/encerrar  (RF09: ABERTA -> ENCERRADA)
  async encerrar(req, res) {
    // RN28: confirmação explícita
    if (req.body?.confirmar !== true) {
      throw new ErroApp(400, 'Confirme o encerramento enviando { "confirmar": true }');
    }

    const votacao = await VotacaoModel.obter();
    if (votacao.status !== 'ABERTA') {
      throw new ErroApp(403, 'Só é possível encerrar uma votação aberta');
    }

    // RN29: grava data/hora; a partir daqui nenhum voto ou cadastro é aceito
    const { status, abertaEm, encerradaEm } = await VotacaoModel.encerrar();
    res.json({ status, abertaEm, encerradaEm });
  },
};

module.exports = VotacaoController;
