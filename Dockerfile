FROM node:20-alpine

WORKDIR /app

COPY package*.json prisma.config.ts ./
COPY prisma/ ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "node_modules/.bin/next", "start"]
