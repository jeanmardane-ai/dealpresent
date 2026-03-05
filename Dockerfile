FROM node:20-slim
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY config/ ./config/
RUN mkdir -p generated uploads
EXPOSE 3501
ENV PORT=3501
CMD ["node", "backend/server.js"]
