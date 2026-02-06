/* ===============================
   IMAGE MAP
=============================== */
const imageMap = {
    "2_80": ["images/2_80_1.png", "images/2_80_2.png"],
    "2_120": ["images/2_120_1.png"],
    "2_240": ["images/2_240_1.png", "images/2_240_2.png"],
    "3_80": ["images/3_80_1.png", "images/3_80_2.png"],
    "3_160": ["images/3_160_1.png"]
};

let selectedTicket = null;
let selectedBox = null;

/* 고급 옵션용 전역 상태 */
let lastRequiredTickets = 0;
const floorThresholds = [0, 250, 500, 750, 1050, 1350, 1650, 1950, 2100, 2300];

let advToggle = null;
let advRows = [];
let advCurrentInput = null;


/* ===============================
   버튼 선택 이벤트
=============================== */
document.querySelectorAll("#ticketButtons .select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        selectedTicket = btn.dataset.ticket;
        selectedBox = null;
        updateButtonState();
    });
});

document.querySelectorAll("#boxButtons .select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!btn.classList.contains("disabled-btn")) {
            selectedBox = btn.dataset.box;
            updateButtonState();
            renderTable();
            renderImages();
        }
    });
});


/* ===============================
   버튼 활성/비활성 표시
=============================== */
function updateButtonState() {
    const ticketBtns = document.querySelectorAll("#ticketButtons .select-btn");
    const boxBtns = document.querySelectorAll("#boxButtons .select-btn");

    ticketBtns.forEach(b => b.classList.remove("active"));
    boxBtns.forEach(b => {
        b.classList.remove("active", "disabled-btn");
        b.disabled = false;
    });

    if (selectedTicket) {
        document.querySelector(`[data-ticket="${selectedTicket}"]`).classList.add("active");

        boxBtns.forEach(btn => {
            const key = `${selectedTicket}_${btn.dataset.box}`;
            if (!rewardData[key]) {
                btn.classList.add("disabled-btn");
                btn.disabled = true;
            }
        });
    }

    if (selectedBox) {
        document.querySelector(`[data-box="${selectedBox}"]`).classList.add("active");
    }
}


/* ===============================
   중간표 생성
=============================== */
function renderTable() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];
    const area = document.getElementById("table-area");

    if (!data) {
        area.innerHTML = "<p style='color:red;text-align:center;'>만족하는 상자 없음</p>";
        return;
    }

    let html = `
        <table>
            <tr>
                <th>보상 종류</th>
                <th>남은 개수(현재 수량 직접입력)</th>
                <th>전체 개수</th>
                <th>단가</th>
                <th>점수(남은 개수×단가)</th>
                <th>티켓화</th>
            </tr>
    `;

    data.forEach((item, index) => {

        let displayName = item.name;
        if (item.name.length === 1) displayName = item.name + "보상";

        const max = item.count;
        const isFinal = item.name === "최종보상";

        const inputField = isFinal
            ? `<input type="number" value="1" readonly style="text-align:center;">`
            : `
                <div class="dropdown-wrapper yellow-cell">
                    <input type="number" class="remain-input" data-index="${index}" value="${max}" 
                           min="0" max="${max}" inputmode="numeric">
                    <div class="dropdown-btn" data-index="${index}">▼</div>
                    <div class="dropdown-list" id="drop-${index}">
                        ${Array.from({ length: max + 1 }, (_, n) =>
                            `<div class="dropdown-item" onclick="selectRemain(${index},${n})">${n}</div>`
                        ).join("")}
                    </div>
                </div>
            `;

        html += `
            <tr class="reward-row" data-index="${index}">
                <td>${displayName}</td>
                <td class="yellow-cell">${inputField}</td>
                <td>${item.count}</td>
                <td>${item.price}</td>
                <td class="score-cell"></td>
                <td class="ticket-cell purple"></td>
            </tr>
        `;
    });

    const totalCount = data.slice(1).reduce((s, x) => s + x.count, 0);

    html += `
        <tr id="sum-row">
            <td>A~G보상의 합계</td>
            <td id="sum-remain" class="yellow-cell"></td>
            <td>${totalCount}</td>
            <td></td><td></td><td></td>
        </tr>
        </table>
    `;

    area.innerHTML = html;

    document.querySelectorAll(".remain-input").forEach(inp => {
        inp.addEventListener("input", () => {
            const max = Number(inp.max);
            let v = Number(inp.value);

            if (v < 0) v = 0;
            if (v > max) v = max;

            inp.value = v;
            calculate();
        });
    });

    document.querySelectorAll(".dropdown-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = btn.dataset.index;
            closeDropdowns();
            document.getElementById(`drop-${idx}`).style.display = "block";
        });
    });

    calculate();
}


/* ===============================
   드롭다운
=============================== */
function closeDropdowns() {
    document.querySelectorAll(".dropdown-list").forEach(d => d.style.display = "none");
}

function selectRemain(i, val) {
    const input = document.querySelector(`input[data-index="${i}"]`);
    input.value = val;
    closeDropdowns();
    calculate();
}


/* ===============================
   계산
=============================== */
function calculate() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];

    let remains = [];

    document.querySelectorAll(".remain-input").forEach(inp => {
        const idx = Number(inp.dataset.index);
        remains[idx] = Number(inp.value);
    });

    const sumRemain = remains.slice(1).reduce((s, x) => s + x, 0);
    document.getElementById("sum-remain").textContent = sumRemain;

    document.querySelectorAll(".reward-row").forEach(row => {
        const idx = Number(row.dataset.index);
        const item = data[idx];

        const remain = item.name === "최종보상" ? 1 : remains[idx];
        const score = item.price * remain;
        const ticket = (score / 30).toFixed(1);

        row.querySelector(".score-cell").textContent = score;
        row.querySelector(".ticket-cell").textContent = ticket;
    });

    const required = sumRemain * Number(selectedTicket);
    lastRequiredTickets = required;

    renderResult(required);

    /* 고급옵션 켜져 있으면 같이 업데이트 */
    if (advToggle && advToggle.checked) {
        updateAdvanced();
    }
}


