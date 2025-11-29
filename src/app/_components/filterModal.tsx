import { useState, useEffect, useRef} from "react";
import { text } from "stream/consumers";
import { api } from "~/trpc/react"
import type { View, Filter, TableRow, OperatorType } from "~/types/types";

interface prop {
    tableHeaders: string[];
    tableHeaderTypes: number[];
    tableId: string;
    tableName: string;
    baseId: string;
    setData: React.Dispatch<React.SetStateAction<TableRow[]>>;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View
}


export default function FilterModal(FilterModalProps: prop) {
    const filterTypes = [
        "contains",
        "not_contains",
        "eq",
        "gt",
        "lt",
        "empty",
        "not_empty",
    ];

    // everytime filterModal is rendered this gets outputted
    useEffect(() => {
    function handleClick(event: MouseEvent) {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        FilterModalProps.setModal(false);
        }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    }, []);


    const modalRef = useRef<HTMLDivElement>(null);
    const utils = api.useUtils();    
    // const [filters, setFilters] = useState<Filter[]>(FilterModalProps.view.filters);
    const [val, setVal] = useState<string>("");
    const [col, setCol] = useState<number>(0);
    const [operator, setOperator] = useState<OperatorType>("contains");
    const { mutateAsync: addFilterAsync } = api.view.addFilter.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName,
                viewName: FilterModalProps.view.name
            });
          }
    });
    const { mutateAsync: deleteFilterAsync } = api.view.removeFilter.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName,
                viewName: FilterModalProps.view.name
            });
          }
    });
    const { mutateAsync: editFilterHeaderAsync } = api.view.editFilterHeader.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName,
                viewName: FilterModalProps.view.name
            })
        }
    })
    const { mutateAsync: editFilterTypeAsync } = api.view.editFilterType.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName,
                viewName: FilterModalProps.view.name
            })
        }
    })
    const { mutateAsync: editFilterValAsync } = api.view.editFilterVal.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName,
                viewName: FilterModalProps.view.name
            })
        }
    })
    // useEffect(() => {
    //     setFilters(FilterModalProps.view.filters);
    // }, [])    

    async function addFilter() {
        if (operator) {
            const newFilter = await addFilterAsync({viewId: FilterModalProps.view.id, colNum: 0, filterType: "contains", filterVal: ""});
            // setFilters([...filters, newFilter]);
        }
    }

    async function deleteFilter(filterId: string) {
        await deleteFilterAsync({filterId});
        // setFilters(filters.filter((filter) => {
        //     return filter.id !== filterId;
        // }))
    }   

    async function editFilterHeader(filterId: string, newHeaderCol: number) {
        // update backend
        await editFilterHeaderAsync({filterId: filterId, newHeaderColIndex: newHeaderCol});
        // update local state
        // setFilters((prev) => {
        //     return prev.map((filter) => {
        //         if (filter.id === filterId) {
        //             return newFilter
        //         } else {
        //             return filter
        //         }
        //     })
        // })        
    }

    async function editFilterType(filterId: string, newType: OperatorType) {
        // update backend
        await editFilterTypeAsync({filterId: filterId, newType: newType})
    }

    async function editFilterVal(filterId: string, val: string) {
        console.log("this is new val: ", val);
        const newFilter = await editFilterValAsync({filterId: filterId, newFilterVal: val});
        console.log("this is the newFilter returned: ", newFilter);
    }

    return(
        <div ref={modalRef} style={{boxShadow: "0 8px 12px rgba(0, 0, 0, 0.1)", zIndex: "1000", marginLeft: "15vw", top: "139px", width: "570px", background: "white", padding: "10px", position: "fixed", gap: "10px", display: "flex", flexDirection: "column"}}>
            <span style={{fontSize: "14px", color: "grey"}}>In this view, show records</span>
            <div style={{padding: "10px", display: "flex", flexDirection: "column", gap: "10px"}}>
            {FilterModalProps.view.filters.map((filter, i) => {

                return(<div style={{display: "flex"}}key={filter.id}>
                    {i === 0 ? <div style={{width: "50px", marginRight: "5px" , height: "30px", display: "flex", alignItems: "center", fontSize: "14px"}}>Where</div> : <div style={{fontSize: "14px", display: "flex", alignItems: "center", height: "30px", width: "50px", marginRight: "5px"}}>and</div>}
                    <select style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "130px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}} onChange={(e) => editFilterHeader(filter.id, Number(e.target.value))} value={filter.columnIndex}>
                        {FilterModalProps.tableHeaders.map((header, i) => {
                            return(<option key={i} value={i}>{header}</option>)
                        })}
                    </select>
                    {FilterModalProps.tableHeaderTypes[filter.columnIndex] ?
                        <select style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "130px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}} onChange={(e) => (editFilterType(filter.id, e.target.value as OperatorType))} value={filter.type}>                             
                            <option key={0} value="eq">=</option>
                            <option key={1} value="gt">&gt;</option>
                            <option key={2} value="lt">&lt;</option>
                        </select> : 
                        <select style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "130px", height: "30px", display: "flex", alignItems: "center", fontSize: "13px"}} onChange={(e) => (editFilterType(filter.id, e.target.value as OperatorType))} value={filter.type}>                             
                            <option key={0} value="eq">is</option>
                            <option key={1} value="contains">contains...</option>
                            <option key={2} value="not_contains">does not contain...</option>
                            <option key={3} value="empty">is empty</option>
                            <option key={4} value="not_empty">is not empty</option>
                        </select>
                    }
                    <input style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "140px", height: "30px", padding: "10px", display: "flex", alignItems: "center", fontSize: "14px"}} defaultValue={filter.value} onBlur={(e) => editFilterVal(filter.id, e.target.value)}></input>
                    <button style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "30px", height: "30px", display: "flex", justifyContent: "center", alignItems: "center"}}onClick={() => (deleteFilter(filter.id))}><img src="/trash.svg" style={{width: "15px", height: "15px"}}></img></button>
                    <button style={{border: "solid rgba(222, 222, 222, 1) 1px", width: "30px", height: "30px", display: "flex", justifyContent: "center", alignItems: "center"}}><img src="/dots.svg" style={{width: "15px", height: "15px"}}></img></button>
                </div>)
            })}
            </div>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <div style={{display: "flex", gap: "15px", alignItems: "center"}}>
                    <button style={{fontSize: "14px", display: "flex", alignItems: "center", gap: "5px", color: "blue"}} onClick={addFilter}><span style={{fontSize: "18px"}}>+</span>Add condition</button>
                    <button style={{color: "grey", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px"}}><span style={{fontSize: "18px"}}>+</span>Add condition group</button>
                    <img src="/questionMark.svg" style={{width: "15px", height: "15px"}}></img>
                </div>
                <button style={{color: "grey", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px"}}>Copy from another view</button>
            </div>
        </div>
    );
}
