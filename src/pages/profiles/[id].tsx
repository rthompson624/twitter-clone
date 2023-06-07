import type { NextPage } from "next";
import { api } from "~/utils/api";
import ErrorPage from "next/error";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { useSession } from "next-auth/react";
import { Button } from "~/components/Button";
import { MdMenu } from "react-icons/md";
import { useProfileTweetUpdates } from "~/hooks/useProfileTweetUpdates";
import { useRouter } from "next/router";
import Head from "next/head";
import { LoadingSpinner } from "~/components/LoadingSpinner";

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
  const trpcCtx = api.useContext();
  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess: ({ addedFollow }) => {
      trpcCtx.profile.getById.setData({ id }, (oldData) => {
        if (oldData == null) return;
        const countModifier = addedFollow ? 1 : -1;
        return {
          ...oldData,
          followersCount: oldData.followersCount + countModifier,
          isFollowing: addedFollow,
        };
      });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!id || isError || profile == null) return <ErrorPage statusCode={404} />;

  return (
    <>
      <Head>
        <title>{`Bird Is The Word - Profile - ${
          profile.name ? profile.name : ""
        }`}</title>
      </Head>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <div className="ml-4 hidden lg:block">
          <div className="flex gap-4">
            <div className="text-lg font-bold">Profile</div>
            {session.status !== "authenticated" && (
              <div className="mb-5">(sign in to post & comment)</div>
            )}
          </div>
        </div>
        <div className="flex gap-4 pl-4 pt-2 lg:hidden">
          <label htmlFor="my-drawer-2" className="hover:cursor-pointer">
            <MdMenu className="h-6 w-6" />
          </label>
          <div className="font-bold text-lg">Profile</div>
          {session.status !== "authenticated" && (
            <div className="mb-5">(sign in to post & comment)</div>
          )}
        </div>
        <div className="flex items-center pr-3">
          <div className="ml-4 mt-1 flex-grow">
            <h1 className="text-lg font-bold">{profile.name}</h1>
            <div className="text-sm">{profile.email}</div>
            <div className="mb-4 mt-2 flex flex-row gap-6 text-sm text-gray-500">
              <div className="flex gap-1">
                <div className="font-bold text-black">
                  {profile.followsCount}
                </div>
                <div>Following</div>
              </div>
              <div className="flex gap-1">
                <div className="font-bold text-black">
                  {profile.followersCount}
                </div>
                <div>
                  {getPlural(profile.followersCount, "Follower", "Followers")}
                </div>
              </div>
              <div className="flex gap-1">
                <div className="font-bold text-black">
                  {profile.tweetsCount}
                </div>
                <div>{getPlural(profile.tweetsCount, "Tweet", "Tweets")}</div>
              </div>
            </div>
          </div>
          <FollowButton
            isFollowing={profile.isFollowing}
            userId={id}
            isLoading={toggleFollow.isLoading}
            onClick={() => toggleFollow.mutate({ userId: id })}
          />
        </div>
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

function FollowButton({
  userId,
  isFollowing,
  onClick,
  isLoading,
}: {
  userId: string;
  isFollowing: boolean;
  onClick: () => void;
  isLoading: boolean;
}) {
  const session = useSession();

  if (session.status !== "authenticated" || session.data.user.id === userId) {
    return null;
  }

  return (
    <Button disabled={isLoading} onClick={onClick} small gray={isFollowing}>
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}

function getPlural(number: number, singular: string, plural: string) {
  const pluralRules = new Intl.PluralRules();
  return pluralRules.select(number) === "one" ? singular : plural;
}

export default ProfilePage;
