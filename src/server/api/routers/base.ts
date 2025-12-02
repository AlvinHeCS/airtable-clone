import { z } from "zod";
import { faker } from '@faker-js/faker';

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const baseRouter = createTRPCRouter({
  addTables: protectedProcedure
  .input(z.object({ baseId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const base = await ctx.db.base.findUnique({
      where: { id: input.baseId },
      include: { tables: true },
    });
    const number1 = faker.number.int({ min: 1, max: 100 });
    const number2 = faker.number.int({ min: 1, max: 100 });
    const tableAmount = base?.tableAmount || 0;
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
      
    const newTable = await ctx.db.table.create({
      data: {
        name: `Table ${tableAmount + 1}`,
        headers: ["Name", "Assignee", "Status", "Attachments"],
        headerTypes: ["string", "string", "number", "number"],
        numRows: 1,
        numViews: 1,
        baseId: input.baseId,
        views: {
          create: [
            {
              name: "Grid view",
              showing: [true, true, true, true],
            }
          ]
        },
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
      include: {
        rows: {
          include: {
            cells: true,
          },
        },
      },
    });
    await ctx.db.base.update({
      where: { id: input.baseId },
      data: { tableAmount: tableAmount + 1 },
    });
  return newTable;
  }),
    getTables: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ctx, input}) => {
      return await ctx.db.table.findMany({
        where: {baseId: input.baseId},
        orderBy: {creationDate: "asc"}
      })
    }),
})