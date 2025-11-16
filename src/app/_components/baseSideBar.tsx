


export default function BaseSideBar() {
    return (
        <div style={{height: "100%", width: "60px", border: "solid grey 1px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "10px", position: "sticky", top: "0"}}>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "15px"}}>
                <img style={{width: "20px", height: "20px"}} src="/airtable.svg"></img>
                <img style={{width: "30px", height: "30px"}} src="/omni.png"></img>
            </div>            
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "10px"}}>
            <button className="questionMark" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <img style={{width: "15px", height: "15px"}} src="/questionMark.svg"></img>
                    </button>
                    <button className="bell" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <img style={{width: "15px", height: "20px"}} src="/bell.svg"></img>
                    </button>
                    <button style={{width: "30px", height: "30px", borderRadius: "50%", background: "grey", color: "white"}}>
                        A
                    </button>
            </div>
        </div>
    )
}