import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileImage } from "./ProfileImage";
import { useSession } from "next-auth/react";
import { VscHeartFilled, VscHeart } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";

type Tweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  likedByMe: boolean;
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
      trpcCtx.tweet.infiniteFeed.setInfiniteData({}, (oldData) => {
        if (oldData == null) return;
        const likeCountModifier = liked ? 1 : -1;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            tweets: page.tweets.map((tweetItr) => {
              if (tweetItr.id === tweet.id) {
                return {
                  ...tweetItr,
                  likeCount: tweetItr.likeCount + likeCountModifier,
                  likedByMe: liked,
                };
              }
              return tweetItr;
            }),
          })),
        };
      });
    },
  });

  function handleToggleLike() {
    toggleLike.mutate({ id: tweet.id });
  }

  return (
    <li className="flex gap-4 border-b px-4 py-4">
      <Link href={`/profiles/${tweet.user.id}`}>
        <ProfileImage src={tweet.user.image} />
      </Link>
      <div className="flex flex-grow flex-col">
        <div className="flex gap-1">
          <Link
            href={`/profiles/${tweet.user.id}`}
            className="font-bold hover:underline"
          >
            {tweet.user.name}
          </Link>
          <span className="text-gray-500">-</span>
          <span className="text-gray-500">
            {dateTimeFormatter.format(tweet.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap">{tweet.content}</p>
        <HeartButton
          likedByMe={tweet.likedByMe}
          likeCount={tweet.likeCount}
          isLoading={toggleLike.isLoading}
          onClick={handleToggleLike}
        />
      </div>
    </li>
  );
}

type HeartButtonProps = {
  likedByMe: boolean;
  likeCount: number;
  onClick: () => void;
  isLoading: boolean;
};

function HeartButton({
  likedByMe,
  likeCount,
  isLoading,
  onClick,
}: HeartButtonProps) {
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
      <IconHoverEffect red>
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
