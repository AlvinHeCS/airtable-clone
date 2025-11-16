import { z } from "zod";
import { faker } from '@faker-js/faker';

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
    getUsers: publicProcedure.query(async ({ ctx }) => {
        return await ctx.db.user.findMany()
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
                headers: ["A Name", "Assignee", "Status", "Attachments"],
                headerTypes: [0, 0, 1, 1],
                numRows: 1,
                rows: {
                  create: [
                    {
                      rowNum: 0,
                      cells: [faker.person.fullName(), faker.person.fullName(), String(faker.number.int({ min: 1, max: 100 })), String(faker.number.int({ min: 1, max: 100 }))]
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
    }),
    getBaseTables: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.base.findUnique(
        {
          where: {id: input.baseId},
          include: { 
            tables: {
              include: {
                rows: true
              }
            }
           },
        }
      )
      return base?.tables || []
    })
})