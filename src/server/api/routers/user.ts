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
      const users = await ctx.db.user.findMany();
      console.log("server-side users fetched:", users); // <-- check this in Vercel logs
      return users;    
    })
})