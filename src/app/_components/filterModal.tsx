import { useState, useEffect } from "react";
import { api } from "~/trpc/react"

type TableRow = Record<string, string> & { rowId: string };

const filterTypes = [
    "contains",
    "not_contains",
    "eq",
    "gt",
    "lt",
    "empty",
    "not_empty",
] as const;

type OperatorType = typeof filterTypes[number];

type Filter = {
    id: string;
    type: OperatorType;
    value: string;
    tableId: string;
    columnIndex: number;
};

interface prop {
    tableFilters: Filter[];
    tableHeaders: string[];
    tableId: string;
    tableName: string;
    baseId: string;
    setData: React.Dispatch<React.SetStateAction<TableRow[]>>;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FilterModal(FilterModalProps: prop) {
    const utils = api.useUtils();    
    const [filters, setFilters] = useState<Filter[]>([]);
    const [val, setVal] = useState<string>("");
    const [col, setCol] = useState<number>(0);
    const [operator, setOperator] = useState<OperatorType>("contains");
    const { mutateAsync: addFilterAsync } = api.table.addFilter.useMutation({
        onSuccess: () => {
            utils.table.getTableWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName
            });
          }
    });
    const { mutateAsync: deleteFilterAsync } = api.table.removeFilter.useMutation({
        onSuccess: () => {
            utils.table.getTableWithRowsAhead.reset({
                baseId: FilterModalProps.baseId,
                tableName: FilterModalProps.tableName
            });
        }
    });

    useEffect(() => {
        setFilters(FilterModalProps.tableFilters);
    }, [])    

    async function addFilter() {
        if (operator) {
            const newFilter = await addFilterAsync({tableId: FilterModalProps.tableId, colNum: col, filterType: operator, filterVal: val});
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
        <div style={{width: "400px", background: "white", border: "solid black 1px"}}>
            <div>
                <div>
                    <select value={col} onChange={(e) => setCol(Number(e.target.value))}>
                        {FilterModalProps.tableHeaders.map((header, i) => {
                            return(<option key={i} value={i}>{header}</option>)
                        })}
                    </select>
                    <input type="text" placeholder="value" onChange={(e) => (setVal(e.target.value))}></input>
                    <select value={operator} onChange={(e) => (setOperator(e.target.value as OperatorType))} >
                        {filterTypes.map((type, i) => {
                            return(<option key={i} value={type}>{type}</option>)
                        })}
                    </select>
                </div>
                <button onClick={addFilter}>AddFilter</button>
            </div>
            <div>
                {filters.map((filter) => {
                    return(<div key={filter.id}>
                        <span>Value: {filter.value}</span>
                        <span>Column: {FilterModalProps.tableHeaders[filter.columnIndex]}</span>
                        <span>Filter: {filter.type}</span>
                        <button onClick={() => (deleteFilter(filter.id))}>delete</button>
                    </div>)
                })}
                <button onClick={() => FilterModalProps.setModal(false)}>Exit</button>
            </div>
        </div>
    );
}
