"use client"

export default function BaseHeader() {
    return (
        <div style={{width: "100%", height: "60px", position: "sticky", top: "0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "solid grey 0.5px", padding: "10px", background: "white"}}>
            <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
                <div style={{background: "#63498D", width: "30px", height: "30px", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "5px"}}>
                    <img style={{width: "25px", height: "25px"}} src="/airtablep2.png"></img>
                </div>
                <span style={{fontSize: "16px"}}><b>Untitled Base</b></span>
                <img style={{width: "10px", height: "10px"}} src="/arrowD.svg"></img>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "15px"}}>
                <span style={{fontSize: "13px", fontWeight: "500"}}>Data</span>
                <span style={{fontSize: "13px", fontWeight: "500"}}>Automations</span>
                <span style={{fontSize: "13px", fontWeight: "500"}}>Interfaces</span>
                <span style={{fontSize: "13px", fontWeight: "500"}}>Forms</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "15px"}}>
                <img style={{width: "15px", height: "15px"}} src="/history.svg"></img>
                <button style={{borderRadius: "5px", paddingRight: "10px", padding: "5px", fontSize: "13px", width: "80px", height: "30px", border: "solid rgba(204, 204, 204, 1) 0.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"}}>
                    <img src="/launch.png" style={{width: "15px", height: "10px"}}></img>
                    <span>Launch</span>
                </button>
                <button style={{background: "#63498D", borderRadius: "5px", padding: "5px", color: "white", fontSize: "14px", width: "60px", height: "29px", fontWeight: "500"}}>Share</button>
            </div>
        </div>
    )
}