FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY index.js .
COPY tracing.js .

EXPOSE 8002

CMD ["node", "index.js"]