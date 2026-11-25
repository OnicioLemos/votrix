const prisma = require('../config/prisma');

const UsuarioModel = {
  buscarPorCpf(cpf) {
    return prisma.usuario.findUnique({ where: { cpf } });
  },

  criarEleitor({ nome, cpf, senhaHash }) {
    // RN08: o cadastro público sempre cria ELEITOR
    return prisma.usuario.create({
      data: { nome, cpf, senha: senhaHash, perfil: 'ELEITOR' },
      select: { id: true, nome: true, perfil: true, criadoEm: true },
    });
  },

  contarEleitores() {
    return prisma.usuario.count({ where: { perfil: 'ELEITOR' } });
  },

  listarEleitores() {
    return prisma.usuario.findMany({
      where: { perfil: 'ELEITOR' },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        nome: true,
        cpf: true,
        criadoEm: true,
        voto: { select: { criadoEm: true } },
      },
    });
  },
};

module.exports = UsuarioModel;
