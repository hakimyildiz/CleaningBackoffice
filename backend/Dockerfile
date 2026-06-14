FROM node:20-alpine
# Install Chromium for Puppeteer PDF generation
RUN apk add --no-cache chromium
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
