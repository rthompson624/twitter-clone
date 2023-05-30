import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { NewTweetForm } from "~/components/NewTweetForm";
import { api } from "~/utils/api";
import { useState } from "react";
import { MdMenu } from "react-icons/md";

type TabOption = "For you" | "Following";
const TABS: TabOption[] = ["For you", "Following"];

const Home: NextPage = () => {
  const [selectedTab, setSelectedTab] = useState<TabOption>("For you");
  const session = useSession();
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <h1 className="mb-2 hidden px-4 text-lg font-bold lg:block">Home</h1>
        <div className="pl-4 pt-2 lg:hidden">
          <label
            htmlFor="my-drawer-2"
            className="flex gap-4 hover:cursor-pointer "
          >
            <MdMenu className="h-6 w-6" />
            {session.status !== "authenticated" && (
              <div className="mb-5">
                You are not signed in. Click to sign in.
              </div>
            )}
          </label>
        </div>

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
      {selectedTab === "For you" ? <RecentTweets /> : <FollowingTweets />}
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
