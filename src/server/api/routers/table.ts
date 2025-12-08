import { z } from "zod";
import { faker } from '@faker-js/faker';
import { headerType, type Row } from "~/types/types";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { viewRouter } from "./view";

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

    const search = view.search
    let tmp = []
    
    if (search !== "") {
      for (let i = 0; i <  table.headerTypes.length; i++) {
        const header = `"cellsFlat"->>${i}` 
        tmp.push(`${header} LIKE '%${search}%'`)
      }
      let searchString = tmp.join(" OR ")
      searchString = "(" + searchString + ")";
      whereClause = whereClause + " AND " + searchString
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
      SELECT *
      FROM "Row" r
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
.input(z.object({tableId: z.string(), rowNum: z.number(), cellsFlat: z.array(z.union([z.string(), z.number(), z.null()])), rowId: z.string()}))
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
        rowNum: input.rowNum + 1,
        tableId: input.tableId,
        cellsFlat: input.cellsFlat,
      },
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

    const newCellFlatVal = input.type === "string" ? '""' : 'null';
    return await ctx.db.$executeRaw`
      UPDATE "Row"
      SET "cellsFlat" = COALESCE("cellsFlat", '[]'::jsonb) || ${newCellFlatVal}::jsonb
      WHERE "tableId" = ${input.tableId};
    `;
}),

  editCell: protectedProcedure
  .input(z.object({
    rowId: z.string(),
    col: z.number(),
    newVal: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    return await ctx.db.$transaction(async (tx) => {
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
        }
        
        batchRowsData.push({ id: rowId, tableId: input.tableId, rowNum, cellsFlat });
    }
    await ctx.db.row.createMany({ data: batchRowsData });
  }

  return ctx.db.table.update({
    where: { id: input.tableId },
    data: { numRows: numRows + NUM_TO_ADD },
  });
}),
deleteColumn:protectedProcedure
.input(z.object({tableId: z.string(), colIndex: z.number()}))
.mutation(async({ctx, input}) => {
  // update table
  const prevTable = await ctx.db.table.findUnique({
    where: {id: input.tableId}
  })
  if (!prevTable) throw new Error("Table not found");
  const newHeader = [...prevTable.headers];
  const newHeaderTypes = [...prevTable.headerTypes];
  // remove the index
  newHeader.splice(input.colIndex, 1)
  newHeaderTypes.splice(input.colIndex, 1)
  await ctx.db.table.update({
    where: {id: input.tableId},
    data: {
      headers: newHeader,
      headerTypes: newHeaderTypes
    }
  })
  // update views
  const views = await ctx.db.view.findMany({
    where: {tableId: input.tableId}
  })
  if (!views || !views[0]) throw new Error("no views founds")
  const newShowing = views[0].showing
  newShowing.splice(input.colIndex, 1)
  const viewsUpdated = await ctx.db.view.updateMany({
    where: {tableId: input.tableId},
    data: {
      showing: newShowing
    }
  })
  // update filters and sorts
  for (let view of views) {
    await ctx.db.filter.deleteMany({
      where: {columnIndex: input.colIndex, viewId: view.id}
    })
    await ctx.db.sort.deleteMany({
      where: {columnIndex: input.colIndex, viewId: view.id}
    })
  }

  // update rows need to update all the cellsflat
    // cellsFlat
  // this is not return 
  const result = await ctx.db.$executeRaw`
    UPDATE "Row"
    SET "cellsFlat" = COALESCE("cellsFlat", '[]'::jsonb) - ${input.colIndex}::int
    WHERE "tableId" = ${input.tableId};
  `;
  return result;
  }),
  duplicateCol: protectedProcedure
  .input(z.object({colIndex: z.number(), tableId: z.string()}))
  .mutation(async ({ctx, input}) => {
    // update table --> header and tableHeaders
    const table = await ctx.db.table.findUnique({
      where: {id: input.tableId},
    })

    if (!table) throw new Error("table not found")
    const newHeaders = [...table.headers];
    const newHeaderTypes = [...table.headerTypes];
    const newHeader = table.headers[input.colIndex];
    const newHeaderType = table.headerTypes[input.colIndex];
    if (!newHeader || !newHeaderType) throw new Error ("target column for duplicate header and headerType dont exist");
    newHeaders.splice(input.colIndex, 0, newHeader);
    newHeaderTypes.splice(input.colIndex, 0, newHeaderType);
    await ctx.db.table.update({
      where: {id: input.tableId},
      data: {
        headers: newHeaders,
        headerTypes: newHeaderTypes
      }
    })
    // update views --> showing
    const view = await ctx.db.view.findFirst({
      where: {tableId: input.tableId}
    })
    if (!view) throw new Error("table has no views")
    const newShowings = [...view.showing]
    newShowings.splice(input.colIndex, 0, true)
    await ctx.db.view.updateMany({
      where: {tableId: input.tableId},
      data: {
        showing: newShowings
      }
    })
    // update rows
    const colIndex = input.colIndex;

    return await ctx.db.$executeRawUnsafe(`
      UPDATE "Row"
      SET "cellsFlat" = (
        SELECT jsonb_agg(elem)
        FROM (
          SELECT elem 
          FROM jsonb_array_elements(COALESCE("cellsFlat",'[]')) WITH ORDINALITY AS t(elem, ord)
          WHERE ord <= ${colIndex}::int

          UNION ALL

          SELECT (COALESCE("cellsFlat",'[]') -> ${colIndex}::int) AS elem  -- duplicate element

          UNION ALL

          SELECT elem 
          FROM jsonb_array_elements(COALESCE("cellsFlat",'[]')) WITH ORDINALITY AS t(elem, ord)
          WHERE ord > ${colIndex}::int
        ) q
      )
      WHERE "tableId" = '${input.tableId}';
    `);
  }),
  editHeaderCol: protectedProcedure
  .input(z.object({colIndex: z.number(), tableId: z.string(), newHeaderName: z.string(), newHeaderType: z.enum([
        "string",
        "number"
      ])}))
  .mutation(async ({ctx, input}) => {
    // change table header
    const table = await ctx.db.table.findUnique({
      where: {id: input.tableId},
    })
    if (!table) throw new Error("table not found")
    const newHeaders = [...table.headers];
    newHeaders.splice(input.colIndex, 1, input.newHeaderName)
    const newHeaderTypes = [...table.headerTypes]
    if (input.newHeaderType !== table.headerTypes[input.colIndex]) {
      newHeaderTypes.splice(input.colIndex, 1, input.newHeaderType)
      // reset the col values
      // for that index 
      const newCellFlatVal = input.newHeaderType === "string" ? '""':'null'
      if (input.newHeaderType === "number") {
        return await ctx.db.$executeRaw`
          UPDATE "Row"
          SET "cellsFlat" = (
            SELECT jsonb_agg(elem)
            FROM (
              SELECT elem 
              FROM jsonb_array_elements(COALESCE("cellsFlat",'[]')) WITH ORDINALITY AS t(elem, ord)
              WHERE ord < ${input.colIndex + 1}::int

              UNION ALL

              SELECT ${newCellFlatVal}::jsonb as elem

              UNION ALL

              SELECT elem 
              FROM jsonb_array_elements(COALESCE("cellsFlat",'[]')) WITH ORDINALITY AS t(elem, ord)
              WHERE ord > ${input.colIndex + 1}::int
            ) q
          )
          WHERE "tableId" = ${input.tableId};
        `;
      }
    }
    await ctx.db.table.update({
        where: {id: input.tableId},
        data: {
          headers: newHeaders,
          headerTypes: newHeaderTypes,
        }
    })

    // delete all the filters and sorts on that column
    const views = await ctx.db.view.findMany({
      where: {tableId: input.tableId}
    })
    if (!views) return new Error("no views")
    
    for (let view of views) {
      await ctx.db.filter.deleteMany({
        where: {viewId: view.id, columnIndex: input.colIndex}
      })
      await ctx.db.sort.deleteMany({
        where: {viewId: view.id, columnIndex: input.colIndex}
      })
    }
  })
})