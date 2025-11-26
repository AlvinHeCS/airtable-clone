import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { api } from "~/trpc/react";
import { useEffect } from 'react';

interface prop {
    tableHeaders: string[];
    tableId: string;
    tableName: string;
    baseId: string;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    localShowing: boolean[];
    setLocalShowing: React.Dispatch<React.SetStateAction<boolean[]>>;
}



export default function ShowHideColModal(showHideColModalProp: prop) {
    const utils = api.useUtils();
    const {mutateAsync} = api.table.showHideCol.useMutation();

    async function handleChange(colIndex: number, check: boolean) {
        //update backend first
        await mutateAsync({tableId: showHideColModalProp.tableId, check: check, colIndex: colIndex})
        // update local state
        showHideColModalProp.setLocalShowing((prev) => {
            const newLocalShowing = [...prev];
            newLocalShowing[colIndex] = check;

            utils.table.getTableWithRowsAhead.setInfiniteData({baseId: showHideColModalProp.baseId, tableName: showHideColModalProp.tableName}, 
                (oldData) => {
                    //   pages: {
                    //     table: Table;
                    //     rows: Row[]; size is 200 as long as theres more
                    //     nextCursor: number | null;
                    //   }[],

                    // if value has never been cached before
                    if (!oldData) return oldData;
                    // set all table 
                    const newPages = oldData.pages.map((page) => {
                        return ({
                            ...page,
                            table: {
                                ...page.table,
                                showing: newLocalShowing
                            }
                            }
                        )
                    })
                    return {
                        ...oldData,
                        pages: newPages
                    }

                }   
            )
            return newLocalShowing
        })
    }
    
    return(
        <div style={{zIndex: "1000", marginLeft: "10vw", marginTop: "220px", width: "600px", background: "white", border: "solid black 1px", padding: "10px", position: "fixed", gap: "10px", display: "flex", flexDirection: "column"}}>
            <span style={{borderBottom: "solid grey 1px"}}>find a field</span>
            <FormGroup>
                {showHideColModalProp.tableHeaders.map((header, i) => {
                    return(<FormControlLabel key={i} control={<Switch onChange={(e) => handleChange(i, e.target.checked)} checked={showHideColModalProp.localShowing[i]} />} label={header} />)
                })}
            </FormGroup>
            <button onClick={() => (showHideColModalProp.setModal(false))}>back</button>
        </div>
    )
}