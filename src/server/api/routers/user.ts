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
                headers: ["A Name"],
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
    }),
    getBaseTables: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.base.findUnique(
        {
          where: {id: input.baseId},
          include: { tables: true }
        }
      )
      return base?.tables || []
    }),
    addTables: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .mutation(async ({ ctx, input }) => {

      // get tableAmount from baseId
      const base = await ctx.db.base.findUnique(
        {
          where: {id: input.baseId},
          include: { tables: true }
        }
      )

      const tableAmount = base?.tableAmount || 0
      

      await ctx.db.table.create({
        data: {
          name: `Table ${tableAmount + 1}`,   // or something more meaningful
          headers: ["New Column"],       // default header
          base: {
            connect: { id: input.baseId },
          },
          rows: {
            create: [
              {
                rowNum: 1,
                cells: {
                  create: [{ colNum: 1, valStr: "" }],
                },
              },
            ],
          },
        },
      });
      // set new tableAmount to tableAmount + 1
      await ctx.db.base.update({
        where: { id: input.baseId },
        data: {
          tableAmount: {
            increment: 1,
          },
        },
      });
    })
})