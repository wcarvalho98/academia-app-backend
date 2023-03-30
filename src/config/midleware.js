const { expressjwt } = require('express-jwt');

const jwt = expressjwt({ secret: 'chave-secreta', algorithms: ["HS256"] });

module.exports = jwt;