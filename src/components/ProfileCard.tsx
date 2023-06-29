import { useSession } from "next-auth/react";
import { type Profile } from "~/server/api/routers/profile";
import { Button } from "./Button";
import { api } from "~/utils/api";
import Link from "next/link";
import { FiUserCheck } from "react-icons/fi";
import { ProfileImage } from "./ProfileImage";
import { useRef } from "react";
import { ProfilesModal } from "./ProfilesModal";

export function ProfileCard({
  profile,
  editable,
}: {
  profile: Profile;
  editable: boolean;
}) {
  const followersDialogRef = useRef<HTMLInputElement>(null);
  const followsDialogRef = useRef<HTMLInputElement>(null);
  const trpcCtx = api.useContext();
  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess: ({ addedFollow }) => {
      trpcCtx.profile.getById.setData({ id: profile.id }, (oldData) => {
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
  const { data: followers, refetch: fetchFollowers } =
    api.profile.getFollowers.useQuery(
      {
        userId: profile.id,
      },
      { enabled: false, refetchOnWindowFocus: false }
    );
  const { data: follows, refetch: fetchFollows } =
    api.profile.getFollows.useQuery(
      {
        userId: profile.id,
      },
      { enabled: false, refetchOnWindowFocus: false }
    );

  async function showFollowers() {
    followersDialogRef.current?.click();
    await fetchFollowers();
  }

  async function showFollows() {
    followsDialogRef.current?.click();
    await fetchFollows();
  }

  return (
    <div className="ml-4">
      <div className="flex gap-4 pr-3">
        <Link href={`/profiles/${profile.id}`}>
          <ProfileImage src={profile.image} />
        </Link>
        <div className="flex-grow">
          <Link href={`/profiles/${profile.id}`}>
            <div className="text-lg font-bold">{profile.name}</div>
            <div className="text-sm">{profile.email}</div>
          </Link>
        </div>
        {editable ? (
          <FollowButton
            isFollowing={profile.isFollowing}
            userId={profile.id}
            isLoading={toggleFollow.isLoading}
            onClick={() => toggleFollow.mutate({ userId: profile.id })}
          />
        ) : (
          <div>
            <FollowBadge
              isFollowing={profile.isFollowing}
              userId={profile.id}
            />
          </div>
        )}
      </div>
      <div className="ml-14 mt-1 flex flex-row gap-6 text-sm text-gray-500">
        <div
          onClick={() => void showFollows()}
          className="flex cursor-pointer gap-1"
        >
          <div className="font-bold text-black">{profile.followsCount}</div>
          <div>Following</div>
        </div>
        <div
          onClick={() => void showFollowers()}
          className="flex cursor-pointer gap-1"
        >
          <div className="font-bold text-black">{profile.followersCount}</div>
          <div>
            {getPlural(profile.followersCount, "Follower", "Followers")}
          </div>
        </div>
        <div className="flex gap-1">
          <div className="font-bold text-black">{profile.tweetsCount}</div>
          <div>{getPlural(profile.tweetsCount, "Tweet", "Tweets")}</div>
        </div>
      </div>
      <ProfilesModal
        modalId={`${profile.id}-following`}
        modalRef={followsDialogRef}
        title="Following"
        profiles={follows}
      />
      <ProfilesModal
        modalId={`${profile.id}-followers`}
        modalRef={followersDialogRef}
        title="Followers"
        profiles={followers}
      />
    </div>
  );
}

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
    <Button
      disabled={isLoading}
      onClick={onClick}
      small
      gray={isFollowing}
      className="h-8"
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}

function getPlural(number: number, singular: string, plural: string) {
  const pluralRules = new Intl.PluralRules();
  return pluralRules.select(number) === "one" ? singular : plural;
}

function FollowBadge({
  userId,
  isFollowing,
}: {
  userId: string;
  isFollowing: boolean;
}) {
  const session = useSession();

  if (session.status !== "authenticated" || session.data.user.id === userId) {
    return null;
  }

  if (!isFollowing) return null;

  return <FiUserCheck className="h-7 w-7 pr-2 text-blue-500" />;
}
