import { createServer } from "@graphql-yoga/node";
import fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import schema from "./api/schema";
import { context } from "./api/context";

// This is the fastify instance you have created
const app = fastify({ logger: true });

const graphQLServer = createServer<{
  req: FastifyRequest;
  reply: FastifyReply;
}>({
  // Integrate Fastify logger
  logging: app.log,
  schema,
  context,
});

app.register(fastifyStatic, {
  root: path.join(__dirname, "..", "browser"),
  prefix: "/public/",
});

app.route({
  url: "/",
  method: ["GET"],
  handler: async function indexRoute(_req, reply) {
    reply.sendFile("index.html");
  },
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

app.listen(4000);
