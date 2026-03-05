FROM node:20-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
COPY frontend/ ./public/
COPY config/ ./config/
EXPOSE 3501
CMD ["node", "server.js"]
