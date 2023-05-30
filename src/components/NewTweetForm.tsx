import { useSession } from "next-auth/react";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";
import { type FormEvent, useState } from "react";
import { api } from "~/utils/api";
import { type InfiniteFeedTweet } from "~/server/api/routers/tweet";

export function NewTweetForm() {
  const session = useSession();
  const [inputValue, setInputValue] = useState("");
  const trpcCtx = api.useContext();
  const createTweet = api.tweet.create.useMutation({
    onSuccess: (newTweet) => {
      setInputValue("");
      const updater: Parameters<
        typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null || oldData.pages[0] == null) return;
        if (session.data == null) return;
        const cachedTweet: InfiniteFeedTweet = {
          ...newTweet,
          likeCount: 0,
          likedByMe: false,
          user: {
            id: session.data.user.id,
            name: session.data.user.name,
            image: session.data.user.image,
          },
          retweetCount: 0,
          retweetedByMe: false,
          retweetCreditorName: null,
          comments: [],
          commentCount: 0,
          commentedByMe: false,
        };
        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              tweets: [cachedTweet, ...oldData.pages[0].tweets],
            },
            ...oldData.pages.slice(1),
          ],
        };
      };
      trpcCtx.tweet.infiniteFeed.setInfiniteData({}, updater);
      trpcCtx.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updater
      );
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createTweet.mutate({ content: inputValue });
  }

  if (session.status !== "authenticated") {
    return <></>;
  }

  return (
    <form
      onSubmit={(e) => handleSubmit(e)}
      className="flex flex-col gap-2 border-b px-4 py-4"
    >
      <div className="flex gap-4">
        <ProfileImage src={session.data.user.image} />
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-16 grow overflow-y-auto text-lg outline-none"
          placeholder="What's happening?"
        />
      </div>
      <Button className="self-end">Tweet</Button>
    </form>
  );
}
