
import { api } from "~/trpc/react"
import { useState, useEffect } from "react"
import type { View } from "~/types/types";


interface prop {
    tableId: string;
    baseId: string;
    tableName: string;
    setViewName: React.Dispatch<React.SetStateAction<string>>
    viewName: string;
}


export default function GridBar(GridBarProp: prop) {
    const utils = api.useUtils();
    const [localViews, setLocalViews] = useState<View[]>([]);
    const {data: views, isLoading: loadingViews} = api.table.getViews.useQuery({tableId: GridBarProp.tableId});
    const { mutateAsync: asynAddView } = api.table.addView.useMutation()
    useEffect(() => {
        if (!views) return;
        setLocalViews(views);
    }, [views]) 
    async function addView() {
        const newView = await asynAddView({tableId: GridBarProp.tableId});
        // update local
        setLocalViews((prev) => {
            return [...prev, newView]
        });

        // and then update trpc for the different views
        utils.table.getViews.setData({tableId: GridBarProp.tableId}, (prev) => {
            if (!prev) return []
            return(
                [...prev, newView]
            )
        })
        // update localCache for showing
        for (const view of localViews) {
            utils.table.getTableAndViewWithRowsAhead.setInfiniteData(
                { baseId: GridBarProp.baseId, tableName: GridBarProp.tableName, viewName: view.name},
                (oldData) => {
                if (!oldData) return
                const newPages = oldData.pages.map((page) => {
                    return {
                        ...page,
                        view: {
                            ...page.view,
                            showing: [...view.showing, false]
                        }
                    }
                });
                return {
                    pages: newPages,
                    pageParams: oldData.pageParams
                }
                }
            )
        }

    }

    if (loadingViews || !views) {
        return (
        <div style={{height: "100%", width: "300px", position: "sticky", top: "0", background: "rgb(207, 207, 207)"}}>
            <span>Loading views</span>
        </div>
        )
    }

    return (
        <div style={{height: "100%", width: "300px", position: "sticky", top: "0", background: "rgb(207, 207, 207)", display: "flex", flexDirection: "column"}}>
            {localViews.map((view) => {
                const isSelected = view.name === GridBarProp.viewName;
                return(
                    <button onClick={() => GridBarProp.setViewName(view.name)} key={view.id} style={{background: isSelected ? "green" : "grey"}}>
                        <span>{view.name}</span>
                    </button>
                )
            })}
            
            <button onClick={addView}>add a view</button>
        </div>
    )
}