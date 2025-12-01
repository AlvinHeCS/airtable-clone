import { z } from "zod";
import { faker } from '@faker-js/faker';
import type { Row } from "~/types/types";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const tableRouter = createTRPCRouter({

getTable: protectedProcedure
.input(z.object({tableId: z.string()}))
.query(async ({ctx, input}) => {
  return await ctx.db.table.findUnique({
    where: {id: input.tableId},
    include: {
      views: {
        orderBy: {creationDate: "asc"}
      }
    }
  })
}),
getViews: protectedProcedure
.input(z.object({tableId: z.string()}))
.query(async({ctx, input}) => {
  return await ctx.db.view.findMany({
    where: {tableId: input.tableId},
    orderBy: {creationDate: "asc"},
    include: {
      filters: {
        orderBy: {creationDate: "asc"}
      },
      sorts: {
        orderBy: {creationDate: "asc"}
      }
    }
  })
}),
rowsAhead: protectedProcedure
  .input(z.object({
    tableId: z.string(),
    cursor: z.number().optional(),
    viewId: z.string(),
  }))
  .query(async ({ ctx, input }) => {
    const view = await ctx.db.view.findFirst({
      where: { id: input.viewId},
      include: {filters: {orderBy: {creationDate: "asc"}}, sorts: {orderBy: {creationDate: "asc"}}}
    })
    const table = await ctx.db.table.findUnique({
      where: {id: input.tableId}
    })
    if (!view) throw new Error("View not found");
    if (!table) throw new Error("Table not found");
    
    let whereClause = `"tableId" = '${input.tableId}'`
    if (view.filters.length > 0) {
      const formattedFilters = view.filters.map((filter) => {
        const header = table.headerTypes[filter.columnIndex] 
        ? `"cellsFlat"->>${filter.columnIndex}::int` 
        : `"cellsFlat"->>${filter.columnIndex}` 
        let sqlWhere = `${header} LIKE '%${filter.value}%'`
        switch (filter.type) {
          case "contains": 
            sqlWhere = `${header} LIKE '%${filter.value}%'`
            break
          case "not_contains":
            sqlWhere = `${header} NOT LIKE '%${filter.value}%'`
            break
          case "empty":
            sqlWhere = `${header} = '${filter.value}'`
            break
          case "not_empty":
            sqlWhere = `${header} != '${filter.value}'`
            break
          case "eq":
            sqlWhere = `${header} = '${filter.value}'`
            break
          case "gt": 
            sqlWhere = `${header} > '${filter.value}'`
            break
          case "lt":
            sqlWhere = `${header} < '${filter.value}'`
            break
        }
        return sqlWhere
      })
      whereClause = `"tableId" = '${input.tableId}' AND ${formattedFilters.join(" AND ")}`
    }

    let orderByClause = `"rowNum" ASC`;
    if (view.sorts.length !== 0) {
      const formattedSorts = view.sorts.map(sort => {
        const direction = (sort.type === "sort1_9" || sort.type === "sortA_Z") ? "ASC" : "DESC";
        return table.headerTypes[sort.columnIndex]
          ? `"cellsFlat"->>${sort.columnIndex}::int ${direction}`
          : `"cellsFlat"->>${sort.columnIndex} ${direction}`;
      });
      formattedSorts.reverse()
      orderByClause = formattedSorts.join(", ");
    }
    const pageSize = 200;


    const sqlRows: Row[] = await ctx.db.$queryRawUnsafe(`
      SELECT 
        r.*,
        json_agg(c ORDER BY c."colNum" ASC) AS cells
      FROM "Row" r
      LEFT JOIN "Cell" c ON c."rowId" = r.id
      WHERE ${whereClause}
      GROUP BY r.id
      ORDER BY ${orderByClause}
      LIMIT ${pageSize + 1} OFFSET ${input.cursor ?? 0};
    `);
    console.log("this is sqlRows: ", sqlRows)

    let nextCursor: number | null = null;
    if (sqlRows.length > pageSize) {
      sqlRows.pop();
      nextCursor = (input.cursor ?? 0) + pageSize;
    }

    return {
      rows: sqlRows,
      nextCursor
    };
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

    // make rowNum 0 indexed
    const rowNum = (table.numRows ?? 1) - 1;

    // create cellsData and cellsFlat
    const cellsData: { colNum: number; val: string; numVal: number | null }[] = [];
    const cellsFlat: (string | number| null)[] = [];
    table.headers.forEach((_, i) => {
      if (table.headerTypes[i] === 0) {
        const val = faker.person.fullName();
        cellsData.push({ colNum: i, val, numVal: null });
        cellsFlat.push(val)
      } else {
        const numVal = faker.number.int({ min: 1, max: 100 });
        const val = String(numVal);
        cellsData.push({ colNum: i, val, numVal });
        cellsFlat.push(numVal)
      }
    });

    return await tx.row.create({
      data: {
        rowNum,
        tableId: input.tableId,
        cellsFlat,
        cells: {
          create: cellsData.map(cell => ({
            colNum: cell.colNum,
            val: cell.val,
            numVal: cell.numVal,
          })),
        },
      },
      include: { cells: {orderBy: {colNum: "asc"}}} 
    });
  });
}),
  
