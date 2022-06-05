import { DateTimeResolver } from "graphql-scalars";
import {
  asNexusMethod,
  makeSchema,
} from "nexus";
import { join } from "path";
import Comment from "./schema/Comment";
import Mutation from "./schema/Mutation";
import Query from "./schema/Query";

const dateTimeScalar = asNexusMethod(DateTimeResolver, "date");

const schema = makeSchema({
  types: [dateTimeScalar, Comment, Query, Mutation],
  outputs: {
    typegen: join(__dirname, "../nexus-typegen.ts"),
    schema: join(__dirname, "../schema.graphql"),
  },
  contextType: {
    module: join(__dirname, "./context.ts"),
    export: "Context",
  },
});

export default schema;
