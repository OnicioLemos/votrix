// Seed do Votrix, gerado a partir do backup do banco (dump de 25/11/2026).
//
// O que ele faz:
//   1. Cria/atualiza o administrador com os dados do .env (ADMIN_*)
//   2. Cadastra os projetos da feira
//   3. Cadastra os eleitores do backup (com a senha já criptografada)
//   4. Cria o registro único da votação
//
// Pode rodar quantas vezes quiser: usa upsert, então não duplica nada
// e NÃO sobrescreve o que já foi alterado pela dashboard.
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { limparCpf, cpfValido } = require('../src/utils/cpf');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Estado da votação ao criar o banco do zero.
// O backup estava ABERTA. Para começar a feira do zero e ainda poder
// cadastrar projetos (RN21), troque para 'NAO_INICIADA'.
// Se o registro já existir no banco, o estado atual é mantido.
// ---------------------------------------------------------------------------
const VOTACAO = {
  status: 'ABERTA',
  abertaEm: new Date('2026-11-25T18:13:04.969Z'),
  encerradaEm: null,
};

// ---------------------------------------------------------------------------
// Projetos (tabela votrix_projetos)
// ---------------------------------------------------------------------------
const PROJETOS = [
  {
    nome: 'Eventos Vale do Aço',
    equipe: 'Beatriz Batista, Dominick Taysunuda, Ryan Alexssander e Thays Aquino.',
    descricao:
      'O Eventos Vale do Aço é uma plataforma que conecta pessoas, experiências e oportunidades, reunindo e divulgando eventos de Coronel Fabriciano, Timóteo e Ipatinga em um só lugar. Por meio de filtros por cidade e categoria, os usuários podem descobrir atividades, consultar informações, acessar links de inscrição e conhecer novas possibilidades de lazer e cultura na região.',
    estande: null,
    imagemUrl: 'https://plain-enam-prod-public.komododecks.com/202611/25/nonbwOXMMiqXSmUWHUsl/image.png',
    ativo: true,
    criadoEm: new Date('2026-11-25T18:02:16.596Z'),
  },
  {
    nome: 'PetShop Camillo',
    equipe: 'não listado',
    descricao: 'não listado',
    estande: null,
    imagemUrl: null,
    ativo: true,
    criadoEm: new Date('2026-11-25T18:03:33.787Z'),
  },
  {
    nome: 'FriViu-Jogou',
    equipe: 'André Simão Carvalho Rodrigues, Maria Letícia Passos Silva & Samuel Heitor Silvano Magalhães Ferreira',
    descricao:
      'O projeto FRIViu-Jogou é uma miniplataforma intuitiva, viciante e de alto padrão profissional que traz três jogos principais desenvolvidos em HTML, CSS e JavaScript para rodar nativamente no navegador, sem exigir altos requisitos gráficos. Inspirado na ideia original do clássico site FRIV e nos arcades antigos, o projeto atende ao interesse geral do público por jogos simples e gratuitos, unindo a facilidade para jogar e a busca por cativar os usuários de forma dinâmica e nostálgica.',
    estande: null,
    imagemUrl: 'https://plain-enam-prod-public.komododecks.com/202611/25/U60ITkRFocLHpxJJyWqV/image.png',
    ativo: true,
    criadoEm: new Date('2026-11-25T18:04:51.074Z'),
  },
  {
    nome: 'Fácil ID',
    equipe: 'não listado',
    descricao: 'não listado',
    estande: null,
    imagemUrl: 'https://plain-enam-prod-public.komododecks.com/202611/25/fTyx7P6bhMvoKl3WClVj/image.png',
    ativo: true,
    criadoEm: new Date('2026-11-25T18:06:42.708Z'),
  },
  {
    nome: 'NOVA AI',
    equipe: 'Luan Gonçalves Barbosa, Kassio Silva Costa de Paula, Kauã Hernandes',
    // Texto cortado no limite de 500 caracteres (RN19), igual ao backup
    descricao:
      'A NOVA AI é uma assistente inteligente para computadores Windows, desenvolvida para facilitar tarefas do dia a dia por meio de comandos em linguagem natural. Ela utiliza inteligência artificial com Gemini e Ollama, podendo criar, editar, ler, organizar e gerenciar arquivos e pastas, além de executar tarefas autorizadas no computador. O projeto busca tornar a interação com o computador mais simples, rápida e acessível, reunindo automação, inteligência artificial e uma interface intuitiva em um ún',
    estande: null,
    imagemUrl: 'https://plain-enam-prod-public.komododecks.com/202611/25/b7cbfAOZJpEwYJ3zXGT5/image.png',
    ativo: true,
    criadoEm: new Date('2026-11-25T18:08:09.083Z'),
  },
  {
    nome: 'Pocket Hero: The Dungeon Inventory',
    equipe: 'não listado',
    descricao:
      'Pocket Hero: The Dungeon Inventory é uma aplicação Web de um jogo RPG na qual você escolhe entre as classes Warrior (Guerreiro), Archer (Arqueiro) ou Berserker (Bárbaro) e enfrenta ondas de monstros, minibosses e bosses, enquanto gerencia os itens da sua mochila. A cada inimigo derrotado, você coleta ouro para gastar na loja em armas mais fortes, comidas para restaurar seu HP e armaduras para aumentar sua defesa contra os próximos desafios.',
    estande: null,
    imagemUrl: 'https://plain-enam-prod-public.komododecks.com/202611/25/AjoY06GeLJmTZ8lscSct/image.png',
    ativo: true,
    criadoEm: new Date('2026-11-25T18:10:37.568Z'),
  },
  {
    nome: 'The Battle – A Conjunção Dos Doze’',
    equipe: 'Guilherme Neves, Fabiano Ravani, Jhuan Henrique',
    descricao:
      'O projeto ‘The Battle – A Conjunção Dos Doze’ é um RPG baseado em texto feito pelo Python, utilizando as bibliotecas TKInter para a interface gráfica (GUI), Random para os dados D20 e D6, dataclasses para simplificar a criação de classes, unittest, pygames ,pathlib e JSON. O projeto conta com recurso de salvamento de campanha,',
    estande: null,
    imagemUrl: 'https://plain-enam-prod-public.komododecks.com/202611/25/1ryS2GsWwauEOXXD6LRL/image.jpg',
    ativo: true,
    criadoEm: new Date('2026-11-25T18:12:15.370Z'),
  },
];

