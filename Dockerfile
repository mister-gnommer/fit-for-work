FROM node:24.14.1-bookworm

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install --global npm@11.11.0
RUN mkdir /data && chown node:node /app /data

USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
RUN npm run build

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/app.db
EXPOSE 3000

CMD ["sh", "-c", "npm run db:deploy && exec npm start -- --hostname 0.0.0.0"]
