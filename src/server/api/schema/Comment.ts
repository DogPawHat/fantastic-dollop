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
    t.nonNull.string("authorName", {
      description: "Name of the comment author"
    });
    t.nonNull.string("content", {
      description: "Content of the comment"
    });
    t.nonNull.int("upvotes", {
      description: "Number of upvotes the comment has (can be negative!)"
    });
  },
});

export default Comment;
