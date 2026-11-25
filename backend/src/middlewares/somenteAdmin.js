// RN23: rotas da dashboard só com perfil ADMIN; qualquer outro recebe 403
const ErroApp = require('../utils/ErroApp');

function somenteAdmin(req, res, next) {
  if (req.usuario?.perfil !== 'ADMIN') {
    return next(new ErroApp(403, 'Acesso restrito ao administrador'));
  }
  next();
}

module.exports = somenteAdmin;
