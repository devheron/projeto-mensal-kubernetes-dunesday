# Como subir o DUNESDAY no Kubernetes (Minikube)

Guia completo: do zero ate a aplicacao rodando no cluster local.

## Pre-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) instalado
- [kubectl](https://kubernetes.io/docs/tasks/tools/) instalado

## 1 — Iniciar o Minikube

```bash
minikube start --driver=docker
```

Verificar se esta rodando:

```bash
minikube status
```

## 2 — Apontar o Docker para o daemon do Minikube

As imagens precisam ser construidas DENTRO do Minikube, senao ele nao encontra.

**Linux / macOS:**
```bash
eval $(minikube docker-env)
```

**Windows PowerShell:**
```powershell
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
```

> **Importante:** Esse comando so vale para o terminal atual. Se abrir outro terminal, rode de novo.

## 3 — Construir as imagens Docker

Ainda no mesmo terminal onde fez o passo 2:

```bash
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
docker build -t todo-mongo:latest ./banco-de-dados
```

Conferir se as 3 imagens apareceram:

```bash
docker images | grep todo
```

## 4 — Criar os recursos Kubernetes

Aplique os manifestos nesta ordem (banco primeiro, depois backend, por ultimo frontend):

```bash
# Namespace (se estiver usando)
# kubectl create namespace dunesday

# ConfigMap e Secret
kubectl apply -f k8s/mongo-secret.yaml
kubectl apply -f k8s/app-configmap.yaml

# Banco de dados
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/mongo-service.yaml

# Backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

Ou tudo de uma vez (se a ordem dos arquivos estiver correta):

```bash
kubectl apply -f k8s/
```

## 5 — Verificar se tudo subiu

```bash
# Ver todos os pods
kubectl get pods -o wide

# Ver os services
kubectl get services

# Ver os deployments
kubectl get deployments

# Ver tudo junto
kubectl get all
```

Espere ate todos os pods mostrarem `Running` e `READY 1/1`.

## 6 — Acessar a aplicacao

O frontend usa um Service do tipo NodePort. Para abrir no navegador:

```bash
minikube service todo-frontend
```

Ou pegar a URL manualmente:

```bash
minikube service todo-frontend --url
```

## 7 — Comandos uteis para o dia a dia

### Ver logs de um pod

```bash
# Listar pods primeiro
kubectl get pods

# Ver logs (substitua o nome do pod)
kubectl logs <nome-do-pod>

# Logs em tempo real
kubectl logs -f <nome-do-pod>
```

### Entrar dentro de um pod

```bash
kubectl exec -it <nome-do-pod> -- /bin/sh
```

### Escalar replicas

```bash
# Exemplo: 3 replicas do backend
kubectl scale deployment todo-backend --replicas=3

# Verificar
kubectl get pods -o wide
```

### Reiniciar um deployment

```bash
kubectl rollout restart deployment todo-frontend
```

## 8 — Demonstracoes exigidas pelo exercicio

### 8.1 — Load balancing entre pods

```bash
# Escalar o backend para 2+ replicas
kubectl scale deployment todo-backend --replicas=2

# Ver os pods rodando em nos diferentes
kubectl get pods -o wide

# Testar varias requisicoes e observar qual pod responde
# (precisa do endpoint /health no backend com o HOSTNAME)
for i in $(seq 1 10); do
  curl -s $(minikube service todo-frontend --url)/api/health
  echo
done
```

### 8.2 — Auto-recreacao de pods

```bash
# Listar os pods
kubectl get pods

# Deletar um pod manualmente
kubectl delete pod <nome-do-pod>

# Ver o Kubernetes recriando automaticamente
kubectl get pods -w
```

O ReplicaSet garante que o numero de pods volte ao desejado.

### 8.3 — Comunicacao entre componentes

```bash
# Frontend -> Backend: via Service ClusterIP (todo-backend:8080)
# Backend -> MongoDB: via Service ClusterIP (todo-mongo:27017)
# Todos dentro do cluster, sem exposicao externa

# Verificar os services e seus ClusterIPs
kubectl get services

# Testar de dentro de um pod
kubectl exec -it <pod-do-backend> -- wget -qO- http://todo-backend:8080/todos
```

### 8.4 — ConfigMaps e Secrets

```bash
# Ver os ConfigMaps
kubectl get configmaps
kubectl describe configmap app-config

# Ver os Secrets (valores ficam em base64)
kubectl get secrets
kubectl describe secret mongo-secret
```

## 9 — Limpar tudo

```bash
# Remover todos os recursos
kubectl delete -f k8s/

# Parar o Minikube
minikube stop

# Deletar o cluster (remove tudo)
minikube delete
```

## 10 — Troubleshooting

| Problema | Solucao |
|----------|---------|
| Pod em `ImagePullBackOff` | Voce nao construiu a imagem dentro do Minikube. Rode `eval $(minikube docker-env)` e reconstrua. Os Deployments precisam de `imagePullPolicy: Never`. |
| Pod em `CrashLoopBackOff` | Veja os logs: `kubectl logs <pod>`. Geralmente e variavel de ambiente faltando ou banco nao conectou ainda. |
| `connection refused` no frontend | O nginx precisa do `proxy_pass` apontando para `http://todo-backend:8080/`. Confira o `nginx.conf`. |
| `minikube service` nao abre | Tente `minikube tunnel` em outro terminal e acesse pelo IP do service. |
| Imagens nao aparecem no `docker images` | O terminal perdeu o env do Minikube. Rode `eval $(minikube docker-env)` de novo. |
