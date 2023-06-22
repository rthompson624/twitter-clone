import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePusher } from "~/context/PusherContext";
import type {
  NewCommentEventData,
  UpdateTweetLikesEventData,
  UpdateTweetRetweetsEventData,
} from "~/server/api/routers/tweet";
import { api } from "~/utils/api";
import { deserializeComment } from "~/utils/helperFunctions";

export function useTweetDetailUpdates() {
  const session = useSession();
  const currentUserId = session.data?.user.id;
  const trpcCtx = api.useContext();
  const pusher = usePusher();
  useEffect(() => {
    const channel = pusher.subscribe("channel.tweet");
    channel.bind(
      "tweet.update.likes",
      ({ tweetId, userId, liked }: UpdateTweetLikesEventData) => {
        // Only process if like is from another user.
        // We are already updating the local cache for updates made by the current user.
        if (userId !== currentUserId) {
          trpcCtx.tweet.getById.setData({ id: tweetId }, (oldData) => {
            if (oldData == null) return;
            const countModifier = liked ? 1 : -1;
            return {
              ...oldData,
              likeCount: oldData.likeCount + countModifier,
            };
          });
        }
      }
    );
    channel.bind(
      "tweet.update.retweets",
      ({ tweetId, userId, retweeted }: UpdateTweetRetweetsEventData) => {
        // Only process if retweet is from another user.
        // We are already updating the local cache for updates made by the current user.
        if (userId !== currentUserId) {
          trpcCtx.tweet.getById.setData({ id: tweetId }, (oldData) => {
            if (oldData == null) return;
            const countModifier = retweeted ? 1 : -1;
            return {
              ...oldData,
              retweetCount: oldData.retweetCount + countModifier,
            };
          });
        }
      }
    );
    channel.bind(
      "tweet.update.comments",
      ({ serializedComment }: NewCommentEventData) => {
        const newComment = deserializeComment(serializedComment);
        // Only process if comment is from another user.
        // We are already updating the local cache for updates made by the current user.
        if (newComment.user.id !== currentUserId) {
          const updater: Parameters<
            typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
          >[1] = (oldData) => {
            if (oldData == null || oldData.pages[0] == null) return;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => {
                return {
                  ...page,
                  tweets: page.tweets.map((itr) => {
                    if (itr.id === newComment.tweetId) {
                      const comments = [
                        ...itr.comments,
                        {
                          id: newComment.id,
                          content: newComment.content,
                          createdAt: newComment.createdAt,
                          user: {
                            id: newComment.user.id,
                            name: newComment.user.name,
                            image: newComment.user.image,
                          },
                        },
                      ];
                      return {
                        ...itr,
                        comments,
                        commentCount: comments.length,
                      };
                    }
                    return itr;
                  }),
                };
              }),
            };
          };
          trpcCtx.tweet.infiniteFeed.setInfiniteData({}, updater);
          trpcCtx.tweet.infiniteFeed.setInfiniteData(
            { onlyFollowing: true },
            updater
          );
          trpcCtx.tweet.getById.setData(
            { id: newComment.tweetId },
            (oldData) => {
              if (oldData == null) return;
              const comments = [
                ...oldData.comments,
                {
                  id: newComment.id,
                  content: newComment.content,
                  createdAt: newComment.createdAt,
                  user: {
                    id: newComment.user.id,
                    name: newComment.user.name,
                    image: newComment.user.image,
                  },
                },
              ];
              return {
                ...oldData,
                comments,
                commentCount: comments.length,
              };
            }
          );
        }
      }
    );
    return () => {
      pusher.unsubscribe("channel.tweet");
    };
  }, [trpcCtx, currentUserId, pusher]);
}
