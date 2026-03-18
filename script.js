// Available bets per game
const gameBets = {
  "Super Ace": [0.5, 1, 2, 3, 5, 10, 20, 30, 40, 50, 80, 100, 200, 500, 1000],
  "Super Ace Deluxe": [0.5, 1, 2, 3, 5, 10, 20, 30, 40, 50, 80, 100, 200, 500, 1000],
  "Wild Bounty": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500, 800, 1000, 2500, 5000],
  "Wild Ape": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500, 800, 1000, 2500, 5000],
  "Pinata Wins": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500, 800, 1000, 2500, 5000],
  "Wild Bandito": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500, 800, 1000, 2500, 5000],
  "Treasures of Aztec": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500, 800, 1000, 2500, 5000],
  "Lucky Necko": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500, 800, 1000, 2500, 5000],
  "Asgardian Rising": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500, 800, 1000, 2500, 5000],
  "Zombie Outbreak": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500, 800, 1000, 2500, 5000],
};

// ===== DRAG FLOATING WINDOW =====
const dragElement = document.getElementById("floatingWindow");
const dragBar = document.querySelector(".drag-bar");

let offsetX = 0, offsetY = 0, isDragging = false;

dragBar.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - dragElement.offsetLeft;
  offsetY = e.clientY - dragElement.offsetTop;
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    dragElement.style.left = (e.clientX - offsetX) + "px";
    dragElement.style.top = (e.clientY - offsetY) + "px";
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// ===== ORIGINAL CODE BELOW (UNCHANGED) =====

let startingBalance = 0;
let balance = 0;
let targetProfit = 0;
let maxLoss = 0;
let baseBet = 0;
let spinCounter = 0;
let nextBet = 0;
let loseStreak = 0;
let availableBets = [];

let peakBalance = 0;
let isAggressive = false;
let sessionEnded = false;

// MULTI TIMER STORAGE
let historyTimers = [];

let hasShownProfitNotice = false;
let hasShownLossNotice = false;

let totalHits = 0;
let totalMisses = 0;
let totalFreeSpins = 0;

let loseStepLevel = 0;

let betIndex = 0;
let stepUpCount = 0;
let inLock = false;
let missAfterHit = 0;

let gameHistory = [];

document.getElementById("game").addEventListener("change", function () {
  // Reset only gameplay variables, NOT historyTimers
  startingBalance = 0;
  balance = 0;
  targetProfit = 0;
  maxLoss = 0;
  baseBet = 0;
  spinCounter = 0;
  nextBet = 0;
  loseStreak = 0;
  availableBets = [];

  peakBalance = 0;
  isAggressive = false;
  sessionEnded = false;

  hasShownProfitNotice = false;
  hasShownLossNotice = false;

  totalHits = 0;
  totalMisses = 0;
  totalFreeSpins = 0;

  loseStepLevel = 0;

  betIndex = 0;
  stepUpCount = 0;
  inLock = false;
  missAfterHit = 0;

  // Do NOT clear historyTimers here so countdowns continue

  document.getElementById("balanceInput").value = "";
  document.getElementById("targetProfit").value = "";
  document.getElementById("maxLoss").value = "";
  document.getElementById("baseBet").value = "";
  document.getElementById("betAmount").value = "";
  document.getElementById("resultAmount").value = "";
  document.getElementById("freeSpin").checked = false;

  document.getElementById("status").innerText = "Status: Waiting...";
  document.getElementById("currentBalance").innerText = "Balance: 0.00";
  document.getElementById("profitLoss").innerText = "Profit/Loss: 0.00";
  document.getElementById("spinCount").innerText = "Total Spins: 0";
  document.getElementById("nextBet").innerText = "Next Bet: 0.00";

  clearHistory();
  updateSummary();
  renderGameHistory();
});

// SAVE HISTORY + LOSS COUNTDOWN
function saveGameHistory() {
  if (startingBalance === 0) return;

  let gameName = document.getElementById("game").value;
  let profit = balance - startingBalance;
  let isLoss = profit < 0;

  gameHistory.push({
    game: gameName,
    profit: profit,
    result: isLoss ? "LOSS" : "WIN",
    countdown: isLoss ? "WAIT: 10:00" : "WIN"
  });

  let index = gameHistory.length - 1;

  if (isLoss) {
    startCountdown(index);
  }
}

