import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileImage } from "./ProfileImage";
import { useSession } from "next-auth/react";
import { VscHeartFilled, VscHeart, VscGitCompare } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";

type Tweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  retweetCount: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  likedByMe: boolean;
  retweetedByMe: boolean;
  retweetCreditorName: string | null | undefined;
};

type InfiniteTweetListProps = {
  tweets?: Tweet[];
  isError: boolean;
  isLoading: boolean;
  hasMore: boolean | undefined;
  fetchNewTweets: () => Promise<unknown>;
};

export function InfiniteTweetList({
  tweets,
  isError,
  isLoading,
  hasMore,
  fetchNewTweets,
}: InfiniteTweetListProps) {
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <h1>Error...</h1>;

  if (tweets == null || tweets.length === 0) {
    return (
      <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>
    );
  }

  return (
    <ul>
      <InfiniteScroll
        dataLength={tweets.length}
        next={fetchNewTweets}
        hasMore={hasMore ? hasMore : false}
        loader={<LoadingSpinner />}
      >
        {tweets.map((tweet) => (
          <TweetCard tweet={tweet} key={tweet.id} />
        ))}
      </InfiniteScroll>
    </ul>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

function TweetCard({ tweet }: { tweet: Tweet }) {
  const trpcCtx = api.useContext();
  const toggleLike = api.tweet.toggleLike.useMutation({
    onSuccess: ({ liked }) => {
      const updateData: Parameters<
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

      trpcCtx.tweet.infiniteFeed.setInfiniteData({}, updateData);
      trpcCtx.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updateData
      );
      trpcCtx.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: tweet.user.id },
        updateData
      );
    },
  });
  const toggleRetweet = api.tweet.toggleRetweet.useMutation({
    onSuccess: ({ retweeted }) => {
      const updateData: Parameters<
        typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;
        const countModifier = retweeted ? 1 : -1;
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
                  };
                }
                return itr;
              }),
            };
          }),
        };
      };

      trpcCtx.tweet.infiniteFeed.setInfiniteData({}, updateData);
      trpcCtx.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updateData
      );
      trpcCtx.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: tweet.user.id },
        updateData
      );
    },
  });

  function handleToggleLike() {
    toggleLike.mutate({ id: tweet.id });
  }

  function handleToggleRetweet() {
    toggleRetweet.mutate({ tweetId: tweet.id });
  }

  return (
    <li className="flex gap-4 border-b px-4 py-4">
      <Link href={`/profiles/${tweet.user.id}`}>
        <ProfileImage src={tweet.user.image} />
      </Link>
      <div className="flex flex-grow flex-col">
        {tweet.retweetCreditorName && (
          <div className="text-sm">
            Retweeted by {tweet.retweetCreditorName}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-2">
          <Link
            href={`/profiles/${tweet.user.id}`}
            className="font-bold hover:underline"
          >
            {tweet.user.name}
          </Link>
          <div className="text-xs text-gray-500">
            {dateTimeFormatter.format(tweet.createdAt)}
          </div>
        </div>
        <p className="whitespace-pre-wrap">{tweet.content}</p>
        <div className="flex gap-6">
          <RetweetButton
            retweetedByMe={tweet.retweetedByMe}
            retweetCount={tweet.retweetCount}
            isLoading={toggleRetweet.isLoading}
            onClick={handleToggleRetweet}
          />
          <LikeButton
            likedByMe={tweet.likedByMe}
            likeCount={tweet.likeCount}
            isLoading={toggleLike.isLoading}
            onClick={handleToggleLike}
          />
        </div>
      </div>
    </li>
  );
}

type LikeButtonProps = {
  likedByMe: boolean;
  likeCount: number;
  onClick: () => void;
  isLoading: boolean;
};

function LikeButton({
  likedByMe,
  likeCount,
  isLoading,
  onClick,
}: LikeButtonProps) {
  const session = useSession();
  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;

  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <HeartIcon />
        <span>{likeCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        likedByMe
          ? "text-red-500"
          : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
      }`}
    >
      <IconHoverEffect color={"red"}>
        <HeartIcon
          className={`transition-colors duration-200 ${
            likedByMe
              ? "fill-red-500"
              : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
          }`}
        />
      </IconHoverEffect>
      <span>{likeCount}</span>
    </button>
  );
}

type RetweetButtonProps = {
  retweetedByMe: boolean;
  retweetCount: number;
  onClick: () => void;
  isLoading: boolean;
};

function RetweetButton({
  retweetedByMe,
  retweetCount,
  isLoading,
  onClick,
}: RetweetButtonProps) {
  const session = useSession();

  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <VscGitCompare />
        <span>{retweetCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        retweetedByMe
          ? "text-green-500"
          : "text-gray-500 hover:text-green-700 focus-visible:text-green-700"
      }`}
    >
      <IconHoverEffect color={"green"}>
        <VscGitCompare
          className={`transition-colors duration-200 ${
            retweetedByMe
              ? "fill-green-500"
              : "fill-gray-500 group-hover:fill-green-700 group-focus-visible:fill-green-700"
          }`}
        />
      </IconHoverEffect>
      <span>{retweetCount}</span>
    </button>
  );
}
