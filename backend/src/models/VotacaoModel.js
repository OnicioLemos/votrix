const prisma = require('../config/prisma');

// A votação é um registro único (id = 1) na tabela votrix_votacao
const ID_VOTACAO = 1;

const VotacaoModel = {
  async obter(cliente = prisma) {
    // Garante que o registro exista mesmo se o seed não tiver rodado
    return cliente.votacao.upsert({
      where: { id: ID_VOTACAO },
      update: {},
      create: { id: ID_VOTACAO },
    });
  },

  abrir() {
    return prisma.votacao.update({
      where: { id: ID_VOTACAO },
      data: { status: 'ABERTA', abertaEm: new Date() },
    });
  },

  encerrar() {
    return prisma.votacao.update({
      where: { id: ID_VOTACAO },
      data: { status: 'ENCERRADA', encerradaEm: new Date() },
    });
  },
};

module.exports = VotacaoModel;
