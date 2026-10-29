FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/joshrs
RUN git init engine && cd engine && git remote add origin https://github.com/LostCityRS/Engine-TS.git && git fetch --depth 1 origin 1d25566cb53e7af1b1cb18ade8af996316c19614 && git checkout --detach FETCH_HEAD
RUN git init content && cd content && git remote add origin https://github.com/LostCityRS/Content.git && git fetch --depth 1 origin 65b754f768b79b941b21b2a1eb3b0d1ecae3cdfe && git checkout --detach FETCH_HEAD
WORKDIR /opt/joshrs/engine
RUN npm ci --no-audit --no-fund
# Keep management private even when the game HTTP port is published.
RUN node --input-type=module -e "import fs from 'node:fs'; const p='src/web.ts'; const s=fs.readFileSync(p,'utf8'); const from=\"management.listen({ port: Environment.web.managementPort, host: '0.0.0.0' })\"; if(!s.includes(from)) throw Error('Upstream management binding changed'); fs.writeFileSync(p,s.replace(from,from.replace('0.0.0.0','127.0.0.1')));"
COPY deploy/server/configure.mjs ./configure.mjs
COPY deploy/server/start.sh ./joshrs-start.sh
RUN mkdir -p /data && chown -R node:node /data /opt/joshrs
USER node
EXPOSE 8888
STOPSIGNAL SIGTERM
CMD ["sh", "./joshrs-start.sh"]
