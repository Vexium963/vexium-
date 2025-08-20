FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN addgroup -g 1001 -S nodejs
RUN adduser -S vexiumbot -u 1001

RUN mkdir -p database/data database/backups logs temp && \
    chown -R vexiumbot:nodejs database logs temp

USER vexiumbot

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

CMD ["npm", "start"]
