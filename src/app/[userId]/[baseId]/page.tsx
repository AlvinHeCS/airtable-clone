"use client"

import { useParams } from "next/navigation"
import { api } from "~/trpc/react"
import Table from "~/app/_components/table"
import BaseSideBar from "~/app/_components/baseSideBar"
import BaseHeader from "~/app/_components/baseHeader"
import GridBar from "~/app/_components/gridBar"
import { useState } from "react"
import "./page.css"

export default function BasePage() {
  const [selectedTableName, setSelectedTableName] = useState<string>("Table 1")
  const [showGridView, setShowGridView] = useState<boolean>(false)

  const utils = api.useUtils()
  const params = useParams()
  const baseId = String(params.baseId)

  const { data: tableAmount, isLoading: loadingTableAmount } =
    api.base.getTableAmount.useQuery({ baseId })

  const { mutateAsync: addTableMutate } = api.base.addTables.useMutation({
    onSuccess: () => utils.base.getTableAmount.invalidate()
  })

  function addTable() {
    addTableMutate({ baseId })
  }

  if (loadingTableAmount) return <>loading table amount</>

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh" }}>
      <BaseSideBar />

      <div style={{ display: "flex", flexDirection: "column", width: "100vw" }}>
        <BaseHeader />

        {/* Top table tabs */}
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
            {Array.from({ length: tableAmount ?? 0 }).map((_, index) => {
              const tableName = `Table ${index + 1}`
              const isSelected = selectedTableName === tableName

              return (
                <div key={index}>
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
                    onClick={() => setSelectedTableName(tableName)}
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

        {/* Toolbar */}
        <div
          style={{
            height: "50px",
            borderBottom: "solid grey 0.5px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5px",
            position: "sticky",
            top: "88.5px",
            background: "white",
            zIndex: 9
          }}
        >
          {/* Left side */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setShowGridView(!showGridView)}
              className="bell"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <img style={{ width: "15px", height: "20px" }} src="/hamburger.svg" />
            </button>

            <button
              className="bell"
              style={{
                height: "30px",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
                padding: "5px"
              }}
            >
              <img style={{ width: "18px", height: "15px" }} src="/bTable.png" />
              <span style={{ fontWeight: "500", fontSize: "13px" }}>Grid view</span>
              <img style={{ width: "10px", height: "10px" }} src="/arrowD.svg" />
            </button>
          </div>

          {/* Right side buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            {[
              { src: "/hide.svg", label: "Hide fields", width: "100px" },
              { src: "/filter.svg", label: "Filter" },
              { src: "/groupStuff.svg", label: "Groups" },
              { src: "/sort.svg", label: "Sort" },
              { src: "/color.svg", label: "Color" },
              { src: "/rowHeight.svg" },
              { src: "/share.svg", label: "Share and sync", width: "130px" },
              { src: "/search2.svg" }
            ].map((btn, i) => (
              <button
                key={i}
                className="bell"
                style={{
                  width: btn.width || "80px",
                  flexShrink: 0,
                  height: "30px",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px"
                }}
              >
                <img style={{ width: "20px", height: "20px" }} src={btn.src} />
                {btn.label && (
                  <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>{btn.label}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table / Grid view */}
        <div
          style={{
            display: "flex",
            height: "calc(100vh - 138.5px)",
            border: "solid red 1px",
            width: "95vw"
          }}
        >
          {showGridView && <GridBar />}

          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ minWidth: "max-content" }}>
              <Table key={selectedTableName} name={selectedTableName} baseId={baseId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
