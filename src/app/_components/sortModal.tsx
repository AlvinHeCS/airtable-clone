"use client"

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react"
import type { View, SortType, Row, Sort, HeaderType } from "~/types/types";
import "./sortModal.css";
import Switch from '@mui/material/Switch'; 
import FormControlLabel from '@mui/material/FormControlLabel';
import { alpha, styled } from '@mui/material/styles';
import { green } from '@mui/material/colors';

interface prop {
    tableHeaders: string[];
    tableHeaderTypes: HeaderType[];
    tableId: string;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View;
    position: {top: number, left: number}
}

export default function SortModal(SortModalProps: prop) {
    const modalRef = useRef<HTMLDivElement>(null);
    const selectNewSortRef = useRef<HTMLDivElement>(null);
    const utils = api.useUtils();    
    const [newSortModal, setNewSortModal] = useState<boolean>(false);

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
        if (selectNewSortRef.current && !selectNewSortRef.current.contains(event.target as Node)) {
            setNewSortModal(false)
            return
        }
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        SortModalProps.setModal(false);
        }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const { mutateAsync: addSortAsync } = api.view.addSort.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: SortModalProps.tableId, viewId: SortModalProps.view.id})
        }
    });
    const { mutateAsync: deleteSortAsync } = api.view.removeSort.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: SortModalProps.tableId, viewId: SortModalProps.view.id})
        }
    });
    const { mutateAsync: editSortTypeAsync } = api.view.editSortType.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: SortModalProps.tableId, viewId: SortModalProps.view.id})
        }
    });
    const { mutateAsync: editSortHeaderAsync } = api.view.editSortHeader.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: SortModalProps.tableId, viewId: SortModalProps.view.id})
        }
    });
    
    function sortRows(newRows: Row[], sorts: Sort[]) {
        for (const s of sorts) {
            switch(s.type) {
                case "sort1_9": 
                newRows.sort((a, b) => {
                    const aComparison = (a.cellsFlat as (string | number | null)[])[s.columnIndex]
                    const bComparison = (b.cellsFlat as (string | number | null)[])[s.columnIndex]
                    return (Number(aComparison) - Number(bComparison))
                })
                break;
                case "sort9_1":
                newRows.sort((a, b) => {
                    const aComparison = (a.cellsFlat as (string | number | null)[])[s.columnIndex]
                    const bComparison = (b.cellsFlat as (string | number | null)[])[s.columnIndex]
                    return (Number(bComparison) - Number(aComparison))
                })
                break;
                case "sortA_Z":
                newRows.sort((a, b) => {
                    const aComparison = (a.cellsFlat as (string | number | null)[])[s.columnIndex]
                    const bComparison = (b.cellsFlat as (string | number | null)[])[s.columnIndex]
                    return (String(aComparison).localeCompare(String(bComparison)))
                })
                break;
                case "sortZ_A":
                newRows.sort((a, b) => {
                    const aComparison = (a.cellsFlat as (string | number | null)[])[s.columnIndex]
                    const bComparison = (b.cellsFlat as (string | number | null)[])[s.columnIndex]
                    return (String(bComparison).localeCompare(String(aComparison)))
                })
                break;
            }
        }
        return newRows
    }

    async function addSort(col: number) {
        const newSortType: SortType = (SortModalProps.tableHeaderTypes[col] === "string") ? "sortA_Z" : "sort1_9"
        // backend 
        const newSort = await addSortAsync({viewId: SortModalProps.view.id, colNum: col, sortType: newSortType});
        // update trpc cache for views
        utils.table.getViews.setData({tableId: SortModalProps.tableId}, (prev) => {
            if (!prev) return []
            return prev.map((view) => {
                if (view.id === SortModalProps.view.id) {
                    return {
                        ...view,
                        sorts: [...view.sorts, newSort]
                    }
                } else {
                    return view
                }
            })
        })
        setNewSortModal(false)        
    }

    async function deleteSort(sortId: string) {
        const deletedSort = await deleteSortAsync({sortId});
        utils.table.getViews.setData({tableId: SortModalProps.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === SortModalProps.view.id) {
                    const newSorts = view.sorts.filter((sort) => {
                        if (sort.id !== deletedSort.id) {
                            return sort
                        } 
                    })
                    return {
                        ...view,
                        sorts: newSorts
                    }
                } else {
                    return view
                }
            })
        })

    }   

    async function changeSortHeader(sortId: string, newSortColIndex: number, oldCol: number, sortType: SortType) {
        // edit sort backend
        let newSortType = sortType;
        if (SortModalProps.tableHeaderTypes[newSortColIndex] !== SortModalProps.tableHeaderTypes[oldCol]) {
            newSortType = SortModalProps.tableHeaderTypes[newSortColIndex] === "string" ? "sortA_Z" : "sort1_9";
        }
        const newSort = await editSortHeaderAsync({sortId: sortId, sortColIndex: newSortColIndex, sortType: newSortType});
        utils.table.getViews.setData({tableId: SortModalProps.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === SortModalProps.view.id) {
                    const newSorts = view.sorts.map((sort) => {
                        if (sort.id === sortId) {
                            return newSort
                        } else {
                            return sort
                        }
                    })
                    return {
                        ...view,
                        sorts: newSorts
                    }
                } else {
                    return view
                }
            })
        })
    }
    async function changeSortType(sortId: string, newSortType: SortType) {
        // edit sort backend
        const newSort = await editSortTypeAsync({sortId: sortId, sortType: newSortType});
        utils.table.getViews.setData({tableId: SortModalProps.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === SortModalProps.view.id) {
                    const newSorts = view.sorts.map((sort) => {
                        if (sort.id === sortId) {
                            return newSort
                        } else {
                            return sort
                        }
                    })
                    return {
                        ...view,
                        sorts: newSorts
                    }
                } else {
                    return view
                }
            })
        })       
    }

    return(
        <div ref={modalRef} style={{boxShadow: "0 8px 12px rgba(0, 0, 0, 0.1)", zIndex: "1000", left: `${SortModalProps.position.left - 300}px`, top: `${SortModalProps.position.top + 45}px`, minHeight: "140px", width: "500px", background: "white", position: "fixed"}}>
            <div style={{paddingRight: "20px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "20px", gap: "10px", display: "flex", flexDirection: "column"}}>
                <div style={{paddingBottom: "5px", borderBottom: "solid rgba(216, 216, 216, 1) 1px", fontSize: "14px", color: "grey", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px"}}>
                    Sort by 
                    <img src="/questionMark.svg" style={{width: "13px", height: "13px" }}></img>
                </div>
                    {SortModalProps.view.sorts.map((sort) => {
                        return(<div style={{display: "flex", justifyContent: "center", gap: "10px", alignItems: "center"}} key={sort.id}>
                            <select style={{borderRadius: "5px", border: "solid grey 1px", width: "250px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}} onChange={(e) => changeSortHeader(sort.id, Number(e.target.value), sort.columnIndex, sort.type)} value={sort.columnIndex} >
                                {SortModalProps.tableHeaders.map((header, i) => {
                                    return(<option key={i} value={i}>{header}</option>)
                                })}
                            </select>
                            {SortModalProps.tableHeaderTypes[sort.columnIndex] === "number"?
                                <select style={{borderRadius: "5px", border: "solid grey 1px", width: "150px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px" }} onChange={(e) => (changeSortType(sort.id, e.target.value as SortType))} value={sort.type}>                             
                                    <option key={0} value="sort1_9">1-9</option>
                                    <option key={1} value="sort9_1">9-1</option>
                                </select> : 
                                <select style={{borderRadius: "5px", border: "solid grey 1px", width: "150px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px" }} onChange={(e) => (changeSortType(sort.id, e.target.value as SortType))} value={sort.type}>                             
                                    <option key={0} value="sortA_Z">A-Z</option>
                                    <option key={1} value="sortZ_A">Z-A</option>
                                </select>
                            }
                            <button className="deleteButton" onClick={() => (deleteSort(sort.id))}><img src="/cross.svg" style={{width: "15px", height: "15px"}}></img></button>
                        </div>)
                    })}

            <div style={{position: "relative"}}>
                <button className="addSort">
                    <img src="/plus2.svg" style={{width: "15px", height: "15px"}}></img>
                    <div onClick={() => {setNewSortModal(true)}}>Add another sort</div>
                </button>
                {newSortModal && 
                    <div ref={selectNewSortRef} style={{overflow: "scroll", position: "absolute", width: "450px", height: "200px", background: "white", zIndex: "999", display: "flex", flexDirection: "column", alignItems: "flex-start", border: "solid black 1px"}}>
                        <span style={{width: "100%", padding: "5px", color: "grey", fontSize: "14px", position: "sticky", top: 0, background: "white"}}>Find a field</span>
                        {SortModalProps.tableHeaders.map((header, i) => {
                            return (SortModalProps.tableHeaderTypes[i] === "number" ? 
                            <button className="selectNewHeader" onClick={() => (addSort(i))} style={{padding: "5px", display: "flex", width: "100%", alignItems: "center", gap: "5px", fontSize: "14px"}}key={i} value={i}><img src="/hashtag.svg" style={{width: "15px", height: "15px"}}></img>{header}</button> :
                            <button className="selectNewHeader" onClick={() => (addSort(i))} style={{padding: "5px", display: "flex", width: "100%", alignItems: "center", gap: "5px", fontSize: "14px"}}key={i} value={i}><img src="/letter.svg" style={{width: "15px", height: "15px"}}></img>{header}</button>
                        )
                        })}           
                    </div>
                }
            </div>
            </div>
            <div style={{background: "rgba(244, 244, 244, 1)", height: "40px", padding: "20px", display: "flex", alignItems: "center"}}>
                <FormControlLabel sx={{'& .MuiFormControlLabel-label': { fontSize: '13px'}}} control={<GreenSwitch size="small" sx={{ transform: "scale(0.75)" }} defaultChecked/>} label="Automatically sort records" />
            </div>
        </div>
    );
}
