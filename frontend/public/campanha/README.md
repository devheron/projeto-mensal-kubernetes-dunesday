# Arte de campanha

Os arquivos de imagem do plano de fundo ficam aqui. A aplicação testa cada par
antes de pintar qualquer coisa: se um arquivo não existir, aquele par é ignorado
e o fundo procedural assume sozinho. Por isso o projeto roda normalmente com esta
pasta vazia, inclusive dentro do Minikube.

## Nomes esperados

| Arquivo            | Lado     | Mundo                      |
| ------------------ | -------- | -------------------------- |
| `arrakis-1.jpg`    | esquerda | Arrakis, versão escura     |
| `latveria-1.jpg`   | direita  | Latveria, versão escura    |
| `arrakis-2.jpg`    | esquerda | Arrakis, versão clara      |
| `latveria-2.jpg`   | direita  | Latveria, versão clara     |

Arrakis sempre ocupa a esquerda e Latveria sempre a direita. O par 1 e o par 2
alternam a cada 2 minutos, com transição de 6 segundos.

## Como escolher as imagens

Os dois arquivos de um mesmo par precisam ter luminosidade parecida, senão a
costura do meio fica com um degrau visível. Juntar uma imagem escura com uma
clara no mesmo par é o que quebra o efeito.

A aplicação já aplica opacidade de 26%, dessaturação, desfoque leve e uma
vinheta por cima, então a arte fica bem apagada de propósito. O conteúdo é que
precisa ficar legível.

Formato recomendado: JPG, paisagem, 1920x1080 ou maior.

## Direitos de uso

Esta pasta é versionada vazia. Se você colocar aqui imagens de terceiros, elas
são sua responsabilidade e não devem ser enviadas para um repositório público.
O `.gitignore` da raiz já ignora os arquivos de imagem deste diretório.
