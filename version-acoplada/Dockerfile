# Usar imagen oficial de Node.js
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 8080

# Variables de entorno por defecto
ENV PORT=8080
ENV AWS_REGION=us-east-1
ENV DYNAMODB_TABLE=planets-shared

# Comando para iniciar la aplicación
CMD ["node", "server.js"]