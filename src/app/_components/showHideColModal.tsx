"use client"

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { alpha, styled } from '@mui/material/styles';
import { green } from '@mui/material/colors';
import { api } from "~/trpc/react";
import type { View, HeaderType } from "~/types/types";
import { useRef, useEffect } from "react"

interface prop {
    tableHeaders: string[];
    tableHeaderTypes: HeaderType[];
    tableId: string;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View;
    position: {top: number, left: number}
}

export default function ShowHideColModal(showHideColModalProp: prop) {

    const GreenSwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: '#ffffff',
        '&:hover': {
        backgroundColor: alpha(green[600], theme.palette.action.hoverOpacity),
        },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: green[600],
    },
    }));

    const utils = api.useUtils();
    const modalRef = useRef<HTMLDivElement>(null);
    const {mutateAsync} = api.view.showHideCol.useMutation();
    
    useEffect(() => {
    function handleClick(event: MouseEvent) {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            showHideColModalProp.setModal(false);
        }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function handleChange(colIndex: number, check: boolean) {
        //update backend first
        await mutateAsync({viewId: showHideColModalProp.view.id, check: check, colIndex: colIndex})
        // this should cause columns to regenerate
        utils.table.getViews.setData({tableId: showHideColModalProp.tableId}, 
        (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === showHideColModalProp.view.id) {
                    const newShowing = [...view.showing];
                    newShowing[colIndex] = check;
                    return {
                        ...view,
                        showing: newShowing
                    } 
                } else {
                    return view
                }
            })
        })
    }
    
    return(
        <div ref={modalRef} style={{boxShadow: "0 8px 12px rgba(0, 0, 0, 0.1)", zIndex: "1000", left: `${showHideColModalProp.position.left - 400}px`, top: `${showHideColModalProp.position.top + 40}px`, width: "300px", background: "white", padding: "10px", position: "fixed", gap: "10px", display: "flex", flexDirection: "column"}}>
            <span style={{color: "grey", fontSize: "12px", height: "35px", borderBottom: "solid rgba(210, 210, 210, 1) 1px", display: "flex", alignItems: "center", justifyContent: "space-between"}}>Find a field<img src="/questionMark.svg" style={{width: "15px", height: "15px"}}></img></span>
            <FormGroup>
                {showHideColModalProp.tableHeaders.map((header, i) => {
                    return (showHideColModalProp.tableHeaderTypes[i] === "number" ? <FormControlLabel sx={{'& .MuiFormControlLabel-label': { fontSize: '13px'}}} key={i} control={<GreenSwitch size="small" sx={{ transform: "scale(0.75)" }} onChange={(e) => handleChange(i, e.target.checked)} checked={showHideColModalProp.view.showing[i]} />} label={<div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/hashtag.svg" style={{width: "10px", height: "10px"}}></img>{header}</div>} /> :
                            <FormControlLabel sx={{'& .MuiFormControlLabel-label': { fontSize: '13px'}}} key={i} control={<GreenSwitch size="small" sx={{ transform: "scale(0.75)" }} onChange={(e) => handleChange(i, e.target.checked)} checked={showHideColModalProp.view.showing[i]} />} label={<div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/letter.svg" style={{width: "10px", height: "10px"}}></img>{header}</div>} />
                            )
                })}
            </FormGroup>
            <div style={{display: "flex", justifyContent: "center", gap: "20px"}}>
                <button style={{fontSize: "12px", fontWeight: "500", color: "grey", width: "130px", height: "27px", background: "rgba(235, 235, 235, 1)"}}>Hide all</button>
                <button style={{fontSize: "12px", fontWeight: "500", color: "grey", width: "130px", height: "27px", background: "rgba(235, 235, 235, 1)"}}>Show all</button>
            </div>
        </div>
    )
}