# DUNESDAY

**Ordens de Campanha** — aplicacao full-stack de gerenciamento de tarefas containerizada e orquestrada com Kubernetes.

Projeto do Exercicio 2 do Mensal de Solucoes Cloud — UniAmerica 2026.

## Equipe

- **Heron Felipe**
- **Jihad Ghozayel**

## Sobre o projeto

Uma aplicacao de to-do list tematica inspirada no conflito entre dois universos: **Arrakis** (Dune Part Three) e **Latveria** (Avengers: Doomsday). A interface alterna automaticamente entre os dois mundos, mudando cores, vocabulario, efeitos visuais e sons ambientes.

O objetivo tecnico e migrar uma aplicacao que rodava na nuvem (Google Cloud Run) para um cluster Kubernetes local usando Minikube, demonstrando os conceitos fundamentais de orquestracao de containers.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, nginx |
| Backend | Node.js 18, Express, Mongoose |
| Banco de dados | MongoDB |
| Containers | Docker (multi-stage build) |
| Orquestracao | Kubernetes via Minikube |

## Arquitetura

```
┌────────────────────────────────────────────────┐
│                  Minikube Cluster               │
│                                                 │
│  ┌───────────┐    ┌───────────┐   ┌──────────┐ │
│  │ frontend  │───>│  backend  │──>│  MongoDB  │ │
│  │ (nginx)   │    │ (express) │   │           │ │
│  │ NodePort  │    │ ClusterIP │   │ ClusterIP │ │
│  │ 2 replicas│    │           │   │  + PVC    │ │
│  └───────────┘    └───────────┘   └──────────┘ │
│                                                 │
└────────────────────────────────────────────────┘
```

- **Frontend** comunica com o backend via proxy reverso do nginx (`/api/` -> `todo-backend:8080`)
- **Backend** conecta no MongoDB via DNS interno do cluster (`todo-mongo:27017`)
- Credenciais do banco gerenciadas por **Secret**
- Configuracoes da aplicacao em **ConfigMap**
- Nada roda fora do cluster

## Funcionalidades demonstradas

- Containerizacao completa com Docker (3 imagens)
- Deployments e Services no Kubernetes
- Comunicacao interna entre pods via Services ClusterIP
- Replicas e load balancing entre pods
- Auto-recreacao de pods apos exclusao manual
- ConfigMaps para configuracao da aplicacao
- Secrets para credenciais do banco de dados
- Imagens construidas dentro do daemon do Minikube (`imagePullPolicy: Never`)

## Interface

A interface muda entre dois temas a cada 18 segundos:

- **Arrakis** — tons de areia e ambar, tempestade de areia com raios, vocabulario dos Fremen
- **Latveria** — tons de verde e trevas, fumaca de feiticaria com raios verdes, vocabulario do trono de Doom

Efeitos procedurais: particulas animadas em canvas, raios com ramificacao, audio sintetizado por Web Audio API (sem arquivos de audio), arte SVG inline (zero peso de assets).

## Projeto anterior

Este projeto e a evolucao do [Mensal 1 — Infraestrutura Cloud](https://github.com/devheron/aula-uniamerica-infraestrutura-cloud), que rodava no Google Cloud Run com HTTPS, Load Balancer, Cloud Armor e MongoDB Atlas.
