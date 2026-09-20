export interface RowLabel {
  screenRow: number;
  knittingRow: number;
}

export interface ColLabel {
  screenCol: number;
  knittingCol: number;
}

export function knittingRow(screenRow: number, rows: number): number {
  return rows - screenRow;
}

export function knittingCol(screenCol: number, cols: number): number {
  return cols - screenCol;
}

export function shouldLabelRow(knittingRow: number, rows: number): boolean {
  return (
    knittingRow === 1 ||
    knittingRow === rows ||
    knittingRow % 2 === 1
  );
}

export function shouldLabelCol(knittingCol: number, cols: number): boolean {
  return (
    knittingCol === 1 ||
    knittingCol === cols ||
    knittingCol % 5 === 0
  );
}

export function visibleRowLabels(rows: number): RowLabel[] {
  const labels: RowLabel[] = [];
  for (let screenRow = 0; screenRow < rows; screenRow++) {
    const kRow = knittingRow(screenRow, rows);
    if (shouldLabelRow(kRow, rows)) {
      labels.push({ screenRow, knittingRow: kRow });
    }
  }
  return labels;
}

export function visibleColLabels(cols: number): ColLabel[] {
  const labels: ColLabel[] = [];
  for (let screenCol = 0; screenCol < cols; screenCol++) {
    const kCol = knittingCol(screenCol, cols);
    if (shouldLabelCol(kCol, cols)) {
      labels.push({ screenCol, knittingCol: kCol });
    }
  }
  return labels;
}
