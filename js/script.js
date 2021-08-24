(function () {
  let rows = 28;
  let cols = 28;
  let leftMouseButtonOnlyDown = false;

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
      let color = "rgb(30, 201, 201," + this.greyScaleValue + ")";
      // getCellElem(this.x, this.y).style.opacity = this.greyScaleValue;
      getCellElem(this.x, this.y).style.backgroundColor = color;
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
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        console.log(gameBoard[x][y].greyScaleValue);
      }
    }
  }

  function onMouseOver(e) {
    if (leftMouseButtonOnlyDown) {
      let [x, y] = getXYFromCell(e.target);
      gameBoard[x][y].increaseGreyScale(0.95);
      gameBoard[x][y].neighbors.forEach((n) =>
        gameBoard[n[0]][n[1]].increaseGreyScale(0.2)
      );
    }
  }

  function buildGridInternal() {}

  (function () {
    document.getElementById("start").addEventListener("click", start);
    document.body.onmousedown = setLeftButtonState;
    document.body.onmousemove = setLeftButtonState;
    document.body.onmouseup = setLeftButtonState;

    for (let x = 0; x < cols; x++) {
      gameBoard.push([]);
      const col = document.createElement("div");
      col.id = "col-" + x;
      col.classList.add("col");
      gameBoard_UI.appendChild(col);
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
