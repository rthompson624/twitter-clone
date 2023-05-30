import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileImage } from "./ProfileImage";
import { useSession } from "next-auth/react";
import {
  VscHeartFilled,
  VscHeart,
  VscGitCompare,
  VscClose,
  VscComment,
} from "react-icons/vsc";
import { MdSend } from "react-icons/md";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { useState } from "react";
import { type InfiniteFeedTweet } from "~/server/api/routers/tweet";

type InfiniteTweetListProps = {
  tweets?: InfiniteFeedTweet[];
  isError: boolean;
  isLoading: boolean;
  hasMore: boolean | undefined;
  fetchNewTweets: () => Promise<unknown>;
};

export function InfiniteTweetList({
  tweets,
  isError,
  isLoading,
  hasMore,
  fetchNewTweets,
}: InfiniteTweetListProps) {
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <h1>Error...</h1>;

  if (tweets == null || tweets.length === 0) {
    return (
      <h2 className="my-4 text-center text-xl text-gray-500">No Tweets</h2>
    );
  }

  return (
    <ul>
      <InfiniteScroll
        dataLength={tweets.length}
        next={fetchNewTweets}
        hasMore={hasMore ? hasMore : false}
        loader={<LoadingSpinner />}
        scrollableTarget="infiniteScrollTarget"
      >
        {tweets.map((tweet) => (
          <TweetCard tweet={tweet} key={tweet.id} />
        ))}
      </InfiniteScroll>
    </ul>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

function TweetCard({ tweet }: { tweet: InfiniteFeedTweet }) {
  const [showComments, setShowComments] = useState(false);
  const session = useSession();
  const trpcCtx = api.useContext();
  const toggleLike = api.tweet.toggleLike.useMutation({
    onSuccess: ({ liked }) => {
      const updater: Parameters<
        typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;
        const countModifier = liked ? 1 : -1;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((itr) => {
                if (itr.id === tweet.id) {
                  return {
                    ...itr,
                    likeCount: itr.likeCount + countModifier,
                    likedByMe: liked,
                  };
                }
                return itr;
              }),
            };
          }),
        };
      };

      trpcCtx.tweet.infiniteFeed.setInfiniteData({}, updater);
      trpcCtx.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updater
      );
      trpcCtx.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: tweet.user.id },
        updater
      );
    },
  });
  const toggleRetweet = api.tweet.toggleRetweet.useMutation({
    onSuccess: ({ retweeted }) => {
      const updater: Parameters<
        typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;
        const countModifier = retweeted ? 1 : -1;
        const retweetCreditorName = retweeted ? session.data?.user.name : null;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((itr) => {
                if (itr.id === tweet.id) {
                  return {
                    ...itr,
                    retweetCount: itr.retweetCount + countModifier,
                    retweetedByMe: retweeted,
                    retweetCreditorName,
                  };
                }
                return itr;
              }),
            };
          }),
        };
      };

      trpcCtx.tweet.infiniteFeed.setInfiniteData({}, updater);
      trpcCtx.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updater
      );
      trpcCtx.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: tweet.user.id },
        updater
      );
    },
  });

  function handleToggleLike() {
    toggleLike.mutate({ id: tweet.id });
  }

  function handleToggleRetweet() {
    toggleRetweet.mutate({ tweetId: tweet.id });
  }

  function handleToggleComment() {
    setShowComments(!showComments);
  }

  return (
    <li className="flex flex-col border-b px-4 py-4">
      <div className="flex gap-4">
        <Link href={`/profiles/${tweet.user.id}`}>
          <ProfileImage src={tweet.user.image} />
        </Link>
        <div className="flex flex-grow flex-col">
          {tweet.retweetCreditorName && (
            <div className="text-sm">{tweet.retweetCreditorName} Retweeted</div>
          )}
          <div className="flex flex-wrap items-center gap-x-2">
            <Link
              href={`/profiles/${tweet.user.id}`}
              className="font-bold hover:underline"
            >
              {tweet.user.name}
            </Link>
            <div className="text-xs text-gray-500">
              {dateTimeFormatter.format(tweet.createdAt)}
            </div>
          </div>
          <p className="whitespace-pre-wrap">{tweet.content}</p>
          <div className="flex gap-9">
            <RetweetButton
              retweetedByMe={tweet.retweetedByMe}
              retweetCount={tweet.retweetCount}
              isLoading={toggleRetweet.isLoading}
              onClick={handleToggleRetweet}
            />
            <LikeButton
              likedByMe={tweet.likedByMe}
              likeCount={tweet.likeCount}
              isLoading={toggleLike.isLoading}
              onClick={handleToggleLike}
            />
            <CommentButton
              commentedByMe={tweet.commentedByMe}
              commentCount={tweet.commentCount}
              onClick={handleToggleComment}
            />
          </div>
        </div>
      </div>
      {showComments && <Comments tweet={tweet} />}
    </li>
  );
}

type LikeButtonProps = {
  likedByMe: boolean;
  likeCount: number;
  onClick: () => void;
  isLoading: boolean;
};

