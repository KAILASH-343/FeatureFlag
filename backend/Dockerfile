FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY src/ ./src/

ENV PORT=5001
ENV NODE_ENV=production

EXPOSE 5001

CMD ["node", "src/server.js"]
