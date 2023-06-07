import type { Prisma } from "@prisma/client";
import type { inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";
import type { createTRPCContext } from "~/server/api/trpc";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { pusherServer } from "~/server/ws";
import { serializeTweet } from "~/utils/helperFunctions";

export const tweetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ content: z.string(), imageUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tweet = await ctx.prisma.tweet.create({
        data: {
          content: input.content,
          userId: ctx.session.user.id,
          images: input.imageUrl
            ? { create: [{ url: input.imageUrl }] }
            : undefined,
        },
        include: { images: true },
      });

      // Distribute to other users via Pusher
      const formattedTweet: InfiniteFeedTweet = {
        ...tweet,
        likeCount: 0,
        likedByMe: false,
        user: {
          id: ctx.session.user.id,
          name: ctx.session.user.name,
          image: ctx.session.user.image,
        },
        retweetCount: 0,
        retweetedByMe: false,
        retweetCreditorName: null,
        comments: [],
        commentCount: 0,
        commentedByMe: false,
      };
      const tweetFollowers = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          followers: { select: { id: true, name: true, image: true } },
        },
      });
      const eventData: NewTweetEventData = {
        serializedTweet: serializeTweet(formattedTweet),
        followers: tweetFollowers ? tweetFollowers.followers : [],
      };
      await pusherServer.trigger("channel.tweet", "tweet.new", eventData);

      return tweet;
    }),
  infiniteProfileFeed: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().optional().default(10),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await getInfiniteTweets({
        whereClause: {
          OR: [
            {
              userId: input.userId,
            },
            { retweets: { some: { userId: input.userId } } },
          ],
        },
        ctx,
        limit: input.limit,
        cursor: input.cursor,
      });
    }),
  infiniteFeed: publicProcedure
    .input(
      z.object({
        onlyFollowing: z.boolean().optional().default(false),
        limit: z.number().optional().default(10),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const currentUserId = ctx.session?.user.id;
      return await getInfiniteTweets({
        whereClause:
          currentUserId == null || !input.onlyFollowing
            ? undefined
            : {
                OR: [
                  {
                    user: {
                      followers: { some: { id: currentUserId } },
                    },
                  },
                  {
                    retweets: {
                      some: {
                        user: {
                          followers: { some: { id: currentUserId } },
                        },
                      },
                    },
                  },
                ],
              },
        ctx,
        limit: input.limit,
        cursor: input.cursor,
      });
    }),
  toggleLike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const existingLike = await ctx.prisma.like.findUnique({
        where: { userId_tweetId: { tweetId: id, userId: ctx.session.user.id } },
      });
      let liked: boolean;
      if (existingLike == null) {
        await ctx.prisma.like.create({
          data: { tweetId: id, userId: ctx.session.user.id },
        });
        liked = true;
      } else {
        await ctx.prisma.like.delete({
          where: {
            userId_tweetId: { tweetId: id, userId: ctx.session.user.id },
          },
        });
        liked = false;
      }

      // Distribute to other users via Pusher
      const eventData: UpdateTweetLikesEventData = {
        tweetId: id,
        userId: ctx.session.user.id,
        liked,
      };
      await pusherServer.trigger(
        "channel.tweet",
        "tweet.update.likes",
        eventData
      );

      return { liked };
    }),
  toggleRetweet: protectedProcedure
    .input(z.object({ tweetId: z.string() }))
    .mutation(async ({ input: { tweetId }, ctx }) => {
      const existingRetweet = await ctx.prisma.retweet.findUnique({
        where: { userId_tweetId: { userId: ctx.session.user.id, tweetId } },
      });
      let retweeted: boolean;
      if (existingRetweet == null) {
        await ctx.prisma.retweet.create({
          data: { tweetId, userId: ctx.session.user.id },
        });
        retweeted = true;
      } else {
        await ctx.prisma.retweet.delete({
          where: { userId_tweetId: { userId: ctx.session.user.id, tweetId } },
        });
        retweeted = false;
      }

      // Distribute to other users via Pusher
      const eventData: UpdateTweetRetweetsEventData = {
        tweetId,
        userId: ctx.session.user.id,
        retweeted,
      };
      await pusherServer.trigger(
        "channel.tweet",
        "tweet.update.retweets",
        eventData
      );

      return { retweeted };
    }),
  createComment: protectedProcedure
    .input(z.object({ content: z.string(), tweetId: z.string() }))
    .mutation(async ({ input: { content, tweetId }, ctx }) => {
      const comment = await ctx.prisma.comment.create({
        data: { userId: ctx.session.user.id, tweetId, content },
        include: { user: { select: { id: true, name: true, image: true } } },
      });

      // Distribute to other users via Pusher
      const eventData: NewCommentEventData = {
        serializedComment: {
          id: comment.id,
          tweetId,
          createdAt: comment.createdAt.toISOString(),
          content: comment.content,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            image: comment.user.image,
          },
        },
      };
      await pusherServer.trigger(
        "channel.tweet",
        "tweet.update.comments",
        eventData
      );

      return comment;
    }),
});

