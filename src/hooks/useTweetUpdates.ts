import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { useEffect } from "react";
import { env } from "~/env.mjs";
import type {
  NewCommentEventData,
  NewTweetEventData,
  UpdateTweetLikesEventData,
  UpdateTweetRetweetsEventData,
} from "~/server/api/routers/tweet";
import { api } from "~/utils/api";
import { deserializeComment, deserializeTweet } from "~/utils/helperFunctions";

export function useTweetUpdates() {
  const session = useSession();
  const currentUserId = session.data?.user.id;
  const trpcCtx = api.useContext();
  useEffect(() => {
    const pusher = new Pusher(env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    const channel = pusher.subscribe("channel.tweet");
    channel.bind(
      "tweet.new",
      ({ serializedTweet, followers }: NewTweetEventData) => {
        const tweet = deserializeTweet(serializedTweet);
        // Only process if tweet is from another user.
        // We are already updating the local cache for updates made by the current user.
        if (tweet.user.id !== currentUserId) {
          const updater: Parameters<
            typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
          >[1] = (oldData) => {
            if (oldData == null || oldData.pages[0] == null) return;
            return {
              ...oldData,
              pages: [
                {
                  ...oldData.pages[0],
                  tweets: [tweet, ...oldData.pages[0].tweets],
                },
                ...oldData.pages.slice(1),
              ],
            };
          };
          trpcCtx.tweet.infiniteFeed.setInfiniteData({}, updater);
          // Only update the onlyFollowing feed option if current user is a follower
          if (followers.find((follower) => follower.id === currentUserId)) {
            trpcCtx.tweet.infiniteFeed.setInfiniteData(
              { onlyFollowing: true },
              updater
            );
          }
        }
      }
    );
    channel.bind(
      "tweet.update.likes",
      ({ tweetId, userId, liked }: UpdateTweetLikesEventData) => {
        // Only process if like is from another user.
        // We are already updating the local cache for updates made by the current user.
        if (userId !== currentUserId) {
          const updater: Parameters<
            typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
          >[1] = (oldData) => {
            if (oldData == null || oldData.pages[0] == null) return;
            const countModifier = liked ? 1 : -1;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => {
                return {
                  ...page,
                  tweets: page.tweets.map((itr) => {
                    if (itr.id === tweetId) {
                      return {
                        ...itr,
                        likeCount: itr.likeCount + countModifier,
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
        }
      }
    );
    channel.bind(
      "tweet.update.retweets",
      ({ tweetId, userId, retweeted }: UpdateTweetRetweetsEventData) => {
        // Only process if retweet is from another user.
        // We are already updating the local cache for updates made by the current user.
        if (userId !== currentUserId) {
          const updater: Parameters<
            typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
          >[1] = (oldData) => {
            if (oldData == null || oldData.pages[0] == null) return;
            const countModifier = retweeted ? 1 : -1;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => {
                return {
                  ...page,
                  tweets: page.tweets.map((itr) => {
                    if (itr.id === tweetId) {
                      return {
                        ...itr,
                        retweetCount: itr.retweetCount + countModifier,
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
        }
      }
    );
    return () => {
      pusher.unsubscribe("channel.tweet");
    };
  }, [trpcCtx, currentUserId]);
}
