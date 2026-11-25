// Projetos de exemplo para testar localmente. Só cria se a tabela estiver vazia.
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const projetos = [
  {
    nome: 'EcoSense',
    equipe: 'Ana Souza, Bruno Lima, Carla Dias',
    descricao: 'Sensores IoT que monitoram a qualidade do ar nas salas de aula e alertam quando é hora de ventilar.',
    estande: 'A01',
  },
  {
    nome: 'LibraSign',
    equipe: 'Diego Alves, Elisa Martins',
    descricao: 'Tradutor de Libras em tempo real usando visão computacional na câmera do notebook.',
    estande: 'A02',
  },
  {
    nome: 'AgroDrone',
    equipe: 'Felipe Rocha, Gabriela Nunes, Hugo Pires',
    descricao: 'Drone de baixo custo que mapeia falhas de irrigação em pequenas propriedades.',
    estande: 'B01',
  },
  {
    nome: 'MedLembra',
    equipe: 'Isabela Costa, João Ribeiro',
    descricao: 'App que lembra idosos de tomar remédios e avisa a família quando uma dose é esquecida.',
    estande: 'B02',
  },
];

async function main() {
  const total = await prisma.projeto.count();
  if (total > 0) {
    console.log(`Já existem ${total} projetos. Nada foi criado.`);
    return;
  }
  await prisma.projeto.createMany({ data: projetos });
  console.log(`${projetos.length} projetos de exemplo criados.`);
}

main()
  .catch((err) => {
    console.error('Erro no seed de demonstração:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
