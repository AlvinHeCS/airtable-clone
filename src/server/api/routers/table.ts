import { z } from "zod";
import { faker } from '@faker-js/faker';

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";



export const tableRouter = createTRPCRouter({
    addRow: protectedProcedure
    .input(z.object({tableId: z.string()}))
    .mutation(async ({ ctx, input }) => {
      const newRow = await ctx.db.$transaction(async (tx) => {

        const table = await tx.table.update({
          where: { id: input.tableId },
          data: { numRows: { increment: 1 } },
          select: { numRows: true, headers: true, headerTypes: true },
        });

        const rowNum = (table.numRows ?? 1) - 1; 
        const cells = table.headers.map((_, i) =>
          table.headerTypes[i] === 0
            ? faker.person.fullName()
            : String(faker.number.int({ min: 1, max: 100 }))
        );

        return tx.row.create({
          data: {
            rowNum,
            cells,
            tableId: input.tableId,
          },
        });
      });

      return newRow;
    }),
  
    addCol: protectedProcedure
    .input(z.object({ tableId: z.string(), type: z.number(), header: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction([
        ctx.db.row.updateMany({
          where: { tableId: input.tableId },
          data: { cells: { push: "" } },
        }),
        ctx.db.table.update({
          where: { id: input.tableId },
          data: { headers: { push: input.header }, headerTypes: { push: input.type } },
        }),
      ]);
    }),
    
    editCell: protectedProcedure
    .input(z.object({rowId: z.string(), col: z.number(), newVal: z.string()}))
    .mutation(async ({ctx, input}) => {
      let row = await ctx.db.row.findUnique({
        where: {id: input.rowId}
      })
      if (!row) {
        throw new Error("row not found")
      }
      const updatedCells = row.cells.map((val, idx) =>
        idx === input.col ? input.newVal : val
      );
      await ctx.db.row.update({
        where: {id: input.rowId},
        data: {
          cells: updatedCells
        }
      });
    }),
    add100kRow: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
    
      const table = await ctx.db.table.findUnique({
        where: { id: input.tableId },
        select: { numRows: true, headers: true, headerTypes: true }
      });
    
      if (!table) throw new Error("Table not found");
    
      const { numRows, headers, headerTypes } = table;
      const NUM_TO_ADD = 100_000;
    
      const rowsToInsert = Array.from({ length: NUM_TO_ADD }, (_, i) => {
        const cells = headers.map((_, colIndex) => {
          return headerTypes[colIndex] === 0
            ? faker.person.fullName()
            : String(faker.number.int({ min: 1, max: 100 }));
        });
    
        return {
          tableId: input.tableId,
          rowNum: numRows + i,
          cells
        };
      });
    
      const BATCH_SIZE = 5000;
    
      for (let start = 0; start < rowsToInsert.length; start += BATCH_SIZE) {
        await ctx.db.row.createMany({
          data: rowsToInsert.slice(start, start + BATCH_SIZE)
        });
      }
    
      return await ctx.db.table.update({
        where: { id: input.tableId },
        data: { numRows: numRows + NUM_TO_ADD }
      });
    }),
    addFilter: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        colNum: z.number(),
        filterVal: z.string().optional(),
        filterType: z.enum([
          "contains",
          "not_contains",
          "eq",
          "gt",
          "lt",
          "empty",
          "not_empty",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.filter.create({
        data: {
          tableId: input.tableId,
          columnIndex: input.colNum,
          type: input.filterType,
          value: input.filterVal ?? "",
        },
      });
    }),
    removeFilter: protectedProcedure
    .input(z.object({filterId: z.string()}))
    .mutation(async ({ctx, input}) => {
      const deleted = await ctx.db.filter.delete({
        where: {id: input.filterId}
      })
      return deleted;
    })
})