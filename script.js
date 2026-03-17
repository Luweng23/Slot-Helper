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

let startingBalance = 0;
let balance = 0;
let targetProfit = 0;
let maxLoss = 0;
let baseBet = 0;
let spinCounter = 0;
let nextBet = 0;
let loseStreak = 0;
let availableBets = [];

// NEW VARIABLES
let peakBalance = 0;
let isAggressive = false;

// NEW VARIABLES FOR PROMPT CONTROL
let hasShownProfitNotice = false;
let hasShownLossNotice = false;

// NEW FOR SUMMARY
let totalHits = 0;
let totalMisses = 0;

// ✅ NEW: FREE SPIN COUNT
let totalFreeSpins = 0;

// NEW: STEP LEVEL BASED SA 10 LOSE
let loseStepLevel = 0;

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
  spinCounter = 0;
  loseStreak = 0;
  loseStepLevel = 0;
  isAggressive = false;

  hasShownProfitNotice = false;
  hasShownLossNotice = false;

  totalHits = 0;
  totalMisses = 0;
  totalFreeSpins = 0;

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

  if (balance > peakBalance) {
    peakBalance = balance;
  }

  if (bet > 0) spinCounter++;

  if (result === 0) {
    loseStreak++;
    totalMisses++;

    if (loseStreak % 10 === 0) {
      loseStepLevel++;
    }

  } else {
    loseStreak = 0;
    loseStepLevel = 0;
    totalHits++;
  }

  // ✅ COUNT FREE SPIN
  if (freeSpin) {
    totalFreeSpins++;
  }

  decideNextBet(freeSpin);
  checkStop();
  updateUI();
  addHistory(bet, result, freeSpin);
  updateSummary();

  const resultBox = document.getElementById("resultAmount");
  resultBox.value = "";
  resultBox.focus();

  document.getElementById("freeSpin").checked = false;

  document.getElementById("betAmount").value = nextBet.toFixed(2)
}

function getClosestBet(target) {
  let validBets = availableBets.filter(b => b <= balance);
  if (validBets.length === 0) return balance;
  let closest = validBets.reduce((prev, curr) => {
    return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
  });
  return closest;
}

function decideNextBet(freeSpin) {
  let targetBet = baseBet;

  let profit = balance - startingBalance;
  let peakProfit = peakBalance - startingBalance;

  if (profit >= 50) {
    isAggressive = true;
  }

  if (isAggressive && profit <= peakProfit * 0.5) {
    isAggressive = false;
  }

  if (balance <= startingBalance) {
    isAggressive = false;
  }

  if (loseStepLevel > 0) {
    targetBet = baseBet * (1 + loseStepLevel);
  }
  else if (balance <= startingBalance) {
    targetBet = baseBet;
  } 
  else if (freeSpin && balance > startingBalance) {
    targetBet = baseBet;
  } 
  else if (isAggressive) {
    targetBet = Math.max(baseBet * 2, nextBet * 1.5);
  } 
  else {
    targetBet = baseBet;
  }

  if (balance <= startingBalance - maxLoss + baseBet) {
    targetBet = baseBet;
  }
  if (balance >= startingBalance + targetProfit - baseBet) {
    targetBet = baseBet;
  }

  nextBet = getClosestBet(targetBet);
}

function checkStop() {
  const gameName = document.getElementById("game").value;

  if (balance >= startingBalance + targetProfit) {
    document.getElementById("status").innerText = "🎉 TARGET PROFIT REACHED - STOP";

    if (!hasShownProfitNotice) {
      alert("Congratulations! Your target winning has been reached.");
      hasShownProfitNotice = true;
    }

  } else if (balance <= startingBalance - maxLoss) {
    document.getElementById("status").innerText = "⚠️ MAX LOSS - STOP";

    if (!hasShownLossNotice) {
      alert(gameName + " is currently down. Please play again after 10 minutes.");
      hasShownLossNotice = true;
    }

  } else {
    document.getElementById("status").innerText = "Running...";
  }
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

// UPDATED SUMMARY
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