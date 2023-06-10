import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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
