const VotoModel = require('../models/VotoModel');
const ErroApp = require('../utils/ErroApp');

const VotoController = {
  // POST /votos  (RF04: RN10–RN14, RN17)
  async registrar(req, res) {
    // RN14: o administrador não vota
    if (req.usuario.perfil === 'ADMIN') {
      throw new ErroApp(403, 'O administrador não vota');
    }

    const projetoId = Number(req.body?.projetoId);
    if (!Number.isInteger(projetoId) || projetoId <= 0) {
      throw new ErroApp(400, 'Informe o projeto (projetoId)');
    }

    try {
      const voto = await VotoModel.registrar(req.usuario.id, projetoId);
      res.status(201).json({
        mensagem: 'Voto registrado',
        voto: { projeto: voto.projeto, criadoEm: voto.criadoEm },
      });
    } catch (err) {
      // Dois cliques ao mesmo tempo: o índice UNIQUE do banco segura (RN10)
      if (err.code === 'P2002') throw new ErroApp(409, 'Você já votou');
      throw err;
    }
  },

  // GET /votos/meu  (RF05: RN16 — mostra o próprio voto, sem contagem parcial)
  async meu(req, res) {
    const voto = await VotoModel.buscarDoUsuario(req.usuario.id);
    if (!voto) return res.json({ votou: false, voto: null });

    res.json({
      votou: true,
      voto: { projeto: voto.projeto, criadoEm: voto.criadoEm },
    });
  },
};

module.exports = VotoController;
