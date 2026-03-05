FROM node:20-slim

WORKDIR /app

# Copy everything
COPY . .

# Install deps
WORKDIR /app/backend
RUN npm install --production

# Create required directories
WORKDIR /app
RUN mkdir -p generated uploads config

# Set env
ENV PORT=3501

# Start server
CMD ["node", "/app/backend/server.js"]
