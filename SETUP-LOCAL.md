# Como rodar o DUNESDAY localmente

Guia para subir o projeto na sua maquina sem Kubernetes, usando Docker Compose.

## Pre-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- [Node.js 18+](https://nodejs.org/) (so se quiser rodar o frontend fora do container)
- Git

## 1 — Clonar o repositorio

```bash
git clone https://github.com/devheron/projeto-mensal-kubernetes-dunesday.git
cd projeto-mensal-kubernetes-dunesday
```

## 2 — Rodar tudo com Docker Compose

O `docker-compose.yaml` sobe os 3 servicos de uma vez: MongoDB, backend e frontend.

```bash
docker compose up --build
```

Aguarde ate aparecer:
- `Conectado ao MongoDB`
- `Servidor rodando na porta 8080`

Acesse: **http://localhost** (porta 80)

Para parar:

```bash
docker compose down
```

## 3 — Rodar so o frontend em modo dev (sem Docker)

Se quiser editar o frontend com hot reload:

```bash
# Terminal 1 — sobe o banco e o backend
docker compose up mongo backend

# Terminal 2 — roda o frontend em modo dev
cd frontend
npm install
npm start
```

O React abre em **http://localhost:3000** e aponta para o backend em `http://localhost:5000` (valor padrao da variavel `REACT_APP_API_URL`).

> **Nota:** O backend dentro do Docker escuta na porta 8080, mas o `docker-compose.yaml` mapeia `5000:5000`. Se der erro de conexao, confira se o mapeamento de portas esta correto ou ajuste a variavel:
>
> ```bash
> set REACT_APP_API_URL=http://localhost:8080
> npm start
> ```

## 4 — Arte de campanha (opcional)

As imagens do fundo ficam em `frontend/public/campanha/`. Sem elas o projeto roda normal — o fundo procedural assume. Se quiser ativar:

1. Coloque os 4 arquivos na pasta:
   - `arrakis-1.jpg` — Dune escuro (esquerda)
   - `latveria-1.jpg` — Doom escuro (direita)
   - `arrakis-2.jpg` — Dune claro (esquerda)
   - `latveria-2.jpg` — Doom claro (direita)
2. Os pares precisam ter luminosidade parecida entre si.
3. Esses arquivos sao gitignored — nao vao pro repositorio.

## Estrutura de pastas

```
projeto-mensal-kubernetes-dunesday/
├── frontend/          # React 19 + nginx (multi-stage Docker build)
├── backend/           # Express + Mongoose
├── banco-de-dados/    # Mongo com script de seed
├── k8s/               # Manifestos Kubernetes (usado no Minikube)
├── docker-compose.yaml
└── README.md
```
