import {
  idArg,
  nonNull,
  queryType,
} from "nexus";

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

export default Query;