// ---------------------------------------------------------------------------
// Eleitores (tabela votrix_usuarios, perfil ELEITOR).
// A senha já está em hash bcrypt, copiada do backup: o eleitor
// continua entrando com a mesma senha de antes.
// ---------------------------------------------------------------------------
const ELEITORES = [
  {
    nome: 'Onicio Lemos',
    cpf: '07184570642',
    senhaHash: '$2b$10$HsS0oSPlujXKqwuZKh7tze4lcUO2y.HAWlvu2/7r76wQDzBHo.K9a',
    criadoEm: new Date('2026-11-25T18:15:46.166Z'),
  },
];

// ---------------------------------------------------------------------------

async function seedAdmin() {
  const nome = (process.env.ADMIN_NOME || 'Administrador').trim();
  const cpf = limparCpf(process.env.ADMIN_CPF);
  const senha = process.env.ADMIN_SENHA;

  if (!cpfValido(cpf)) throw new Error('ADMIN_CPF ausente ou inválido no .env');
  if (!senha || senha.length < 6) throw new Error('ADMIN_SENHA deve ter no mínimo 6 caracteres');

  const senhaHash = await bcrypt.hash(senha, 10);

  // O admin sempre segue o .env (troca de senha = rodar o seed de novo)
  await prisma.usuario.upsert({
    where: { cpf },
    update: { nome, senha: senhaHash, perfil: 'ADMIN' },
    create: { nome, cpf, senha: senhaHash, perfil: 'ADMIN' },
  });
  console.log(`  ✓ Admin: ${nome} (CPF ${cpf})`);
}

async function seedProjetos() {
  let criados = 0;
  for (const projeto of PROJETOS) {
    const existe = await prisma.projeto.findUnique({ where: { nome: projeto.nome } });
    if (existe) continue; // não sobrescreve edições feitas pela dashboard
    await prisma.projeto.create({ data: projeto });
    criados++;
  }
  console.log(`  ✓ Projetos: ${criados} criados, ${PROJETOS.length - criados} já existiam`);
}

async function seedEleitores() {
  let criados = 0;
  for (const e of ELEITORES) {
    const existe = await prisma.usuario.findUnique({ where: { cpf: e.cpf } });
    if (existe) continue;
    await prisma.usuario.create({
      data: { nome: e.nome, cpf: e.cpf, senha: e.senhaHash, perfil: 'ELEITOR', criadoEm: e.criadoEm },
    });
    criados++;
  }
  console.log(`  ✓ Eleitores: ${criados} criados, ${ELEITORES.length - criados} já existiam`);
}

async function seedVotacao() {
  const votacao = await prisma.votacao.upsert({
    where: { id: 1 },
    update: {}, // mantém o estado atual se já existir
    create: { id: 1, ...VOTACAO },
  });
  console.log(`  ✓ Votação: ${votacao.status}`);
}

async function main() {
  console.log('Seed do Votrix');
  await seedAdmin();
  await seedProjetos();
  await seedEleitores();
  await seedVotacao();
  console.log('Seed concluído.');
}

main()
  .catch((err) => {
    console.error('Erro no seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
