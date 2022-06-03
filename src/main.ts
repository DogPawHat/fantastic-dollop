import { createServer } from '@graphql-yoga/node'
import fastify, { FastifyRequest, FastifyReply } from 'fastify'

// This is the fastify instance you have created
const app = fastify({ logger: true })

const graphQLServer = createServer<{
  req: FastifyRequest
  reply: FastifyReply
}>({
  // Integrate Fastify logger
  logging: app.log,
})

/**
 * We pass the incoming HTTP request to GraphQL Yoga
 * and handle the response using Fastify's `reply` API
 * Learn more about `reply` https://www.fastify.io/docs/latest/Reply/
 **/
app.route({
  url: '/graphql',
  method: ['GET', 'POST', 'OPTIONS'],
  handler: async (req, reply) => {
    // Second parameter adds Fastify's `req` and `reply` to the GraphQL Context
    const response = await graphQLServer.handleIncomingMessage(req, {
      req,
      reply,
    })
    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    reply.status(response.status)

    reply.send(response.body)
  },
})

app.listen(4000)