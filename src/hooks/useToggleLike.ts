import { type InfiniteFeedTweet } from "~/server/api/routers/tweet";
import { api } from "~/utils/api";

export function useToggleLike(tweet: InfiniteFeedTweet) {
  const trpcCtx = api.useContext();
  return api.tweet.toggleLike.useMutation({
    onSuccess: ({ liked }) => {
      const updater: Parameters<
        typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;
        const countModifier = liked ? 1 : -1;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((itr) => {
                if (itr.id === tweet.id) {
                  return {
                    ...itr,
                    likeCount: itr.likeCount + countModifier,
                    likedByMe: liked,
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
        const countModifier = liked ? 1 : -1;
        return {
          ...oldData,
          likeCount: oldData.likeCount + countModifier,
          likedByMe: liked,
        };
      });
    },
  });
}
