import { buildSchema } from "type-graphql";
import { resolvers } from "@generated/type-graphql";

const schema = await buildSchema({
  resolvers,
  validate: false,
});

export default schema;