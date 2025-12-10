export const filterTypes = [
  "contains",
  "not_contains",
  "eq",
  "gt",
  "lt",
  "empty",
  "not_empty",
  "is"
] as const;

export type OperatorType = typeof filterTypes[number];

export type Filter = {
  id: string;
  type: OperatorType;
  value: string;
  viewId: string;
  columnIndex: number;
  creationDate: Date;
};

export const sortTypes = [
  "sortA_Z",
  "sortZ_A",
  "sort1_9",
  "sort9_1",
  "sortCheck_NotCheck",
  "sortNotCheck_Check"
] as const;

export type SortType = typeof sortTypes[number];

export type Sort = {
  id: string;
  type: SortType;
  viewId: string;
  columnIndex: number;
  creationDate: Date;
};


export const headerType = [
  "string",
  "number",
  "checkBox",
] as const

export type HeaderType = typeof headerType[number]

export type Table = {
  id: string;
  baseId: string;
  headers: string[];
  headerTypes: HeaderType[];
  numRows: number;
  numViews: number;
  name: string;
};

// string for key value
// string for idVal which must be included because of the & {id: string}
// Record for object containg cellVal and then highlightCellBool

export type TableRow = Record<string, Record<string, string | boolean> | string> & { id: string };

export const cellHeight = [
  "small",
  "medium",
  "large"
] as const

export type CellHeight = typeof cellHeight[number]

export type View = {
  id: string;
  name: string;
  tableId: string;
  filters: Filter[];
  sorts: Sort[];
  showing: boolean[];
  search: string;
  creationDate: Date;
  cellHeight: CellHeight;
};

export type Augments = {
  bool: boolean;
  num: number;
}

export type Filtered = {
  bool: boolean;
  filterNames: string;
}

export type CellsFlat = (number | string | boolean | null)[]; 

export type Row = { 
  id: string; 
  rowNum: number; 
  cellsFlat: CellsFlat; 
  tableId: string; 
}

export type RowNoCell = {
  id: string; 
  rowNum: number; 
  cellsFlat: CellsFlat; 
  tableId: string; 
}
