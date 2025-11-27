import { useState, useEffect } from "react";
import { api } from "~/trpc/react"
import type { View, Sort, TableRow, SortType } from "~/types/types";


interface prop {
    tableHeaders: string[];
    tableId: string;
    tableName: string;
    baseId: string;
    setData: React.Dispatch<React.SetStateAction<TableRow[]>>;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View;
}

export default function SortModal(SortModalProps: prop) {
    const utils = api.useUtils();    
    const [sorts, setSorts] = useState<Sort[]>([]);
    const [val, setVal] = useState<string>("");
    const [col, setCol] = useState<number>(0);
    const [operator, setOperator] = useState<SortType>("sortA_Z");
    const { mutateAsync: addSortAsync } = api.table.addSort.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: SortModalProps.baseId,
                tableName: SortModalProps.tableName,
                viewName: SortModalProps.view.name
            });
          }
    });
    const { mutateAsync: deleteSortAsync } = api.table.removeSort.useMutation({
        onSuccess: () => {
            utils.table.getTableAndViewWithRowsAhead.reset({
                baseId: SortModalProps.baseId,
                tableName: SortModalProps.tableName,
                viewName: SortModalProps.view.name
            });
        }
    });
    
    useEffect(() => {
        setSorts(SortModalProps.view.sorts);
    }, [])    

    async function addSort() {
        if (operator) {
            const newSort = await addSortAsync({viewId: SortModalProps.view.id || "", colNum: col, sortType: operator});
            setSorts([...sorts, newSort]);
        }
    }

    async function deleteSort(sortId: string) {
        await deleteSortAsync({sortId});
        setSorts(sorts.filter((sort) => {
            return sort.id !== sortId;
        }))
    }   


    return(
        <div style={{zIndex: "1000", marginLeft: "40vw", marginTop: "220px", width: "400px", background: "white", border: "solid black 1px", padding: "10px", position: "fixed", gap: "10px", display: "flex", flexDirection: "column"}}>
            <span style={{fontSize: "14px", color: "grey"}}>In this view, show records</span>
            <div style={{overflow: "scroll", height: "50px", display: "flex", flexDirection: "column", gap: "5px", border: "solid grey 0.5px"}}>
                {sorts.map((sort) => {
                    return(<div style={{display: "flex"}}key={sort.id}>
                        <div style={{border: "solid grey 1px", width: "150px", height: "30px", padding: "10px", display: "flex", alignItems: "center"}}>{SortModalProps.tableHeaders[sort.columnIndex]}</div>
                        <div style={{border: "solid grey 1px", width: "150px", height: "30px", padding: "10px", display: "flex", alignItems: "center"}}>{sort.type}</div>
                        <button onClick={() => (deleteSort(sort.id))}>delete</button>
                    </div>)
                })}
            </div>
            <div style={{display: "flex"}}>
                <select style={{border: "solid rgba(161, 161, 161, 1) 0.5px", width: "150px", height: "30px", fontSize: "14px"}} value={col} onChange={(e) => setCol(Number(e.target.value))}>
                    {SortModalProps.tableHeaders.map((header, i) => {
                        return(<option key={i} value={i}>{header}</option>)
                    })}
                </select>
                <select style={{border: "solid grey 0.5px", width: "150px", height: "30px", fontSize: "14px"}} value={operator} onChange={(e) => (setOperator(e.target.value as SortType))} >
                    <option key={0} value="sortA_Z">A-Z</option>
                    <option key={1} value="sortZ_A">Z-A</option>
                    <option key={2} value="sort1_9">1-9</option>
                    <option key={3} value="sortA_Z">9-1</option>
                </select>
                <button style={{marginLeft: "10px"}}onClick={addSort}>AddSort</button>
            </div>
            <div>
                <button onClick={() => SortModalProps.setModal(false)}>Back</button>
            </div>
        </div>
    );
}
