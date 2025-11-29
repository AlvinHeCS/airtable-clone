import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react"
import type { View, Sort, SortType } from "~/types/types";
import "./sortModal.css";
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { alpha, styled } from '@mui/material/styles';
import { green } from '@mui/material/colors';

interface prop {
    tableHeaders: string[];
    tableHeaderTypes: number[];
    tableId: string;
    tableName: string;
    baseId: string;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View;
}

export default function SortModal(SortModalProps: prop) {
    const modalRef = useRef<HTMLDivElement>(null);
    const selectNewSortRef = useRef<HTMLDivElement>(null);
    const utils = api.useUtils();    
    // const [sorts, setSorts] = useState<Sort[]>([]);
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
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: SortModalProps.baseId,
                tableName: SortModalProps.tableName,
                viewName: SortModalProps.view.name
            });
          }
    });
    const { mutateAsync: deleteSortAsync } = api.view.removeSort.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: SortModalProps.baseId,
                tableName: SortModalProps.tableName,
                viewName: SortModalProps.view.name
            });
        }
    });
    const { mutateAsync: editSortTypeAsync } = api.view.editSortType.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: SortModalProps.baseId,
                tableName: SortModalProps.tableName,
                viewName: SortModalProps.view.name
            });
        }
    });
    const { mutateAsync: editSortHeaderAsync } = api.view.editSortHeader.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: SortModalProps.baseId,
                tableName: SortModalProps.tableName,
                viewName: SortModalProps.view.name
            });
        }
    })
    
    // useEffect(() => {
    //     setSorts(SortModalProps.view.sorts);
    // }, [])    

    async function addSort(col: number) {
        if (SortModalProps.tableHeaderTypes[col]) {
            const newSort = await addSortAsync({viewId: SortModalProps.view.id || "", colNum: col, sortType: "sort1_9"});
            // setSorts([...sorts, newSort]);
        } else {
            const newSort = await addSortAsync({viewId: SortModalProps.view.id || "", colNum: col, sortType: "sortA_Z"});
            // setSorts([...sorts, newSort]);
        }        
    }

    async function deleteSort(sortId: string) {
        await deleteSortAsync({sortId});
        // setSorts(sorts.filter((sort) => {
        //     return sort.id !== sortId;
        // }))
    }   
    async function changeSortHeader(sortId: string, newSortColIndex: number) {
        // edit sort backend
        const newSort = await editSortHeaderAsync({sortId: sortId, sortColIndex: newSortColIndex});
        if (!newSort) return 
        // // edit local frontend
        // setSorts((prev) => {
        //     if (!prev) return []
        //     return prev.map((sort) => {
        //         if (sort.id === sortId) {
        //             return {
        //                 ...sort,
        //                 columnIndex: newSortColIndex
        //             }
        //         } else {
        //             return sort
        //         }
        //     })
        // })
    }
    async function changeSortType(sortId: string, newSortType: SortType) {
        // edit sort backend
        const newReturnedSort = await editSortTypeAsync({sortId: sortId, sortType: newSortType});
        if (!newReturnedSort) return
        // edit local value for sort
        // setSorts((prev) => {
        //     if (!prev) return []
        //     return (prev.map((sort) => {
        //         if (sort.id === sortId) {
        //             return { ...sort, type: newSortType }
        //         } else {
        //             return sort
        //         }
        //     }))
        // });  
    }

    return(
        <div ref={modalRef} style={{boxShadow: "0 8px 12px rgba(0, 0, 0, 0.1)", zIndex: "1000", marginLeft: "40vw", minHeight: "140px", top: "139px", width: "500px", background: "white", position: "fixed"}}>
            <div style={{paddingRight: "20px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "20px", gap: "10px", display: "flex", flexDirection: "column"}}>
                <div style={{paddingBottom: "5px", borderBottom: "solid rgba(216, 216, 216, 1) 1px", fontSize: "14px", color: "grey", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px"}}>
                    Sort by 
                    <img src="/questionMark.svg" style={{width: "13px", height: "13px" }}></img>
                </div>
                    {SortModalProps.view.sorts.map((sort) => {
                        return(<div style={{display: "flex", justifyContent: "center", gap: "10px", alignItems: "center"}} key={sort.id}>
                            <select style={{borderRadius: "5px", border: "solid grey 1px", width: "250px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}} onChange={(e) => changeSortHeader(sort.id, Number(e.target.value))} value={sort.columnIndex} >
                                {SortModalProps.tableHeaders.map((header, i) => {
                                    return(<option key={i} value={i}>{header}</option>)
                                })}
                            </select>
                            {SortModalProps.tableHeaderTypes[sort.columnIndex] ?
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
                            return (SortModalProps.tableHeaderTypes[i] ? 
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
