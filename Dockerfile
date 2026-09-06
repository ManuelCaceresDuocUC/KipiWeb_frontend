# Etapa 1: Compilación
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Web
FROM nginx:alpine

# Copia el resultado de la compilación de la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copia tu configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# MODIFICADO: Ahora exponemos el puerto 80 y el 443 para HTTPS
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]