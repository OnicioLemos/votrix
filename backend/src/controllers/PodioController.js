const ResultadoModel = require('../models/ResultadoModel');
const VotacaoModel = require('../models/VotacaoModel');
const ErroApp = require('../utils/ErroApp');

const PodioController = {
  // GET /podio  (RF10: público, só após encerrar — RN30–RN32)
  async exibir(req, res) {
    const votacao = await VotacaoModel.obter();
    if (votacao.status !== 'ENCERRADA') {
      throw new ErroApp(403, 'O pódio fica disponível após o encerramento da votação');
    }

    const { totalVotos, podio } = await ResultadoModel.podio();
    res.json({ encerradaEm: votacao.encerradaEm, totalVotos, podio });
  },
};

module.exports = PodioController;
