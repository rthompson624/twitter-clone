import { type inferRouterOutputs } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { pusherServer } from "~/server/ws";
import { serializeNotification } from "~/utils/helperFunctions";

export const profileRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id }, ctx }) => {
      const currentUserId = ctx.session?.user.id;
      const user = await ctx.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          _count: { select: { followers: true, follows: true, tweets: true } },
          followers:
            currentUserId == null
              ? undefined
              : { where: { id: currentUserId } },
        },
      });

      if (user == null) return;

      const profile: Profile = {
        id: user.id,
        name: user.name,
        image: user.image,
        email: user.email,
        followersCount: user._count.followers,
        followsCount: user._count.follows,
        tweetsCount: user._count.tweets,
        isFollowing: user.followers.length > 0,
      };
      return profile;
    }),
  getFollowers: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input: { userId }, ctx }) => {
      const query = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          followers: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      });
      return query ? query.followers : [];
    }),
  getFollows: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input: { userId }, ctx }) => {
      const query = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          follows: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      });
      return query ? query.follows : [];
    }),
  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input: { userId }, ctx }) => {
      const currentUserId = ctx.session.user.id;
      const existingFollow = await ctx.prisma.user.findFirst({
        where: { id: userId, followers: { some: { id: currentUserId } } },
      });

      let addedFollow: boolean;
      if (existingFollow == null) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { followers: { connect: { id: currentUserId } } },
        });
        addedFollow = true;
        // Handle notification
        const notification = await ctx.prisma.notification.create({
          data: {
            notifyeeId: userId,
            notifyerId: currentUserId,
            resourcePath: "profiles",
            resourceId: currentUserId,
            type: "NEW_FOLLOWER",
          },
          select: {
            id: true,
            notifyee: true,
            notifyer: true,
            resourcePath: true,
            resourceId: true,
            type: true,
            createdAt: true,
          },
        });
        await pusherServer.trigger(
          "channel.notification",
          "notification.new",
          serializeNotification(notification)
        );
      } else {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { followers: { disconnect: { id: currentUserId } } },
        });
        addedFollow = false;
      }

      return { addedFollow };
    }),
  getInfiniteProfiles: publicProcedure
    .input(
      z.object({
        searchTerm: z
          .string()
          .optional()
          .transform((val) => (val == null ? undefined : val.toLowerCase())),
        limit: z.number().optional().default(10),
        cursor: z.object({ id: z.string() }).optional(),
      })
    )
    .query(async ({ input: { searchTerm, limit, cursor }, ctx }) => {
      const currentUserId = ctx.session?.user.id;
      const users = await ctx.prisma.user.findMany({
        take: limit + 1,
        cursor,
        where:
          searchTerm == null ? undefined : { name: { contains: searchTerm } },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          _count: { select: { tweets: true, followers: true, follows: true } },
          followers:
            currentUserId == null
              ? undefined
              : { where: { id: currentUserId } },
        },
      });

      let nextCursor: typeof cursor | undefined;
      if (users.length > limit) {
        const nextUser = users.pop();
        if (nextUser != null) {
          nextCursor = { id: nextUser.id };
        }
      }

      const profiles: Profile[] = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        followersCount: user._count.followers,
        followsCount: user._count.follows,
        tweetsCount: user._count.tweets,
        isFollowing: user.followers.length > 0,
      }));
      return { profiles, nextCursor };
    }),
});

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  followersCount: number;
  followsCount: number;
  tweetsCount: number;
  isFollowing: boolean;
};

type RouterOutput = inferRouterOutputs<typeof profileRouter>;
export type MiniProfile = RouterOutput["getFollowers"][number];
