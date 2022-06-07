import {
  idArg,
  nonNull,
  queryType,
} from "nexus";

const Query = queryType({
  definition(t) {
    t.field("commentById", {
      description: "Get a single comment",
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
      description: "Get the full list of comments",
      resolve(_root, _args, ctx) {
        return ctx.db.comment.findMany({
          orderBy: {
            createdAt: "desc",
          },
        });
      },
    });
  },
});

export default Query;
