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
   TOOLTIP
=============================== */
window.showRemainHelp = function () {
    alert("현재 이벤트 창의 수량을 직접 입력하세요.");
};

/* ===============================
   BUTTON ACTIVATION LOGIC
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
        if (btn.classList.contains("disabled-btn")) return;
        selectedBox = btn.dataset.box;
        updateButtonState();
        renderTable();
        renderImages();
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
   TABLE RENDERING
=============================== */

function renderTable() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];

    const area = document.getElementById("table-area");
    area.innerHTML = "";

    if (!data) {
        area.innerHTML = `<p style="color:red; text-align:center;">만족하는 상자 없음</p>`;
        return;
    }

    let html = `
        <table>
            <tr>
                <th>보상 종류</th>
                <th>남은 개수 <span class="help-icon" onclick="showRemainHelp()">?</span></th>
                <th>전체 개수</th>
                <th>단가</th>
                <th>점수</th>
                <th>티켓화</th>
            </tr>
    `;

    data.forEach((item, idx) => {
        const max = item.count;

        const inputField =
            item.name === "최종보상"
                ? `<input type="number" value="1" readonly />`
                : `
            <div class="dropdown-wrapper">
                <input class="remain-input" 
                       data-row="${idx}" 
                       type="number" 
                       min="0" 
                       max="${max}" 
                       value="${max}">
                <div class="dropdown-btn" onclick="toggleDropdown(${idx})">▼</div>
                <div class="dropdown-list" id="drop-${idx}" style="display:none;">
                    ${Array.from({ length: max + 1 }, (_, n) =>
                        `<div class="dropdown-item" onclick="selectRemain(${idx}, ${n})">${n}</div>`
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

    document.querySelectorAll(".remain-input").forEach(inp => {
        inp.addEventListener("input", () => {
            const max = Number(inp.max);
            const min = Number(inp.min);
            let v = Number(inp.value);

            if (isNaN(v)) v = max;
            if (v > max) v = max;
            if (v < min) v = min;

            inp.value = v;
            calculate();
        });
    });

    calculate();
}

/* ===============================
   DROPDOWN
=============================== */

window.toggleDropdown = function (row) {
    closeAllDropdowns();
    document.getElementById(`drop-${row}`).style.display = "block";
};

window.selectRemain = function (row, val) {
    const input = document.querySelector(`input[data-row="${row}"]`);
    input.value = val;
    closeAllDropdowns();
    calculate();
};

function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-list").forEach(e => (e.style.display = "none"));
}

/* ===============================
   CALCULATION
=============================== */

function calculate() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];
    if (!data) return;

    let remains = [];

    document.querySelectorAll(".remain-input").forEach((inp, idx) => {
        let v = Number(inp.value);
        remains[idx] = v;
    });

    const totalRemain = remains.reduce((a, b) => a + b, 0);
    const required = totalRemain * Number(selectedTicket);

    document.getElementById("required-box").innerHTML = `
        <div style="text-align:center; margin:15px 0; font-size:18px; font-weight:bold;">
            전부 획득 시 필요한 티켓 → <span style="color:red">${required}</span>
        </div>
    `;

    document.querySelectorAll("tr").forEach((row, i) => {
        if (i === 0 || !data[i - 1]) return;

        const item = data[i - 1];
        const remain = remains[i - 1];
        const score = item.price * remain;
        const ticket = (score / 30).toFixed(1);

        row.querySelector(".score-cell").textContent = score;
        row.querySelector(".ticket-cell").textContent = ticket;
    });

    renderResult(required);
}

/* ===============================
   RESULT TABLE
=============================== */

function renderResult(required) {
    const rows = document.querySelectorAll("tr");
    let totals = [];
    let noFinal = 0;
    let noFinalA = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length === 6) {
            const name = cells[0].textContent;
            const t = parseFloat(cells[5].textContent) || 0;

            totals.push(t);
            if (name !== "최종보상") noFinal += t;
            if (name !== "최종보상" && name !== "A") noFinalA += t;
        }
    });

    const sum = totals.reduce((a, b) => a + b, 0);

    const calc = val => ({
        profit: (val - required),
        gem: (val - required) * 300
    });

    const c1 = calc(sum);
    const c2 = calc(noFinal);
    const c3 = calc(noFinalA);

    const fmt = v => v >= 0 ? `<span class="green">${v}</span>` : `<span class="red">${v}</span>`;

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
                <td>${sum.toFixed(1)}</td>
                <td>${noFinal.toFixed(1)}</td>
                <td>${noFinalA.toFixed(1)}</td>
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
        .map(src => `<img src="${src}" style="width:90px; margin-left:8px;">`)
        .join("");
}
