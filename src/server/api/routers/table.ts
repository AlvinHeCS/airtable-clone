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
        const header = table.headerTypes[filter.columnIndex] === "number"
        ? `("cellsFlat"->>${filter.columnIndex})::int` 
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
            if (!filter.value) return ""
            sqlWhere = `${header} = ${filter.value}::int`
            break
          case "gt": 
            if (!filter.value) return ""
            sqlWhere = `${header} > ${filter.value}::int`
            break
          case "lt":
            if (!filter.value) return ""
            sqlWhere = `${header} < ${filter.value}::int`
            break
        }
        return sqlWhere
      })
      const newFormattedFilters = formattedFilters.filter((filter) => {
        return (filter !== "")
      })
      if (newFormattedFilters.length > 0) {
        whereClause = `"tableId" = '${input.tableId}' AND ${newFormattedFilters.join(" AND ")}`
      }
    }

    let orderByClause = `"rowNum" ASC`;
    if (view.sorts.length !== 0) {
      const formattedSorts = view.sorts.map(sort => {
        const direction = (sort.type === "sort1_9" || sort.type === "sortA_Z") ? "ASC" : "DESC";
        return table.headerTypes[sort.columnIndex] === "number"
          ? `("cellsFlat"->>${sort.columnIndex})::int ${direction}`
          : `"cellsFlat"->>${sort.columnIndex} ${direction}`;
      });
      formattedSorts.reverse()
      orderByClause = formattedSorts.join(", ");
    }
    const pageSize = 5000;

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
.input(z.object({ cellsData: z.array(z.object({
  id: z.string(),
  colNum: z.number(),
  val: z.string(),
  numVal: z.number().nullable(),
  rowId: z.string()
})), 
tableId: z.string(), rowNum: z.number(), 
cellsFlat: z.array(z.union([z.string(), z.number(), z.null()])), 
rowId: z.string()}))
.mutation(async ({ ctx, input }) => {
  return await ctx.db.$transaction(async (tx) => {
    const table = await tx.table.update({
      where: { id: input.tableId },
      data: { numRows: { increment: 1 } },
      select: { numRows: true, headers: true, headerTypes: true },
    });


    return await tx.row.create({
      data: {
        id: input.rowId, 
        rowNum: input.rowNum,
        tableId: input.tableId,
        cellsFlat: input.cellsFlat,
        cells: {
          create: input.cellsData.map(cell => ({
            id: cell.id,
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
.input(z.object({ tableId: z.string(), type: z.enum([
        "string",
        "number"
      ]), header: z.string(), viewName: z.string() }))
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

    const newCellFlatVal = input.type === "string" ? '""' : 'null';
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
      if (table.headerTypes[input.col] === "string") {
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
  const NUM_COLUMNS = headers.length; 
  
  const ROW_BATCH_SIZE = 5000; 

  for (let i = 0; i < NUM_TO_ADD; i += ROW_BATCH_SIZE) {
    
    const batchRowsData = [];
    const batchCellsData = [];

    const currentBatchSize = Math.min(ROW_BATCH_SIZE, NUM_TO_ADD - i);

    for (let j = 0; j < currentBatchSize; j++) {
        const rowIdx = i + j;
        
        const rowId = `row_${rowIdx}_${crypto.randomUUID()}`;
        const rowNum = numRows + rowIdx;
        const cellsFlat: (string | number | null)[] = [];

        for (let k = 0; k < NUM_COLUMNS; k++) {
            const isString = headerTypes[k] === "string";
            
            const val = isString 
                ? faker.person.fullName() 
                : String(faker.number.int({ min: 1, max: 100 }));
            
            const numVal = isString ? null : Number(val);

            cellsFlat.push(numVal ?? val);
            
            batchCellsData.push({
                rowId,
                colNum: k,
                val: val,
                numVal
            });
        }
        
        batchRowsData.push({ id: rowId, tableId: input.tableId, rowNum, cellsFlat });
    }


    await ctx.db.row.createMany({ data: batchRowsData });
    await ctx.db.cell.createMany({ data: batchCellsData });
  }

  return ctx.db.table.update({
    where: { id: input.tableId },
    data: { numRows: numRows + NUM_TO_ADD },
  });
}),
})