(function bg(window, document, undefined) {
  "use strict";

  var desk = document.getElementById("backgammon"),
      points = [].slice.call(desk.querySelectorAll(".point")).sort(function(a, b) {
          return a.dataset.id - b.dataset.id;
      }),
      checkers = [].slice.call(document.getElementsByClassName("checker")),
      randNums = [],
      isWhiteMoves = true,
      draggedEle = null,
      btnStart = document.getElementById("btnStart"),
      btnRoll = document.getElementById("btnRoll"),
      movesLeft = document.getElementById("movesLeft"),
      turnOf = document.getElementById("turnOf"),
      jail = document.getElementById("jail"),
      btnChangeColors = document.getElementById("btnChangeColors"),
      colorPickerModal = document.getElementById("colorPickerModal"),
      colorChoices = [].slice.call(colorPickerModal.querySelectorAll(".color-choice")),
      closeModal = document.getElementById("closeModal");

  // Event listeners
  btnStart.addEventListener("click", startTimer);
  btnRoll.addEventListener("click", roll);
  btnChangeColors.addEventListener("click", openColorPicker);
  closeModal.addEventListener("click", closeColorPicker);

  colorChoices.forEach(function(button) {
    button.addEventListener("click", function() {
      var selectedColor = this.dataset.color;
      changeCheckerColors(selectedColor);
      closeColorPicker();
    });
  });

  function openColorPicker() {
    colorPickerModal.classList.remove("hidden");
  }

  function closeColorPicker() {
    colorPickerModal.classList.add("hidden");
  }

  function changeCheckerColors(color) {
    checkers.forEach(function(checker) {
      if (checker.dataset.type === "black" || checker.dataset.type === "white") {
        checker.style.backgroundColor = color; // Change color based on selected color
      }
    });
  }

  function toggleColors() {
    points.forEach(function(point) {
        point.classList.toggle('alternate');
    });
  }

  function roll(e) {
    if (typeof roll.id === "undefined") {
      roll.id = 0;
      points.forEach(function(ele) {
        ele.addEventListener("dragover", handleDragOver);
        ele.addEventListener("dragenter", handleDragEnter);
        ele.addEventListener("dragleave", handleDragLeave);
        ele.addEventListener("drop", handleDrop);
      });

      checkers.forEach(function(ele) {
        ele.draggable = true;
        ele.addEventListener("dragstart", handleDragStart);
        ele.addEventListener("dragend", handleDragEnd);
      });
    }

    if (roll.id !== 0) {
      isWhiteMoves = !isWhiteMoves;
    }

    toggleDraggability(isWhiteMoves);
    this.disabled = true;

    rollDice();
    showNumbers();
    roll.id++;

    if (!hasAvailableMoves(isWhiteMoves)) {
      randNums.length = 0;
      this.disabled = false;
    }
  }

  function hasAvailableMoves(type) {
    return points.some(function(p) {
      var t = type ? "white" : "black",
          e = p.firstElementChild,
          from = +p.dataset.id,
          to1 = 0,
          to2 = 0;

      if (type) {
        to1 = from + randNums[0];
        to2 = from + randNums[1];
      } else {
        to1 = from - randNums[0];
        to2 = from - randNums[1];
      }

      if (e != null && e.dataset.type === t &&
          ((to1 > 0 && to1 < 25) || (to2 > 0 && to2 < 25))) {
        var target = getPoint(points, to1);
        if (target &&
            (target.childElementCount === 0 ||
            target.childElementCount === 1 ||
            (target.firstElementChild &&
                target.firstElementChild.dataset.type === t))) {
          return true;
        }

        target = getPoint(points, to2);
        if (target &&
            (target.childElementCount === 0 ||
            target.childElementCount === 1 ||
            (target.firstElementChild &&
                target.firstElementChild.dataset.type === t))) {
          return true;
        }
      }
      return false;
    });
  }

  function start() {
    getStarter();
    showNumbers(true);
  }

  function getPoint(points, id) {
    return points.find(function(v) {
      return +v.dataset.id === id;
    });
  }

  function showNumbers(isStart) {
    movesLeft.firstElementChild.innerHTML = randNums[0] || '';
    movesLeft.lastElementChild.innerHTML = randNums[1] || '';
    if (isStart) {
      turnOf.innerHTML = isWhiteMoves ? "White starts!" : "Black starts!";
      randNums.length = 0;
    } else if (roll.id > 0) {
      turnOf.innerHTML = isWhiteMoves ? "White moves!" : "Black moves!";
    }
  }

  function startTimer(e) {
    if (typeof startTimer.i === "undefined") {
      startTimer.i = 5;
    }

    btnStart.textContent = startTimer.i--;

    if (startTimer.i < 0) {
      [].forEach.call(document.querySelectorAll(".hidden"), function(ele) {
        ele.classList.remove("hidden");
      });
      btnStart.classList.add("hidden");
      start();
    } else {
      setTimeout(startTimer, 1000);
    }
  }

  function validate(type, from, to, n) {
    return ((isWhiteMoves && from > to && (from - to) === n) ||
        (!isWhiteMoves && from < to && (to - from) === n));
  }

  function toggleDraggability(isWhite) {
    checkers.forEach(function(c) {
      if ((c.dataset.type === "white" && isWhite) ||
          (c.dataset.type === "black" && !isWhite)) {
        c.removeEventListener("dragstart", handleDragStartDisabler);
        c.addEventListener("dragstart", handleDragStart);
      } else {
        c.addEventListener("dragstart", handleDragStartDisabler);
        c.removeEventListener("dragstart", handleDragStart);
      }
    });
  }

  function handleDragStartDisabler(e) {
    e.preventDefault();
    return false;
  }

  function handleDragEnd(e) {
    this.style.opacity = 1;
    points.forEach(function(ele) {
      if (ele.classList.contains("over")) {
        ele.classList.remove("over");
      }
    });
  }

  function handleDrop(e) {
    e.stopPropagation();
    var parent = draggedEle.parentNode,
        i;

    if (jail.childElementCount > 0 && draggedEle.parentNode != jail && jail.querySelector('[data-type="' + draggedEle.dataset.type + '"]')) {
      return false;
    }

    if (parent != this &&
        ((draggedEle.dataset.type === "black" &&
            +parent.dataset.id > +this.dataset.id) ||
        (draggedEle.dataset.type === "white" &&
            +parent.dataset.id < +this.dataset.id))) {
      i = randNums.indexOf(Math.abs(parent.dataset.id - this.dataset.id));
      if (i > -1) {
        if (this.querySelector('[data-type="' + draggedEle.dataset.type + '"]') != null || this.childElementCount === 0) {
          pickNum(i);
          this.appendChild(draggedEle);
        } else if (this.childElementCount === 1) {
          jail.appendChild(this.firstElementChild);
          pickNum(i);
          this.appendChild(draggedEle);
        }
      }
    } else if (parent === jail) {
      i = randNums.indexOf(this.dataset.id < 7 ? +this.dataset.id : 6 - (this.dataset.id % 6) + 1);
      if (this.dataset.home !== draggedEle.dataset.type && i > -1) {
        if (this.querySelector('[data-type="' + draggedEle.dataset.type + '"]') != null || this.childElementCount === 0) {
          pickNum(i);
          this.appendChild(draggedEle);
        } else if (this.childElementCount === 1) {
          jail.appendChild(this.firstElementChild);
          pickNum(i);
          this.appendChild(draggedEle);
        }
      }
    }

    if (randNums.length === 0) {
      btnRoll.disabled = false;
    }

    return false;
  }

  function handleDragLeave(e) {
    if (this.classList.contains("over")) {
      this.classList.remove("over");
    }
  }

  function handleDragEnter(e) {
    this.classList.add("over");
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    return false;
  }

  function handleDragStart(e) {
    this.style.opacity = "0.4";
    draggedEle = this;
  }

  function getStarter() {
    var toss = {
      white: getRandom(),
      black: getRandom()
    };

    if (toss.white === toss.black) {
      getStarter();
    }

    if (toss.white > toss.black) {
      isWhiteMoves = true;
    } else {
      isWhiteMoves = false;
    }
  }

  function rollDice() {
    randNums.length = 0;

    for (var i = 0; i < 2; i++) {
      randNums.push(getRandom());
    }

    randNums.sort(function(a, b) {
      return a - b;
    });
  }

  function pickNum(i) {
    randNums.splice(i, 1);
  }

  function getRandom() {
    return Math.ceil(Math.random() * 6);
  }
})(window, document);
