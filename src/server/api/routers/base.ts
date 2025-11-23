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
      const base = await ctx.db.base.findUnique(
        {
          where: {id: input.baseId},
          include: { tables: true }
        }
      )
      const tableAmount = base?.tableAmount || 0
      
      await ctx.db.table.create({
        data: {
          name: `Table ${tableAmount + 1}`,   
          headers: ["A Name", "Assignee", "Status", "Attachments"],       
          headerTypes: [0, 0, 1, 1],
          numRows: 1,
          base: {
            connect: { id: input.baseId },
          },
          rows: {
            create: [
              {
                rowNum: 0,
                cells: [faker.person.fullName(), faker.person.fullName(), String(faker.number.int({ min: 1, max: 100 })), String(faker.number.int({ min: 1, max: 100 }))]
              }, 
            ],
          },
        },
      });

      await ctx.db.base.update({
        where: { id: input.baseId },
        data: {
          tableAmount: {
            increment: 1,
          },
        },
      });
    }),
    getTableAmount: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ctx, input}) => {
      const base = await ctx.db.base.findUnique({
        where: {id: input.baseId}
      })
      return base?.tableAmount || 0
    }),
    getTableFromName: protectedProcedure
    .input(z.object({tableName: z.string(), baseId: z.string()}))
    .query(({ctx, input}) => {
      return ctx.db.table.findFirst({
        where: {
          baseId: input.baseId,     
          name: input.tableName 
        },
        include: {
          filters: true
        }
      }) 
    }),


    getTableRowsAhead: protectedProcedure
    .input(z.object({ tableId: z.string(), cursor: z.number().optional()}))
    .query(async ({ ctx, input }) => {

      let rows = await (ctx.db.row.findMany({
        where: { tableId: input.tableId, 
          rowNum: { gte: input.cursor ?? 0 },
        },
        take: 50,
      })) ?? []
      
      const lastRow = rows[rows.length - 1];
      const nextCursor = lastRow ? lastRow.rowNum + 1 : input.cursor ?? 0;      
      const hasMore = rows.length === 50
      return { rows, nextCursor, hasMore }
    }),
})