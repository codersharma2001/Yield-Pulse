import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { pathToFileURL } from "node:url";

import { env } from "./env";
import { registerV1Routes } from "./routes/v1";

const buildServer = () => {
  const server = Fastify({
    logger: {
      level: env.LOG_LEVEL
    }
  });

  server.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString()
  }));

  server.register(fastifyCors, {
    origin: env.CORS_ORIGIN ?? true
  });

  server.register(registerV1Routes);

  return server;
};

const start = async () => {
  const server = buildServer();
  try {
    const address = await server.listen({
      port: env.PORT,
      host: "0.0.0.0"
    });
    server.log.info(`HTTP server listening on ${address}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;

if (entryHref && import.meta.url === entryHref) {
  start();
}

export type AppServer = ReturnType<typeof buildServer>;
export { buildServer };
