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

/* ===============================
   GLOBAL STATE
=============================== */
let selectedTicket = null;
let selectedBox = null;

/* ===============================
   버튼 동작
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
   버튼 활성화/비활성화
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
                <th>남은 개수 <span class="tooltip" onclick="showTip(event,'현재 이벤트 창의 수량을 직접 입력하세요.')">?</span></th>
                <th>전체 개수</th>
                <th>단가</th>
                <th>점수</th>
                <th>티켓화</th>
            </tr>
    `;

    data.forEach((item, i) => {
        const isFinal = item.name === "최종보상";
        const max = item.count;

        const inputField = isFinal
            ? `<input type="number" value="1" readonly>`
            : `
                <div class="dropdown-wrapper">
                    <input type="number" class="remain-input" data-row="${i}" value="${max}" min="0" max="${max}">
                    <div class="dropdown-btn" onclick="toggleDropdown(${i})">▼</div>
                    <div class="dropdown-list" id="drop-${i}">
                        ${Array.from({ length: max + 1 }, (_, n) =>
                            `<div class="dropdown-item" onclick="selectRemain(${i},${n})">${n}</div>`).join("")}
                    </div>
                </div>
            `;

        html += `
            <tr>
                <td>${item.name}</td>
                <td>${inputField}</td>
                <td>${item.count}</td>
                <td>${item.price}</td>
                <td class="score-cell"></td>
                <td class="ticket-cell"></td>
            </tr>
        `;
    });

    /* 합계 행 추가 */
    const totalCount = data.slice(1).reduce((s,x)=>s+x.count, 0);
    html += `
        <tr>
            <td>합계 <span class="tooltip" onclick="showTip(event,'A~G 보상의 합계')">?</span></td>
            <td id="sum-remain"></td>
            <td>${totalCount}</td>
            <td></td><td></td><td></td>
        </tr>
    `;

    html += `</table>`;
    area.innerHTML = html;

    document.querySelectorAll(".remain-input").forEach(inp => {
        inp.addEventListener("input", () => {
            const max = Number(inp.max);
            const v = Number(inp.value);
            if (v < 0) inp.value = 0;
            else if (v > max) inp.value = max;
            calculate();
        });
    });

    calculate();
}

/* ===============================
   드롭다운
=============================== */
function toggleDropdown(i) {
    closeDropdowns();
    document.getElementById(`drop-${i}`).style.display = "block";
}

function closeDropdowns() {
    document.querySelectorAll(".dropdown-list").forEach(d => d.style.display = "none");
}

function selectRemain(i, val) {
    const input = document.querySelector(`input[data-row="${i}"]`);
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

    document.querySelectorAll(".remain-input").forEach((inp, i) => {
        let v = Number(inp.value);
        remains[i] = v;
    });

    /* 합계 표시(최종보상 제외) */
    const sumRemain = remains.reduce((s,x)=>s+x, 0);
    document.getElementById("sum-remain").textContent = sumRemain;

    /* 점수/티켓화 계산 */
    document.querySelectorAll("#table-area tr").forEach((row, i) => {
        if (i === 0 || i > data.length) return;
        const item = data[i-1];
        const remain = item.name === "최종보상" ? 1 : remains[i-1];

        const score = item.price * remain;
        const ticket = (score / 30).toFixed(1);

        row.querySelector(".score-cell").textContent = score;
        row.querySelector(".ticket-cell").textContent = ticket;
    });

    /* 결과표 계산 유지 */
    renderResult();
}

/* ===============================
   툴팁
=============================== */
function showTip(event, text) {
    closeTooltip();

    const box = document.createElement("div");
    box.className = "tooltip-box";
    box.textContent = text;
    document.body.appendChild(box);

    const rect = event.target.getBoundingClientRect();
    box.style.left = rect.left + "px";
    box.style.top  = rect.bottom + 5 + "px";

    box.style.display = "block";
}

function closeTooltip() {
    document.querySelectorAll(".tooltip-box").forEach(e => e.remove());
}

document.addEventListener("click", e => {
    if (!e.target.classList.contains("tooltip"))
        closeTooltip();
});
