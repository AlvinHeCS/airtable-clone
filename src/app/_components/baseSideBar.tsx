


export default function BaseSideBar() {
    return (
        <div style={{height: "100vh", width: "60px", borderRight: "solid grey 0.5px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", paddingLeft: "10px", paddingRight: "10px", paddingBottom: "20px", paddingTop: "20px", position: "sticky", top: "0"}}>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "15px"}}>
                <img style={{width: "25px", height: "25px"}} src="/airtableB.svg"></img>
                <img style={{width: "30px", height: "30px"}} src="/omniB.png"></img>
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