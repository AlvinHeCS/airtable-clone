// import { useState } from "react";

// type Filter = {
//   column: string;
//   operator: string;
//   value: string;
// };

// export default function FilterModal() {
//   const [filters, setFilters] = useState<Filter[]>([
//     { column: "", operator: "contains", value: "" },
//   ]);

//   const updateFilter = (index: number, key: keyof Filter, value: string) => {
//     const newFilters = [...filters];
//     if (newFilters[index]) {
//         newFilters[index][key] = value;
//         setFilters(newFilters);
//     }
//   };

//   const addFilter = () => {
//     setFilters([...filters, { column: "", operator: "contains", value: "" }]);
//   };

//   const removeFilter = (index: number) => {
//     setFilters(filters.filter((_, i) => i !== index));
//   };

//   return (
//     <div
//       style={{
//         padding: "10px",
//         border: "solid grey 1px",
//         position: "fixed",
//         width: "25vw",
//         background: "white",
//         display: "flex",
//         flexDirection: "column",
//         gap: "10px",
//         zIndex: 1000,
//         top: "20%",
//         left: "50%",
//         transform: "translateX(-50%)",
//         maxHeight: "70vh",
//         overflowY: "auto",
//       }}
//     >
//       <h3 style={{ margin: 0, fontSize: "14px" }}>Filters</h3>

//       {filters.map((f, i) => (
//         <div
//           key={i}
//           style={{
//             display: "flex",
//             gap: "5px",
//             alignItems: "center",
//           }}
//         >
//           <select
//             value={f.column}
//             onChange={(e) => updateFilter(i, "column", e.target.value)}
//             style={{
//               flex: 2,
//               height: "30px",
//               fontSize: "12px",
//               borderRadius: "5px",
//               border: "solid grey 1px",
//             }}
//           >
//             <option value="">Select column</option>
//             {columnOptions.map((col, idx) => (
//               <option key={idx} value={col}>
//                 {col}
//               </option>
//             ))}
//           </select>

//           <select
//             value={f.operator}
//             onChange={(e) => updateFilter(i, "operator", e.target.value)}
//             style={{
//               flex: 2,
//               height: "30px",
//               fontSize: "12px",
//               borderRadius: "5px",
//               border: "solid grey 1px",
//             }}
//           >
//             {operatorOptions.map((op, idx) => (
//               <option key={idx} value={op}>
//                 {op.replace("_", " ")}
//               </option>
//             ))}
//           </select>

//           {!(f.operator === "empty" || f.operator === "not_empty") && (
//             <input
//               type="text"
//               value={f.value}
//               onChange={(e) => updateFilter(i, "value", e.target.value)}
//               placeholder="Value"
//               style={{
//                 flex: 3,
//                 height: "30px",
//                 fontSize: "12px",
//                 borderRadius: "5px",
//                 border: "solid grey 1px",
//                 padding: "5px",
//               }}
//             />
//           )}

//           <button
//             onClick={() => removeFilter(i)}
//             style={{
//               background: "red",
//               color: "white",
//               borderRadius: "5px",
//               border: "none",
//               height: "30px",
//               padding: "0 5px",
//               cursor: "pointer",
//             }}
//           >
//             ✕
//           </button>
//         </div>
//       ))}

//       <button
//         onClick={addFilter}
//         style={{
//           background: "#eee",
//           border: "solid grey 1px",
//           borderRadius: "5px",
//           padding: "5px",
//           fontSize: "12px",
//           cursor: "pointer",
//         }}
//       >
//         + Add Filter
//       </button>

//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           marginTop: "10px",
//         }}
//       >
//         <button
//           onClick={onCancel}
//           style={{
//             background: "#aaa",
//             fontWeight: 400,
//             fontSize: "12px",
//             width: "100px",
//             height: "30px",
//             borderRadius: "5px",
//           }}
//         >
//           Cancel
//         </button>
//         <button
//           onClick={() => onApply(filters)}
//           style={{
//             background: "#156FE2",
//             fontWeight: 600,
//             fontSize: "12px",
//             color: "white",
//             width: "100px",
//             height: "30px",
//             borderRadius: "5px",
//           }}
//         >
//           Apply
//         </button>
//       </div>
//     </div>
//   );
// }
