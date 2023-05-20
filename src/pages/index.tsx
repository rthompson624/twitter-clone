import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { NewTweetForm } from "~/components/NewTweetForm";
import { api } from "~/utils/api";
import { useState } from "react";

type TabOption = "Recent" | "Following";
const TABS: TabOption[] = ["Recent", "Following"];

const Home: NextPage = () => {
  const [selectedTab, setSelectedTab] = useState<TabOption>("Recent");
  const session = useSession();
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
        {session.status === "authenticated" && (
          <div className="flex">
            {TABS.map((tab) => {
              return (
                <button
                  key={tab}
                  className={`flex-grow p-2 ${
                    tab === selectedTab
                      ? "border-b-4 border-b-blue-500 font-bold"
                      : ""
                  }`}
                  onClick={() => setSelectedTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}
      </header>
      <NewTweetForm />
      {selectedTab === "Recent" ? <RecentTweets /> : <FollowingTweets />}
    </>
  );
};

function RecentTweets() {
  const infiniteQuery = api.tweet.infiniteFeed.useInfiniteQuery(
    {},
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  return (
    <InfiniteTweetList
      tweets={infiniteQuery.data?.pages.flatMap((page) => page.tweets)}
      isError={infiniteQuery.isError}
      isLoading={infiniteQuery.isLoading}
      hasMore={infiniteQuery.hasNextPage}
      fetchNewTweets={infiniteQuery.fetchNextPage}
    />
  );
}

function FollowingTweets() {
  const infiniteQuery = api.tweet.infiniteFeed.useInfiniteQuery(
    { onlyFollowing: true },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  return (
    <InfiniteTweetList
      tweets={infiniteQuery.data?.pages.flatMap((page) => page.tweets)}
      isError={infiniteQuery.isError}
      isLoading={infiniteQuery.isLoading}
      hasMore={infiniteQuery.hasNextPage}
      fetchNewTweets={infiniteQuery.fetchNextPage}
    />
  );
}

export default Home;
