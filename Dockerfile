# Utiliza una imagen base de Node.js para construir la aplicación
FROM node:18-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json (o yarn.lock)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Utiliza una imagen de servidor web ligero para servir la aplicación construida
FROM nginx:stable-alpine

# Copia los archivos construidos desde la etapa de construcción
COPY --from=builder /app/build /usr/share/nginx/html

# Expone el puerto en el que Nginx servirá la aplicación
EXPOSE 80

# Inicia el servidor Nginx
CMD ["nginx", "-g", "daemon off;"]