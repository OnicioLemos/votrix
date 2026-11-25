# VOTRIX — versão local

Sistema de votação da feira técnica de tecnologia, rodando no seu computador com MySQL local. Não depende do Render nem da Clever Cloud.

- **Back-end:** Node.js, Express 5 e Prisma 6 com MySQL, em arquitetura MVC
- **Front-end:** HTML, CSS e JavaScript puro, servido pela própria API
- **Regras:** RN01–RN32 do documento *Votrix — Levantamento de Regras de Negócio*

```
votrix/
├── backend/
│   ├── prisma/schema.prisma     # 4 tabelas com prefixo votrix_
│   ├── prisma/seed.js           # cria o admin e o registro da votação
│   ├── prisma/seed-demo.js      # 4 projetos de exemplo (opcional)
│   ├── src/config/              # instância do Prisma
│   ├── src/models/              # acesso ao banco (Usuario, Projeto, Voto, Votacao, Resultado)
│   ├── src/controllers/         # regras de negócio
│   ├── src/routes/              # rotas da API
│   ├── src/middlewares/         # autenticar, somenteAdmin, tratarErros
│   ├── src/utils/               # cpf.js, ErroApp.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── index.html  cadastro.html  votar.html  admin.html  podio.html
    ├── css/style.css
    ├── js/
    └── config.js
```

---

## 1. Ter um MySQL rodando (sem precisar de administrador)

Escolha **uma** das opções.

### Opção A: o MySQL ou XAMPP do laboratório já está instalado
Só confira usuário, senha e porta (normalmente `root`, sem senha, porta `3306`).

### Opção B: XAMPP portátil
1. Baixe o XAMPP para Windows na versão **.zip (portable)**, não o instalador.
2. Extraia numa pasta sua, por exemplo `C:\Users\SEU_USUARIO\xampp`.
3. Rode `setup_xampp.bat` uma vez e depois abra `xampp-control.exe`.
4. Clique em **Start** no MySQL. Usuário `root`, sem senha.

> O MySQL do XAMPP é na verdade o MariaDB, que o Prisma aceita com o provider `mysql`.

### Opção C: MySQL Community em ZIP (noinstall)
1. Baixe o **MySQL Community Server → ZIP Archive** e extraia em `C:\Users\SEU_USUARIO\mysql`.
2. No terminal, dentro da pasta extraída:
   ```bat
   bin\mysqld --initialize-insecure --console
   bin\mysqld --console
   ```
3. Deixe essa janela aberta: enquanto ela estiver aberta, o MySQL está rodando. Usuário `root`, sem senha.

Você **não** precisa criar o banco `votrix` à mão: o Prisma cria sozinho no passo 3.

---

## 2. Configurar o `.env`

```bat
cd backend
copy .env.example .env
```

Abra o `.env` e ajuste a `DATABASE_URL`:

```env
# root sem senha (XAMPP / ZIP)
DATABASE_URL="mysql://root:@localhost:3306/votrix"

# root com senha
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/votrix"
```

Troque também o `JWT_SECRET` e os dados `ADMIN_NOME`, `ADMIN_CPF` e `ADMIN_SENHA`. O CPF do admin precisa ser válido. O padrão `52998224725` é um CPF de teste.

---

## 3. Instalar, criar as tabelas e iniciar

```bat
cd backend
npm install
npm run setup
npm start
```

| Comando | O que faz |
| --- | --- |
| `npm run setup` | `prisma db push` (cria o banco e as tabelas) + seed do admin |
| `npm run seed:demo` | Cadastra 4 projetos de exemplo (só se a tabela estiver vazia) |
| `npm start` | Sobe a API e o front em `http://localhost:3000` |
| `npm run dev` | Igual ao start, mas reinicia sozinho quando você salva um arquivo |
| `npm run studio` | Abre o Prisma Studio para ver os dados no navegador |
| `npm run reset` | **Apaga tudo** e recria do zero (útil para testar de novo depois de encerrar) |

Abra **http://localhost:3000** e entre com o CPF e a senha do admin.

Os dados ficam gravados no MySQL. Se você desligar o computador e rodar `npm start` de novo, cadastros, votos e o estado da votação continuam lá.

---

## 4. Usar na feira (celulares na mesma rede)

Ao iniciar, o terminal mostra algo como:

```
  VOTRIX rodando
  Neste computador:  http://localhost:3000
  Na rede local:     http://192.168.0.15:3000
```

