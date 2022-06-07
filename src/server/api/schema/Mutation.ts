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
      description: "Post a new comment (with auto-generated author)",
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
      description: "Increment the upvote count of this comment by one",
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
      description: "Decrement the upvote count of this comment by one",
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
