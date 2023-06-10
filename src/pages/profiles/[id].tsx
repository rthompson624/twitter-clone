import type { NextPage } from "next";
import { api } from "~/utils/api";
import ErrorPage from "next/error";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { useSession } from "next-auth/react";
import { MdMenu } from "react-icons/md";
import { useProfileTweetUpdates } from "~/hooks/useProfileTweetUpdates";
import { useRouter } from "next/router";
import Head from "next/head";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { ProfileCard } from "~/components/ProfileCard";

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const session = useSession();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const {
    data: profile,
    isLoading,
    isError,
  } = api.profile.getById.useQuery({ id });
  const infiniteQuery = api.tweet.infiniteProfileFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  useProfileTweetUpdates(id);

  if (isLoading) return <LoadingSpinner />;
  if (!id || isError || profile == null) return <ErrorPage statusCode={404} />;

  return (
    <>
      <Head>
        <title>{`Bird Is The Word - Profile - ${
          profile.name ? profile.name : ""
        }`}</title>
      </Head>
      <header className="sticky top-0 z-10 border-b bg-white pb-2 pt-2">
        <div className="ml-4 hidden pb-2 lg:block">
          <div className="flex gap-4">
            <div className="text-lg font-bold">Profile</div>
            {session.status !== "authenticated" && (
              <div className="mb-5">(sign in to post & comment)</div>
            )}
          </div>
        </div>
        <div className="flex gap-4 pb-2 pl-4 pt-2 lg:hidden">
          <label htmlFor="my-drawer-2" className="hover:cursor-pointer">
            <MdMenu className="h-6 w-6" />
          </label>
          <div className="text-lg font-bold">Profile</div>
          {session.status !== "authenticated" && (
            <div className="mb-5">(sign in to post & comment)</div>
          )}
        </div>
        <ProfileCard profile={profile} editable={true} />
      </header>
      <main>
        <InfiniteTweetList
          tweets={infiniteQuery.data?.pages.flatMap((page) => page.tweets)}
          isError={infiniteQuery.isError}
          isLoading={infiniteQuery.isLoading}
          hasMore={infiniteQuery.hasNextPage}
          fetchNewTweets={infiniteQuery.fetchNextPage}
        />
      </main>
    </>
  );
};

export default ProfilePage;
