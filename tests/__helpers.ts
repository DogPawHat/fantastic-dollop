import { PrismaClient } from "@prisma/client";
import { createServer } from "@graphql-yoga/node";
import { execSync } from "child_process";
import fastify, {
  FastifyRequest,
  FastifyReply,
  FastifyInstance,
} from "fastify";
import { Client as GraphQLClient, createClient } from "@urql/core";
import { join } from "path";
import getPort, { makeRange } from "get-port";

import schema from "../src/server/api/schema";

const DATABASE_URL = "file:./test.db";

type TestContext = {
  client: GraphQLClient;
  db: PrismaClient;
};

export function createTestContext(): TestContext {
  let ctx = {} as TestContext;
  const graphqlCtx = graphqlTestContext();
  const prismaCtx = prismaTestContext();

  beforeEach(async () => {
    const db = await prismaCtx.before();
    const client = await graphqlCtx.before(db);

    Object.assign(ctx, {
      client,
      db,
    });
  });

  afterEach(async () => {
    await graphqlCtx.after();
    await prismaCtx.after();
  });

  return ctx;
}

function graphqlTestContext() {
  let serverInstance: FastifyInstance;

  return {
    async before(db: PrismaClient) {
      const port = await getPort({ port: makeRange(4040, 5050) });
      const app = fastify({ logger: true });

      const graphQLServer = createServer<{
        req: FastifyRequest;
        reply: FastifyReply;
      }>({
        // Integrate Fastify logger
        logging: app.log,
        schema,
        context: {
          db
        }
      });

      app.route({
        url: "/graphql",
        method: ["GET", "POST", "OPTIONS"],
        handler: async function graphqlRoute(req, reply) {
          // Second parameter adds Fastify's `req` and `reply` to the GraphQL Context
          const response = await graphQLServer.handleIncomingMessage(req, {
            req,
            reply,
          });
          response.headers.forEach((value, key) => {
            reply.header(key, value);
          });
          reply.status(response.status);
          reply.send(response.body);
        },
      });

      await app.listen(port);

      serverInstance = app;

      return createClient({ url: `http://localhost:${port}/graphql` });
    },

    async after() {
      return serverInstance?.close();
    },
  };
}

function prismaTestContext() {
  const prismaBinary = join(__dirname, "..", "node_modules", ".bin", "prisma");
  let prismaClient: null | PrismaClient = null;

  return {
    async before() {
      execSync(`DATABASE_URL=${DATABASE_URL} ${prismaBinary} migrate reset --force`);

      prismaClient = new PrismaClient({
        datasources: {
          db: {
            url: DATABASE_URL,
          },
        },
      });

      return prismaClient;
    },

    async after() {
      // Release the Prisma Client connection
      await prismaClient?.$disconnect();
    },
  };
}
