const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const somenteAdmin = require('../middlewares/somenteAdmin');

const AuthController = require('../controllers/AuthController');
const VotacaoController = require('../controllers/VotacaoController');
const ProjetoController = require('../controllers/ProjetoController');
const VotoController = require('../controllers/VotoController');
const AdminController = require('../controllers/AdminController');
const PodioController = require('../controllers/PodioController');

const rotas = Router();

// ---------- Públicas ----------
rotas.post('/auth/cadastro', AuthController.cadastrar);
rotas.post('/auth/login', AuthController.login);
rotas.get('/votacao/status', VotacaoController.status);
rotas.get('/podio', PodioController.exibir);

// ---------- Eleitor (logado) ----------
rotas.get('/projetos', autenticar, ProjetoController.listarAtivos);
rotas.post('/votos', autenticar, VotoController.registrar);
rotas.get('/votos/meu', autenticar, VotoController.meu);

// ---------- Administrador ----------
const admin = Router();
admin.use(autenticar, somenteAdmin);

admin.get('/projetos', ProjetoController.listarTodos);
admin.post('/projetos', ProjetoController.criar);
admin.put('/projetos/:id', ProjetoController.atualizar);
admin.delete('/projetos/:id', ProjetoController.excluir);
admin.get('/resultado', AdminController.resultado);
admin.get('/eleitores', AdminController.eleitores);
admin.post('/votacao/abrir', VotacaoController.abrir);
admin.post('/votacao/encerrar', VotacaoController.encerrar);

rotas.use('/admin', admin);

module.exports = rotas;
