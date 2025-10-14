import Fastify from "fastify";

const buildServer = () => {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    }
  });

  server.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString()
  }));

  return server;
};

const start = async () => {
  const server = buildServer();
  try {
    await server.listen({
      port: Number(process.env.PORT ?? 3001),
      host: "0.0.0.0"
    });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export type AppServer = ReturnType<typeof buildServer>;
export { buildServer };
