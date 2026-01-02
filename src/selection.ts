import { TypedEventTarget } from "@remix-run/interaction";

function isWithinThreshold(
  el: HTMLElement,
  position: { x: number; y: number },
  desiredThreshold: number,
) {
  const bounds = el.getBoundingClientRect();
  // relative positions within the element
  const distanceEnteredX = position.x - bounds.left;
  const distanceEnteredY = position.y - bounds.top;

  // percent of the element that has been entered
  const thresholdEnteredX = (distanceEnteredX / bounds.width) * 100;
  const thresholdEnteredY = (distanceEnteredY / bounds.height) * 100;

  // need to diff to track the other side
  const lesserSideThreshold = 100 - desiredThreshold;

  const xSuccess = thresholdEnteredX >= lesserSideThreshold &&
    thresholdEnteredX <= desiredThreshold;
  const ySuccess = thresholdEnteredY >= lesserSideThreshold &&
    thresholdEnteredY <= desiredThreshold;

  return xSuccess && ySuccess;
}

const possibleDirection = [
  [0, 1], // down
  [0, -1], // up
  [1, 0], // right
  [-1, 0], // left
  [1, 1], // down right
  [1, -1], // up right
  [-1, 1], // down left
  [-1, -1], // up left
];
// only can select items that are adjaceent and not already selected
const isSelectable = (index: number, selected: number[]) => {
  const disiredRow = Math.floor(index / 4);
  const desiredColumn = index % 4;
  const lastSelected = selected[selected.length - 1];

  const lastRow = Math.floor(lastSelected / 4);
  const lastColumn = lastSelected % 4;

  const canMove = possibleDirection.filter(([diffx, diffy]) => {
    const newRow = lastRow + diffy;
    const newColumn = lastColumn + diffx;
    return newRow >= 0 && newRow <= 3 && newColumn >= 0 && newColumn <= 3;
  }).some(([diffx, diffy]) => {
    const nextRow = lastRow + diffy;
    const nextCol = lastColumn + diffx;
    return disiredRow === nextRow && desiredColumn === nextCol;
  });

  return canMove;
};

const getClosestCell = (event: TouchEvent): HTMLElement | null => {
  if (event.touches.length > 1) {
    return null;
  }
  const [touch] = event.touches;
  const hoveredElement =
    document.elementsFromPoint(touch.clientX, touch.clientY)[0];
  if (!hoveredElement || !(hoveredElement instanceof HTMLElement)) {
    return null;
  }
  const cell = hoveredElement.closest("[data-cell]");
  return cell as HTMLElement;
};

export class WordSelecteldEvent extends Event {
  selection: number[];
  constructor(selection: number[]) {
    super("wordSelected");
    this.selection = selection;
  }
}

export class SelectionController extends TypedEventTarget<{ change: Event, wordSelected: WordSelecteldEvent }> {
  touchedCells: number[] = [];

  handleTouchEnd(event: TouchEvent) {
    if(this.touchedCells.length > 2) {
      this.dispatchEvent(new WordSelecteldEvent(this.touchedCells));
    }
    this.dispatchEvent(new Event("change"));
    this.touchedCells = [];
  }

  handleTouchStart(event: TouchEvent) {
    event.preventDefault();
    const cell = getClosestCell(event);
    if (cell instanceof HTMLElement) {
      const cellIndex = cell.dataset!.index;
      if (typeof cellIndex === "string") {
        this.touchedCells.push(+cellIndex);
        this.dispatchEvent(new Event("change"));
      }
    }
  }

  handleTouchMove(event: TouchEvent) {
    // we will handle touches
    event.preventDefault();
    const cell = getClosestCell(event);
    if (cell instanceof HTMLElement) {
      const [touch] = event.touches;
      const enteredEnoughThreshold = isWithinThreshold(cell, {
        x: touch.clientX,
        y: touch.clientY,
      }, 80);
      const cellIndex = cell.dataset!.index ? +cell.dataset!.index : -1;
      if (
        enteredEnoughThreshold &&
        isSelectable(cellIndex, this.touchedCells)
      ) {
        const touchedItems = this.touchedCells;
        // add the new cell selection if it's not selected
        if (
          cellIndex >= 0 && !touchedItems.includes(+cellIndex)
        ) {
          this.touchedCells = [...this.touchedCells, +cellIndex];
          this.dispatchEvent(new Event("change"));
          return;
        }
        // if you've gone backwards we can deselect to allow picking a different letter.
        if (touchedItems[touchedItems.length - 2] === cellIndex) {
          this.touchedCells = touchedItems.slice(0, touchedItems.length - 1);
          this.dispatchEvent(new Event("change"));
        }
      }
    }
  }
}

