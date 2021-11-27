(function () {
  let rows = 28;
  let cols = 28;
  let leftMouseButtonOnlyDown = false;

  const baseURL = "https://shnpln252.pythonanywhere.com/digits";

  // const baseURL = "http://127.0.0.1:5000/digits";

  const gameBoard = [];

  const gameBoard_UI = document.getElementById("gameBoard_UI");

  class Cell {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.greyScaleValue = 0;
      this.neighbors = [];
    }

    increaseGreyScale(amount) {
      this.greyScaleValue += amount;
      if (this.greyScaleValue > 1) {
        this.greyScaleValue = 1;
      }
      this.setBackGround();
    }

    setBackGround() {
      let color = "rgb(30, 30, 30," + this.greyScaleValue + ")";
      getCellElem(this.x, this.y).style.backgroundColor = color;
    }

    resetBackGround() {
      getCellElem(this.x, this.y).style.backgroundColor = "white";
    }

    setNeighbors() {
      const dirs = [-1, 0, 1];
      for (let dirx of dirs) {
        for (let diry of dirs) {
          if (validPosition(this.x + dirx, this.y + diry)) {
            if (dirx === 0 && diry === 0) {
              continue;
            }
            this.neighbors.push([this.x + dirx, this.y + diry]);
          }
        }
      }
    }
  }

  function setLeftButtonState(e) {
    leftMouseButtonOnlyDown =
      e.buttons === undefined ? e.which === 1 : e.buttons === 1;
  }

  function getCellId(x, y) {
    return "cell-" + x + "-" + y;
  }

  function getXYFromCell(cell) {
    return [cell.id.split("-")[1], cell.id.split("-")[2]];
  }

  function getCellElem(x, y) {
    return document.getElementById(getCellId(x, y));
  }

  function validPosition(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows;
  }

  function start() {
    document.getElementById("loadingAnimation").classList.remove("hidden");
    for (let i = 0; i < 14; i++) {
      shiftValueHor();
    }
    for (let i = 0; i < 14; i++) {
      shiftValueVer();
    }
    const values = [];
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        values.push([gameBoard[y][x].greyScaleValue]);
      }
    }
    const url = baseURL + "?digits=" + JSON.stringify(values);

    fetch(url, { method: "get", mode: "cors" })
      .then((r) => r.json())
      .then(showGuess);
  }

  function shiftValueVer() {
    let topDistance, botDistance;
    let topFound = false;
    let botFound = false;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (gameBoard[y][x].greyScaleValue > 0) {
          topDistance = x;
          topFound = true;
          break;
        }
      }
      if (topFound) {
        break;
      }
    }
    for (let x = cols - 1; x >= 0; x--) {
      for (let y = rows - 1; y >= 0; y--) {
        if (gameBoard[y][x].greyScaleValue > 0) {
          botDistance = rows - x;
          botFound = true;
          break;
        }
      }
      if (botFound) {
        break;
      }
    }

    if (topDistance === botDistance) {
      return;
    }
    if (topDistance > botDistance) {
      movey(-1);
    }
    if (topDistance < botDistance) {
      movey(1);
    }
  }

  function shiftValueHor() {
    let leftDistance, rightDistance;
    for (let x = 0; x < cols; x++) {
      if (gameBoard[x].some((cell) => cell.greyScaleValue > 0)) {
        leftDistance = x;
        break;
      }
    }
    for (let x = cols - 1; x >= 0; x--) {
      if (gameBoard[x].some((cell) => cell.greyScaleValue > 0)) {
        rightDistance = cols - x;
        break;
      }
    }
    if (leftDistance === rightDistance) {
      return;
    }
    if (leftDistance > rightDistance) {
      movex(-1);
    }
    if (leftDistance < rightDistance) {
      movex(1);
    }
  }

  function getLitCells() {
    let litCells = [];
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (gameBoard[x][y].greyScaleValue > 0) {
          litCells.push(gameBoard[x][y]);
        }
      }
    }
    return litCells;
  }

  function movex(dirx) {
    const litCells = getLitCells();
    const len = litCells.length;
    if (dirx === -1) {
      litCells.forEach((cell) => {
        if (validPosition(cell.x + dirx, cell.y)) {
          gameBoard[cell.x + dirx][cell.y].greyScaleValue = cell.greyScaleValue;
          gameBoard[cell.x + dirx][cell.y].setBackGround();
        }
        cell.greyScaleValue = 0;
        cell.resetBackGround();
      });
    } else {
      litCells
        .slice()
        .reverse()
        .forEach((cell) => {
          if (validPosition(cell.x + dirx, cell.y)) {
            gameBoard[cell.x + dirx][cell.y].greyScaleValue =
              cell.greyScaleValue;
            gameBoard[cell.x + dirx][cell.y].setBackGround();
          }
          cell.greyScaleValue = 0;
          cell.resetBackGround();
        });
    }
  }

  function movey(diry) {
    const litCells = getLitCells();
    const len = litCells.length;
    if (diry === -1) {
      litCells.forEach((cell) => {
        if (validPosition(cell.x, cell.y + diry)) {
          gameBoard[cell.x][cell.y + diry].greyScaleValue = cell.greyScaleValue;
          gameBoard[cell.x][cell.y + diry].setBackGround();
        }
        cell.greyScaleValue = 0;
        cell.resetBackGround();
      });
    } else {
      litCells
        .slice()
        .reverse()
        .forEach((cell) => {
          if (validPosition(cell.x, cell.y + diry)) {
            gameBoard[cell.x][cell.y + diry].greyScaleValue =
              cell.greyScaleValue;
            gameBoard[cell.x][cell.y + diry].setBackGround();
          }
          cell.greyScaleValue = 0;
          cell.resetBackGround();
        });
    }
  }

  function showGuess(g) {
    let max = [0, 0];
    g.forEach((item, i) => {
      if (item > max[0]) {
        max[0] = item;
        max[1] = i;
      }
    });
    let secondHighest = [0, 0];
    g.forEach((item, i) => {
      if (item > secondHighest[0] && item !== max[0]) {
        secondHighest[0] = item;
        secondHighest[1] = i;
      }
    });
    document.getElementById("loadingAnimation").classList.add("hidden");
    if (max[0] * 100 < 70) {
      document.getElementById("guess").textContent = "";
      document.getElementById("guessConfidence").textContent =
        "Confidence too low to guess";
    } else {
      if (max[0] * 100 > 90) {
        document.getElementById("guess").textContent = max[1];
        document.getElementById("guessConfidence").textContent =
          "High Confidence (>90%)";
      } else {
        document.getElementById("guess").textContent = max[1];
        document.getElementById("guessConfidence").textContent =
          "Low Confidence (70-90%)";
      }
      if (secondHighest[0] * 100 > 50) {
        document.getElementById("guess").textContent =
          max[1] + " or " + secondHighest[1];
      }
    }
  }

  function onMouseOver(e) {
    if (leftMouseButtonOnlyDown) {
      let [x, y] = getXYFromCell(e.target);
      gameBoard[x][y].increaseGreyScale(1);
      gameBoard[x][y].neighbors.forEach((n) => {
        gameBoard[n[0]][n[1]].increaseGreyScale(0.7);
      });
    }
  }

  function clear() {
    document.getElementById("guess").textContent = "";
    document.getElementById("guessConfidence").textContent = "";
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        gameBoard[y][x].greyScaleValue = 0;
        getCellElem(x, y).style.backgroundColor = "white";
      }
    }
  }

  (function () {
    document.getElementById("start").addEventListener("click", start);
    document.getElementById("clear").addEventListener("click", clear);

    document.body.onmousedown = setLeftButtonState;
    document.body.onmousemove = setLeftButtonState;
    document.body.onmouseup = setLeftButtonState;

    for (let x = 0; x < cols; x++) {
      gameBoard.push([]);
      const col = document.createElement("div");
      col.id = "col-" + x;
      col.classList.add("col");
      gameBoard_UI.appendChild(col);
      col.draggable = false;
      col.ondragstart = function () {
        return false;
      };
      for (let y = 0; y < rows; y++) {
        const newCell = new Cell(x, y);
        gameBoard[x].push(newCell);
        newCell.setNeighbors();
        const cell = document.createElement("div");
        cell.id = getCellId(x, y);
        cell.classList.add("cell");
        col.appendChild(cell);
        cell.addEventListener("mouseover", onMouseOver);
      }
    }
  })();
})();
