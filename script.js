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

/* 버튼 */
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

/* 버튼 활성화 */
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

/* 테이블 생성 */
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
                <th>점수</th>
                <th>티켓화</th>
            </tr>
    `;

    data.forEach((item, i) => {
        const max = item.count;
        const isFinal = item.name === "최종보상";

        const inputField = isFinal
            ? `<input type="number" value="1" readonly>`
            : `
                <div class="dropdown-wrapper yellow-cell">
                    <input type="number" class="remain-input" data-row="${i}" value="${max}" min="0" max="${max}">
                    <div class="dropdown-btn">▼</div>
                    <div class="dropdown-list" id="drop-${i}">
                        ${Array.from({ length: max + 1 }, (_, n) =>
                            `<div class="dropdown-item" onclick="selectRemain(${i},${n})">${n}</div>`).join("")}
                    </div>
                </div>
            `;

        html += `
            <tr class="reward-row" data-index="${i}">
                <td>${item.name}</td>
                <td class="yellow-cell">${inputField}</td>
                <td>${item.count}</td>
                <td>${item.price}</td>
                <td class="score-cell"></td>
                <td class="ticket-cell purple"></td>
            </tr>
        `;
    });

    /* 합계행 */
    const totalCount = data.slice(1).reduce((s,x)=>s+x.count, 0);
    html += `
        <tr id="sum-row">
            <td>A~G 의 합계</td>
            <td id="sum-remain" class="yellow-cell"></td>
            <td>${totalCount}</td>
            <td></td><td></td><td></td>
        </tr>
    `;

    html += `</table>`;
    area.innerHTML = html;

    /* 입력 이벤트 */
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

    /* 드롭다운 버튼 */
    document.querySelectorAll(".dropdown-btn").forEach((btn, i) => {
        btn.addEventListener("click", () => {
            closeDropdowns();
            document.getElementById(`drop-${i}`).style.display = "block";
        });
    });

    calculate();
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

/* 계산 로직 */
function calculate() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];

    /* A~G 남은 개수 */
    let remains = [];
    document.querySelectorAll(".remain-input").forEach((inp, i) => {
        remains[i] = Number(inp.value);
    });

    /* 합계 */
    const sumRemain = remains.reduce((s,x)=>s+x, 0);
    document.getElementById("sum-remain").textContent = sumRemain;

    /* 점수 / 티켓화 정확한 행 매칭 계산 */
    document.querySelectorAll(".reward-row").forEach(row => {
        const index = Number(row.dataset.index);
        const item = data[index];

        const remain = item.name === "최종보상" ? 1 : remains[index];
        const score = item.price * remain;
        const ticket = (score / 30).toFixed(1);

        row.querySelector(".score-cell").textContent = score;
        row.querySelector(".ticket-cell").textContent = ticket;
    });

    renderResult(sumRemain * Number(selectedTicket));
}

/* 결과표 */
function renderResult(required) {
    const area = document.getElementById("result-area");

    let totals = [];
    let excludeFinal = 0;
    let excludeA = 0;

    document.querySelectorAll(".reward-row").forEach(row => {
        const name = row.children[0].textContent;
        const t = parseFloat(row.querySelector(".ticket-cell").textContent) || 0;
        totals.push(t);
        if (name !== "최종보상") excludeFinal += t;
        if (name !== "최종보상" && name !== "A") excludeA += t;
    });

    const totalReturn = totals.reduce((a,b)=>a+b,0);

    function calc(val){
        return {
            profit: val - required,
            gem: (val - required) * 300
        };
    }

    const c1 = calc(totalReturn);
    const c2 = calc(excludeFinal);
    const c3 = calc(excludeA);

    const fmt = v => v >= 0 
        ? `<span class="green">${v}</span>`
        : `<span class="red">${v}</span>`;

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
            <td>${fmt(c1.gem)}</td>
            <td>${fmt(c2.gem)}</td>
            <td>${fmt(c3.gem)}</td>
        </tr>
    </table>
    `;

    document.getElementById("required-box").innerHTML = `
        <div style="text-align:center; margin:15px 0; font-size:18px; font-weight:bold;">
            전부 획득 시 필요한 티켓 → <span class="purple">${required}</span>
        </div>
    `;
}

/* 이미지 */
function renderImages() {
    const key = `${selectedTicket}_${selectedBox}`;
    const images = imageMap[key];

    let area = document.getElementById("image-area");
    if (!area) {
        area = document.createElement("div");
        area.id = "image-area";
        area.style.textAlign = "right";
        area.style.marginTop = "-80px";
        area.style.marginBottom = "20px";
        document.querySelector(".container").prepend(area);
    }

    area.innerHTML = images
        ? images.map(src => `<img src="${src}" style="width:90px; margin-left:8px;">`).join("")
        : "";
}
