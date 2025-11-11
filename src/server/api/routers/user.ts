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
      console.log("server-side users fetched:", users); 
      return users;    
    }),

    getBases: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return await ctx.db.base.findMany({
        where: {
          userId: userId,
        }
      })
    }),
    addBase: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
  
      const newBase = await ctx.db.base.create({
        data: {
          user: { connect: { id: userId } },
          name: "Untitled Base",
          tableAmount: 1,             
          tables: {
            create: [
              {
                name: "Table 1",
                rows: {
                  create: [
                    {
                      rowNum: 1,
                      cells: {
                        create: [
                          { colNum: 1, valStr: "" },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          tables: true,
        },
      });

      return newBase;
    })
})