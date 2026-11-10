FROM node:24.14.1-bookworm

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install --global npm@11.11.0
RUN mkdir /data && chown node:node /app /data

# Referral PDFs: Chromium's system libraries and a serif font with Polish characters. Runs before npm ci so
# dependency changes don't repeat apt; keep the version in sync with "playwright" in package.json.
RUN npx --yes playwright@1.65.0 install-deps chromium \
  && apt-get install -y --no-install-recommends fonts-liberation \
  && rm -rf /var/lib/apt/lists/* /root/.npm

USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
RUN npx playwright install --only-shell chromium

COPY --chown=node:node . .
RUN npm run build

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/app.db
EXPOSE 3000

CMD ["sh", "-c", "npm run db:deploy && exec npm start -- --hostname 0.0.0.0"]