function LikeButton({
  likedByMe,
  likeCount,
  isLoading,
  onClick,
}: LikeButtonProps) {
  const session = useSession();
  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;

  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <HeartIcon />
        <span>{likeCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        likedByMe
          ? "text-red-500"
          : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
      }`}
    >
      <IconHoverEffect color={"red"}>
        <HeartIcon
          className={`transition-colors duration-200 ${
            likedByMe
              ? "fill-red-500"
              : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
          }`}
        />
      </IconHoverEffect>
      <span>{likeCount}</span>
    </button>
  );
}

type RetweetButtonProps = {
  retweetedByMe: boolean;
  retweetCount: number;
  onClick: () => void;
  isLoading: boolean;
};

function RetweetButton({
  retweetedByMe,
  retweetCount,
  isLoading,
  onClick,
}: RetweetButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const session = useSession();

  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <VscGitCompare />
        <span>{retweetCount}</span>
      </div>
    );
  }

  function toggleRetweet() {
    setShowMenu(!showMenu);
    onClick();
  }

  return (
    <div className="relative flex flex-col">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isLoading}
        className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
          retweetedByMe
            ? "text-green-500"
            : "text-gray-500 hover:text-green-700 focus-visible:text-green-700"
        }`}
      >
        <IconHoverEffect color={"green"}>
          <VscGitCompare
            className={`transition-colors duration-200 ${
              retweetedByMe
                ? "fill-green-500"
                : "fill-gray-500 group-hover:fill-green-700 group-focus-visible:fill-green-700"
            }`}
          />
        </IconHoverEffect>
        <span>{retweetCount}</span>
      </button>
      {showMenu && (
        <ul className="menu rounded-box absolute -left-16 top-0 z-10 w-44 bg-base-100">
          <li className="bg-gray-100">
            <a onClick={() => toggleRetweet()}>
              <VscGitCompare />
              {retweetedByMe ? "Undo Retweet" : "Retweet"}
            </a>
          </li>
          <li>
            <a onClick={() => setShowMenu(!showMenu)}>
              <VscClose />
              Cancel
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}

type CommentButtonProps = {
  commentedByMe: boolean;
  commentCount: number;
  onClick: () => void;
};

function CommentButton({
  commentedByMe,
  commentCount,
  onClick,
}: CommentButtonProps) {
  const session = useSession();

  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <VscComment />
        <span>{commentCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        commentedByMe
          ? "text-blue-500"
          : "text-gray-500 hover:text-blue-700 focus-visible:text-blue-700"
      }`}
    >
      <IconHoverEffect color={"blue"}>
        <VscComment
          className={`transition-colors duration-200 ${
            commentedByMe
              ? "fill-blue-500"
              : "fill-gray-500 group-hover:fill-blue-700 group-focus-visible:fill-blue-700"
          }`}
        />
      </IconHoverEffect>
      <span>{commentCount}</span>
    </button>
  );
}

function Comments({ tweet }: { tweet: InfiniteFeedTweet }) {
  return (
    <div className="ml-3 mt-1">
      {tweet.comments.map((comment) => {
        return (
          <div key={comment.id} className="chat chat-start">
            <div className="chat-image avatar">
              <Link href={`/profiles/${comment.user.id}`}>
                <ProfileImage src={comment.user.image} small />
              </Link>
            </div>
            <div className="chat-header">{comment.user.name}</div>
            <div className="chat-bubble max-w-full bg-slate-100 text-black">
              {comment.content}
            </div>
          </div>
        );
      })}
      <CommentForm tweet={tweet} />
    </div>
  );
}

function CommentForm({ tweet }: { tweet: InfiniteFeedTweet }) {
  const [commentText, setCommentText] = useState("");
  const session = useSession();
  const trpcCtx = api.useContext();
  const createTweet = api.tweet.createComment.useMutation({
    onSuccess: (newComment) => {
      setCommentText("");
      const updater: Parameters<
        typeof trpcCtx.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null || oldData.pages[0] == null) return;
        if (session.data == null) return;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((itr) => {
                if (itr.id === newComment.tweetId) {
                  const comments = [
                    ...itr.comments,
                    {
                      id: newComment.id,
                      content: newComment.content,
                      createdAt: newComment.createdAt,
                      user: {
                        id: session.data.user.id,
                        name: session.data.user.name,
                        image: session.data.user.image,
                      },
                    },
                  ];
                  const commentedByMe = comments.find(
                    (comment) => comment.user.id === session.data.user.id
                  )
                    ? true
                    : false;
                  return {
                    ...itr,
                    comments,
                    commentCount: comments.length,
                    commentedByMe,
                  };
                }
                return itr;
              }),
            };
          }),
        };
      };

      trpcCtx.tweet.infiniteFeed.setInfiniteData({}, updater);
      trpcCtx.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updater
      );
      trpcCtx.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: tweet.user.id },
        updater
      );
    },
  });

  if (session.status !== "authenticated") return <></>;

  const iconColor = commentText ? "text-blue-500" : "text-gray-400";

  function submitComment() {
    if (commentText) {
      createTweet.mutate({ content: commentText, tweetId: tweet.id });
    }
  }

  return (
    <div className="chat chat-start mt-3">
      <div className="chat-image avatar">
        <Link href={`/profiles/${session.data.user.id}`}>
          <ProfileImage src={session.data.user.image} small />
        </Link>
      </div>
      <div className="chat-bubble flex w-full max-w-full items-center bg-slate-100 px-2 py-0 text-black">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? submitComment() : null)}
          type="text"
          placeholder="Write a comment..."
          className="bor input-ghost input h-8 w-full bg-slate-100 px-2 focus:text-black focus:outline-none"
        />
        <div
          onClick={() => submitComment()}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:cursor-pointer hover:bg-slate-200"
        >
          <MdSend className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
