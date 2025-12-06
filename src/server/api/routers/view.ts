import { z } from "zod";
import type { Filter, Sort } from "~/types/types";

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
  .input(z.object({ filterId: z.string(), newHeaderColIndex: z.number(), newValue: z.string(), newType: z.enum([
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
            columnIndex: input.newHeaderColIndex,
            type: input.newType,
            value: input.newValue
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
    return await ctx.db.filter.delete({
      where: {id: input.filterId}
    })
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
  .input(z.object({sortId: z.string(), sortColIndex: z.number(), sortType: z.enum([
        "sortA_Z",
        "sortZ_A",
        "sort1_9",
        "sort9_1",
      ])}))
  .mutation(async ({ctx, input}) => {
    return await ctx.db.sort.update({
      where: {id: input.sortId},
      data: {
        columnIndex: input.sortColIndex,
        type: input.sortType
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
          showing: table.headers.map((h) => { return true}),
          search: "",
          cellHeight: "small"
        },
        include: {
          filters: {orderBy: {creationDate: "asc"}},
          sorts: {orderBy: {creationDate: "asc"}}
        }
      })
    })
  }),
  // from a view choose a view and pick to copy there filter, sorts, or hidden fields
  copyViewAugments: protectedProcedure
  .input(z.object({currentViewId: z.string(), newFilterIds: z.array(z.string()).optional(), newSortIds: z.array(z.string()).optional(), targetViewId: z.string(), filterBool: z.boolean(), sortBool: z.boolean(), showHideBool: z.boolean()}))
  .mutation(async ({ctx, input}) => {
    const copyView = await ctx.db.view.findUnique({
      where: {id: input.targetViewId},
      include: {sorts: {orderBy: {creationDate: "asc"}}, filters: {orderBy: {creationDate: "asc"}}}
    })
    if (!copyView) throw new Error("copy view not found")
    // delete old augments
    if (input.filterBool) {
      await ctx.db.filter.deleteMany({
        where: {viewId: input.currentViewId},
      })
      // then add the copyView
      const newFilters: Filter[] = copyView.filters.map((filter, i) => {
        return {
          id: input.newFilterIds![i] ?? "",
          viewId: input.currentViewId,
          columnIndex: filter.columnIndex,
          type: filter.type,
          value: filter.value,
          creationDate: new Date()
        }
      })
      await ctx.db.filter.createMany({
        data: newFilters,
        skipDuplicates: true
      })
    } if (input.sortBool) {
      await ctx.db.sort.deleteMany({
        where: {viewId: input.currentViewId},
      })
      const newSorts: Sort[] = copyView.sorts.map((sort, i) => {
        return {
          id: `${i}_${crypto.randomUUID()}`,
          viewId: input.currentViewId,
          columnIndex: sort.columnIndex,
          type: sort.type,
          creationDate: new Date()
        }
      })
      await ctx.db.sort.createMany({
        data: newSorts,
        skipDuplicates: true
      })
    } if (input.showHideBool) {
      // update old showing
      ctx.db.view.update({
        where: {id: input.currentViewId},
        data: {
          showing: copyView.showing
        }
      })
    }
  }),
  editSearch: protectedProcedure
  .input(z.object({viewId: z.string(), search: z.string()}))
  .mutation(async({ctx, input}) => {
    return await ctx.db.view.update({
      where: {id: input.viewId},
      data: {
        search: input.search
      },
      include: {filters: {orderBy: {creationDate: "asc"}}, sorts: {orderBy: {creationDate: "asc"}}}
    })
  }),


  editCellHeight: protectedProcedure
  .input(z.object({viewId: z.string(), newCellHeight: z.enum([
        "small",
        "medium",
        "large",
      ])}))
  .mutation(async ({ctx, input}) => {
    return ctx.db.view.update({
      where: {id: input.viewId},
      data: {
        cellHeight: input.newCellHeight
      }
    })
  })
})