"use client"

import { useState, useRef, useEffect } from "react"
import type { View } from "~/types/types";
import { api } from "~/trpc/react";


interface prop {
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    position: {top: number, left: number};
    view: View;
    tableId: string;
}

export default function SearchModal(SearchModalProp: prop) {
    const [searchVal, setSearchVal] = useState<string>(SearchModalProp.view.search)
    const utils = api.useUtils();
    const { mutate: mutateSearch, mutateAsync: mutateAsyncSearch } = api.view.editSearch.useMutation()
    const modalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
    function handleClick(event: MouseEvent) {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            SearchModalProp.setModal(false);
        }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    }, []);
    
    function handleSearch(val: string) {
        
        setSearchVal(val);
        // call the api
        mutateSearch({viewId: SearchModalProp.view.id, search: val})
        // update trpc cache for views ahead
        utils.table.getViews.setData({tableId: SearchModalProp.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === SearchModalProp.view.id) {
                    return {
                        ...view,
                        search: val
                    }
                } else {
                    return view
                }
            })
        })
    }

    return (
        <div ref={modalRef} style={{border: "solid rgba(222, 222, 222, 1) 0.5px", padding: "5px", borderRadius: "5px", left: `${SearchModalProp.position.left - 280}px`, top: `${SearchModalProp.position.top + 40}px`, zIndex: 900, width: "300px", height: "40px", background: "white", position: "fixed"}}>
            <input placeholder="Find in view" style={{ color: "grey", fontSize: "13px", height: "30px", width: "200px"}} type="text" value={searchVal} onChange={(e) => handleSearch(e.target.value)}></input>
        </div>
    )
}