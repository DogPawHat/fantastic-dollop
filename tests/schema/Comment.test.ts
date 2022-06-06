import { createTestContext } from "../__helpers";
import { Comment } from "@prisma/client";
import { gql } from "@urql/core";
import { result } from "nexus/dist/utils";
import { pipe, map, toPromise, mergeMap } from "wonka";

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

it("ensures that a comment can be created and retrieved", async () => {
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

it("ensures that a multiple comments can be created and retrieved", async () => {
  const [
    commentOne,
    commentTwo,
    commentThree,
  ] = await Promise.all([
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

  const getAllCommentsResult = await ctx.client.query(commentsQuery).toPromise();

  const getContent = (comment: Comment) => comment.content

  expect(getAllCommentsResult.data.comments.length).toEqual(3);
  expect(getAllCommentsResult.data.comments.map(getContent)).toContain(commentOne.data.postComment.content);
  expect(getAllCommentsResult.data.comments.map(getContent)).toContain(commentOne.data.postComment.content);
  expect(getAllCommentsResult.data.comments.map(getContent)).toContain(commentOne.data.postComment.content);

  const persistedData = await ctx.db.comment.findMany();

  expect(persistedData.length).toEqual(3);
});

it("ensures that a comment can be upvoted and downvoted", async () => {
  // Create, upvote and downvote 4 comments in parrell
  // urql uses wonka for streams under the hood, so
  // were using it here to pipe mutation operations into
  // one another in a non-blocking manner
  const [
    upvoteOneResult,
    upvoteThreeResult,
    downvoteTwoResult,
    upvoteDownvoteResult,
  ] = await Promise.all([
    // Upvote a comment once
    pipe(
      ctx.client.mutation(postCommentMutation, {
        content: "This comment will be upvoted once",
      }),
      mergeMap((result) => {
        const id = result.data.postComment.id;

        return ctx.client.mutation(upvoteCommentMutation, { id });
      }),
      toPromise
    ),
    // Upvote a comment three times
    pipe(
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
    ),
    // Downvote a comment twice
    pipe(
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
    ),
    // Upvotes, downvotes, this should have 4 when I'm done
    pipe(
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
    ),
  ]);

  expect(upvoteOneResult.data.upvoteComment.upvotes).toEqual(1);
  expect(upvoteThreeResult.data.upvoteComment.upvotes).toEqual(3);
  expect(downvoteTwoResult.data.downvoteComment.upvotes).toEqual(-2);
  expect(upvoteDownvoteResult.data.upvoteComment.upvotes).toEqual(4);

  const persistedData = await ctx.db.comment.findUnique({
    where: { id: upvoteDownvoteResult.data.upvoteComment.id },
  });

  expect(persistedData.upvotes).toEqual(4);
});
