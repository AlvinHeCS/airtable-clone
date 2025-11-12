import { RowSelection } from "@tanstack/react-table";
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
                headers: ["A Name", "Assignee", "Status", "Attachments"],
                headerTypes: [0, 0, 1, 1],
                numRows: 2,
                rows: {
                  create: [
                    {
                      rowNum: 0,
                      cells: {
                        create: [
                          { colNum: 0, valStr: "Alvin" },
                          { colNum: 1, valStr: "Joanna" },
                          { colNum: 2, valInt: 1 },
                          { colNum: 3, valInt: 67 }
                        ],
                      },
                    }, 
                    {
                      rowNum: 1,
                      cells: {
                        create: [
                          { colNum: 0, valStr: "" },
                          { colNum: 1, valStr: "" },
                          { colNum: 2, valInt: 0 },
                          { colNum: 3, valInt: 0 }
                        ]
                      }
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
          include: { 
            tables: {
              include: {
                rows: {
                  include: {
                    cells: true
                  }
                }
              }
            }
           },
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
          name: `Table ${tableAmount + 1}`,   
          headers: ["A Name", "Assignee", "Status", "Attachments"],       
          headerTypes: [0, 0, 1, 1],
          numRows: 2,
          base: {
            connect: { id: input.baseId },
          },
          rows: {
            create: [
              {
                rowNum: 0,
                cells: {
                  create: [
                    { colNum: 0, valStr: "Alvin" },
                    { colNum: 1, valStr: "Joanna" },
                    { colNum: 2, valInt: 1 },
                    { colNum: 3, valInt: 67 }
                  ],
                },
              },
              {
                rowNum: 1,
                cells: {
                  create: [
                    { colNum: 0, valStr: "" },
                    { colNum: 1, valStr: "" },
                    { colNum: 2, valInt: 0 },
                    { colNum: 3, valInt: 0 }
                  ]
                }
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
    }),
  addRow: protectedProcedure
  .input(z.object({tableId: z.string()}))
  .mutation(async ({ ctx, input }) => {

    const table = await ctx.db.table.findUnique({
      where: {id: input.tableId},
      include: { rows: {include: {cells: true} }}
    })
    
    const headers = table?.headers || [];
    const headerTypes = table?.headerTypes || [];
    const numRows = table?.numRows || -1

    const cells = headers.map((_, i) => {
      if (headerTypes[i] === 0) {
        return { colNum: i, valStr: "" };
      } else {
        return { colNum: i };
      }
    });


    return ctx.db.table.update({
      where: { id: input.tableId },
      data: {
        numRows: numRows + 1,
        rows: {
          create: [{
            rowNum: numRows,
            cells: {
              create: cells
            },
        }],
        },
      },
    })
  }),
  addCol: protectedProcedure
  .input(z.object({tableId: z.string(), type: z.number(), header: z.string()}))
  .mutation(async ({ ctx, input }) => {
    const table = await ctx.db.table.findUnique({
      where: {id: input.tableId},
      include: {rows: {include: {cells: true}}}
    })
    // need to update headers
    const headers = table?.headers || [];
    headers.push(input.header);
    const headerTypes = table?.headerTypes || [];
    headerTypes.push(input.type);
    const newColIndex = headers.length - 1;
  

    const rowUpdates = await table?.rows.map(row => ({
      where: { id: row.id },
      data: {
        cells: {
          create: [
            input.type === 0
              ? { colNum: newColIndex, valStr: "" } 
              : { colNum: newColIndex }            
          ]
        }
      }
    }));

    await ctx.db.table.update({
      where: {id: input.tableId},
      data: {
        headers: headers,
        headerTypes: headerTypes,
        rows: {
          update: rowUpdates
        }
      }
    })
  })
})