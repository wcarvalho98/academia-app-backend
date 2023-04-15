# Backend do app de academia
Este é o backend da aplicação de academia. Note que essa aplicação utiliza docker para rodar o ambiente.
Para isso, segue um tutorial de como rodar essa aplicação corretamente:

## Pré-requisitos
Antes de começar, certifique-se de ter o Docker e o Docker Compose instalados em sua máquina. Você pode instalar o Docker Desktop que já possui as duas aplicações:
- Docker Desktop: https://docs.docker.com/get-docker/

## Passo a passo
1. Clone o repositório da aplicação: `git clone https://github.com/wcarvalho98/academia-app-backend`
2. Navegue até a pasta do projeto: `cd backend`
3. Execute o seguinte comando para criar e iniciar os containers: `docker-compose up --build`
   - O comando acima irá baixar as imagens necessárias, criar os containers e iniciar a aplicação.
4. Aguarde até que o contêiner esteja em execução. Você deverá ver uma saída semelhante a esta: `backend-app-1 | Servidor rodando na porta 8080` e `backend-app-1 | MongoDB connected.`
5. Para parar o contêiner, execute o seguinte comando: `docker-compose down`
6. Pronto, a aplicação estará rodando no seguinte endereço: `http://localhost:8080`

## Rotas
As seguintes rotas estão disponíveis:

### Sem autenticação:
- POST `/user` - criação de aluno ou instrutor
- POST `/user/login` - login do usuário (aqui o Bearer `token` é gerado)
- GET `/user/search` - procurar instrutor
- GET `/feedback/:id_instrutor` - obter feedbacks do instrutor em específico

### Com autenticação:
- PATCH `/user/instrutor` - atualizar os dados do instrutor (requer Bearer `token` de algum instrutor)
- POST `/treino` - criar treino do aluno (requer Bearer `token` de algum instrutor)
- PATCH `/treino/:id_treino` - atualizar o treino do aluno (requer Bearer `token` de algum instrutor)
- GET `/treino/aluno/:id_aluno` - obter a lista de treinos do aluno (requer Bearer `token` de algum instrutor ou do próprio aluno)
- DELETE `/treino/:id_treino/delete` - deletar o treino do aluno (requer Bearer `token` de algum instrutor)
- POST `/feedback` - criar um feedback do aluno para instrutor (requer Bearer `token` de um aluno e esse aluno só pode mandar feedback apenas para o instrutor atual)
- PATCH `/feedback/:id_feedback` - atualizar um feedback (requer Bearer `token` do aluno que fez o feedback)
- DELETE `/feedback/:id_feedback` - deletar um feedback (requer Bearer `token` do aluno que fez o feedback)