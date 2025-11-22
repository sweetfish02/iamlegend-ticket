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
   GLOBAL
=============================== */
let selectedTicket = null;
let selectedBox = null;

/* ===============================
   BUTTON EVENT
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
   BUTTON STATE
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
   TABLE RENDER
=============================== */
function renderTable() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];
    const area = document.getElementById("table-area");

    if (!data) {
        area.innerHTML = "<p style='color:red;text-align:center;'>만족하는 상자 없음</p>";
        return;
    }

    let html =
        `<table>
            <thead>
                <tr>
                    <th>보상 종류</th>
                    <th>남은 개수 <span class="tooltip" onclick="showTip(event,'현재 이벤트 창의 수량을 직접 입력하세요.')">?</span></th>
                    <th>전체 개수</th>
                    <th>단가</th>
                    <th>점수</th>
                    <th>티켓화</th>
                </tr>
            </thead>
            <tbody>
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
                            `<div class="dropdown-item" onclick="selectRemain(${i},${n})">${n}</div>`
                        ).join("")}
                    </div>
                </div>`;

        html += `
            <tr data-index="${i}">
                <td>${item.name}</td>
                <td>${inputField}</td>
                <td>${item.count}</td>
                <td>${item.price}</td>
                <td class="score-cell"></td>
                <td class="ticket-cell"></td>
            </tr>`;
    });

    /* 합계행 */
    const totalCount = data.slice(1).reduce((s, x) => s + x.count, 0);

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td>합계 <span class="tooltip" onclick="showTip(event,'A~G 보상의 합계')">?</span></td>
                    <td id="sum-remain"></td>
                    <td>${totalCount}</td>
                    <td></td><td></td><td></td>
                </tr>
            </tfoot>
        </table>`;

    area.innerHTML = html;

    /* 직접 입력 계산 */
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

    calculate();
}

/* ===============================
   DROPDOWN
=============================== */
function toggleDropdown(i) {
    closeDropdowns();
    document.getElementById(`drop-${i}`).style.display = "block";
}

function closeDropdowns() {
    document.querySelectorAll(".dropdown-list").forEach(d => d.style.display = "none");
}

function selectRemain(i, v) {
    const input = document.querySelector(`input[data-row="${i}"]`);
    input.value = v;
    closeDropdowns();
    calculate();
}

/* ===============================
   CALCULATE
=============================== */
function calculate() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];

    if (!data) return;

    /* A~G 남은 개수 */
    const remains = Array.from(document.querySelectorAll(".remain-input"))
        .map(inp => Number(inp.value));

    /* 합계 표시 */
    const sumRemain = remains.reduce((s, x) => s + x, 0);
    const sumBox = document.getElementById("sum-remain");
    if (sumBox) sumBox.textContent = sumRemain;

    /* 점수 / 티켓화 */
    document.querySelectorAll("#table-area tbody tr").forEach((row, idx) => {
        const item = data[idx];
        const remain = item.name === "최종보상" ? 1 : remains[idx - 1];

        const score = item.price * remain;
        const ticket = (score / 30).toFixed(1);

        row.querySelector(".score-cell").textContent = score;
        row.querySelector(".ticket-cell").textContent = ticket;
    });

    /* 필요한 티켓 */
    const required = sumRemain * Number(selectedTicket);
    document.getElementById("required-box").innerHTML =
        `<div style="text-align:center; margin:15px 0; font-size:18px; font-weight:bold;">
            전부 획득 시 필요한 티켓 → <span style="color:red">${required}</span>
        </div>`;

    renderResult(required);
}

/* ===============================
   RESULT TABLE
=============================== */
function renderResult(required) {
    const rows = document.querySelectorAll("#table-area tbody tr");
    let tickets = [];

    rows.forEach((row, i) => {
        const name = row.children[0].textContent;
        const t = parseFloat(row.querySelector(".ticket-cell").textContent) || 0;
        tickets[i] = t;
    });

    const total = tickets.reduce((a, b) => a + b, 0);
    const excludeFinal = tickets.slice(1).reduce((a, b) => a + b, 0);
    const excludeA = tickets.slice(2).reduce((a, b) => a + b, 0);

    const calc = v => ({
        profit: v - required,
        gem: (v - required) * 300
    });

    const c1 = calc(total);
    const c2 = calc(excludeFinal);
    const c3 = calc(excludeA);

    const fmt = v => v >= 0
        ? `<span class="green">${v}</span>`
        : `<span class="red">${v}</span>`;

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
        </table>`;
}

/* ===============================
   IMAGE RENDERING
=============================== */
function renderImages() {
    const key = `${selectedTicket}_${selectedBox}`;
    const images = imageMap[key];

    const area = document.getElementById("image-area");
    if (!images) {
        area.innerHTML = "";
        return;
    }

    area.innerHTML = images
        .map(src => `<img src="${src}" style="width:95px; margin-left:8px;">`)
        .join("");
}

/* ===============================
   TOOLTIP
=============================== */
function showTip(event, text) {
    closeTooltip();

    const box = document.createElement("div");
    box.className = "tooltip-box";
    box.textContent = text;
    document.body.appendChild(box);

    const r = event.target.getBoundingClientRect();
    box.style.left = r.left + "px";
    box.style.top = (r.bottom + 5) + "px";
    box.style.display = "block";
}

function closeTooltip() {
    document.querySelectorAll(".tooltip-box").forEach(el => el.remove());
}

document.addEventListener("click", e => {
    if (!e.target.classList.contains("tooltip"))
        closeTooltip();
});