async function getInfiniteTweets({
  whereClause,
  ctx,
  limit,
  cursor,
}: {
  whereClause?: Prisma.TweetWhereInput;
  limit: number;
  cursor: { id: string; createdAt: Date } | undefined;
  ctx: inferAsyncReturnType<typeof createTRPCContext>;
}) {
  const currentUserId = ctx.session?.user.id;

  const data = await ctx.prisma.tweet.findMany({
    take: limit + 1,
    cursor: cursor ? { createdAt_id: cursor } : undefined,
    where: whereClause,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      content: true,
      createdAt: true,
      _count: { select: { likes: true, retweets: true, comments: true } },
      likes:
        currentUserId == null ? false : { where: { userId: currentUserId } },
      retweets: {
        where: {
          OR: [
            { userId: currentUserId },
            { user: { followers: { some: { id: currentUserId } } } },
          ],
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      user: { select: { name: true, id: true, image: true } },
      comments: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { name: true, id: true, image: true } },
        },
      },
      images: true,
    },
  });

  let nextCursor: typeof cursor | undefined;
  if (data.length > limit) {
    const nextItem = data.pop();
    if (nextItem != null) {
      nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt };
    }
  }
  return {
    tweets: data.map((tweet) => {
      const retweetedByMe = tweet.retweets.find(
        (retweet) => retweet.user.id === currentUserId
      )
        ? true
        : false;
      const retweetCreditorName = retweetedByMe
        ? ctx.session?.user.name
        : tweet.retweets[0]?.user.name;
      const commentedByMe = tweet.comments.find(
        (comment) => comment.user.id === currentUserId
      )
        ? true
        : false;

      const formattedTweet: InfiniteFeedTweet = {
        id: tweet.id,
        content: tweet.content,
        createdAt: tweet.createdAt,
        likeCount: tweet._count.likes,
        retweetCount: tweet._count.retweets,
        user: tweet.user,
        likedByMe: tweet.likes?.length > 0,
        retweetedByMe,
        retweetCreditorName,
        comments: tweet.comments,
        commentCount: tweet._count.comments,
        commentedByMe,
        images: tweet.images,
      };

      return formattedTweet;
    }),
    nextCursor,
  };
}

export type InfiniteFeedTweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  retweetCount: number;
  user: {
    id: string;
    name: string | null | undefined;
    image: string | null | undefined;
  };
  likedByMe: boolean;
  retweetedByMe: boolean;
  retweetCreditorName: string | null | undefined;
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null | undefined;
      image: string | null | undefined;
    };
  }[];
  commentCount: number;
  commentedByMe: boolean;
  images: {
    id: string;
    url: string;
    createdAt: Date;
  }[];
};

export type InfiniteFeedTweetSerialized = {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  user: {
    id: string;
    name: string | null | undefined;
    image: string | null | undefined;
  };
  likedByMe: boolean;
  retweetedByMe: boolean;
  retweetCreditorName: string | null | undefined;
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null | undefined;
      image: string | null | undefined;
    };
  }[];
  commentCount: number;
  commentedByMe: boolean;
  images: {
    id: string;
    url: string;
    createdAt: string;
  }[];
};

export type NewTweetEventData = {
  serializedTweet: InfiniteFeedTweetSerialized;
  followers: {
    id: string;
    name: string | null;
    image: string | null;
  }[];
};

export type UpdateTweetLikesEventData = {
  tweetId: string;
  userId: string;
  liked: boolean;
};

export type UpdateTweetRetweetsEventData = {
  tweetId: string;
  userId: string;
  retweeted: boolean;
};

export type NewComment = {
  id: string;
  tweetId: string;
  createdAt: Date;
  content: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export type NewCommentSerialized = {
  id: string;
  tweetId: string;
  createdAt: string;
  content: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export type NewCommentEventData = {
  serializedComment: NewCommentSerialized;
};
