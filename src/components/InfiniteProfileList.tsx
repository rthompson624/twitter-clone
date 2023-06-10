import { type Profile } from "~/server/api/routers/profile";
import { LoadingSpinner } from "./LoadingSpinner";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileCard } from "./ProfileCard";

type InfiniteProfileListProps = {
  profiles?: Profile[];
  isError: boolean;
  isLoading: boolean;
  hasMore: boolean | undefined;
  fetchNewProfiles: () => Promise<unknown>;
};

export function InfiniteProfileList({
  profiles,
  isError,
  isLoading,
  hasMore,
  fetchNewProfiles,
}: InfiniteProfileListProps) {
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <h1>Error...</h1>;

  if (profiles == null || profiles.length === 0) {
    return <h2 className="my-4 text-center text-xl text-gray-500">No Users</h2>;
  }

  return (
    <InfiniteScroll
      dataLength={profiles.length}
      next={fetchNewProfiles}
      hasMore={hasMore ? hasMore : false}
      loader={<LoadingSpinner />}
      scrollableTarget="infiniteScrollTarget"
      className="flex flex-col gap-4"
    >
      {profiles.map((profile) => (
        <ProfileCard profile={profile} editable={false} key={profile.id} />
      ))}
    </InfiniteScroll>
  );
}
