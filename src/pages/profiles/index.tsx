import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { MdMenu } from "react-icons/md";
import { Button } from "~/components/Button";
import { VscSearch } from "react-icons/vsc";
import { useRef, useState } from "react";
import { api } from "~/utils/api";
import { InfiniteProfileList } from "~/components/InfiniteProfileList";

const Profiles: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState<string | undefined>();
  const session = useSession();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isLoading = false;

  const infiniteQuery = api.profile.getInfiniteProfiles.useInfiniteQuery(
    { searchTerm },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  function initiateSearch() {
    setSearchTerm(searchInputRef.current?.value);
  }

  return (
    <>
      <Head>
        <title>{"Bird Is The Word - Users"}</title>
      </Head>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <div className="ml-4 hidden lg:block">
          <div className="flex gap-4">
            <div className="text-lg font-bold">Users</div>
            {session.status !== "authenticated" && (
              <div className="mb-5">(sign in to post & comment)</div>
            )}
          </div>
        </div>
        <div className="flex gap-4 pl-4 pt-2 lg:hidden">
          <label htmlFor="my-drawer-2" className="hover:cursor-pointer">
            <MdMenu className="h-6 w-6" />
          </label>
          <div className="text-lg font-bold">Users</div>
          {session.status !== "authenticated" && (
            <div className="mb-5">(sign in to post & comment)</div>
          )}
        </div>
        <div className="flex items-center gap-4 px-4 pb-3 pt-2">
          <div className="flex-grow">
            <label className="relative block">
              <span className="sr-only">Search</span>
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <VscSearch />
              </span>
              <input
                ref={searchInputRef}
                onKeyDown={(e) =>
                  e.key === "Enter" ? initiateSearch() : undefined
                }
                onChange={(e) =>
                  !e.target.value ? initiateSearch() : undefined
                }
                className="block w-full rounded-full border border-slate-300 bg-white py-1 pl-10 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                placeholder="Search"
                type="text"
                autoComplete="off"
                id="search"
              />
            </label>
          </div>
          <Button disabled={isLoading} onClick={() => initiateSearch()} small>
            Search
          </Button>
        </div>
      </header>
      <main>
        <div className="pt-2">
          <InfiniteProfileList
            profiles={infiniteQuery.data?.pages.flatMap(
              (page) => page.profiles
            )}
            isError={infiniteQuery.isError}
            isLoading={infiniteQuery.isLoading}
            hasMore={infiniteQuery.hasNextPage}
            fetchNewProfiles={infiniteQuery.fetchNextPage}
          />
        </div>
      </main>
    </>
  );
};

export default Profiles;
