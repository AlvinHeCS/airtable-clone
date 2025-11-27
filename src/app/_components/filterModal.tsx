import { useState, useEffect } from "react";
import { api } from "~/trpc/react"
import type { View, Filter, TableRow, OperatorType } from "~/types/types";

interface prop {
    tableHeaders: string[];
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
    const utils = api.useUtils();    
    const [filters, setFilters] = useState<Filter[]>(FilterModalProps.view.filters);
    const [val, setVal] = useState<string>("");
    const [col, setCol] = useState<number>(0);
    const [operator, setOperator] = useState<OperatorType>("contains");
    const { mutateAsync: addFilterAsync } = api.table.addFilter.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName,
                viewName: FilterModalProps.view.name
            });
          }
    });
    const { mutateAsync: deleteFilterAsync } = api.table.removeFilter.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName,
                viewName: FilterModalProps.view.name
            });
          }
    });

    useEffect(() => {
        setFilters(FilterModalProps.view.filters);
    }, [])    

    async function addFilter() {
        if (operator) {
            const newFilter = await addFilterAsync({viewId: FilterModalProps.view.id, colNum: col, filterType: operator, filterVal: val});
            setFilters([...filters, newFilter]);
        }
    }

    async function deleteFilter(filterId: string) {
        await deleteFilterAsync({filterId});
        setFilters(filters.filter((filter) => {
            return filter.id !== filterId;
        }))
    }   

    return(
        <div style={{zIndex: "1000", marginLeft: "15vw", marginTop: "220px", width: "600px", background: "white", border: "solid black 1px", padding: "10px", position: "fixed", gap: "10px", display: "flex", flexDirection: "column"}}>
            <span style={{fontSize: "14px", color: "grey"}}>In this view, show records</span>
            <div style={{overflow: "scroll", height: "50px", display: "flex", flexDirection: "column", gap: "5px", border: "solid grey 0.5px"}}>
                {filters.map((filter) => {
                    return(<div style={{display: "flex"}}key={filter.id}>
                        <div style={{border: "solid grey 1px", width: "150px", height: "30px", padding: "10px", display: "flex", alignItems: "center"}}>{FilterModalProps.tableHeaders[filter.columnIndex]}</div>
                        <div style={{border: "solid grey 1px", width: "150px", height: "30px", padding: "10px", display: "flex", alignItems: "center"}}>{filter.type}</div>
                        <div style={{border: "solid grey 1px", width: "150px", height: "30px", padding: "10px", display: "flex", alignItems: "center"}}>{filter.value}</div>
                        <button onClick={() => (deleteFilter(filter.id))}>delete</button>
                    </div>)
                })}
            </div>
            <div style={{display: "flex"}}>
                <select style={{border: "solid rgba(161, 161, 161, 1) 0.5px", width: "150px", height: "30px", fontSize: "14px"}} value={col} onChange={(e) => setCol(Number(e.target.value))}>
                    {FilterModalProps.tableHeaders.map((header, i) => {
                        return(<option key={i} value={i}>{header}</option>)
                    })}
                </select>
                <select style={{border: "solid grey 0.5px", width: "150px", height: "30px", fontSize: "14px"}} value={operator} onChange={(e) => (setOperator(e.target.value as OperatorType))} >
                    {filterTypes.map((type, i) => {
                        return(<option key={i} value={type}>{type}</option>)
                    })}
                </select>
                <input style={{border: "solid grey 0.5px", width: "150px", height: "30px", paddingLeft: "5px", fontSize: "14px"}} type="text" placeholder="Enter a value" onChange={(e) => (setVal(e.target.value))}></input>
                <button style={{marginLeft: "10px"}}onClick={addFilter}>AddFilter</button>
            </div>
            <div>
                <button onClick={() => FilterModalProps.setModal(false)}>Back</button>
            </div>
        </div>
    );
}
