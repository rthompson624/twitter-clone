import type {
  InfiniteFeedTweet,
  InfiniteFeedTweetSerialized,
  NewComment,
  NewCommentSerialized,
} from "~/server/api/routers/tweet";

export function serializeTweet(
  tweet: InfiniteFeedTweet
): InfiniteFeedTweetSerialized {
  return {
    ...tweet,
    createdAt: tweet.createdAt.toISOString(),
    comments: tweet.comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    })),
    images: tweet.images.map((image) => ({
      ...image,
      createdAt: image.createdAt.toISOString(),
    })),
  };
}

export function deserializeTweet(
  tweet: InfiniteFeedTweetSerialized
): InfiniteFeedTweet {
  return {
    ...tweet,
    createdAt: new Date(Date.parse(tweet.createdAt)),
    comments: tweet.comments.map((comment) => ({
      ...comment,
      createdAt: new Date(Date.parse(comment.createdAt)),
    })),
    images: tweet.images.map((image) => ({
      ...image,
      createdAt: new Date(Date.parse(image.createdAt)),
    })),
  };
}

export function serializeComment(comment: NewComment): NewCommentSerialized {
  return { ...comment, createdAt: comment.createdAt.toISOString() };
}

export function deserializeComment(comment: NewCommentSerialized): NewComment {
  return { ...comment, createdAt: new Date(Date.parse(comment.createdAt)) };
}
