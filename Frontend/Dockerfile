FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN bun x vitest run

EXPOSE 5173

CMD ["bun", "run", "dev", "--host", "0.0.0.0"]