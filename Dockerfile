# Use a imagem do Node.js como base
FROM node:slim

# Crie um diretório de trabalho para a aplicação
WORKDIR /src

# Copie os arquivos da aplicação para o container
COPY package*.json ./
RUN npm install
COPY . .

# Exponha a porta 8080 da aplicação
EXPOSE 8080

# Inicie a aplicação
CMD ["npm", "start"]