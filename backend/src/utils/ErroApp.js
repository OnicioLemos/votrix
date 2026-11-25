// Erro de regra de negócio com código HTTP (RNF02).
// O middleware tratarErros transforma em { "erro": "mensagem" }.
class ErroApp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

module.exports = ErroApp;
