"use client"

import { useEffect, useRef, useState } from "react";
import type { View, HeaderType } from "~/types/types";
import { api } from "~/trpc/react";

interface prop {
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    headerCol: number;
    tableId: string;
    view: View;
    views: View[];
}

export default function HeaderModal(HeaderModalProp: prop) {
    const [showEditHeaderModal, setShowEditHeaderModal] = useState<boolean>(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const utils = api.useUtils()
    const [newHeaderName, setNewHeaderName] = useState<string>("");
    const [newHeaderType, setNewHeaderType] = useState<HeaderType>("string");
    const { mutateAsync: editHeaderColAsync } = api.table.editHeaderCol.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: HeaderModalProp.tableId, viewId: HeaderModalProp.view.id})
        }
    })
    const { mutateAsync: deleteColAsync } = api.table.deleteColumn.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: HeaderModalProp.tableId, viewId: HeaderModalProp.view.id})
        }
    })
    const { mutateAsync: duplicateColAsync } = api.table.duplicateCol.useMutation({
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

    async function deleteCol() {
        // update the backend 
        await deleteColAsync({colIndex: HeaderModalProp.headerCol, tableId: HeaderModalProp.tableId})
        // update the views and update the table
        // for all views need to edit showing and filters and sorts
        utils.table.getViews.setData({tableId: HeaderModalProp.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                const newShowing = [...view.showing];
                newShowing.splice(HeaderModalProp.headerCol, 1)
                const newFilters = view.filters.filter((filter) => {
                    return (filter.columnIndex !== HeaderModalProp.headerCol)
                })
                const newSorts = view.sorts.filter((sort) => {
                    return (sort.columnIndex !== HeaderModalProp.headerCol)
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
            newHeaders.splice(HeaderModalProp.headerCol, 1);
            const newHeaderTypes = [...prev.headerTypes];
            newHeaderTypes.splice(HeaderModalProp.headerCol, 1);
            return {
                ...prev,
                headers: newHeaders,
                headerTypes: newHeaderTypes,
            }
        })        
        // set modal false
        HeaderModalProp.setModal(false);
    }
    
    async function duplicateCol() {
        // on backend need to create a newCol but make cellFlat a copy of that one 
        // update backend
        await duplicateColAsync({colIndex: HeaderModalProp.headerCol, tableId: HeaderModalProp.tableId})
        // update view and update table
        utils.table.getViews.setData({tableId: HeaderModalProp.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                const newShowing = [...view.showing];
                newShowing.splice(HeaderModalProp.headerCol, 0, true)
                return {
                    ...view,
                    showing: newShowing,
                }
            })
        })
        // for table need to update headers and headerType
        utils.table.getTable.setData({tableId: HeaderModalProp.tableId}, (prev) => {
            if (!prev) return prev;
            const newHeaders = [...prev.headers];
            newHeaders.splice(HeaderModalProp.headerCol, 0, newHeaders[HeaderModalProp.headerCol] || "");
            const newHeaderTypes = [...prev.headerTypes];
            newHeaderTypes.splice(HeaderModalProp.headerCol, 0, newHeaderTypes[HeaderModalProp.headerCol] || "string");
            return {
                ...prev,
                headers: newHeaders,
                headerTypes: newHeaderTypes,
            }
        })        

        HeaderModalProp.setModal(false);
    }

    async function editCol() {
        await editHeaderColAsync({colIndex: HeaderModalProp.headerCol, tableId: HeaderModalProp.tableId, newHeaderName: newHeaderName, newHeaderType: newHeaderType})
        
        // remove all filters on that column
        utils.table.getViews.setData({tableId: HeaderModalProp.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                const newFilters = view.filters.filter((filter) => {
                    return (filter.columnIndex !== HeaderModalProp.headerCol)
                })
                const newSorts = view.sorts.filter((sort) => {
                    return (sort.columnIndex !== HeaderModalProp.headerCol)
                })
                return {
                    ...view,
                    filters: newFilters,
                    sorts: newSorts
                }
            })
        })        
        
        // update table headers
        utils.table.getTable.setData({tableId: HeaderModalProp.tableId}, (prev) => {
            if (!prev) return prev
            const newHeaders = [...prev.headers];
            newHeaders.splice(HeaderModalProp.headerCol, 1, newHeaderName);
            const newHeadertTypes = [...prev.headerTypes]
            newHeadertTypes.splice(HeaderModalProp.headerCol, 1, newHeaderType)
            return {
                ...prev,
                headers: newHeaders,
                headerTypes: newHeadertTypes
            }
        })    
        HeaderModalProp.setModal(false);
    }

    return(
        <div ref={modalRef} style={{display: "flex", alignItems: "center", flexDirection: "column", zIndex: 1111, top: "170px", position: "fixed", width: "200px", height: "200px", border: "solid rgba(218, 218, 218, 1) 1px", background: "white"}}>
            {HeaderModalProp.headerCol}
            <button style={{border: "solid grey 1px", padding: "5px"}} onClick={deleteCol}>Delete Column</button>
            <button style={{border: "solid grey 1px", padding: "5px"}} onClick={duplicateCol}>Duplicate Column</button>
            <div>
                <button style={{border: "solid grey 1px", padding: "5px"}} onClick={() => setShowEditHeaderModal(true)}>Edit Field</button>
                {showEditHeaderModal && 
                    <div style={{padding: "10px", background: "white", border: "solid black 1px"}}>
                        <input value={newHeaderName} placeholder="enter new header name" onChange={(e) => setNewHeaderName(e.target.value)}></input>
                        <select value={newHeaderType} onChange={(e) => setNewHeaderType(e.target.value as HeaderType)}>
                            <option value="string">string</option>
                            <option value="number">number</option>
                        </select>
                        <button onClick={editCol}>Change</button>
                    </div>
                }
            </div>
        </div>
    )
}