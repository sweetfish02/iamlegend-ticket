/* ============================
   🔵 전역 변수
============================ */
let selectedTicket = null;
let selectedBox = null;
let currentData = [];
let remainingValues = {};
let openedDropdown = null;

/* 유효한 조합 정의 */
const validOptions = [
    "3-80",
    "3-160",
    "2-80",
    "2-120",
    "2-240"
];

/* ============================
   🔵 버튼 초기화
============================ */
function initButtons() {
    const ticketBtns = document.querySelectorAll(".ticket-btn");
    const boxBtns = document.querySelectorAll(".box-btn");

    /* ▶ 티켓 단가 버튼 */
    ticketBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            selectedTicket = btn.dataset.value;

            ticketBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            updateBoxButtons(); // 상자버튼 상태 갱신
            loadTable();        // 테이블 갱신
        });
    });

    /* ▶ 상자 개수 버튼 */
    boxBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.disabled) return;

            selectedBox = btn.dataset.value;

            boxBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            loadTable();
        });
    });
}

/* ============================
   🔵 가능한 상자 버튼만 활성화
============================ */
function updateBoxButtons() {
    const boxBtns = document.querySelectorAll(".box-btn");

    boxBtns.forEach(btn => {
        const key = `${selectedTicket}-${btn.dataset.value}`;
        const isValid = validOptions.includes(key);

        if (isValid) {
            btn.disabled = false;
            btn.classList.remove("disabled-btn");
        } else {
            btn.disabled = true;
            btn.classList.add("disabled-btn");
            btn.classList.remove("active"); // 비활성 시 선택 해제
        }
    });

    selectedBox = null; // 선택 해제
}

/* ============================
   🔵 테이블 로딩
============================ */
function loadTable() {
    if (!selectedTicket || !selectedBox) return;

    const key = `${selectedTicket}-${selectedBox}`;

    // 조합이 존재하지 않으면 표시 X
    if (!validOptions.includes(key)) {
        document.getElementById("table-area").innerHTML =
            `<div style="color:red; font-weight:bold; margin-top:20px; font-size:20px;">
                만족하는 상자 없음
             </div>`;
        document.getElementById("result-area").innerHTML = "";
        document.getElementById("required-box").innerHTML = "";
        return;
    }

    // 정상 조합이면 테이블 출력
    currentData = rewardData[key];

    let html = `
        <table id="reward-table">
            <thead>
                <tr>
                    <th>보상 종류</th>
                    <th>
                        남은 개수
                        <span class="tooltip-icon" onclick="toggleTooltip()">?</span>
                        <div id="tooltip-box" class="tooltip-box">
                            현재 이벤트 창의 수량을 직접 입력하세요.
                        </div>
                    </th>
                    <th>전체 개수</th>
                    <th>단가</th>
                    <th>점수</th>
                    <th>티켓화</th>
                </tr>
            </thead>
            <tbody>
    `;

    remainingValues = {};

    currentData.forEach((row, index) => {
        const isFinal = row.name === "최종보상";
        const maxValue = row.count;
        remainingValues[index] = isFinal ? 1 : 0;

        html += `
            <tr>
                <td>${row.name}</td>

                <td class="input-cell">
                    ${isFinal ? `
                        <input type="number" disabled value="1">
                    ` : `
                        <div class="dropdown-wrapper">
                            <input type="number" id="input_${index}" value="0" min="0" max="${maxValue}">
                            <div class="dropdown-btn" onclick="toggleDropdown(${index})">▼</div>
                            <div class="dropdown-list" id="dropdown_${index}">
                                ${generateDropdownItems(maxValue, index)}
                            </div>
                        </div>
                    `}
                </td>

                <td>${row.count}</td>
                <td>${row.price}</td>
                <td id="score_${index}">0</td>
                <td id="ticket_${index}">0</td>
            </tr>
        `;
    });

    // 합계 행
    html += `
        <tr>
            <td><b>합계</b></td>
            <td id="sumRemaining">0</td>
            <td id="sumTotal">0</td>
            <td></td><td></td><td></td>
        </tr>
    `;

    html += "</tbody></table>";

    document.getElementById("table-area").innerHTML = html;

    attachInputEvents();
    updateAll();
}

/* ============================
   🔵 드롭다운 옵션 생성
============================ */
function generateDropdownItems(max, index) {
    let list = "";
    for (let i = 0; i <= max; i++) {
        list += `<div class="dropdown-item" onclick="selectDropdown(${index}, ${i})">${i}</div>`;
    }
    return list;
}

