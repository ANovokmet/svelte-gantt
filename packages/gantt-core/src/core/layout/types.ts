export type RowPosition = {
  y: number;
  height: number;
}

export type TaskPosition = {
  height: number;
  top: number;
}

export type Positions = {
  rowPositions: Record<PropertyKey, RowPosition>,
  taskPositions: Record<PropertyKey, TaskPosition>,
}
