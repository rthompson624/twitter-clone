/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import S3 from "aws-sdk/clients/s3";
import { v4 as uuid } from "uuid";
import { TRPCError } from "@trpc/server";

export const awsRouter = createTRPCRouter({
  getPresignedPostUrl: protectedProcedure
    .input(z.object({ fileType: z.string() }))
    .mutation(({ input: { fileType } }) => {
      const fileId = uuid();
      const fileSuffix = fileType.split("/")[1];
      if (fileSuffix == null)
        throw new TRPCError({
          message: `The file type "${fileType}" is not a recognized format.`,
          code: "BAD_REQUEST",
        });
      const fileName = `${fileId}.${fileSuffix}`;
      const s3 = new S3({
        apiVersion: "2006-03-01",
      });
      const post = s3.createPresignedPost({
        Bucket: process.env.BUCKET_NAME,
        Fields: {
          key: fileName,
          "Content-Type": fileType,
        },
        Expires: 60, // seconds
        Conditions: [
          ["content-length-range", 0, 1048576], // up to 1 MB
        ],
      });

      return { ...post };
    }),
});
