FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public
COPY db ./db
COPY scripts ./scripts
COPY docs ./docs
COPY .env.example ./.env.example
RUN mkdir -p /app/var/documents /shared-documents && chown -R node:node /app /shared-documents

USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