addCol: protectedProcedure
.input(z.object({ tableId: z.string(), type: z.number(), header: z.string(), viewName: z.string() }))
.mutation(async ({ ctx, input }) => {
    const table = await ctx.db.table.update({
      where: { id: input.tableId },
      data: {
        headers: { push: input.header },
        headerTypes: { push: input.type },
      },
      select: { headers: true, headerTypes: true },
    });

    // update showing for all the views
    await ctx.db.view.updateMany({
      where: { 
        tableId: input.tableId,
        NOT: { name: input.viewName }
      },
      data: { showing: { push: false } },
    });
    await ctx.db.view.updateMany({
      where: { 
        tableId: input.tableId, 
        name: input.viewName 
      },
      data: { showing: { push: true }}
    });

    const newColNum = table.headers.length - 1;

    const newCellFlatVal = input.type === 0 ? '""' : 'null'; // JSON string or null

    await ctx.db.$executeRaw`
      UPDATE "Row"
      SET "cellsFlat" = COALESCE("cellsFlat", '[]'::jsonb) || ${newCellFlatVal}::jsonb
      WHERE "tableId" = ${input.tableId};
    `;

    const rows = await ctx.db.row.findMany({
      where: { tableId: input.tableId },
      select: { id: true, rowNum: true, cellsFlat: true },
    });

    if (rows.length === 0) return [];

    // make the new cells
    const newCells = rows.map((r, i) => ({
      id: `cell_${i}_${crypto.randomUUID()}`,
      rowId: r.id,
      colNum: newColNum,
      val: "",
      numVal: null,
    }));

    await ctx.db.cell.createMany({
      data: newCells,
      skipDuplicates: true,
    });

    const updatedRows = rows.map((r) => ({
      ...r,
      tableId: input.tableId,
      // for each row you want to give it the cell that matches the rowId
      cells: [
        { ...newCells.find((c) => c.rowId === r.id) },
      ],
    }));
    // rows return will like this
    // ({id, rowNum, cellsFlat, tableId, cells})[]
    // where cells only contains the cell that was created for the new col
    return updatedRows;
}),

  // since editing cells doesnt use cellId (probs should but i ceebs rewriting it now) addCol doesnt need to return the cellId's
  // also good because add100k rows doesnt need when it uses createMany to make cells to return cellId's
  editCell: protectedProcedure
  .input(z.object({
    rowId: z.string(),
    col: z.number(),
    newVal: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    return await ctx.db.$transaction(async (tx) => {
      await tx.cell.updateMany({
        where: {
          rowId: input.rowId,
          colNum: input.col
        },
        data: {
          val: input.newVal,
          numVal: isNaN(Number(input.newVal)) ? null : Number(input.newVal),
        }
      });

      const row = await tx.row.findUnique({
        where: { id: input.rowId },
        select: { cellsFlat: true, tableId: true }
      });



      if (!row) throw new Error("Row not found");
      const table = await tx.table.findUnique({
        where: {id: row.tableId},
        select: {headerTypes: true}
      })
      if (!table) throw new Error("Table not found");
      // update cellsFlat
      const newCellsFlat = [...row.cellsFlat as (string | number | null)[]]
      if (table.headerTypes[input.col] === 0) {
        newCellsFlat[input.col] = input.newVal;
      } else {
        const newValNum = isNaN(Number(input.newVal)) ? null : Number(input.newVal);
        newCellsFlat[input.col] = newValNum;
      }

      await tx.row.update({
        where: { id: input.rowId },
        data: { cellsFlat: newCellsFlat }
      });
      return { success: true };
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
  const NUM_TO_ADD = 100000;


  // create the rows and the cells for the 100k
  const rows: { id: string; tableId: string; rowNum: number; cellsFlat: (string | number | null)[]}[] = [];
  const cells: { rowId: string; colNum: number; val: string; numVal: number | null }[] = [];
  for (let i = 0; i < NUM_TO_ADD; i++) {
    // give it a random rowId because when you create cells it needs to point to a rowId but then since createMany doesnt return
    // id therefore you need to assign the rowId urself so you know wut it is before using it 
    const rowId = `row_${i}_${crypto.randomUUID()}`;
    const rowNum = numRows + i;
    const cellsFlat: (string | number | null)[] = [];
    // create the cellValues, cells and add to cellsFlat
    for (let j = 0; j < headers.length; j++) {
      const val = headerTypes[j] === 0 ? faker.person.fullName() : String(faker.number.int({ min: 1, max: 100 }));
      const numVal = isNaN(Number(val)) ? null : Number(val);
      cellsFlat.push(numVal ?? val);
      cells.push({
        rowId,
        colNum: j,
        val: val,
        numVal
      });
    }
    rows.push({ id: rowId, tableId: input.tableId, rowNum, cellsFlat });
  }

  // Batch insert rows
  const ROW_BATCH = 5000;
  for (let i = 0; i < rows.length; i += ROW_BATCH) {
    await ctx.db.row.createMany({
      data: rows.slice(i, i + ROW_BATCH).map(r => ({
        id: r.id,
        tableId: r.tableId,
        rowNum: r.rowNum,
        cellsFlat: r.cellsFlat
      }))
    });
  }

  // Batch insert cells
  const CELL_BATCH = 20000;
  for (let i = 0; i < cells.length; i += CELL_BATCH) {
    await ctx.db.cell.createMany({
      data: cells.slice(i, i + CELL_BATCH),
    });
  }

  // Update table's numRows
  return ctx.db.table.update({
    where: { id: input.tableId },
    data: { numRows: numRows + NUM_TO_ADD },
  });
}),
})