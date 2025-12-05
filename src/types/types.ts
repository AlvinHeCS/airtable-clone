export const filterTypes = [
  "contains",
  "not_contains",
  "eq",
  "gt",
  "lt",
  "empty",
  "not_empty",
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
  "number"
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

export type TableRow = Record<string, Record<string, string | boolean> | string> & { id: string };

export type View = {
  id: string;
  name: string;
  tableId: string;
  filters: Filter[];
  sorts: Sort[];
  showing: boolean[];
  search: string;
  creationDate: Date;
};

export type Augments = {
  bool: boolean;
  num: number;
}

export type Filtered = {
  bool: boolean;
  filterNames: string;
}

export type CellsFlat = (number | string | null)[]; 

export type Cell = {
    id: string;
    colNum: number;
    val: string;
    numVal: number | null
    rowId: string
}

export type Row = { 
  id: string; 
  rowNum: number; 
  cellsFlat: CellsFlat; 
  tableId: string; 
  cells: Cell[];
}

export type RowNoCell = {
  id: string; 
  rowNum: number; 
  cellsFlat: CellsFlat; 
  tableId: string; 
}
