"use client"

import { useEffect, useRef } from "react";
import type { View } from "~/types/types";
import { api } from "~/trpc/react";

interface prop {
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    headerCol: number;
    tableId: string;
    view: View;
    views: View[];
}

export default function HeaderModal(HeaderModalProp: prop) {
    const modalRef = useRef<HTMLDivElement>(null);
    const utils = api.useUtils()
    const { mutateAsync: deleteColAsync } = api.table.deleteColumn.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: HeaderModalProp.tableId, viewId: HeaderModalProp.view.id})
        }
    })
    useEffect(() => {
    function handleClick(event: MouseEvent) {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            HeaderModalProp.setModal(false);
        }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function deleteCol(colIndex: number) {
        // update the backend 
        await deleteColAsync({colIndex: colIndex, tableId: HeaderModalProp.tableId})
        // update the views and update the table
        // for all views need to edit showing and filters and sorts
        utils.table.getViews.setData({tableId: HeaderModalProp.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                const newShowing = [...view.showing];
                newShowing.splice(colIndex, 1)
                const newFilters = view.filters.filter((filter) => {
                    return (filter.columnIndex !== colIndex)
                })
                const newSorts = view.sorts.filter((sort) => {
                    return (sort.columnIndex !== colIndex)
                })
                return {
                    ...view,
                    showing: newShowing,
                    filters: newFilters,
                    sorts: newSorts
                }
            })
        })
        // for table need to update headers and headerType
        utils.table.getTable.setData({tableId: HeaderModalProp.tableId}, (prev) => {
            if (!prev) return prev;
            const newHeaders = [...prev.headers];
            newHeaders.splice(colIndex, 1);
            const newHeaderTypes = [...prev.headerTypes];
            newHeaderTypes.splice(colIndex, 1);
            return {
                ...prev,
                headers: newHeaders,
                headerTypes: newHeaderTypes,
            }
        })        
        // set modal false
        HeaderModalProp.setModal(false);
    }
    
    return(
        <div ref={modalRef} style={{zIndex: 1111, top: "170px", position: "fixed", display: "flex", width: "200px", height: "200px", border: "solid rgba(218, 218, 218, 1) 1px", background: "white"}}>
            {HeaderModalProp.headerCol}
            <button onClick={() => deleteCol(Number(HeaderModalProp.headerCol))}>Delete Column</button>
        </div>
    )
}