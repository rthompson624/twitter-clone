import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

export function useCreateComment({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: () => void;
}) {
  const session = useSession();
  const trpcCtx = api.useContext();
  return api.tweet.createComment.useMutation({
    onSuccess: (newComment) => {
      onSuccess();

      const updater: Parameters<
        typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null || oldData.pages[0] == null) return;
        if (session.data == null) return;
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
                  const commentedByMe = comments.find(
                    (comment) => comment.user.id === session.data.user.id
                  )
                    ? true
                    : false;
                  return {
                    ...itr,
                    comments,
                    commentCount: comments.length,
                    commentedByMe,
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
      trpcCtx.tweet.infiniteProfileFeed.setInfiniteData({ userId }, updater);
      trpcCtx.tweet.getById.setData({ id: newComment.tweetId }, (oldData) => {
        if (oldData == null) return;
        if (session.data == null) return;
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
        const commentedByMe = comments.find(
          (comment) => comment.user.id === session.data.user.id
        )
          ? true
          : false;
        return {
          ...oldData,
          comments,
          commentCount: comments.length,
          commentedByMe,
        };
      });
    },
  });
}
