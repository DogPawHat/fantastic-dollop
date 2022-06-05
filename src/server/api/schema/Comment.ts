import { objectType } from "nexus";

const Comment = objectType({
  name: "Comment",
  definition(t) {
    t.nonNull.id("id");
    t.nonNull.field("createdAt", {
      type: 'DateTime',
    });
    t.nonNull.field("updatedAt", {
      type: 'DateTime',
    });
    t.nonNull.string("authorName");
    t.nonNull.string("content");
    t.nonNull.int("upvotes");
  },
});

export default Comment;
