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

    // all vals will be either "" or wutever it is, this is the displayed val
    addBase: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const number1 = faker.number.int({ min: 1, max: 100 })
      const number2 = faker.number.int({ min: 1, max: 100 })
      const fakeCellsData = [
        { colNum: 0, val: faker.person.fullName() },
        { colNum: 1, val: faker.person.fullName() },
        { colNum: 2, val: String(number1), numVal: number1 },
        { colNum: 3, val: String(number2), numVal: number2 },
      ];

      const cellsFlat: (string | number| null)[] = [];

      fakeCellsData.forEach(cell => {
        cellsFlat.push(cell.numVal ?? cell.val)
      });

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
                showing: [true, true, true, true],
                rows: {
                  create: [
                    {
                      rowNum: 0,
                      cellsFlat: cellsFlat,
                      cells: {
                        create: fakeCellsData,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          tables: {
            include: {
              rows: {
                include: {
                  cells: true,
                },
              },
            },
          },
        },
      });
  
      return newBase;
    }),  
    getBaseTables: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.table.findMany({
        where: {baseId: input.baseId}
      })
    })
})