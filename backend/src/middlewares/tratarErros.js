// RNF02: todos os erros saem no formato { "erro": "mensagem" }
const ErroApp = require('../utils/ErroApp');

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  if (err instanceof ErroApp) {
    return res.status(err.status).json({ erro: err.message });
  }

  // JSON mal formatado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }

  // Violação de índice UNIQUE vinda do banco (RN04, RN10, nome do projeto)
  if (err.code === 'P2002') {
    return res.status(409).json({ erro: 'Registro duplicado' });
  }

  // Chave estrangeira inválida (ex.: usuário ou projeto apagado no meio da operação)
  if (err.code === 'P2003') {
    return res.status(409).json({ erro: 'Registro relacionado não encontrado. Atualize a página e tente de novo' });
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor' });
}

module.exports = { rotaNaoEncontrada, tratarErros };
