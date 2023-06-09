import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { type InfiniteFeedTweet } from "~/server/api/routers/tweet";
import Link from "next/link";
import { ProfileImage } from "./ProfileImage";
import {
  VscHeartFilled,
  VscHeart,
  VscGitCompare,
  VscClose,
  VscComment,
} from "react-icons/vsc";
import { MdSend } from "react-icons/md";
import { IconHoverEffect } from "./IconHoverEffect";
import { useToggleLike } from "~/hooks/useToggleLike";
import { useToggleRetweet } from "~/hooks/useToggleRetweet";
import { useCreateComment } from "~/hooks/useCreateComment";
import { dateTimeFormatter } from "~/utils/helperFunctions";

export function TweetCard({
  tweet,
  commentsExpanded,
}: {
  tweet: InfiniteFeedTweet;
  commentsExpanded: boolean;
}) {
  const [showComments, setShowComments] = useState(commentsExpanded);
  const toggleLike = useToggleLike(tweet);
  const toggleRetweet = useToggleRetweet(tweet);

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
          {tweet.images[0] && (
            <Image
              src={tweet.images[0]?.url}
              alt="Tweet image"
              quality={100}
              width={300}
              height={300}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="my-2"
            />
          )}
          <div className="flex gap-9">
            <CommentButton
              commentedByMe={tweet.commentedByMe}
              commentCount={tweet.commentCount}
              onClick={() => setShowComments(!showComments)}
            />
            <RetweetButton
              retweetedByMe={tweet.retweetedByMe}
              retweetCount={tweet.retweetCount}
              isLoading={toggleRetweet.isLoading}
              onClick={() => toggleRetweet.mutate({ tweetId: tweet.id })}
            />
            <LikeButton
              likedByMe={tweet.likedByMe}
              likeCount={tweet.likeCount}
              isLoading={toggleLike.isLoading}
              onClick={() => toggleLike.mutate({ id: tweet.id })}
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
        <HeartIcon className="h-5 w-5" />
        <span>{likeCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        likedByMe ? "text-red-500" : "text-gray-500 hover:text-red-500"
      }`}
    >
      <IconHoverEffect color={"red"}>
        <HeartIcon
          className={`h-5 w-5 transition-colors duration-200 ${
            likedByMe
              ? "fill-red-500"
              : "fill-gray-500 group-hover:fill-red-500"
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
        <VscGitCompare className="h-5 w-5" />
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
            : "text-gray-500 hover:text-green-700"
        }`}
      >
        <IconHoverEffect color={"green"}>
          <VscGitCompare
            className={`h-5 w-5 transition-colors duration-200 ${
              retweetedByMe
                ? "fill-green-500"
                : "fill-gray-500 group-hover:fill-green-700"
            }`}
          />
        </IconHoverEffect>
        <span>{retweetCount}</span>
      </button>
      {showMenu && (
        <ul className="menu rounded-box absolute -left-16 top-0 z-10 w-32 bg-base-100">
          <li className="border-2 border-gray-300 bg-white">
            <a onClick={() => toggleRetweet()}>
              <VscGitCompare className="h-5 w-5" />
              {retweetedByMe ? "Untweet" : "Retweet"}
            </a>
          </li>
          <li className="border-x-2 border-b-2 border-gray-300 bg-white">
            <a onClick={() => setShowMenu(!showMenu)}>
              <VscClose className="h-5 w-5" />
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
        <VscComment className="h-5 w-5" />
        <span>{commentCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        commentedByMe ? "text-blue-500" : "text-gray-500 hover:text-blue-700"
      }`}
    >
      <IconHoverEffect color={"blue"}>
        <VscComment
          className={`h-5 w-5 transition-colors duration-200 ${
            commentedByMe
              ? "fill-blue-500"
              : "fill-gray-500 group-hover:fill-blue-700"
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
  const createTweet = useCreateComment({
    userId: tweet.user.id,
    onSuccess: () => setCommentText(""),
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
          id="comment"
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