/* ============================
   🔵 드롭다운 UI
============================ */
function toggleDropdown(index) {
    // 기존 열려 있는 드롭다운 닫기
    document.querySelectorAll(".dropdown-list").forEach(d => {
        if (d.id !== `dropdown_${index}`) d.style.display = "none";
    });

    let target = document.getElementById(`dropdown_${index}`);
    target.style.display = target.style.display === "block" ? "none" : "block";
}

function selectDropdown(index, value) {
    const input = document.getElementById(`input_${index}`);
    const max = parseInt(input.max);
    value = Math.min(value, max);

    input.value = value;
    remainingValues[index] = value;

    document.getElementById(`dropdown_${index}`).style.display = "none";
    updateAll();
}

/* ============================
   🔵 입력 이벤트
============================ */
function attachInputEvents() {
    currentData.forEach((row, index) => {
        const isFinal = row.name === "최종보상";
        if (isFinal) return;

        const input = document.getElementById(`input_${index}`);

        input.addEventListener("input", () => {
            let val = parseInt(input.value) || 0;
            const max = parseInt(input.max);

            if (val < 0) val = 0;
            if (val > max) val = max;

            input.value = val;
            remainingValues[index] = val;
            updateAll();
        });
    });
}

/* ============================
   🔵 전체 계산
============================ */
function updateAll() {
    let sumRemaining = 0;
    let sumTotal = 0;

    currentData.forEach((row, index) => {
        const remain = remainingValues[index] || 0;
        const total = row.count;

        if (row.name !== "최종보상") {
            sumRemaining += remain;
            sumTotal += total;
        }

        const score = remain * row.price;
        document.getElementById(`score_${index}`).innerText = score;

        const ticket = (score / 30).toFixed(1);
        document.getElementById(`ticket_${index}`).innerText = ticket;
    });

    document.getElementById("sumRemaining").innerText = sumRemaining;
    document.getElementById("sumTotal").innerText = sumTotal;

    updateRequired(sumRemaining);
    updateResults(sumRemaining);
}

/* ============================
   🔵 필요한 티켓
============================ */
function updateRequired(sumRemaining) {
    const required = sumRemaining * selectedTicket;

    document.getElementById("required-box").innerHTML =
        `<h3>전부 획득 시 필요한 티켓 : ${required}</h3>`;
}

/* ============================
   🔵 최종 결과표
============================ */
function updateResults(sumRemaining) {
    let totalRefund = 0;
    let exceptFinal = 0;
    let exceptFinalA = 0;

    currentData.forEach((row, index) => {
        const ticket = parseFloat(document.getElementById(`ticket_${index}`).innerText);
        const name = row.name;

        totalRefund += ticket;
        if (name !== "최종보상") exceptFinal += ticket;
        if (name !== "최종보상" && name !== "A") exceptFinalA += ticket;
    });

    const required = sumRemaining * selectedTicket;

    const c1 = (totalRefund - required).toFixed(1);
    const c2 = (exceptFinal - required).toFixed(1);
    const c3 = (exceptFinalA - required).toFixed(1);

    const jewel1 = (c1 * 300).toFixed(0);
    const jewel2 = (c2 * 300).toFixed(0);
    const jewel3 = (c3 * 300).toFixed(0);

    const color = v => v >= 0 ? "green" : "red";

    let html = `
        <table id="result-table">
            <thead>
                <tr>
                    <th>구분</th>
                    <th>전부 반환</th>
                    <th>최종 제외</th>
                    <th>최종 & A 제외</th>
                </tr>
            </thead>

            <tr>
                <td>반환 시 돌려받는 티켓</td>
                <td>${totalRefund.toFixed(1)}</td>
                <td>${exceptFinal.toFixed(1)}</td>
                <td>${exceptFinalA.toFixed(1)}</td>
            </tr>

            <tr>
                <td>티켓 손익</td>
                <td style="color:${color(c1)}">${c1}</td>
                <td style="color:${color(c2)}">${c2}</td>
                <td style="color:${color(c3)}">${c3}</td>
            </tr>

            <tr>
                <td>보석 가치</td>
                <td style="color:${color(jewel1)}">${jewel1}</td>
                <td style="color:${color(jewel2)}">${jewel2}</td>
                <td style="color:${color(jewel3)}">${jewel3}</td>
            </tr>
        </table>
    `;

    document.getElementById("result-area").innerHTML = html;
}

/* ============================
   🔵 툴팁
============================ */
function toggleTooltip() {
    const box = document.getElementById("tooltip-box");
    box.style.display = box.style.display === "block" ? "none" : "block";
}

/* ============================
   🔵 초기 실행
============================ */
initButtons();
