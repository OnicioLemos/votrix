// RNF03: lê o token JWT do cabeçalho Authorization: Bearer <token>
// e confere no banco se o usuário do token ainda existe.
//
// Por que conferir no banco? Se o banco for recriado (npm run reset ou seed
// num banco novo), os ids mudam. Um token antigo guardado no navegador
// apontaria para um usuário que não existe mais (erro de chave estrangeira
// ao votar) ou, pior, para OUTRA pessoa que recebeu o mesmo id.
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ErroApp = require('../utils/ErroApp');

async function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return next(new ErroApp(401, 'Faça login para continuar'));
  }

  let dados;
  try {
    dados = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new ErroApp(401, 'Sessão expirada. Faça login novamente'));
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(dados.id) },
      select: { id: true, nome: true, perfil: true, criadoEm: true },
    });

    // "ts" = data de criação do usuário gravada no token: garante que o id
    // ainda é da mesma pessoa que fez o login
    const mesmoUsuario = usuario && usuario.criadoEm.getTime() === dados.ts;
    if (!mesmoUsuario) {
      return next(new ErroApp(401, 'Sessão inválida. Faça login novamente'));
    }

    // O perfil vem do banco, não do token
    req.usuario = { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = autenticar;
