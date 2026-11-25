const ResultadoModel = require('../models/ResultadoModel');
const UsuarioModel = require('../models/UsuarioModel');
const VotacaoModel = require('../models/VotacaoModel');
const { mascararCpf } = require('../utils/cpf');

const AdminController = {
  // GET /admin/resultado  (RF08: RN24, RN25, RN27)
  async resultado(req, res) {
    const [votacao, resultado, totalEleitores] = await Promise.all([
      VotacaoModel.obter(),
      ResultadoModel.porProjeto(),
      UsuarioModel.contarEleitores(),
    ]);

    res.json({
      status: votacao.status,
      abertaEm: votacao.abertaEm,
      encerradaEm: votacao.encerradaEm,
      totalVotos: resultado.totalVotos,
      totalEleitores,
      projetos: resultado.projetos.map(({ ultimoVoto, ...p }) => p),
    });
  },

  // GET /admin/eleitores  (RNF08: CPF sempre mascarado)
  async eleitores(req, res) {
    const lista = await UsuarioModel.listarEleitores();
    res.json(
      lista.map((u) => ({
        id: u.id,
        nome: u.nome,
        cpf: mascararCpf(u.cpf),
        criadoEm: u.criadoEm,
        votou: Boolean(u.voto), // mostra SE votou, nunca EM QUEM
      }))
    );
  },
};

module.exports = AdminController;
