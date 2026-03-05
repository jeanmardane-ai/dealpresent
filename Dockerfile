FROM node:20-slim
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/server.js ./
COPY frontend ./frontend
RUN mkdir -p generated config uploads
EXPOSE 3501
ENV PORT=3501
CMD ["node", "server.js"]
