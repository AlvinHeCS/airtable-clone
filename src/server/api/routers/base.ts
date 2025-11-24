import { z } from "zod";
import { faker } from '@faker-js/faker';

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const filterTypes = z.enum([
  "contains",
  "not_contains",
  "eq",
  "gt",
  "lt",
  "empty",
  "not_empty",
]);

export const baseRouter = createTRPCRouter({
  addTables: protectedProcedure
  .input(z.object({ baseId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const base = await ctx.db.base.findUnique({
      where: { id: input.baseId },
      include: { tables: true },
    });

    const tableAmount = base?.tableAmount || 0;

    const newTable = await ctx.db.table.create({
      data: {
        name: `Table ${tableAmount + 1}`,
        headers: ["A Name", "Assignee", "Status", "Attachments"],
        headerTypes: [0, 0, 1, 1],
        numRows: 1,
        base: { connect: { id: input.baseId } },
        rows: {
          create: [
            {
              rowNum: 0,
              cells: {
                create: [
                  { colNum: 0, val: faker.person.fullName()},
                  { colNum: 1, val: faker.person.fullName()},
                  { colNum: 2, val: String(faker.number.int({ min: 1, max: 100 }))},
                  { colNum: 3, val: String(faker.number.int({ min: 1, max: 100 }))},
                ],
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
        where: {baseId: input.baseId}
      })
    }),
})