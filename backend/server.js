require('dotenv').config();

const path = require('path');
const os = require('os');
const express = require('express');
const cors = require('cors');

const rotas = require('./src/routes');
const prisma = require('./src/config/prisma');
const { rotaNaoEncontrada, tratarErros } = require('./src/middlewares/tratarErros');

if (!process.env.JWT_SECRET) {
  console.error('Defina JWT_SECRET no arquivo .env (copie de .env.example)');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS: "*" ou lista separada por vírgula
const origens = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim().replace(/\/$/, ''));
app.use(cors({ origin: origens.includes('*') ? true : origens }));
app.use(express.json({ limit: '100kb' }));

// Saúde da API (útil para conferir se está no ar)
app.get('/api/saude', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, app: 'Votrix', banco: 'conectado' });
});

// Na versão local, a própria API entrega o front-end
if (process.env.SERVIR_FRONT !== 'false') {
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
  // Chart.js servido do node_modules: o gráfico funciona mesmo sem internet
  app.get('/vendor/chart.umd.min.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'chart.js', 'dist', 'chart.umd.min.js'));
  });
}

app.use(rotas);
app.use(rotaNaoEncontrada);
app.use(tratarErros);

function ipsDaRede() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}

async function iniciar() {
  try {
    await prisma.$connect();
  } catch (err) {
    console.error('\n[ERRO] Não foi possível conectar ao MySQL.');
    console.error('Confira se o MySQL está rodando e se a DATABASE_URL do .env está certa.');
    console.error(err.message);
    process.exit(1);
  }

  // 0.0.0.0 = aceita conexões de outros aparelhos da mesma rede (celulares na feira)
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n  VOTRIX rodando');
    console.log(`  Neste computador:  http://localhost:${PORT}`);
    for (const ip of ipsDaRede()) {
      console.log(`  Na rede local:     http://${ip}:${PORT}`);
    }
    console.log('');
  });
}

iniciar();

module.exports = app;
