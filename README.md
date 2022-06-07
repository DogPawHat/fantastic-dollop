## Installation requirements

- Node 18
- pnpm 7
- Install with `pnpm install`

## Commands

### `pnpm dev`

Runs the application at `localhost:4000`

- Comment form is at `localhost:4000`. Refreshing after submission is required.
- GraphQL API is at `localhost:4000/graphql`. Api is documented in `src/server/schema.graphql`

### `pnpm test` 

Runs a full intergration test of the API, using the `prisma/test.db` as a store.

### `pnpm run generate`

Regenerates `schema.graphql`

### `pnpm run check`

Checks ts files for type errors

## Tech stack over view

To implement the API for the application, I went with GraphQL as I find it easier to think in the terms of querys and mutations then I do for REST. I've always like it's strong type system and it's easy to read a schema and reason about it.

Front end is a very straightforward HTML file with inline vallina JS and the dev build of TailwindCSS included via CDN. I'm thinking of the comment block template in that file as a "component" to put data into.

## Tooling


- [Graphql](https://graphql.org/)
- [Typescript](https://www.typescriptlang.org/)
- [Fastfy](https://www.fastify.io/)
- [Graphql Yoga](https://www.graphql-yoga.com/)
- [Nexus](https://nexusjs.org/)
- [urql](https://formidable.com/open-source/urql/)
- [tailwind](https://tailwindcss.com/)
- [Jest](https://jestjs.io/)