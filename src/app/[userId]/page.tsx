"use client"

import { api } from "~/trpc/react"
import Base from "~/app/_components/base"
import "./page.css";
import { useState } from "react"
import Profile from "../_components/profile"
import { useSession } from "next-auth/react";
import SideBar from "../_components/sideBar";
import SideBarCollapsed from "../_components/sideBarCollapsed" 
import CircularProgress from '@mui/material/CircularProgress';

export default function UserIdPage() {
    const { data: session, status } = useSession();
    const firstLetter = (session?.user.email?.[0] ?? "A").toUpperCase();
    const utils = api.useUtils();
    const [profileClicked, setProfileClicked] = useState(false);
    const [showSideBar, setShowSideBar] = useState(true);
    const { data, isLoading } = api.user.getBases.useQuery();
    const { mutateAsync } = api.user.addBase.useMutation({
        onSuccess: () => {
            utils.user.getBases.invalidate();
        }
    });
    
    const handleCreateBase = async () => {
        try {
            await mutateAsync();
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) {
        return (
            <div style={{width: "100%", height: "100%"}}>
            <div className="header">
                <div style={{display: "flex", gap: "20px", alignItems:"center"}}>
                    <button onClick={() => {setShowSideBar(!showSideBar)}} style={{display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "40%"}}><img style={{width: "20px", height: "20px"}} src="/hamburger.svg"></img></button>
                    <img style={{width: "120px", height: "25px"}} src="/airtablewords.png"></img>
                </div>
                <button className="search">
                    <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
                        <img style={{width: "18px", height: "18px"}} src="/search.svg"></img>
                        <span>Search...</span>
                    </div>
                    <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
                        <img style={{width: "14px", height: "14px"}} src="/command.svg"></img>
                        <span>K</span>
                    </div>
                </button>
                <div style={{display: "flex", gap: "20px", alignItems:"center"}}>
                    <button className="questionMark" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <img style={{width: "15px", height: "15px"}} src="/questionMark.svg"></img>
                    </button>
                    <button className="bell" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <img style={{width: "15px", height: "20px"}} src="/bell.svg"></img>
                    </button>
                    <button onClick={() => {setProfileClicked(!profileClicked)}}style={{width: "30px", height: "30px", borderRadius: "50%", background: "grey", color: "white"}}>
                        {firstLetter}
                    </button>
                </div>
            </div>
            {profileClicked ? <Profile /> : null}
            <div style={{width: "100%", display: "flex", height: "92vh", overflow: "hidden"}}>
                {showSideBar ? <SideBar createBase={handleCreateBase}/> : null}
                {showSideBar ? null: <SideBarCollapsed /> }
                <div style={{width: "100%", paddingLeft: "50px", paddingRight: "50px", paddingTop: "25px", paddingBottom: "25px", display: "flex", flexDirection: "column", gap: "20px", background: "#F9FAFB", overflowY: "auto"}}>
                    <span style={{fontSize: "30px"}}><b>Home</b></span>
                    <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                        <button className="options" style={{width: "310px", height: "90px"}}>
                            <div style={{display: "flex", fontSize: "16px", alignItems: "center", gap: "10px", fontWeight: "500"}}><img style={{width: "22px", height: "22px"}} src="/omni.png"></img><span>Start with Omni</span></div>
                            <div style={{textAlign: "left", color: "grey"}}>Use AI to build a custom app tailored to your workflow</div>
                        </button>
                        <button className="options" style={{width: "310px", height: "90px"}}>
                            <div style={{display: "flex", fontSize: "16px", alignItems: "center", gap: "10px", fontWeight: "500"}}><img style={{width: "15px", height: "15px"}} src="/pGrid.png"></img><span>Start with templates</span></div>
                            <div style={{textAlign: "left", color: "grey"}}>Select a template to get started and customize as you go.</div>
                        </button>
                        <button className="options" style={{width: "310px", height: "90px"}}>
                            <div style={{display: "flex", fontSize: "16px", alignItems: "center", gap: "10px", fontWeight: "500"}}><img style={{width: "15px", height: "20px"}} src="/gArrow.png"></img><span>Quickly upload</span></div>
                            <div style={{textAlign: "left", color: "grey"}}>Easily migrate your existing projects in just a few minutes.</div>
                        </button>
                        <button onClick={() => void handleCreateBase()} className="options" style={{width: "310px", height: "90px"}}>
                            <div style={{display: "flex", fontSize: "16px", alignItems: "center", gap: "10px", fontWeight: "500"}}><img style={{width: "15px", height: "15px"}} src="/bTable.png"></img><span>Build an app on your own</span></div>
                            <div style={{textAlign: "left", color: "grey"}}>Start with a blank app and build your ideal workflow.</div>
                        </button>
                    </div>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <button className="select" style={{width: "150px", fontSize: "15px", color: "grey", background: "#F9FAFB"}}><div style={{display: "flex", alignItems: "center", gap: "5px", background: "#F9FAFB"}}>Opened anytime<img style={{width: "15px", height: "20px", background: "#F9FAFB"}} src="/arrowD.svg"></img></div></button>
                        <div style={{display: "flex"}}>
                            <button className="bell" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <img style={{width: "15px", height: "20px"}} src="/hamburger.svg"></img>
                            </button>       
                            <button className="bell" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", background: "rgb(232, 232, 232)"}}>
                                <img style={{width: "15px", height: "20px"}} src="/grid.svg"></img>
                            </button>       
                        </div>

                    </div>
                    <div style={{display: "flex", width: "100%", justifyContent: "center", alignItems: "center", gap: "10px", color: "rgb(156, 156, 156)"}}>Loading Bases <CircularProgress size="20px"/></div>
                </div>
            </div>
        </div>

        )
    }

    return (
        <div style={{width: "100%", height: "100%"}}>
            <div className="header">
                <div style={{display: "flex", gap: "20px", alignItems:"center"}}>
                    <button onClick={() => {setShowSideBar(!showSideBar)}} style={{display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "40%"}}><img style={{width: "20px", height: "20px"}} src="/hamburger.svg"></img></button>
                    <img style={{width: "120px", height: "25px"}} src="/airtablewords.png"></img>
                </div>
                <button className="search">
                    <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
                        <img style={{width: "18px", height: "18px"}} src="/search.svg"></img>
                        <span>Search...</span>
                    </div>
                    <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
                        <img style={{width: "14px", height: "14px"}} src="/command.svg"></img>
                        <span>K</span>
                    </div>
                </button>
                <div style={{display: "flex", gap: "20px", alignItems:"center"}}>
                    <button className="questionMark" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <img style={{width: "15px", height: "15px"}} src="/questionMark.svg"></img>
                    </button>
                    <button className="bell" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <img style={{width: "15px", height: "20px"}} src="/bell.svg"></img>
                    </button>
                    <button onClick={() => {setProfileClicked(!profileClicked)}}style={{width: "30px", height: "30px", borderRadius: "50%", background: "grey", color: "white"}}>
                        {firstLetter}
                    </button>
                </div>
            </div>
            {profileClicked ? <Profile /> : null}
            <div style={{width: "100%", display: "flex", height: "92vh", overflow: "hidden"}}>
                {showSideBar ? <SideBar createBase={handleCreateBase}/> : null}
                {showSideBar ? null: <SideBarCollapsed /> }
                <div style={{width: "100%", paddingLeft: "50px", paddingRight: "50px", paddingTop: "25px", paddingBottom: "25px", display: "flex", flexDirection: "column", gap: "20px", background: "#F9FAFB", overflowY: "auto"}}>
                    <span style={{fontSize: "30px"}}><b>Home</b></span>
                    <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                        <button className="options" style={{width: "310px", height: "90px"}}>
                            <div style={{display: "flex", fontSize: "16px", alignItems: "center", gap: "10px", fontWeight: "500"}}><img style={{width: "22px", height: "22px"}} src="/omni.png"></img><span>Start with Omni</span></div>
                            <div style={{textAlign: "left", color: "grey"}}>Use AI to build a custom app tailored to your workflow</div>
                        </button>
                        <button className="options" style={{width: "310px", height: "90px"}}>
                            <div style={{display: "flex", fontSize: "16px", alignItems: "center", gap: "10px", fontWeight: "500"}}><img style={{width: "15px", height: "15px"}} src="/pGrid.png"></img><span>Start with templates</span></div>
                            <div style={{textAlign: "left", color: "grey"}}>Select a template to get started and customize as you go.</div>
                        </button>
                        <button className="options" style={{width: "310px", height: "90px"}}>
                            <div style={{display: "flex", fontSize: "16px", alignItems: "center", gap: "10px", fontWeight: "500"}}><img style={{width: "15px", height: "20px"}} src="/gArrow.png"></img><span>Quickly upload</span></div>
                            <div style={{textAlign: "left", color: "grey"}}>Easily migrate your existing projects in just a few minutes.</div>
                        </button>
                        <button onClick={() => void handleCreateBase()} className="options" style={{width: "310px", height: "90px"}}>
                            <div style={{display: "flex", fontSize: "16px", alignItems: "center", gap: "10px", fontWeight: "500"}}><img style={{width: "15px", height: "15px"}} src="/bTable.png"></img><span>Build an app on your own</span></div>
                            <div style={{textAlign: "left", color: "grey"}}>Start with a blank app and build your ideal workflow.</div>
                        </button>
                    </div>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <button className="select" style={{width: "150px", fontSize: "15px", color: "grey", background: "#F9FAFB"}}><div style={{display: "flex", alignItems: "center", gap: "5px", background: "#F9FAFB"}}>Opened anytime<img style={{width: "15px", height: "20px", background: "#F9FAFB"}} src="/arrowD.svg"></img></div></button>
                        <div style={{display: "flex"}}>
                            <button className="bell" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                                <img style={{width: "15px", height: "20px"}} src="/hamburger.svg"></img>
                            </button>       
                            <button className="bell" style={{width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", background: "rgb(232, 232, 232)"}}>
                                <img style={{width: "15px", height: "20px"}} src="/grid.svg"></img>
                            </button>       
                        </div>

                    </div>
                    <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                        {data?.map((base) => (
                            <div key={base.id}>
                                <Base base={base} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
