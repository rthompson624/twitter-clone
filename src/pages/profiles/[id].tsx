import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from "next/error";
import Link from "next/link";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "~/components/ProfileImage";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { useSession } from "next-auth/react";
import { Button } from "~/components/Button";

const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  id,
}) => {
  const { data: profile } = api.profile.getById.useQuery({ id });
  const infiniteQuery = api.tweet.infiniteProfileFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
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
  if (profile == null || profile.name == null)
    return <ErrorPage statusCode={404} />;

  return (
    <>
      <Head>
        <title>{`Twitter Clone - ${profile.name}`}</title>
      </Head>
      <header className="sticky top-0 z-10">
        <h1 className="mt-2 px-4 text-lg font-bold">Profile</h1>
        <div className="flex items-center border-b bg-white px-4 py-2">
          {/* <Link href=".." className="mr-2">
            <IconHoverEffect>
              <VscArrowLeft className="h-6 w-6" />
            </IconHoverEffect>
          </Link> */}
          <ProfileImage src={profile.image} className="flex-shrink-0" />
          <div className="ml-4 flex-grow">
            <h1 className="text-lg font-bold">{profile.name}</h1>
            <div className="flex flex-col text-gray-500">
              <div>
                {profile.tweetsCount}{" "}
                {getPlural(profile.tweetsCount, "Tweet", "Tweets")}
              </div>
              <div>
                {profile.followersCount}{" "}
                {getPlural(profile.tweetsCount, "Follower", "Followers")}
              </div>
              <div>
                {profile.followsCount}
                {"  Following"}
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

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>
) {
  const id = context.params?.id;

  if (id == null) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  const ssg = ssgHelper();
  await ssg.profile.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}

export default ProfilePage;
