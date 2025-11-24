import { z } from "zod";
import { faker } from '@faker-js/faker';

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const tableRouter = createTRPCRouter({
getTableWithRowsAhead: protectedProcedure
  .input(z.object({
    baseId: z.string(),
    tableName: z.string(),
    cursor: z.number().optional()
  }))
  .query(async ({ ctx, input }) => {
    // 1. Load table once
    const table = await ctx.db.table.findFirst({
      where: { baseId: input.baseId, name: input.tableName },
      include: { filters: true }
    });
    if (!table) throw new Error("Table not found");

    // 2. Load rows with pagination
    const pageSize = 200;
    const rows = await ctx.db.row.findMany({
      where: { 
        tableId: table.id,
        AND: table.filters.map((f) => ({
          cells: {
            some: {
              colNum: f.columnIndex,
              // string contains
              ...(f.type === "contains" && {
                val: { contains: f.value },
              })
            }
          }
        }))
      },
      orderBy: { rowNum: "asc" },
      take: pageSize + 1,
      skip: input.cursor ?? 0,
      include: {
        cells: {
          orderBy: { colNum: "asc" },  
        }
      }
    });

    let nextCursor: number | null = null;
    if (rows.length > pageSize) {
      rows.pop(); 
      nextCursor = (input.cursor ?? 0) + pageSize;
    }

    return {
      table,
      rows,
      nextCursor
    };
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
  addRow: protectedProcedure
  .input(z.object({ tableId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return await ctx.db.$transaction(async (tx) => {
      const table = await tx.table.update({
        where: { id: input.tableId },
        data: { numRows: { increment: 1 } },
        select: { numRows: true, headers: true, headerTypes: true },
      });

      const rowNum = (table.numRows ?? 1) - 1;

      const newRow = await tx.row.create({
        data: {
          rowNum,
          tableId: input.tableId,
        },
      });

      const cellsData = table.headers.map((_, i) => ({
        rowId: newRow.id,
        colNum: i,
        val: table.headerTypes[i] === 0
          ? faker.person.fullName()
          : String(faker.number.int({ min: 1, max: 100 })),
      }));

      await tx.cell.createMany({ data: cellsData });

      return tx.row.findUnique({
        where: { id: newRow.id },
        include: { cells: true },
      });
    });
  }),
  
addCol: protectedProcedure
.input(z.object({ tableId: z.string(), type: z.number(), header: z.string() }))
.mutation(async ({ ctx, input }) => {
  // 1️⃣ Update table headers
  const table = await ctx.db.table.update({
    where: { id: input.tableId },
    data: {
      headers: { push: input.header },
      headerTypes: { push: input.type },
    },
    select: { headers: true, headerTypes: true },
  });

  const newColNum = table.headers.length - 1;

  // 2️⃣ Fetch rows
  const rows = await ctx.db.row.findMany({
    where: { tableId: input.tableId },
    select: { id: true, rowNum: true },
  });

  if (rows.length === 0) return [];

  // 3️⃣ Construct cells in memory
  const newCells = rows.map((r) => ({
    rowId: r.id,
    colNum: newColNum,
    val: "", // initial value
  }));

  // 4️⃣ Insert all cells at once
  await ctx.db.cell.createMany({
    data: newCells,
    skipDuplicates: true,
  });

  // 5️⃣ Return updated rows directly without extra query
  const updatedRows = rows.map((r) => ({
    ...r,
    tableId: input.tableId,
    cells: [
      // Keep old cells empty, add the new cell
      { ...newCells.find((c) => c.rowId === r.id) } as any,
    ],
  }));

  return updatedRows;
}),
    
  editCell: protectedProcedure
  .input(z.object({
    rowId: z.string(),
    col: z.number(),
    newVal: z.string()
  }))
  .mutation(async ({ ctx, input }) => {

    await ctx.db.cell.updateMany({
      where: {
        rowId: input.rowId,
        colNum: input.col
      },
      data: {
        val: input.newVal
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

    const rows = Array.from({ length: NUM_TO_ADD }, (_, i) => ({
      id: `row_${i}_${crypto.randomUUID()}`,
      tableId: input.tableId,
      rowNum: numRows + i,
    }));

    const ROW_BATCH = 5000;
    for (let i = 0; i < rows.length; i += ROW_BATCH) {
      await ctx.db.row.createMany({
        data: rows.slice(i, i + ROW_BATCH)
      });
    }

    const cells: {
      rowId: string;
      colNum: number;
      val: string;
    }[] = [];

    for (let r = 0; r < NUM_TO_ADD; r++) {
      const rowId = rows[r]!.id;

      for (let c = 0; c < headers.length; c++) {
        const v = headerTypes[c] === 0
          ? faker.person.fullName()
          : String(faker.number.int({ min: 1, max: 100 }));

        cells.push({
          rowId,
          colNum: c,
          val: v,
        });
      }
    }

    const CELL_BATCH = 20_000;
    for (let i = 0; i < cells.length; i += CELL_BATCH) {
      await ctx.db.cell.createMany({
        data: cells.slice(i, i + CELL_BATCH),
      });
    }

    return ctx.db.table.update({
      where: { id: input.tableId },
      data: { numRows: numRows + NUM_TO_ADD },
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