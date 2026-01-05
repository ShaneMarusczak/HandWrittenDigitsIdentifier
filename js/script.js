(function () {
  // Constants
  const GRID_SIZE = 28;
  const MAX_SHIFT_ITERATIONS = GRID_SIZE / 2;
  const MAX_GREY_SCALE = 1;
  const NEIGHBOR_INTENSITY = 0.7;
  const CONFIDENCE_HIGH = 0.9;
  const CONFIDENCE_LOW = 0.7;
  const AMBIGUOUS_THRESHOLD = 0.5;

  const BASE_URL = "https://shnpln252.pythonanywhere.com/digits";

  // State
  let leftMouseButtonOnlyDown = false;
  const gameBoard = [];

  // Cached DOM elements
  const gameBoardUI = document.getElementById("gameBoard_UI");
  const loadingAnimation = document.getElementById("loadingAnimation");
  const guessElement = document.getElementById("guess");
  const guessConfidenceElement = document.getElementById("guessConfidence");
  const startButton = document.getElementById("start");
  const clearButton = document.getElementById("clear");

  // Cell class
  class Cell {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.greyScaleValue = 0;
      this.neighbors = [];
    }

    increaseGreyScale(amount) {
      this.greyScaleValue = Math.min(
        this.greyScaleValue + amount,
        MAX_GREY_SCALE
      );
      this.setBackGround();
    }

    setBackGround() {
      getCellElem(this.x, this.y).style.backgroundColor =
        `rgb(30, 30, 30, ${this.greyScaleValue})`;
    }

    resetBackGround() {
      getCellElem(this.x, this.y).style.backgroundColor = "white";
    }

    setNeighbors() {
      const dirs = [-1, 0, 1];
      for (const dirx of dirs) {
        for (const diry of dirs) {
          if (dirx === 0 && diry === 0) continue;
          if (validPosition(this.x + dirx, this.y + diry)) {
            this.neighbors.push([this.x + dirx, this.y + diry]);
          }
        }
      }
    }
  }

  // DOM helpers
  function getCellId(x, y) {
    return `cell-${x}-${y}`;
  }

  function getXYFromCell(cell) {
    const parts = cell.id.split("-");
    return [parseInt(parts[1], 10), parseInt(parts[2], 10)];
  }

  function getCellElem(x, y) {
    return document.getElementById(getCellId(x, y));
  }

  function validPosition(x, y) {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
  }

  function clearSelection() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }
  }

  function showLoading() {
    loadingAnimation.classList.remove("hidden");
  }

  function hideLoading() {
    loadingAnimation.classList.add("hidden");
  }

  // Grid data helpers
  function getLitCells() {
    const litCells = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (gameBoard[x][y].greyScaleValue > 0) {
          litCells.push(gameBoard[x][y]);
        }
      }
    }
    return litCells;
  }

  function collectGridValues() {
    const values = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        values.push([gameBoard[y][x].greyScaleValue]);
      }
    }
    return values;
  }

  // Movement functions (unified)
  function move(axis, direction) {
    const litCells = getLitCells();
    const cellsToProcess = direction === -1 ? litCells : litCells.slice().reverse();

    cellsToProcess.forEach((cell) => {
      const newX = axis === "x" ? cell.x + direction : cell.x;
      const newY = axis === "y" ? cell.y + direction : cell.y;

      if (validPosition(newX, newY)) {
        gameBoard[newX][newY].greyScaleValue = cell.greyScaleValue;
        gameBoard[newX][newY].setBackGround();
      }
      cell.greyScaleValue = 0;
      cell.resetBackGround();
    });
  }

  // Distance calculation for centering
  function calculateEdgeDistance(axis) {
    let startDistance = 0;
    let endDistance = 0;

    if (axis === "x") {
      // Horizontal: find distance from left and right edges
      for (let x = 0; x < GRID_SIZE; x++) {
        if (gameBoard[x].some((cell) => cell.greyScaleValue > 0)) {
          startDistance = x;
          break;
        }
      }
      for (let x = GRID_SIZE - 1; x >= 0; x--) {
        if (gameBoard[x].some((cell) => cell.greyScaleValue > 0)) {
          endDistance = GRID_SIZE - 1 - x;
          break;
        }
      }
    } else {
      // Vertical: find distance from top and bottom edges
      for (let y = 0; y < GRID_SIZE; y++) {
        let found = false;
        for (let x = 0; x < GRID_SIZE; x++) {
          if (gameBoard[x][y].greyScaleValue > 0) {
            startDistance = y;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      for (let y = GRID_SIZE - 1; y >= 0; y--) {
        let found = false;
        for (let x = GRID_SIZE - 1; x >= 0; x--) {
          if (gameBoard[x][y].greyScaleValue > 0) {
            endDistance = GRID_SIZE - 1 - y;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    return { startDistance, endDistance };
  }

  function shiftToCenter(axis) {
    const { startDistance, endDistance } = calculateEdgeDistance(axis);

    if (startDistance === endDistance) return;

    const direction = startDistance > endDistance ? -1 : 1;
    move(axis, direction);
  }

  function centerDigit() {
    for (let i = 0; i < MAX_SHIFT_ITERATIONS; i++) {
      shiftToCenter("x");
    }
    for (let i = 0; i < MAX_SHIFT_ITERATIONS; i++) {
      shiftToCenter("y");
    }
  }

  // Prediction result helpers
  function findTopTwo(predictions) {
    let max = { value: 0, index: 0 };
    let second = { value: 0, index: 0 };

    predictions.forEach((value, index) => {
      if (value > max.value) {
        second = { ...max };
        max = { value, index };
      } else if (value > second.value) {
        second = { value, index };
      }
    });

    return { max, second };
  }

  function displayPrediction(max, second) {
    if (max.value < CONFIDENCE_LOW) {
      guessElement.textContent = "";
      guessConfidenceElement.textContent = "Confidence too low to guess";
      return;
    }

    if (second.value > AMBIGUOUS_THRESHOLD) {
      guessElement.textContent = `${max.index} or ${second.index}`;
    } else {
      guessElement.textContent = max.index.toString();
    }

    if (max.value > CONFIDENCE_HIGH) {
      guessConfidenceElement.textContent = "High Confidence (>90%)";
    } else {
      guessConfidenceElement.textContent = "Low Confidence (70-90%)";
    }
  }

  function showGuess(predictions) {
    hideLoading();
    const { max, second } = findTopTwo(predictions);
    displayPrediction(max, second);
  }

  function showError() {
    hideLoading();
    guessElement.textContent = "";
    guessConfidenceElement.textContent = "Error: Could not reach server";
  }

  // API functions
  function fetchPrediction(values) {
    const url = `${BASE_URL}?digits=${JSON.stringify(values)}`;

    return fetch(url, { method: "get", mode: "cors" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.json();
      });
  }

  function wakeUpServer() {
    const emptyGrid = Array(GRID_SIZE * GRID_SIZE).fill([0]);

    fetchPrediction(emptyGrid)
      .then(() => console.log("Server is awake"))
      .catch(() => console.log("Server wake-up failed"));
  }

  // Main actions
  function evaluate() {
    clearSelection();
    showLoading();
    centerDigit();

    const values = collectGridValues();

    fetchPrediction(values)
      .then(showGuess)
      .catch(showError);
  }

  function clear() {
    clearSelection();
    hideLoading();
    guessElement.textContent = "";
    guessConfidenceElement.textContent = "";

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        gameBoard[x][y].greyScaleValue = 0;
        gameBoard[x][y].resetBackGround();
      }
    }
  }

  // Event handlers
  function setLeftButtonState(e) {
    leftMouseButtonOnlyDown =
      e.buttons === undefined ? e.which === 1 : e.buttons === 1;
  }

  function onMouseOver(e) {
    if (!leftMouseButtonOnlyDown) return;

    const [x, y] = getXYFromCell(e.target);
    gameBoard[x][y].increaseGreyScale(MAX_GREY_SCALE);

    gameBoard[x][y].neighbors.forEach(([nx, ny]) => {
      gameBoard[nx][ny].increaseGreyScale(NEIGHBOR_INTENSITY);
    });
  }

  function preventDrag() {
    return false;
  }

  // Initialization
  function createGrid() {
    for (let x = 0; x < GRID_SIZE; x++) {
      gameBoard.push([]);

      const col = document.createElement("div");
      col.id = `col-${x}`;
      col.classList.add("col");
      col.draggable = false;
      col.ondragstart = preventDrag;
      gameBoardUI.appendChild(col);

      for (let y = 0; y < GRID_SIZE; y++) {
        const newCell = new Cell(x, y);
        gameBoard[x].push(newCell);
        newCell.setNeighbors();

        const cellElement = document.createElement("div");
        cellElement.id = getCellId(x, y);
        cellElement.classList.add("cell");
        cellElement.draggable = false;
        cellElement.ondragstart = preventDrag;
        cellElement.addEventListener("mouseover", onMouseOver);
        col.appendChild(cellElement);
      }
    }
  }

  function setupEventListeners() {
    startButton.addEventListener("click", evaluate);
    clearButton.addEventListener("click", clear);

    document.body.onmousedown = setLeftButtonState;
    document.body.onmousemove = setLeftButtonState;
    document.body.onmouseup = setLeftButtonState;
    document.body.onload = wakeUpServer;

    gameBoardUI.draggable = false;
    gameBoardUI.ondragstart = preventDrag;
  }

  function init() {
    createGrid();
    setupEventListeners();
  }

  init();
})();
