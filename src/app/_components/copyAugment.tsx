"use client"

import type { View, Filter, Sort } from "~/types/types";
import { useState, useRef, useEffect } from "react";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { alpha, styled } from '@mui/material/styles';
import { green } from '@mui/material/colors';
import { api } from "~/trpc/react"

interface prop {
    views: View[];
    view: View;
    tableId: string; 
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    setOpaqueBg: React.Dispatch<React.SetStateAction<boolean>>;
}


export default function CopyAugment(CopyAugmentProp: prop) {
    const utils = api.useUtils()
    const [selectedView, setSelectedView] = useState<View | null>(null);
    selectedView
    const [showSelectedViewModal, setShowSelectedViewModal] = useState<boolean>(false);
    const [filterBool, setFilterBool] = useState<boolean>(true);
    const [sortBool, setSortBool] = useState<boolean>(false);
    const [showHideBool, setShowHideBool] = useState<boolean>(false);
    const { mutateAsync: copyAugments } = api.view.copyViewAugments.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: CopyAugmentProp.tableId, viewId: CopyAugmentProp.view.id})
        }
    });
    const modalRef = useRef<HTMLDivElement>(null);
    const selectModalRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
    function handleClick(event: MouseEvent) {        
        if (selectModalRef.current && !selectModalRef.current.contains(event.target as Node)) {
            setShowSelectedViewModal(false)
            return
        }
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        CopyAugmentProp.setModal(false);
        }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        if (!selectedView) return
        
        setSortBool(false);
        setFilterBool(false);
        setShowHideBool(false);
        if (selectedView.filters.length > 0) {
            setFilterBool(true);
        } 
        if (selectedView.sorts.length > 0) {
            setSortBool(true);
        }
        // check if theres any showings of false first
        setShowHideBool(false)
        selectedView.showing.forEach((show, i) => {
            if (!show) setShowHideBool(true);
        }) 
    }, [selectedView])

    async function addAugments() {
        if (!selectedView) return
        let newFilterIds: string[] = [];
        let newSortIds: string[] = [];
        // create filters first
        if (filterBool) {
            newFilterIds = selectedView.filters.map((filter, i) => {
                return (
                    `${i}_${crypto.randomUUID()}`
                )
            })
        } 
        if (sortBool) {
            newSortIds = selectedView.sorts.map((sort, i) => {
                return (
                    `${i}_${crypto.randomUUID()}`
                )
            })
        }

        if (filterBool && sortBool) {
            await copyAugments({newSortIds: newSortIds, newFilterIds: newFilterIds, currentViewId: CopyAugmentProp.view.id, targetViewId: selectedView.id, filterBool: filterBool, sortBool: sortBool, showHideBool: showHideBool})
        } else if (filterBool) {
            await copyAugments({newFilterIds: newFilterIds, currentViewId: CopyAugmentProp.view.id, targetViewId: selectedView.id, filterBool: filterBool, sortBool: sortBool, showHideBool: showHideBool})
        } else if (sortBool) {
            await copyAugments({newSortIds: newSortIds, currentViewId: CopyAugmentProp.view.id, targetViewId: selectedView.id, filterBool: filterBool, sortBool: sortBool, showHideBool: showHideBool})
        } else {
            await copyAugments({currentViewId: CopyAugmentProp.view.id, targetViewId: selectedView.id, filterBool: filterBool, sortBool: sortBool, showHideBool: showHideBool})
        }
        // update cache for views

        utils.table.getViews.setData({tableId: CopyAugmentProp.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === CopyAugmentProp.view.id) {
                    // create filters
                    const newFilters: Filter[] = selectedView.filters.map((filter, i) => {
                        if (!newFilterIds[i]) throw new Error("new filter id at index was not found")
                        return {
                            ...filter,
                            id: newFilterIds[i]
                        }
                    })
                    const newSorts: Sort[] = selectedView.sorts.map((sort, i) => {
                        if (!newSortIds[i]) throw new Error("new sort id at index was not found")
                        return {
                            ...sort,
                            id: newSortIds[i]
                        }
                    })
                    return {
                        ...view,
                        filters: filterBool ? newFilters : view.filters,
                        sorts: sortBool ? newSorts : view.sorts,
                        showing: showHideBool ? selectedView.showing : view.showing
                    }
                } else {
                    return view
                }
            })
        })
        CopyAugmentProp.setModal(false);
        CopyAugmentProp.setOpaqueBg(false);
    }
    function chooseView(view: View) {
        setSelectedView(view);
        setShowSelectedViewModal(false);
    }
    return (
    <div ref={modalRef} style={{gap: "10px", height: "300px", border: "solid rgba(239, 239, 239, 1) 1px", position: "absolute", top: "25%", left: "32%", padding: "40px", display: "flex", flexDirection: "column", width: "800xp", background: "white", zIndex: 1000}}>
        <span style={{display: "flex", gap: "5px", alignItems: "center"}}><span style={{fontSize: "18px", fontWeight: "600"}}>Copy configuration from </span>
            <div style={{position: "relative"}}>
                <button onClick={() => setShowSelectedViewModal(true)} style={{fontSize: "18px", fontWeight: "600", width: "170px", height: "30px", border: "solid grey 1px", padding: "5px", display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between"}}>{selectedView ? <img style={{width: "20px", height: "20px", display: "flex", justifyContent: "center", alignItems: "center"}} src="/table.svg"></img>: null}{selectedView ? selectedView.name : "Choose a view"}<img style={{width: "10px", height: "10px"}} src="/arrowD.svg"></img></button>
                {showSelectedViewModal && <div ref={selectModalRef} style={{display: "flex", flexDirection: "column", background: "white", position: "absolute", width: "170px", height: "100px", border: "solid grey 0.5px"}}>
                    <span style={{padding: "5px", fontSize: "14px", color: "grey"}}>Find a view</span>
                    {CopyAugmentProp.views.map((view) => {
                        if (view.id !== CopyAugmentProp.view.id) {
                            return <button key={view.id} onClick={() => chooseView(view)}style={{display: "flex", padding: "5px", alignItems: "center", gap: "5px"}}><img src="/bTable.png" style={{width:"15px", height: "15px"}}></img>{view.name}</button>
                        } else {
                            return null
                        }
                    })}
                </div>}
            </div>
            <span style={{fontSize: "18px", fontWeight: "600"}}>to this view</span>
        </span>
        <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
            <span style={{fontSize: "14px", color: "grey"}}>Select one or more configuration options to copy:</span>
            <FormGroup>
                <FormControlLabel checked={showHideBool} onChange={() => setShowHideBool(!showHideBool)} sx={{'& .MuiFormControlLabel-label': { fontSize: '13px'}}} control={<GreenSwitch size="small" sx={{ transform: "scale(0.75)" }} />} label={<div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/hashtag.svg" style={{width: "10px", height: "10px"}}></img>Field Visibility</div>} />
            </FormGroup>
            <FormGroup>
                <FormControlLabel checked={filterBool} onChange={() => setFilterBool(!filterBool)} sx={{'& .MuiFormControlLabel-label': { fontSize: '13px'}}} control={<GreenSwitch size="small" sx={{ transform: "scale(0.75)" }} />} label={<div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/hashtag.svg" style={{width: "10px", height: "10px"}}></img>Filter conditions</div>} />
            </FormGroup>
            <FormGroup>
                <FormControlLabel checked={sortBool} onChange={() => setSortBool(!sortBool)} sx={{'& .MuiFormControlLabel-label': { fontSize: '13px'}}} control={<GreenSwitch size="small" sx={{ transform: "scale(0.75)" }} />} label={<div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/hashtag.svg" style={{width: "10px", height: "10px"}}></img>Sorts</div>} />
            </FormGroup>
            <div style={{display: "flex", gap: "10px"}}>
                <button style={{color: "grey", fontSize: "12px"}}>Select all</button>
                <button style={{color: "grey", fontSize: "12px"}}>Clear all</button>
            </div>
        </div>
        <div style={{display: "flex", justifyContent: "flex-end"}}>
            <button onClick={addAugments} style={{fontSize: "14px", width: "100px", padding: "5px", borderRadius: "5px"}}>Cancel</button>
            <button onClick={addAugments} style={{background: "rgba(109, 171, 251, 1)", fontSize: "14px", width: "150px", color: "white", padding: "5px", borderRadius: "5px"}}>Copy configuration</button>
        </div>
    </div>
    )
}