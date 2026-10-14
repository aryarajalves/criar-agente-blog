FROM node:20-slim

WORKDIR /app

# Instalar dependências primeiro para aproveitar o cache do Docker
COPY frontend/package*.json ./

RUN npm install

# Copiar código restante
COPY frontend/ .

EXPOSE 5300

CMD ["npm", "run", "dev"]
