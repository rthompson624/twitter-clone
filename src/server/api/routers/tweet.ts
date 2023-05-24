import type { Prisma } from "@prisma/client";
import type { inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";
import type { createTRPCContext } from "~/server/api/trpc";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const tweetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tweet = await ctx.prisma.tweet.create({
        data: { content: input.content, userId: ctx.session.user.id },
      });

      // Revalidate cache of profile page since it is SSG
      void ctx.revalidateSSG?.(`/profiles/${ctx.session.user.id}`);

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
      if (existingLike == null) {
        await ctx.prisma.like.create({
          data: { tweetId: id, userId: ctx.session.user.id },
        });
        return { liked: true };
      } else {
        await ctx.prisma.like.delete({
          where: {
            userId_tweetId: { tweetId: id, userId: ctx.session.user.id },
          },
        });
        return { liked: false };
      }
    }),
  toggleRetweet: protectedProcedure
    .input(z.object({ tweetId: z.string() }))
    .mutation(async ({ input: { tweetId }, ctx }) => {
      const existingRetweet = await ctx.prisma.retweet.findUnique({
        where: { userId_tweetId: { userId: ctx.session.user.id, tweetId } },
      });
      if (existingRetweet == null) {
        await ctx.prisma.retweet.create({
          data: { tweetId, userId: ctx.session.user.id },
        });
        return { retweeted: true };
      } else {
        await ctx.prisma.retweet.delete({
          where: { userId_tweetId: { userId: ctx.session.user.id, tweetId } },
        });
        return { retweeted: false };
      }
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
      _count: { select: { likes: true, retweets: true } },
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
    name: string | null;
    image: string | null;
  };
  likedByMe: boolean;
  retweetedByMe: boolean;
  retweetCreditorName: string | null | undefined;
};
