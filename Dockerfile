FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server
COPY migrations ./migrations

EXPOSE 3001

CMD ["node", "server/index.js"]
