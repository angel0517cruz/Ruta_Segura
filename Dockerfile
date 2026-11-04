FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY shared ./shared
COPY src ./src
COPY public ./public

# Ejecuta como usuario sin privilegios (mínimo privilegio)
RUN addgroup -S nova && adduser -S nova -G nova
USER nova

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=4s CMD wget -qO- http://127.0.0.1:3000/api/salud || exit 1
CMD ["node", "src/server.js"]
