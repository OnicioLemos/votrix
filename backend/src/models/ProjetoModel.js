const prisma = require('../config/prisma');

const camposPublicos = {
  id: true,
  nome: true,
  equipe: true,
  descricao: true,
  estande: true,
  imagemUrl: true,
};

const ProjetoModel = {
  // RN13 / RF03: só projetos ativos aparecem para o eleitor
  listarAtivos() {
    return prisma.projeto.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: camposPublicos,
    });
  },

  // Admin: todos, inclusive inativos, com a quantidade de votos
  listarTodos() {
    return prisma.projeto.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { votos: true } } },
    });
  },

  buscarPorId(id) {
    return prisma.projeto.findUnique({
      where: { id },
      include: { _count: { select: { votos: true } } },
    });
  },

  buscarPorNome(nome) {
    return prisma.projeto.findUnique({ where: { nome } });
  },

  contarAtivos() {
    return prisma.projeto.count({ where: { ativo: true } });
  },

  criar(dados) {
    return prisma.projeto.create({ data: dados });
  },

  atualizar(id, dados) {
    return prisma.projeto.update({ where: { id }, data: dados });
  },

  excluir(id) {
    return prisma.projeto.delete({ where: { id } });
  },
};

module.exports = ProjetoModel;
