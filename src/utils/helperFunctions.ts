import { type NotificationWithRelations } from "~/server/api/routers/notification";
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

export function serializeNotification(notification: NotificationWithRelations) {
  return { ...notification, createdAt: notification.createdAt.toISOString() };
}

export type NotificationWithRelationsSerialized = ReturnType<
  typeof serializeNotification
>;

export function deserializeNotification(
  notification: NotificationWithRelationsSerialized
): NotificationWithRelations {
  return {
    ...notification,
    createdAt: new Date(Date.parse(notification.createdAt)),
  };
}

export const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

export function forceString(value: string | null): string {
  return value ? value : "";
}
