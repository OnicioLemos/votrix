const prisma = require('../config/prisma');
const ErroApp = require('../utils/ErroApp');
const VotacaoModel = require('./VotacaoModel');

const VotoModel = {
  // RNF06: estado da votação, projeto e voto anterior conferidos
  // na mesma transação em que o voto é gravado.
  registrar(usuarioId, projetoId) {
    return prisma.$transaction(async (tx) => {
      const votacao = await VotacaoModel.obter(tx);
      if (votacao.status !== 'ABERTA') {
        throw new ErroApp(403, 'A votação não está aberta'); // RN12
      }

      const projeto = await tx.projeto.findUnique({ where: { id: projetoId } });
      if (!projeto || !projeto.ativo) {
        throw new ErroApp(404, 'Projeto não encontrado'); // RN13
      }

      const votoAnterior = await tx.voto.findUnique({ where: { usuarioId } });
      if (votoAnterior) {
        throw new ErroApp(409, 'Você já votou'); // RN10 / RN11
      }

      // RN17: grava usuário, projeto e data/hora
      return tx.voto.create({
        data: { usuarioId, projetoId },
        include: { projeto: { select: { id: true, nome: true } } },
      });
    });
  },

  buscarDoUsuario(usuarioId) {
    return prisma.voto.findUnique({
      where: { usuarioId },
      include: { projeto: { select: { id: true, nome: true, equipe: true } } },
    });
  },

  contarTotal() {
    return prisma.voto.count();
  },

  // RN17: contagem sempre calculada a partir da tabela de votos.
  // Devolve, por projeto, a quantidade de votos e a hora do último voto (RN31).
  async contarPorProjeto() {
    const grupos = await prisma.voto.groupBy({
      by: ['projetoId'],
      _count: { _all: true },
      _max: { criadoEm: true },
    });
    return grupos.map((g) => ({
      projetoId: g.projetoId,
      votos: g._count._all,
      ultimoVoto: g._max.criadoEm,
    }));
  },
};

module.exports = VotoModel;
