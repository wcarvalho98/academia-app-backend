require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const UserController = require('./controllers/UserController');
const TreinoController = require('./controllers/TreinoController');
const FeedbackController = require('./controllers/FeedbackController');

const app = express();

// Configurações de segurança
app.use(cors());
app.use(helmet());

// Logs de requisições
app.use(morgan('tiny'));
app.use(express.json());

// Configuração das rotas
app.use('/user', UserController);
app.use('/treino', TreinoController);
app.use('/feedback', FeedbackController);

// Iniciar o servidor
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});