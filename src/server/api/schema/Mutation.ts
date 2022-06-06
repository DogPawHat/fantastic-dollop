import {
  idArg,
  mutationType,
  nonNull,
  stringArg,
} from "nexus";
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
            authorName: faker.name.findName(),
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

export default Mutation;
