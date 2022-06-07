import { createTestContext } from "../__helpers";
import { Comment } from "@prisma/client";
import { gql } from "@urql/core";
import { pipe, toPromise, mergeMap } from "wonka";

const ctx = createTestContext();

const commentFragment = gql`
  fragment CommentDetails on Comment {
    id
    authorName
    content
    createdAt
    updatedAt
    upvotes
  }
`;

const commentQuery = gql<{ commentById: Comment }, { id: string }>`
  query GetComment($id: ID!) {
    commentById(id: $id) {
      ...CommentDetails
    }
  }
  ${commentFragment}
`;

const commentsQuery = gql<{ comments: Comment[] }>`
  query GetComments {
    comments {
      ...CommentDetails
    }
  }
  ${commentFragment}
`;

const postCommentMutation = gql<{ postComment: Comment }, { content: string }>`
  mutation PostComment($content: String!) {
    postComment(content: $content) {
      ...CommentDetails
    }
  }
  ${commentFragment}
`;

const upvoteCommentMutation = gql<{ upvoteComment: Comment }, { id: string }>`
  mutation UpvoteComment($id: ID!) {
    upvoteComment(id: $id) {
      ...CommentDetails
    }
  }
  ${commentFragment}
`;

const downvoteCommentMutation = gql<
  { downvoteComment: Comment },
  { id: string }
>`
  mutation DownvoteComment($id: ID!) {
    downvoteComment(id: $id) {
      ...CommentDetails
    }
  }
  ${commentFragment}
`;

describe("ensure posting works as expected", () => {
  test("ensures that a comment can be created and retrieved", async () => {
    const publishCommentResult = await ctx.client
      .mutation(postCommentMutation, {
        content: "This is a Test",
      })
      .toPromise();

    expect(publishCommentResult.data.postComment.content).toEqual(
      "This is a Test"
    );

    const getCommentResult = await ctx.client
      .query(commentQuery, {
        id: publishCommentResult.data.postComment.id,
      })
      .toPromise();

    expect(getCommentResult.data.commentById.content).toEqual("This is a Test");
    expect(getCommentResult.data.commentById.authorName).toEqual(
      publishCommentResult.data.postComment.authorName
    );

    const persistedData = await ctx.db.comment.findUnique({
      where: { id: publishCommentResult.data.postComment.id },
    });

    expect(persistedData.content).toEqual("This is a Test");
  });

  test("ensures that a multiple comments can be created and retrieved", async () => {
    const [commentOne, commentTwo, commentThree] = await Promise.all([
      // Upvote a comment once
      pipe(
        ctx.client.mutation(postCommentMutation, {
          content: "First Comment",
        }),
        toPromise
      ),
      // Upvote a comment three times
      pipe(
        ctx.client.mutation(postCommentMutation, {
          content: "Second Comment",
        }),
        toPromise
      ),
      // Downvote a comment twice
      pipe(
        ctx.client.mutation(postCommentMutation, {
          content: "Third Comment",
        }),
        toPromise
      ),
    ]);

    const getAllCommentsResult = await ctx.client
      .query(commentsQuery)
      .toPromise();

    const getContent = (comment: Comment) => comment.content;

    expect(getAllCommentsResult.data.comments.map(getContent)).toContain(
      commentOne.data.postComment.content
    );
    expect(getAllCommentsResult.data.comments.map(getContent)).toContain(
      commentTwo.data.postComment.content
    );
    expect(getAllCommentsResult.data.comments.map(getContent)).toContain(
      commentThree.data.postComment.content
    );

    const persistedData = await ctx.db.comment.findUnique({
      where: { id: commentOne.data.postComment.id },
    });

    expect(persistedData.content).toEqual("First Comment");
  });
});

describe("ensures that comments can be upvoted and downvoted", () => {
  // urql uses wonka for streams under the hood, so were using it here to pipe
  // mutation operations into one another in an easy to read manner before
  // promisifying the final result

  test("upvotes once", async () => {
    const upvoteOneResult = await pipe(
      ctx.client.mutation(postCommentMutation, {
        content: "This comment will be upvoted once",
      }),
      mergeMap((result) => {
        const id = result.data.postComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      toPromise
    );

    expect(upvoteOneResult.data.upvoteComment.upvotes).toBe(1);
  });

  test("upvotes three times", async () => {
    const upvoteThreeResult = await pipe(
      ctx.client.mutation(postCommentMutation, {
        content: "This comment will be upvoted three times",
      }),
      mergeMap((result) => {
        const id = result.data.postComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.upvoteComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.upvoteComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      toPromise
    );

    expect(upvoteThreeResult.data.upvoteComment.upvotes).toBe(3);
  });

  test("downvotes once", async () => {
    const downvoteTwoResult = await pipe(
      ctx.client.mutation(postCommentMutation, {
        content: "This comment will be downvoted twice",
      }),
      mergeMap((result) => {
        const id = result.data.postComment.id;

        return ctx.client.mutation(downvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.downvoteComment.id;

        return ctx.client.mutation(downvoteCommentMutation, { id });
      }),
      toPromise
    );

    expect(downvoteTwoResult.data.downvoteComment.upvotes).toBe(-2);
  });

  test("upvotes six times and downvotes twice", async () => {
    const upvoteDownvoteResult = await pipe(
      ctx.client.mutation(postCommentMutation, {
        content: "This comment will be upvoted six times and downvoted twice",
      }),
      mergeMap((result) => {
        const id = result.data.postComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      mergeMap(function upvoteToUpvote(result) {
        const id = result.data.upvoteComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.upvoteComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.upvoteComment.id;

        return ctx.client.mutation(downvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.downvoteComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.upvoteComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.upvoteComment.id;

        return ctx.client.mutation(downvoteCommentMutation, { id });
      }),
      mergeMap((result) => {
        const id = result.data.downvoteComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      toPromise
    );

    expect(upvoteDownvoteResult.data.upvoteComment.upvotes).toBe(4);

    const persistedData = await ctx.db.comment.findUnique({
      where: { id: upvoteDownvoteResult.data.upvoteComment.id },
    });

    expect(persistedData.upvotes).toBe(4);
  });

  test("fails if you attempt to upvote a non-existing comment", async () => {
    const failedUpvote = await ctx.client
      .mutation(upvoteCommentMutation, { id: "totally-valid-id" })
      .toPromise();

    expect(failedUpvote.data.upvoteComment).toBeNull();
    expect(failedUpvote.error).not.toBeNull();
  });

  test("fails if you attempt to downvote a non-existing comment", async () => {
    const failedUpvote = await ctx.client
      .mutation(downvoteCommentMutation, { id: "totally-valid-id" })
      .toPromise();

    expect(failedUpvote.data.downvoteComment).toBeNull();
    expect(failedUpvote.error).not.toBeNull();
  });
});