/* ===============================
   결과표 생성
=============================== */
function renderResult(required) {
    const area = document.getElementById("result-area");

    const ticketCells = Array.from(document.querySelectorAll(".reward-row .ticket-cell"))
        .map(c => parseFloat(c.textContent) || 0);

    const totalReturn = ticketCells.reduce((a, b) => a + b, 0);
    const excludeFinal = ticketCells.slice(1).reduce((a, b) => a + b, 0);
    const excludeA = ticketCells.slice(2).reduce((a, b) => a + b, 0);

    function calc(val) {
        const diff = val - required;
        return {
            profit: diff,
            gem: Math.ceil(diff * 300)
        };
    }

    const c1 = calc(totalReturn);
    const c2 = calc(excludeFinal);
    const c3 = calc(excludeA);

    const fmt = v =>
        v >= 0 ? `<span class="green">${v}</span>` : `<span class="red">${v}</span>`;

    area.innerHTML = `
<table>
    <tr>
        <th>구분</th>
        <th>전부 반환</th>
        <th>최종 제외</th>
        <th>최종 & A 제외</th>
    </tr>
    <tr>
        <td class="purple">돌려받는 티켓</td>
        <td>${totalReturn.toFixed(1)}</td>
        <td>${excludeFinal.toFixed(1)}</td>
        <td>${excludeA.toFixed(1)}</td>
    </tr>
    <tr>
        <td>티켓 손익</td>
        <td>${fmt(c1.profit.toFixed(1))}</td>
        <td>${fmt(c2.profit.toFixed(1))}</td>
        <td>${fmt(c3.profit.toFixed(1))}</td>
    </tr>
    <tr>
        <td>보석 가치</td>
        <td class="result-gem">${fmt(c1.gem)}</td>
        <td class="result-gem">${fmt(c2.gem)}</td>
        <td class="result-gem">${fmt(c3.gem)}</td>
    </tr>
</table>
`;

    document.getElementById("required-box").innerHTML = `
        <div style="text-align:center; margin:15px 0; font-size:18px; font-weight:bold;">
            전부 획득 시 필요한 티켓 → <span class="purple">${required}</span>
        </div>
    `;
}


/* ===============================
   고급 옵션 로직
=============================== */

function setupAdvancedOption() {
    advToggle = document.getElementById("advToggle");
    advCurrentInput = document.getElementById("advCurrent");
    advRows = document.querySelectorAll(".adv-extra");

    if (!advToggle || !advCurrentInput) return;

    /* 처음에는 접힌 상태 */
    advRows.forEach(r => r.style.display = "none");

    advToggle.addEventListener("change", () => {
        const show = advToggle.checked;
        advRows.forEach(r => r.style.display = show ? "table-row" : "none");
        if (show) updateAdvanced();
    });

    advCurrentInput.addEventListener("input", () => {
        if (advToggle.checked) updateAdvanced();
    });
}

/* 6행 2열 계산에 해당하는 함수 */
function computeCoreFromFloors(current, dest, arr) {
    let sum = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        const low = arr[i];
        const high = arr[i + 1];
        const delta = high - low;
        if (delta <= 0) continue;

        const overlap = Math.min(dest, high) - Math.max(current, low);
        if (overlap > 0) {
            /* 7행 * 8행 (양수만) 의 SUMPRODUCT 과 동일 */
            sum += overlap / delta;
        }
    }
    return sum;
}

function updateAdvanced() {
    if (!advCurrentInput) return;

    const current = Number(advCurrentInput.value) || 0;
    const increase = lastRequiredTickets || 0;
    const dest = current + increase;

    // 증가하는 층수: 보라색 + '층'
    document.getElementById("advIncrease").innerHTML =
        `<span class="purple">${increase}층</span>`;

    // 도착하는 층수: '층'만 붙이기 (색은 기본)
    document.getElementById("advDestination").textContent =
        `${dest}층`;

    // 코어 계산은 기존 그대로
    const core = computeCoreFromFloors(current, dest, floorThresholds);

    // 코어 개수: 초록색 + '개'
    document.getElementById("advCore").innerHTML =
        `<span class="green">${core.toFixed(2)}개</span>`;
}


/* ===============================
   이미지 출력
=============================== */
function renderImages() {
    const key = `${selectedTicket}_${selectedBox}`;
    const images = imageMap[key];

    let area = document.getElementById("image-area");
    if (!area) {
        area = document.createElement("div");
        area.id = "image-area";
        area.style.textAlign = "right";
        area.style.marginBottom = "10px";

        const tableArea = document.getElementById("table-area");
        tableArea.parentNode.insertBefore(area, tableArea);
    }

    area.innerHTML = images
        ? images.map(src => `<img src="${src}" style="width:90px; margin-left:8px;">`).join("")
        : "";
}

/* 고급 옵션 초기 세팅 */
setupAdvancedOption();

// 드롭다운: 바깥 클릭 시 닫기
document.addEventListener("click", (e) => {
  // dropdown-wrapper 내부 클릭이면 닫지 않음
  if (e.target.closest(".dropdown-wrapper")) return;
  closeDropdowns();
});
