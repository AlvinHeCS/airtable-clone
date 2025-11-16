

interface TableProp {
    tableData: {
        id: string;
        name: string;
    }
    tableSetter: {
        setter: React.Dispatch<React.SetStateAction<string | null>>;
    }
}


export default function TableButton(prop: TableProp) {
    return(
        <>
        <button onClick={() => {prop.tableSetter.setter(prop.tableData.id)}}>{prop.tableData.name}</button>
        </>
    )
}