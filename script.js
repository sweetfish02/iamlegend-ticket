/* ===============================
   IMAGE MAP
=============================== */

const imageMap = {
    "2_80": ["images/2_80_1.png", "images/2_80_2.png"],
    "2_120": ["images/2_120_1.png"],
    "2_160": null,
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
   BUTTON LOGIC
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

function updateButtonState() {
    const ticketBtns = document.querySelectorAll("#ticketButtons .select-btn");
    const boxBtns = document.querySelectorAll("#boxButtons .select-btn");

    ticketBtns.forEach(btn => btn.classList.remove("active"));
    boxBtns.forEach(btn => {
        btn.classList.remove("active", "disabled-btn");
        btn.disabled = false;
    });

    if (selectedTicket) {
        document.querySelector(`#ticketButtons button[data-ticket="${selectedTicket}"]`)
            .classList.add("active");

        boxBtns.forEach(btn => {
            const key = `${selectedTicket}_${btn.dataset.box}`;
            if (!rewardData[key]) {
                btn.classList.add("disabled-btn");
                btn.disabled = true;
            }
        });
    }

    if (selectedBox) {
        document.querySelector(`#boxButtons button[data-box="${selectedBox}"]`)
            .classList.add("active");
    }
}

/* ===============================
   RENDER TABLE
=============================== */

function renderTable() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];

    const area = document.getElementById("table-area");
    area.innerHTML = "";

    if (!data) {
        area.innerHTML = `<p style="color:red; text-align:center;">만족하는 상자 없음</p>`;
        document.getElementById("result-area").innerHTML = "";
        document.getElementById("required-box").innerHTML = "";
        return;
    }

    let html = `
        <table>
            <tr>
                <th>보상 종류</th>
                <th>남은 개수 ?</th>
                <th>전체 개수</th>
                <th>단가</th>
                <th>점수</th>
                <th>티켓화</th>
            </tr>
    `;

    data.forEach((item, i) => {
        const max = item.count;
        const isFinal = item.name === "최종보상";

        const inputField = isFinal
            ? `<input class="remain-input" data-row="${i}" type="number" value="1" readonly />`
            : `
            <div class="dropdown-wrapper">
                <input class="remain-input" data-row="${i}" type="number" value="${max}" min="0" max="${max}">
                <div class="dropdown-btn" onclick="toggleDropdown(${i})">▼</div>
                <div class="dropdown-list" id="drop-${i}" style="display:none;">
                    ${Array.from({ length: max + 1 }, (_, n) =>
                        `<div class="dropdown-item" onclick="selectRemain(${i}, ${n})">${n}</div>`
                    ).join("")}
                </div>
            </div>
            `;

        html += `
            <tr>
                <td>${item.name}</td>
                <td class="input-cell">${inputField}</td>
                <td>${item.count}</td>
                <td>${item.price}</td>
                <td class="score-cell"></td>
                <td class="ticket-cell"></td>
            </tr>`;
    });

    html += `</table>`;
    area.innerHTML = html;

    /* 직접 입력 시 자동 계산 + 범위 보정 */
    document.querySelectorAll(".remain-input").forEach(inp => {
        inp.addEventListener("input", () => {
            const row = Number(inp.dataset.row);
            const max = data[row].count;

            let v = Number(inp.value);
            if (v < 0) v = 0;
            if (v > max) v = max;

            inp.value = v;
            calculate();
        });
    });

    calculate();
}

/* ===============================
   DROPDOWN
=============================== */

window.selectRemain = function(row, val) {
    const input = document.querySelector(`input[data-row="${row}"]`);
    input.value = val;
    closeAllDropdowns();
    calculate();
};

window.toggleDropdown = function(row) {
    closeAllDropdowns();
    document.getElementById(`drop-${row}`).style.display = "block";
};

function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-list").forEach(e => e.style.display = "none");
}

/* ===============================
   CALCULATE  (완전 수정판)
=============================== */

function calculate() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];

    let remains = [];

    document.querySelectorAll(".remain-input").forEach((inp, i) => {
        let max = data[i].count;  
        let v = Number(inp.value);
        if (v < 0) v = 0;
        if (v > max) v = max;
        inp.value = v;
        remains[i] = v;
    });

    // 최종보상(0번째)은 항상 1 고정 → 계산에서 제외
    const requireRemain = remains.slice(1).reduce((a, b) => a + b, 0);

    const required = requireRemain * Number(selectedTicket);

    document.getElementById("required-box").innerHTML = `
        <div style="text-align:center; margin:15px 0; font-size:18px; font-weight:bold;">
            전부 획득 시 필요한 티켓 → <span style="color:red">${required}</span>
        </div>
    `;

    /* --- 중간표 계산 --- */
    document.querySelectorAll("tr").forEach((row, idx) => {
        if (idx === 0 || !data[idx - 1]) return;

        const item = data[idx - 1];
        const remain = remains[idx - 1];

        const score = item.price * remain;
        const ticket = score / 30;

        row.querySelector(".score-cell").textContent = score;
        row.querySelector(".ticket-cell").textContent =
            isNaN(ticket) ? "0" : ticket.toFixed(1);
    });

    /* --- 결과표 계산 --- */
    renderResult(required);
}

/* ===============================
   RESULT TABLE
=============================== */

function renderResult(required) {
    const rows = document.querySelectorAll("tr");
    let totals = [];
    let excludeFinal = 0;
    let excludeA = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length === 6) {
            const name = cells[0].textContent;
            const t = parseFloat(cells[5].textContent) || 0;

            totals.push(t);
            if (name !== "최종보상") excludeFinal += t;
            if (name !== "최종보상" && name !== "A") excludeA += t;
        }
    });

    const total = totals.reduce((a, b) => a + b, 0);

    function calc(val) {
        return {
            profit: val - required,
            gem: (val - required) * 300
        };
    }

    const c1 = calc(total);
    const c2 = calc(excludeFinal);
    const c3 = calc(excludeA);

    const fmt = v => (v >= 0
        ? `<span class="green">${v}</span>`
        : `<span class="red">${v}</span>`
    );

    document.getElementById("result-area").innerHTML = `
    <table>
        <tr>
            <th>구분</th>
            <th>전부 반환</th>
            <th>최종 제외</th>
            <th>최종 & A 제외</th>
        </tr>
        <tr>
            <td>돌려받는 티켓</td>
            <td>${total.toFixed(1)}</td>
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
            <td>${fmt(c1.gem)}</td>
            <td>${fmt(c2.gem)}</td>
            <td>${fmt(c3.gem)}</td>
        </tr>
    </table>
    `;
}

/* ===============================
   IMAGE OUTPUT
=============================== */

function renderImages() {
    const key = `${selectedTicket}_${selectedBox}`;
    const images = imageMap[key];

    let area = document.getElementById("image-area");

    if (!area) return;

    if (!images) {
        area.innerHTML = "";
        return;
    }

    area.innerHTML = images
        .map(src => `<img src="${src}" style="width:90px; margin-left:8px;">`)
        .join("");
}
