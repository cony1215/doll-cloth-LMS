// === 針法模式定義 ===
const stitchModes = {
  "平針縫": {
    name: "平針縫",
    validate: validateRunningStitch,
    goalCount: 5
  },
  "回針縫": {
    name: "回針縫",
    validate: validateBackStitch,
    goalCount: 10
  },
  "藏針縫": {
    name: "藏針縫",
    validate: validateHiddenStitch,
    goalCount: 10
  }
};

// === 當前模式 ===
let selectedMode = localStorage.getItem('stitchMode') || "平針縫";
let currentStitchMode = stitchModes[selectedMode];

// === 初始狀態 ===
let currentHole = null;
let currentDirection = null;
let directionPopup = null;
let stitchHistory = [];

document.addEventListener("DOMContentLoaded", () => {
  const title = document.getElementById("stitchTitle");
  if (title) {
    title.textContent = "目標：" + currentStitchMode.name;
  }
});

const holes = document.querySelectorAll('.hole');

holes.forEach(hole => {
  hole.addEventListener('click', (event) => {
    showDirectionOptions(event.target);
  });
});

function showDirectionOptions(target) {
  if (directionPopup) directionPopup.remove();

  directionPopup = document.createElement('div');
  directionPopup.className = 'direction-popup';
  directionPopup.innerHTML = `
    <button onclick="handleStitch('${target.dataset.pos}', '前')">前</button>
    <button onclick="handleStitch('${target.dataset.pos}', '後')">後</button>
  `;

  document.body.appendChild(directionPopup);

  const rect = target.getBoundingClientRect();
  directionPopup.style.position = 'absolute';
  directionPopup.style.left = `${rect.right + 10}px`;
  directionPopup.style.top = `${rect.top}px`;
}

function handleStitch(pos, direction) {
  const newHole = [...holes].find(h => h.dataset.pos === pos);

  if (currentHole && newHole === currentHole) {
    alert("不能選擇同一個洞！");
    removePopup();
    return;
  }

  if (currentDirection && currentDirection === direction) {
    alert("這一針的方向需與上一針相反！");
    removePopup();
    return;
  }

  // === 針法規則驗證 ===
	if (stitchHistory.length > 0 && !currentStitchMode.validate(pos)) {
	  alert("❌ 不符合「" + currentStitchMode.name + "」規則！");
	  removePopup();
	  return;
	}

  newHole.classList.add('selected');

  if (currentHole) {
    drawLineBetween(currentHole, newHole, direction);
    addLog(`✅ 縫線：${currentHole.dataset.pos}（從${currentDirection}）→ ${pos}（從${direction}）`);
  } else {
    addLog(`🔸 起點：${pos}（從${direction}）`);
  }

  currentHole = newHole;
  currentDirection = direction;
  stitchHistory.push(pos);

  removePopup();
  checkStitchCompletion();
}

function removePopup() {
  if (directionPopup) {
    directionPopup.remove();
    directionPopup = null;
  }
}

function drawLineBetween(hole1, hole2, direction) {
  const svg = document.getElementById("stitchCanvas");
  const rect1 = hole1.getBoundingClientRect();
  const rect2 = hole2.getBoundingClientRect();

  const x1 = rect1.left + rect1.width / 2;
  const y1 = rect1.top + rect1.height / 2;
  const x2 = rect2.left + rect2.width / 2;
  const y2 = rect2.top + rect2.height / 2;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);

  const color = direction === "後" ? "#93d8ce" : "#d66b00";
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "9");
  line.setAttribute("stroke-linecap", "round");

  svg.appendChild(line);
}

function addLog(text) {
  const logPanel = document.getElementById("logPanel");
  const p = document.createElement("p");
  p.textContent = text;
  logPanel.appendChild(p);
  logPanel.scrollTop = logPanel.scrollHeight;
}

function checkStitchCompletion() {
  if (stitchHistory.length === currentStitchMode.goalCount) {
    document.getElementById("successText").textContent =
	`🎉 任務完成！你成功完成「${currentStitchMode.name}」！`;
	document.getElementById("successMessage").style.display = "block";
    msg.style.display = "block";
  }
}

// === 規則函式 ===

function validateRunningStitch(nextPos) {
  if (stitchHistory.length === 0) return true;
  const lastPos = stitchHistory.at(-1);
  const sameRow = lastPos[0] === nextPos[0];
  const lastIndex = parseInt(lastPos.slice(1));
  const nextIndex = parseInt(nextPos.slice(1));
  return sameRow && nextIndex === lastIndex + 1;
}

function validateBackStitch(nextPos) {
  const len = stitchHistory.length;
  if (len === 0) return true; // 第一針任意
  const baseRow = stitchHistory[0][0];
  const nextRow = nextPos[0];
  const nextIndex = parseInt(nextPos.slice(1));

  if (nextRow !== baseRow) return false;

  const lastIndex = parseInt(stitchHistory[len - 1].slice(1));

  if (len === 1) {
    // 第二針：必須是起點 +1
    const startIndex = parseInt(stitchHistory[0].slice(1));
    return nextIndex === startIndex + 1;
  }

  if (len === 9) {
    // 第十針（最後一針）：+1 收尾
    return nextIndex === lastIndex + 1;
  }

  if (len % 2 === 0) {
    // 第 2,4,6,8 → 回退一格
    return nextIndex === lastIndex - 1;
  } else {
    // 第 3,5,7 → 前進兩格
    return nextIndex === lastIndex + 2;
  }
}

function validateHiddenStitch(nextPos) {
  const len = stitchHistory.length;
  if (len === 0) return true;

  const nextRow = nextPos[0];
  const nextIndex = parseInt(nextPos.slice(1));

  const lastPos = stitchHistory[len - 1];
  const lastRow = lastPos[0];
  const lastIndex = parseInt(lastPos.slice(1));

  if (len === 1) {
    // 第 1 → 第 2 針：必須換排，index 相同
    return nextRow !== lastRow && nextIndex === lastIndex;
  }

  if (len % 2 === 0) {
    // 第 2, 4, 6, 8：同排，index +1
    return nextRow === lastRow && nextIndex === lastIndex + 1;
  } else {
    // 第 3, 5, 7, 9：換排，index 相同
    return nextRow !== lastRow && nextIndex === lastIndex;
  }
}

function restartStitch() {
  // 清除線條
  const svg = document.getElementById("stitchCanvas");
  svg.innerHTML = "";

  // 清除紀錄與樣式
  stitchHistory = [];
  currentHole = null;
  currentDirection = null;

  document.querySelectorAll('.hole').forEach(h => h.classList.remove('selected'));
  document.getElementById("logPanel").innerHTML = "";
  document.getElementById("successMessage").style.display = "none";
}

function finishStitch() {
  window.location.href = "stitch-select.html";
}