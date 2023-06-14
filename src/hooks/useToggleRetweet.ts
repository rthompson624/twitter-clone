import { useSession } from "next-auth/react";
import { type InfiniteFeedTweet } from "~/server/api/routers/tweet";
import { api } from "~/utils/api";

export function useToggleRetweet(tweet: InfiniteFeedTweet) {
  const session = useSession();
  const trpcCtx = api.useContext();
  return api.tweet.toggleRetweet.useMutation({
    onSuccess: ({ retweeted }) => {
      const updater: Parameters<
        typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;
        const countModifier = retweeted ? 1 : -1;
        const retweetCreditorName = retweeted ? session.data?.user.name : null;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((itr) => {
                if (itr.id === tweet.id) {
                  return {
                    ...itr,
                    retweetCount: itr.retweetCount + countModifier,
                    retweetedByMe: retweeted,
                    retweetCreditorName,
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
      trpcCtx.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: tweet.user.id },
        updater
      );
      trpcCtx.tweet.getById.setData({ id: tweet.id }, (oldData) => {
        if (oldData == null) return;
        const countModifier = retweeted ? 1 : -1;
        const retweetCreditorName = retweeted ? session.data?.user.name : null;
        return {
          ...oldData,
          retweetCount: oldData.retweetCount + countModifier,
          retweetedByMe: retweeted,
          retweetCreditorName,
        };
      });
    },
  });
}
