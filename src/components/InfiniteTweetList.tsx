import InfiniteScroll from "react-infinite-scroll-component";
import { LoadingSpinner } from "./LoadingSpinner";
import { type InfiniteFeedTweet } from "~/server/api/routers/tweet";
import { TweetCard } from "./TweetCard";

type InfiniteTweetListProps = {
  tweets?: InfiniteFeedTweet[];
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
      <h2 className="my-4 text-center text-xl text-gray-500">No Tweets</h2>
    );
  }

  return (
    <ul>
      <InfiniteScroll
        dataLength={tweets.length}
        next={fetchNewTweets}
        hasMore={hasMore ? hasMore : false}
        loader={<LoadingSpinner />}
        scrollableTarget="infiniteScrollTarget"
      >
        {tweets.map((tweet) => (
          <TweetCard tweet={tweet} commentsExpanded={false} key={tweet.id} />
        ))}
      </InfiniteScroll>
    </ul>
  );
}