Os visitantes acessam o endereço **"Na rede local"** pelo celular, conectados ao mesmo Wi-Fi. Dá para gerar um QR Code com esse endereço e colar nos estandes.

**Teste com um celular antes da feira.** Duas coisas podem bloquear o acesso:

- **Firewall do Windows:** na primeira execução, o Windows pergunta se libera o Node.js na rede. Sem permissão de administrador, talvez não dê para liberar. Nesse caso, peça à TI uma regra de entrada para a porta `3000` (ou para o `node.exe`).
- **Isolamento de clientes no Wi-Fi:** algumas redes institucionais não deixam um aparelho enxergar o outro. Se o celular não abrir a página mesmo com o firewall liberado, a saída é usar um roteador próprio ou o hotspot de um celular, com o notebook conectado nele.

---

## 5. Fluxo do dia

1. **Admin** entra, cadastra os projetos (ou roda `npm run seed:demo` para testar).
2. **Abrir votação**: exige pelo menos 2 projetos ativos (RN22). Depois disso não entram projetos novos (RN21).
3. **Eleitores** se cadastram com nome, CPF e senha e votam uma vez (RN10), com confirmação (RN15).
4. A **dashboard** mostra o gráfico de rosca, os percentuais e a participação, e se atualiza a cada 10 s (RN26).
5. **Encerrar votação**: o admin precisa digitar `ENCERRAR` para confirmar. É irreversível (RN28).
6. O **pódio** fica público em `/podio.html` (RN30). Dá para deixar essa página aberta no telão: ela aparece sozinha assim que a votação é encerrada.

---

## 6. Rotas da API

| Método | Rota | Acesso | Função |
| --- | --- | --- | --- |
| POST | `/auth/cadastro` | Público | Cria eleitor e já devolve o token |
| POST | `/auth/login` | Público | Devolve token e perfil |
| GET | `/votacao/status` | Público | Estado atual da votação |
| GET | `/podio` | Público (após encerrar) | Top 3 |
| GET | `/projetos` | Logado | Projetos ativos |
| POST | `/votos` | Eleitor | `{ "projetoId": 1 }` |
| GET | `/votos/meu` | Eleitor | O próprio voto |
| GET | `/admin/projetos` | Admin | Todos os projetos, com votos |
| POST | `/admin/projetos` | Admin | Cadastra projeto |
| PUT | `/admin/projetos/:id` | Admin | Edita ou desativa (`{ "ativo": false }`) |
| DELETE | `/admin/projetos/:id` | Admin | Exclui se não houver votos |
| GET | `/admin/resultado` | Admin | Votos e percentual por projeto |
| GET | `/admin/eleitores` | Admin | Eleitores com CPF mascarado |
| POST | `/admin/votacao/abrir` | Admin | `NAO_INICIADA` → `ABERTA` |
| POST | `/admin/votacao/encerrar` | Admin | `{ "confirmar": true }`, `ABERTA` → `ENCERRADA` |
| GET | `/api/saude` | Público | Confere se a API e o banco respondem |

Erros sempre no formato `{ "erro": "mensagem" }`, com os códigos 400, 401, 403, 404 e 409.

---

## 7. Voltar para o deploy (Render + Clever Cloud)

O código é o mesmo. Muda só o ambiente:

- **Render Web Service:** Root Directory `backend`, Build `npm install && npx prisma db push && npm run seed`, Start `npm start`. Nas variáveis, use a `DATABASE_URL` da Clever Cloud com `?connection_limit=2`, `SERVIR_FRONT=false` e `CORS_ORIGIN` com a URL do Static Site.
- **Render Static Site:** Root Directory `frontend`. Ajuste `API_PRODUCAO` em `frontend/config.js`.

---

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| `Não foi possível conectar ao MySQL` | MySQL parado, ou usuário/senha/porta errados na `DATABASE_URL` |
| `P1001` no `npm run setup` | Mesmo caso acima |
| `Defina JWT_SECRET` | Faltou criar o `.env` a partir do `.env.example` |
| Porta 3000 ocupada | Mude `PORT` no `.env` (e `API_LOCAL` em `frontend/config.js` se usar o Live Server) |
| Celular não abre a página | Firewall ou isolamento de Wi-Fi (veja a seção 4) |
| Encerrei e quero testar de novo | `npm run reset` (apaga todos os dados) |
