"use client"

import { useState, useRef, useEffect } from "react"
import type { View } from "~/types/types";
import { api } from "~/trpc/react";
import "./searchModal.css";

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

    function exit() {
        setSearchVal("");
        mutateSearch({viewId: SearchModalProp.view.id, search: ""})
        utils.table.getViews.setData({tableId: SearchModalProp.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === SearchModalProp.view.id) {
                    return {
                        ...view,
                        search: ""
                    }
                } else {
                    return view
                }
            })
        })
        SearchModalProp.setModal(false);
    }

    return (
        <div style={{gap: "3px", alignItems: "center", display: "flex", border: "solid rgba(222, 222, 222, 1) 0.5px", padding: "5px", borderRadius: "5px", left: `${SearchModalProp.position.left - 280}px`, top: `${SearchModalProp.position.top + 40}px`, zIndex: 900, width: "300px", height: "40px", background: "white", position: "fixed"}}>
            <input placeholder="Find in view" style={{ color: "grey", fontSize: "13px", height: "30px", width: "200px"}} type="text" value={searchVal} onChange={(e) => handleSearch(e.target.value)}></input>
            <button className="arrowButton"><img src="/arrowD.svg" style={{width: "6px", height: "6px"}}></img></button>
            <button className="arrowButton"><img src="/arrowU.svg" style={{width: "10px", height: "10px"}}></img></button>
            <button className="blackButton">Ask Omni</button>
            <button onClick={exit} className="crossButton"><img src="/cross.svg" style={{width: "10px", height: "10px"}}></img></button>
        </div>
    )
}