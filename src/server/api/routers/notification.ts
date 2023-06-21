import { z } from "zod";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  getNotifications: protectedProcedure.query(({ ctx }) => {
    const currentUserId = ctx.session.user.id;
    return ctx.prisma.notification.findMany({
      where: { notifyeeId: currentUserId },
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
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input: { id }, ctx }) => {
      return ctx.prisma.notification.delete({ where: { id } });
    }),
});

type RouterOutput = inferRouterOutputs<typeof notificationRouter>;
export type NotificationWithRelations =
  RouterOutput["getNotifications"][number];
