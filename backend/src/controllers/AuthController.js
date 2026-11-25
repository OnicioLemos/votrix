const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
const VotacaoModel = require('../models/VotacaoModel');
const ErroApp = require('../utils/ErroApp');
const { limparCpf, cpfValido } = require('../utils/cpf');

function gerarToken(usuario) {
  // RN06: token com id e perfil, válido por 8 horas.
  // "ts" (data de criação do usuário) permite ao middleware autenticar
  // detectar tokens antigos depois que o banco é recriado.
  return jwt.sign(
    { id: usuario.id, perfil: usuario.perfil, nome: usuario.nome, ts: new Date(usuario.criadoEm).getTime() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

const AuthController = {
  // POST /auth/cadastro  (RF01: RN01–RN05, RN08, RN09)
  async cadastrar(req, res) {
    const { nome, cpf, senha } = req.body || {};

    // RN01: os três campos são obrigatórios
    if (!nome || !cpf || !senha) {
      throw new ErroApp(400, 'Informe nome, CPF e senha');
    }

    // RN02: nome de 3 a 100 caracteres, sem espaços nas pontas
    const nomeLimpo = String(nome).trim().replace(/\s+/g, ' ');
    if (nomeLimpo.length < 3 || nomeLimpo.length > 100) {
      throw new ErroApp(400, 'O nome deve ter entre 3 e 100 caracteres');
    }

    // RN03: CPF válido, gravado só com os dígitos
    const cpfLimpo = limparCpf(cpf);
    if (!cpfValido(cpfLimpo)) {
      throw new ErroApp(400, 'CPF inválido');
    }

    // RN05: senha com no mínimo 6 caracteres
    if (String(senha).length < 6) {
      throw new ErroApp(400, 'A senha deve ter no mínimo 6 caracteres');
    }

    // RN09: cadastro bloqueado após o encerramento
    const votacao = await VotacaoModel.obter();
    if (votacao.status === 'ENCERRADA') {
      throw new ErroApp(403, 'A votação foi encerrada. Novos cadastros não são aceitos');
    }

    // RN04: CPF único
    if (await UsuarioModel.buscarPorCpf(cpfLimpo)) {
      throw new ErroApp(409, 'CPF já cadastrado');
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);

    let usuario;
    try {
      // RN08: o perfil enviado no corpo é ignorado
      usuario = await UsuarioModel.criarEleitor({ nome: nomeLimpo, cpf: cpfLimpo, senhaHash });
    } catch (err) {
      if (err.code === 'P2002') throw new ErroApp(409, 'CPF já cadastrado');
      throw err;
    }

    // Já devolve o token para o eleitor entrar direto na votação
    res.status(201).json({ token: gerarToken(usuario), usuario });
  },

  // POST /auth/login  (RF02: RN06, RN07)
  async login(req, res) {
    const { cpf, senha } = req.body || {};
    const erroGenerico = new ErroApp(401, 'CPF ou senha inválidos'); // RN07

    if (!cpf || !senha) throw erroGenerico;

    const usuario = await UsuarioModel.buscarPorCpf(limparCpf(cpf));
    if (!usuario) throw erroGenerico;

    const senhaConfere = await bcrypt.compare(String(senha), usuario.senha);
    if (!senhaConfere) throw erroGenerico;

    // RN05: a senha nunca é devolvida
    res.json({
      token: gerarToken(usuario),
      usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
    });
  },
};

module.exports = AuthController;
