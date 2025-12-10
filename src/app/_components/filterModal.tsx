"use client"

import { useEffect, useRef} from "react";
import { api } from "~/trpc/react"
import type { View, OperatorType, Row, Filter, Sort, HeaderType} from "~/types/types";

interface prop {
    tableHeaders: string[];
    tableHeaderTypes: HeaderType[];
    tableId: string;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View;
    position: {top: number, left: number};
    setCopyModal: React.Dispatch<React.SetStateAction<boolean>>;
    copyModal: boolean;
    setBgOpaque: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FilterModal(FilterModalProps: prop) {

    const textInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const utils = api.useUtils();    
    useEffect(() => {
    function handleClick(event: MouseEvent) {
        if (modalRef.current && !(document.activeElement === textInputRef.current) && !modalRef.current.contains(event.target as Node) && !FilterModalProps.copyModal) {
        FilterModalProps.setModal(false);
        }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    }, [FilterModalProps.copyModal]);

    const { mutateAsync: addFilterAsync } = api.view.addFilter.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: FilterModalProps.tableId, viewId: FilterModalProps.view.id})
        }
    });
    const { mutateAsync: deleteFilterAsync } = api.view.removeFilter.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: FilterModalProps.tableId, viewId: FilterModalProps.view.id})
        }
    });
    const { mutateAsync: editFilterHeaderAsync } = api.view.editFilterHeader.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: FilterModalProps.tableId, viewId: FilterModalProps.view.id})
        }
    });
    const { mutateAsync: editFilterTypeAsync } = api.view.editFilterType.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: FilterModalProps.tableId, viewId: FilterModalProps.view.id})
        }
    });
    const { mutateAsync: editFilterValAsync } = api.view.editFilterVal.useMutation({
        onSuccess: () => {
            utils.table.rowsAhead.reset({tableId: FilterModalProps.tableId, viewId: FilterModalProps.view.id})
        }
    });

    async function addFilter() {
        const newFilter = await addFilterAsync({viewId: FilterModalProps.view.id, colNum: 0, filterType: "contains"});
        // update views trpc cache with new filter
        utils.table.getViews.setData({tableId: FilterModalProps.tableId}, (prev) => {
            if (!prev) return []
            return prev.map((view) => {
                if (view.id === FilterModalProps.view.id) {
                    return {
                        ...view,
                        filters: [...view.filters, newFilter]
                    }
                } else {
                    return view
                }
            })
        })

        // since making a filter does nothing to the rows no need to update
    }

    async function deleteFilter(filterId: string) {
        const deletedFilter = await deleteFilterAsync({filterId});
        utils.table.getViews.setData({tableId: FilterModalProps.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === FilterModalProps.view.id) {
                    return {
                        ...view,
                        filters: view.filters.filter((filter) => {
                            return (filter.id !== deletedFilter.id) 
                        })
                    }
                } else {
                    return view
                }
            })
        })
    }

    async function editFilterHeader(filterId: string, newHeaderCol: number, oldCol: number, filterVal: string, filterType: OperatorType) {
        // update backend
        let newVal = filterVal;
        let newType = filterType;
        if (FilterModalProps.tableHeaderTypes[newHeaderCol] !== FilterModalProps.tableHeaderTypes[oldCol]) {
            newVal = "";
            if (FilterModalProps.tableHeaderTypes[newHeaderCol] === "string") {
                newType = "contains";
            } else if (FilterModalProps.tableHeaderTypes[newHeaderCol] === "number") {
                newType = "eq";
            } else {
                newType = "is";
            }
        }
        if (FilterModalProps.tableHeaderTypes[newHeaderCol] === "checkBox") {
            newVal = "true"
        }

        const newFilter = await editFilterHeaderAsync({filterId: filterId, newHeaderColIndex: newHeaderCol, newType: newType, newValue: newVal});
            utils.table.getViews.setData({tableId: FilterModalProps.tableId}, (prev) => {
                if (!prev) return prev
                return prev.map((view) => {
                    if (view.id === FilterModalProps.view.id) {
                        return {
                            ...view,
                            filters: view.filters.map((filter) => {
                                if (filter.id  === newFilter.id) {
                                    return newFilter
                                } else {
                                    return filter
                                }
                            })
                        }
                    } else {
                        return view
                    }
                })
            })
    }

    async function editFilterType(filterId: string, newType: OperatorType) {
        // update backend
        const newFilter = await editFilterTypeAsync({filterId: filterId, newType: newType})
        utils.table.getViews.setData({tableId: FilterModalProps.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === FilterModalProps.view.id) {
                    return {
                        ...view,
                        filters: view.filters.map((filter) => {
                            if (filter.id === newFilter.id) {
                                return newFilter
                            } else {
                                return filter
                            }
                        })
                    }
                } else {
                    return view
                }
            })
        })
    }

    async function editFilterVal(filterId: string, val: string) {
        const newFilter = await editFilterValAsync({filterId: filterId, newFilterVal: val});

        utils.table.getViews.setData({tableId: FilterModalProps.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === FilterModalProps.view.id) {
                    return {
                        ...view,
                        filters: view.filters.map((filter) => {
                            if (filter.id === newFilter.id) {
                                return newFilter
                            } else {
                                return filter
                            }
                        })
                    }
                } else {
                    return view
                }
            })
        })
    }

    function copyFromAnotherViewClick() {
        FilterModalProps.setCopyModal(true);
        FilterModalProps.setBgOpaque(true);
    }

    return(
        <div ref={modalRef} style={{boxShadow: "0 8px 12px rgba(0, 0, 0, 0.1)", zIndex: 899, left: `${FilterModalProps.position.left - 380}px`, top: `${FilterModalProps.position.top + 40}px`, width: "570px", background: "white", padding: "10px", position: "fixed", gap: "10px", display: "flex", flexDirection: "column"}}>
            <span style={{fontSize: "14px", color: "grey"}}>In this view, show records</span>
            <div style={{padding: "10px", display: "flex", flexDirection: "column", gap: "10px"}}>
            {FilterModalProps.view.filters.map((filter, i) => {
                return(<div style={{display: "flex"}} key={filter.id}>
                    {i === 0 ? <div style={{width: "50px", marginRight: "5px" , height: "30px", display: "flex", alignItems: "center", fontSize: "14px"}}>Where</div> : <div style={{fontSize: "14px", display: "flex", alignItems: "center", height: "30px", width: "50px", marginRight: "5px"}}>and</div>}
                    <select style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "130px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}} onChange={(e) => editFilterHeader(filter.id, Number(e.target.value), filter.columnIndex, filter.value, filter.type)} value={filter.columnIndex}>
                        {FilterModalProps.tableHeaders.map((header, i) => {
                            return(<option key={i} value={i}>{header}</option>)
                        })}
                    </select>
                    {FilterModalProps.tableHeaderTypes[filter.columnIndex] === "number" 
                        ? <select style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "130px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}} onChange={(e) => (editFilterType(filter.id, e.target.value as OperatorType))} value={filter.type}>                             
                            <option key={0} value="eq">=</option>
                            <option key={1} value="gt">&gt;</option>
                            <option key={2} value="lt">&lt;</option>
                        </select> 
                        : FilterModalProps.tableHeaderTypes[filter.columnIndex] === "string" 
                        ? <select style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "130px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}} onChange={(e) => (editFilterType(filter.id, e.target.value as OperatorType))} value={filter.type}>                             
                            <option key={0} value="eq">is</option>
                            <option key={1} value="contains">contains...</option>
                            <option key={2} value="not_contains">does not contain...</option>
                            <option key={3} value="empty">is empty</option>
                            <option key={4} value="not_empty">is not empty</option>
                        </select>
                        : <div style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "130px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}}>
                            is
                        </div>
                    }
                    {FilterModalProps.tableHeaderTypes[filter.columnIndex] === "number"
                    ? <input ref={textInputRef} type="number" style={{ border: "solid rgba(222, 222, 222, 1) 1px", width: "140px", height: "30px", padding: "10px", display: "flex", alignItems: "center", fontSize: "14px"}} defaultValue={filter.value} placeholder={filter.value === "" ? "Enter a value": undefined} onBlur={(e) => editFilterVal(filter.id, e.target.value)}></input>
                    : FilterModalProps.tableHeaderTypes[filter.columnIndex] === "string" 
                    ? <input ref={textInputRef} style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "140px", height: "30px", padding: "10px", display: "flex", alignItems: "center", fontSize: "14px"}} defaultValue={filter.value} placeholder={filter.value === "" ? "Enter a value": undefined} onBlur={(e) => editFilterVal(filter.id, e.target.value)}></input>
                    : <div style={{ border: "solid rgba(222, 222, 222, 1) 1px", width: "140px", height: "30px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px"}} >
                        <input ref={textInputRef} type="checkbox" style={{width: "15px", height: "15px"}} checked={filter.value === "true"} onChange={(e) => editFilterVal(filter.id, String(e.target.checked))}></input>
                    </div>
                    }
                    <button style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "30px", height: "30px", display: "flex", justifyContent: "center", alignItems: "center"}}onClick={() => (deleteFilter(filter.id))}><img src="/trash.svg" style={{width: "15px", height: "15px"}}></img></button>
                    <button style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "30px", height: "30px", display: "flex", justifyContent: "center", alignItems: "center"}}><img src="/dots.svg" style={{width: "15px", height: "15px"}}></img></button>
                </div>)
            })}
            </div>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <div style={{display: "flex", gap: "15px", alignItems: "center"}}>
                    <button style={{fontSize: "14px", display: "flex", alignItems: "center", gap: "5px", color: "blue", width: "120px", justifyContent: "center"}} onClick={addFilter}><span style={{fontSize: "18px"}}>+</span>Add condition</button>
                    <button style={{color: "grey", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px", width: "150px", justifyContent: "center"}}><span style={{fontSize: "18px"}}>+</span>Add condition group</button>
                    <img src="/questionMark.svg" style={{width: "15px", height: "15px"}}></img>
                </div>
                <button onClick={copyFromAnotherViewClick} style={{color: "grey", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px", width: "160px", justifyContent: "center"}}>Copy from another view</button>
            </div>
        </div>
    );
}
