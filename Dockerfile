# ===================================
# ETAPA 1: Imagen base
# ===================================
# Usamos Node.js 18 Alpine por ser ligera y segura
FROM node:18-alpine

# Información del mantenedor
LABEL version="1.0.0"
LABEL description="Microservicio de gestión de tareas con Node.js, Express, MySQL y JWT"
LABEL maintainer="tu-email@example.com"

# ===================================
# ETAPA 2: Configuración del usuario
# ===================================
# Crear un usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S taskmanager -u 1001

# ===================================
# ETAPA 3: Directorio de trabajo
# ===================================
# Establecer directorio de trabajo
WORKDIR /usr/src/app

# ===================================
# ETAPA 4: Copia de dependencias
# ===================================
# Copiar archivos de configuración primero (para aprovechar cache de Docker)
COPY package*.json ./

# ===================================
# ETAPA 5: Instalación de dependencias
# ===================================
# Instalar dependencias en modo producción
RUN npm ci --only=production && npm cache clean --force

# ===================================
# ETAPA 6: Copia del código fuente
# ===================================
# Copiar el resto del código
COPY . .

# ===================================
# ETAPA 7: Crear directorio de logs
# ===================================
# Crear directorio de logs con permisos apropiados
RUN mkdir -p logs && chown -R taskmanager:nodejs logs

# ===================================
# ETAPA 8: Permisos y seguridad
# ===================================
# Cambiar propietario de archivos al usuario no-root
RUN chown -R taskmanager:nodejs /usr/src/app
USER taskmanager

# ===================================
# ETAPA 9: Configuración de red
# ===================================
# Exponer el puerto que usa la aplicación
EXPOSE 3000

# ===================================
# ETAPA 10: Health check
# ===================================
# Configurar health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# ===================================
# ETAPA 11: Variables de entorno por defecto
# ===================================
ENV NODE_ENV=production
ENV PORT=3000

# ===================================
# ETAPA 12: Comando de ejecución
# ===================================
# Comando para ejecutar la aplicación
CMD ["node", "server.js"]