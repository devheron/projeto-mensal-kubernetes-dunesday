# Manifestos Kubernetes

Diretório reservado para os arquivos YAML do cluster. Cada arquivo entra aqui
conforme o card correspondente do Trello é concluído.

## Arquivos previstos

| Arquivo                     | Card | O que define                                  |
| --------------------------- | ---- | --------------------------------------------- |
| `configmap.yaml`            | 7    | Variáveis não sensíveis da aplicação          |
| `mongo-secret.example.yaml` | 6    | Modelo do Secret, sem o valor real            |
| `mongo-pvc.yaml`            | 9    | Volume persistente do banco                   |
| `mongo-deployment.yaml`     | 9    | Pod do MongoDB                                |
| `mongo-service.yaml`        | 9    | ClusterIP do banco, porta 27017               |
| `backend-deployment.yaml`   | 8    | Pod da API, porta 8080, probes em `/health`   |
| `backend-service.yaml`      | 8    | ClusterIP da API                              |
| `frontend-deployment.yaml`  | 10   | Pods do frontend, 2 réplicas                  |
| `frontend-service.yaml`     | 10   | Exposição externa do frontend                 |

## Ordem de aplicação

O banco sobe antes da API, e a API antes do frontend, para que as probes não
falhem em sequência enquanto as dependências ainda não estão prontas.

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mongo-secret.yaml
kubectl apply -f k8s/mongo-pvc.yaml
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/mongo-service.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

## Secret

O arquivo `mongo-secret.yaml` com a string de conexão real nunca vai para o Git.
Só o `.example.yaml` é versionado. O `.gitignore` da raiz já cobre isso.

Para criar o Secret na máquina:

```bash
kubectl create secret generic mongo-secret \
  --from-literal=MONGO_URI='mongodb://todo-mongo:27017/todo-app'
```