// START COUNTDOWN PER LOSS ROW
function startCountdown(index) {
  let remaining = 600;

  if (historyTimers[index]) clearInterval(historyTimers[index]);

  historyTimers[index] = setInterval(() => {
    remaining--;
    gameHistory[index].countdown = "WAIT: " + formatTime(remaining);
    renderGameHistory();

    if (remaining <= 0) {
      clearInterval(historyTimers[index]);
      gameHistory[index].countdown = "You can play again now because the 10 minutes have finished.";
      renderGameHistory();
    }
  }, 1000);
}

// FORMAT TIME
function formatTime(seconds) {
  let m = Math.floor(seconds / 60);
  let s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ADD NOTE
function addNoteHistory(message) {
  gameHistory.push({
    game: "-",
    profit: 0,
    result: message
  });
  renderGameHistory();
}

// RENDER HISTORY
function renderGameHistory() {
  let table = document.getElementById("gameHistoryTable");
  if (!table) return;

  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  gameHistory.forEach((g, index) => {
    let row = table.insertRow(-1);

    row.insertCell(0).innerText = index + 1;
    row.insertCell(1).innerText = g.game;
    row.insertCell(2).innerText = typeof g.profit === "number" ? g.profit.toFixed(2) : "";
    row.insertCell(3).innerText = g.countdown || g.result;

    if (g.result === "WIN") {
      row.style.backgroundColor = "green";
      row.style.color = "white";
    } else if (g.result === "LOSS") {
      row.style.backgroundColor = "red";
      row.style.color = "white";
    } else {
      row.style.backgroundColor = "black";
      row.style.color = "yellow";
    }
  });
}

// (REMAINING FUNCTIONS UNCHANGED – submitSpin, decideNextBet, checkStop, updateUI, addHistory, etc.)

function startSession() {
  const gameName = document.getElementById("game").value;
  availableBets = gameBets[gameName] || [baseBet];

  startingBalance = Number(document.getElementById("balanceInput").value);
  balance = startingBalance;
  peakBalance = startingBalance;

  targetProfit = Number(document.getElementById("targetProfit").value);
  maxLoss = Number(document.getElementById("maxLoss").value);
  baseBet = Number(document.getElementById("baseBet").value);

  nextBet = getClosestBet(baseBet);
  betIndex = availableBets.indexOf(nextBet);

  spinCounter = 0;
  loseStreak = 0;
  loseStepLevel = 0;
  isAggressive = false;
  sessionEnded = false;

  hasShownProfitNotice = false;
  hasShownLossNotice = false;

  totalHits = 0;
  totalMisses = 0;
  totalFreeSpins = 0;

  stepUpCount = 0;
  inLock = false;
  missAfterHit = 0;

  document.getElementById("status").innerText = "Status: Running...";
  updateUI();
  clearHistory();
  updateSummary();

  injectFreeSpinStyle();
}

function submitSpin() {
  let bet = Number(document.getElementById("betAmount").value);
  let resultInput = document.getElementById("resultAmount").value;
  let result = resultInput === "" ? 0 : Number(resultInput);
  let freeSpin = document.getElementById("freeSpin").checked;

  balance = balance - bet + result;

  if (balance > peakBalance) peakBalance = balance;
  if (bet > 0) spinCounter++;

  if (result === 0) {
    loseStreak++;
    totalMisses++;
    if (loseStreak % 10 === 0) loseStepLevel++;
    if (inLock) missAfterHit++;
  } else {
    loseStreak = 0;
    loseStepLevel = 0;
    totalHits++;
    inLock = true;
    missAfterHit = 0;
  }

  if (freeSpin) totalFreeSpins++;

  decideNextBet(freeSpin, result > 0);
  checkStop();
  updateUI();
  addHistory(bet, result, freeSpin);
  updateSummary();

  document.getElementById("resultAmount").value = "";
  document.getElementById("freeSpin").checked = false;
  document.getElementById("betAmount").value = nextBet.toFixed(2);
}

function decideNextBet(freeSpin, isHit) {
  const baseIndex = availableBets.indexOf(getClosestBet(baseBet));

  let profit = balance - startingBalance;
  let peakProfit = peakBalance - startingBalance;

  if (profit >= 50) isAggressive = true;
  if (isAggressive && profit <= peakProfit * 0.5) isAggressive = false;
  if (balance <= startingBalance) isAggressive = false;

  if (!isHit) {
    if (inLock) {
      if (missAfterHit >= 2) {
        betIndex = baseIndex;
        stepUpCount = 0;
        inLock = false;
        missAfterHit = 0;
      }
    } else {
      if (stepUpCount < 2) {
        betIndex++;
        stepUpCount++;
      } else {
        betIndex = baseIndex;
        stepUpCount = 0;
      }
    }
  }

  betIndex = Math.max(0, Math.min(betIndex, availableBets.length - 1));
  nextBet = availableBets[betIndex];

  if (isAggressive) {
    let aggressiveTarget = Math.max(baseBet * 2, nextBet * 1.5);
    nextBet = getClosestBet(aggressiveTarget);
  }
}

function checkStop() {
  const gameName = document.getElementById("game").value;

  if (balance >= startingBalance + targetProfit) {
    document.getElementById("status").innerText = "🎉 TARGET PROFIT REACHED - STOP";

    if (!sessionEnded) {
      saveGameHistory();
      renderGameHistory();
      sessionEnded = true;
    }

    if (!hasShownProfitNotice) {
      alert("Congratulations! Your target winning has been reached.");
      hasShownProfitNotice = true;
    }

  } else if (balance <= startingBalance - maxLoss) {
    document.getElementById("status").innerText = "⚠️ MAX LOSS - STOP";

    if (!sessionEnded) {
      saveGameHistory();
      renderGameHistory();
      sessionEnded = true;
    }

    if (!hasShownLossNotice) {
      alert(gameName + " is currently down. Please play again after 10 minutes.");
      hasShownLossNotice = true;

      if (lossTimer) clearTimeout(lossTimer);
      if (countdownInterval) clearInterval(countdownInterval);

      remainingTime = 600;

      countdownInterval = setInterval(() => {
        remainingTime--;
        document.getElementById("status").innerText =
          "⏳ WAIT: " + formatTime(remainingTime);

        if (remainingTime <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      lossTimer = setTimeout(() => {
        addNoteHistory("You can play again now because the 10 minutes have finished.");
      }, 600000);
    }

  } else {
    document.getElementById("status").innerText = "Running...";
  }
}

// OTHER FUNCTIONS (UNCHANGED)
function getClosestBet(target) {
  let validBets = availableBets.filter(b => b <= balance);
  if (validBets.length === 0) return balance;
  return validBets.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

function updateUI() {
  document.getElementById("currentBalance").innerText = "Balance: " + balance.toFixed(2);
  document.getElementById("profitLoss").innerText = "Profit/Loss: " + (balance - startingBalance).toFixed(2);
  document.getElementById("spinCount").innerText = "Total Spins: " + spinCounter;
  document.getElementById("nextBet").innerText = "Next Bet: " + nextBet.toFixed(2);

  const betInput = document.getElementById("betAmount");
  if (betInput.value === "") {
    betInput.value = nextBet.toFixed(2);
  }
}

function updateSummary() {
  document.getElementById("summary").innerText =
    `Total Spins: ${spinCounter} | Hits: ${totalHits} | Misses: ${totalMisses} | Free Spins: ${totalFreeSpins}`;
}

function addHistory(bet, result, freeSpin) {
  let table = document.getElementById("historyTable");
  let row = table.insertRow(-1);

  row.insertCell(0).innerText = spinCounter;
  row.insertCell(1).innerText = bet.toFixed(2);
  row.insertCell(2).innerText = result.toFixed(2);
  row.insertCell(3).innerText = freeSpin ? "Yes" : "No";
  row.insertCell(4).innerText = balance.toFixed(2);

  if (result > 0) {
    row.style.backgroundColor = "green";
    row.style.color = "white";
  }

  if (freeSpin) {
    row.classList.add("free-spin-row");
  }
}

function clearHistory() {
  let table = document.getElementById("historyTable");
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
  updateSummary();
}

function injectFreeSpinStyle() {
  const style = document.createElement("style");
  style.innerHTML = `
    .free-spin-row {
      animation: fsColor 1s infinite;
      color: white;
    }

    @keyframes fsColor {
      0% { background-color: green; }
      33% { background-color: yellow; color: black; }
      66% { background-color: blue; }
      100% { background-color: green; }
    }
  `;
  document.head.appendChild(style);
}
