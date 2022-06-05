import { DateTimeResolver } from "graphql-scalars";
import {
  asNexusMethod,
  idArg,
  makeSchema,
  mutationType,
  nonNull,
  queryType,
  stringArg,
} from "nexus";
import { join } from "path";
import { Comment } from "./schema/Comment";
import { v4 } from "uuid";
import { faker } from "@faker-js/faker";

const Mutation = mutationType({
  definition(t) {
    t.field("postComment", {
      type: "Comment",
      args: {
        content: nonNull(stringArg()),
      },
      resolve(_, args, ctx) {
        return ctx.db.comment.create({
          data: {
            id: v4(),
            authorName: faker.internet.userName(),
            content: args.content,
          },
        });
      },
    });
    t.field("upvoteComment", {
      type: "Comment",
      args: {
        id: nonNull(idArg()),
      },
      resolve(_parent, args, ctx) {
        return ctx.db.comment.update({
          where: {
            id: args.id,
          },
          data: {
            upvotes: {
              increment: 1,
            },
          },
        });
      },
    });
    t.field("downvoteComment", {
      type: "Comment",
      args: {
        id: nonNull(idArg()),
      },
      resolve(_parent, args, ctx) {
        return ctx.db.comment.update({
          where: {
            id: args.id,
          },
          data: {
            upvotes: {
              decrement: 1,
            },
          },
        });
      },
    });
  },
});

const Query = queryType({
  definition(t) {
    t.field("commentById", {
      type: "Comment",
      args: {
        id: nonNull(idArg()),
      },
      resolve(_root, args, ctx) {
        return ctx.db.comment.findUnique({
          where: {
            id: args.id,
          },
        });
      },
    });
    t.list.field("comments", {
      type: "Comment",
      resolve(_root, _args, ctx) {
        return ctx.db.comment.findMany({
          orderBy: {
            createdAt: "asc",
          },
        });
      },
    });
  },
});

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
