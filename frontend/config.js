// Endereço da API.
// - Rodando local pela própria API (http://localhost:3000 ou http://IP:3000): usa o mesmo endereço.
// - Abrindo pelo Live Server (porta 5500) ou outro servidor: aponta para a API local.
// - Publicado no Render: troque API_PRODUCAO pela URL do seu Web Service.
const API_LOCAL = 'http://localhost:3000';
const API_PRODUCAO = 'https://votrix-api.onrender.com';

const API_URL = (() => {
  if (location.hostname.endsWith('onrender.com')) return API_PRODUCAO;
  if (location.port === '3000') return ''; // mesmo servidor
  return API_LOCAL;
})();
