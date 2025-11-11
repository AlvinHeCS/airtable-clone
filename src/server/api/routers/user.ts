import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
    getUsers: publicProcedure.query(async ({ ctx }) => {
        return await ctx.db.user.findMany()
    }),
    pingDB: publicProcedure.query(async ({ ctx }) => {
      return await ctx.db.user.count(); // should return a number
    })
})