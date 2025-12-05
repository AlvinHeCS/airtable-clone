"use client"

import { useParams, useRouter } from "next/navigation"
import { api } from "~/trpc/react"
import Table from "~/app/_components/table"
import BaseSideBar from "~/app/_components/baseSideBar"
import BaseHeader from "~/app/_components/baseHeader"
import { useState, useEffect } from "react"
import "./page.css"
import CircularProgress from '@mui/material/CircularProgress';

export default function BasePage() {
  const utils = api.useUtils()
  const params = useParams()
  const baseId = String(params.baseId)
  const [selectedTableId, setSelectedTableId] = useState<string>("")
  const { data: tables, isLoading: loadingTables } = api.base.getTables.useQuery({ baseId })
  const router = useRouter();
  const { mutateAsync: addTableMutate } = api.base.addTables.useMutation()

  async function addTable() {
    const newTable = await addTableMutate({ baseId })
    utils.base.getTables.setData({baseId}, (oldData) => {
      if (!oldData) return oldData
      return [...oldData, newTable]
    })
  }

  useEffect(() => {
    if (!tables || !tables[0]) return
    if (selectedTableId === "") {
      setSelectedTableId(tables[0].id);
    }
  }, [tables])


  if (!tables || loadingTables) {
    return(
        <div style={{display: "flex", width: "100%", height: "80vh", justifyContent: "center", alignItems: "center", gap: "10px", color: "rgb(156, 156, 156)"}}>Loading tables <CircularProgress size="20px"/></div>
    )
  }

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh"}}>
      {/* <div className="background"></div> */}
      <BaseSideBar />

      <div style={{ display: "flex", flexDirection: "column", width: "100vw" }}>
        <BaseHeader />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "33px",
            background: "#FDF4FF",
            paddingRight: "10px",
            position: "sticky",
            top: "55.5px",
            zIndex: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
            {tables.map((table, index) => {
              const isSelected = selectedTableId === table.id
              return (
                <div key={table.id}>
                  <button
                    style={{
                      width: isSelected ? "100px" : "80px",
                      cursor: isSelected ? "default" : "pointer",
                      color: isSelected ? "black" : "grey",
                      display: "flex",
                      fontSize: "14px",
                      lineHeight: isSelected ? "33px" : "12px",
                      gap: "5px",
                      alignItems: "center",
                      height: isSelected ? "100%" : "60%",
                      paddingLeft: "15px",
                      paddingRight: "15px",
                      background: isSelected ? "white" : "transparent",
                      borderRight: "solid grey 0.5px"
                    }}
                    onClick={() => setSelectedTableId(table.id)}
                  >
                    Table {index + 1}
                    {isSelected && <img style={{ width: "10px", height: "10px" }} src="/arrowD.svg" />}
                  </button>
                </div>
              )
            })}

            <img style={{ width: "10px", height: "10px", marginLeft: "10px" }} src="/arrowD.svg" />

            <button
              className="special"
              style={{
                cursor: "pointer",
                width: "130px",
                textAlign: "left",
                justifyContent: "center",
                fontSize: "14px",
                marginLeft: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
              onClick={addTable}
            >
              <img style={{ height: "10px", width: "10px" }} src="/plus2.svg" />
              <span className="add">add or import</span>
            </button>
          </div>
              
          <button
            style={{
              justifyContent: "center",
              width: "80px",
              display: "flex",
              gap: "7px",
              alignItems: "center",
              fontSize: "14px",
              color: "grey"
            }}
          >
            Tools
            <img style={{ width: "10px", height: "10px" }} src="/arrowD.svg" />
          </button>
        </div>
        <div style={{width: "100%", height: "100%"}}>
          <Table key={selectedTableId} tableId={selectedTableId}/>
        </div>
      </div>
    </div>
  )
}
