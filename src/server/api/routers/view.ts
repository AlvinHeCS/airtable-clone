import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const viewRouter = createTRPCRouter({
  addFilter: protectedProcedure
  .input(
    z.object({
      viewId: z.string(),
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
    return await ctx.db.filter.create({
      data: {
        viewId: input.viewId,
        columnIndex: input.colNum,
        type: input.filterType,
        value: input.filterVal ?? "",
      },
    });
  }),
  editFilterHeader: protectedProcedure
  .input(z.object({ filterId: z.string(), newHeaderColIndex: z.number()}))
  .mutation(async ({ctx, input}) => {
    return await ctx.db.filter.update({
        where: {id: input.filterId},
        data: {
            columnIndex: input.newHeaderColIndex
        }
    })
  }),
  editFilterType: protectedProcedure
    .input(z.object({filterId: z.string(), newType: z.enum([
        "contains",
        "not_contains",
        "eq",
        "gt",
        "lt",
        "empty",
        "not_empty",
    ])}))
    .mutation(async ({ctx, input}) => {
        return await ctx.db.filter.update({
            where: {id: input.filterId},
            data: {
                type: input.newType
            }
        })
    }),
    editFilterVal: protectedProcedure
        .input(z.object({filterId: z.string(), newFilterVal: z.string()}))
        .mutation(async({ctx, input}) => {
            return await ctx.db.filter.update({
                where: {id: input.filterId},
                data: {
                    value: input.newFilterVal
                }
            })
        }), 
  removeFilter: protectedProcedure
  .input(z.object({filterId: z.string()}))
  .mutation(async ({ctx, input}) => {
    const deleted = await ctx.db.filter.delete({
      where: {id: input.filterId}
    })
    return deleted;
  }),
  addSort: protectedProcedure
  .input(
    z.object({
      viewId: z.string(),
      colNum: z.number(),
      sortType: z.enum([
        "sortA_Z",
        "sortZ_A",
        "sort1_9",
        "sort9_1",
      ]),
    })
  ) 
  .mutation(async({ctx, input}) => {
    return await ctx.db.sort.create({
      data: {
        viewId: input.viewId,
        columnIndex: input.colNum,
        type: input.sortType
      }
    })
  }),
  removeSort: protectedProcedure
  .input(z.object({sortId: z.string()}))
  .mutation(async ({ctx, input}) => {
    return await ctx.db.sort.delete({
      where: {id: input.sortId}
    })
  }),
  editSortType: protectedProcedure
  .input(z.object({sortId: z.string(), sortType: z.enum([
        "sortA_Z",
        "sortZ_A",
        "sort1_9",
        "sort9_1",
      ]),}))
  .mutation(async ({ctx, input}) => {
    return await ctx.db.sort.update({
      where: {id: input.sortId},
      data: {
        type: input.sortType
      }
    })
  }),
  editSortHeader: protectedProcedure
  .input(z.object({sortId: z.string(), sortColIndex: z.number()}))
  .mutation(async ({ctx, input}) => {
    return await ctx.db.sort.update({
      where: {id: input.sortId},
      data: {
        columnIndex: input.sortColIndex
      }
    })
  }),
  showHideCol: protectedProcedure
  .input(z.object({viewId: z.string(), check: z.boolean(), colIndex: z.number()}))
  .mutation(async ({ctx, input}) => {
    return await ctx.db.$transaction(async (tx) => {
      const view = await tx.view.findUnique({
        where: {id: input.viewId},
      })
      if (!view) throw new Error("view not found");
      const newShowing = [...view.showing]
      newShowing[input.colIndex] = input.check;
      return await tx.view.update({
        where: {id: input.viewId},
        data: {
          showing: newShowing
        }
      })
    })
  }),
  getViews: protectedProcedure
  .input(z.object({tableId: z.string()}))
  .query(async ({ctx, input}) => {
    const table = await ctx.db.table.findUnique({
      where: { id: input.tableId },
      select: { 
        views: {
          orderBy: { creationDate: "asc" },
          include: { filters: {
            orderBy: {creationDate: "asc"}
          }, sorts: {
            orderBy: {creationDate: "asc"}
          }}
      } },
    });
    return table?.views ?? [];
  }),
  getViewFromTableIdViewName: protectedProcedure
  .input(z.object({tableId: z.string(), viewName: z.string()}))
  .query(async ({ctx, input}) => {
    return await ctx.db.view.findFirst({
      where: {
        tableId: input.tableId,
        name: input.viewName
      },
      include: {
        filters: true,
        sorts: true
      }
    })
  }),
  addView: protectedProcedure
  .input(z.object({tableId: z.string()}))
  .mutation(async ({ctx, input}) => {
    return await ctx.db.$transaction(async (tx) => {
      const table = await tx.table.findUnique({
        where: {id: input.tableId},
        select: {numViews: true, headers: true}
      })
      if (!table) throw new Error("table not found");
      const viewAmount = table.numViews
      // update viewAmount
      await tx.table.update({
        where: {id: input.tableId},
        data: {
          numViews: { increment: 1 }
        }
      })
      return await tx.view.create({
        data: {
          name: `Grid ${viewAmount + 1}`,
          tableId: input.tableId,
          showing: table.headers.map((h) => { return true})
        },
        include: {
          filters: true,
          sorts: true
        }
      })
    })
  })

})