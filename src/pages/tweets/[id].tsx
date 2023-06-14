import type { NextPage } from "next";
import { api } from "~/utils/api";
import ErrorPage from "next/error";
import { useSession } from "next-auth/react";
import { MdMenu } from "react-icons/md";
import { useRouter } from "next/router";
import Head from "next/head";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { TweetCard } from "~/components/TweetCard";
import { useTweetDetailUpdates } from "~/hooks/useTweetDetailUpdates";

const TweetPage: NextPage = () => {
  const router = useRouter();
  const session = useSession();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const {
    data: tweet,
    isLoading,
    isError,
  } = api.tweet.getById.useQuery({ id });
  useTweetDetailUpdates();

  if (isLoading) return <LoadingSpinner />;
  if (!id || isError || tweet == null) return <ErrorPage statusCode={404} />;

  return (
    <>
      <Head>
        <title>{`Bird Is The Word - Tweet Detail`}</title>
      </Head>
      <header className="sticky top-0 z-10 border-b bg-white pb-2 pt-2">
        <div className="ml-4 hidden pb-2 lg:block">
          <div className="flex gap-4">
            <div className="text-lg font-bold">Tweet Detail</div>
            {session.status !== "authenticated" && (
              <div>(sign in to post & comment)</div>
            )}
          </div>
        </div>
        <div className="flex gap-4 pb-2 pl-4 pt-2 lg:hidden">
          <label htmlFor="my-drawer-2" className="hover:cursor-pointer">
            <MdMenu className="h-6 w-6" />
          </label>
          <div className="text-lg font-bold">Tweet Detail</div>
          {session.status !== "authenticated" && (
            <div>(sign in to post & comment)</div>
          )}
        </div>
      </header>
      <main>
        <TweetCard tweet={tweet} commentsExpanded={true} />
      </main>
    </>
  );
};

export default TweetPage;
