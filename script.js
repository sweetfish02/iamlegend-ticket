/* ============================
   🔵 전역 변수
============================ */
let selectedTicket = null;
let selectedBox = null;
let currentData = [];
let remainingValues = {}; // 남은 개수 저장

/* ============================
   🔵 버튼 초기화 (active)
============================ */
function initButtons() {
    document.querySelectorAll("#ticketButtons .select-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#ticketButtons .select-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedTicket = btn.dataset.ticket;
            loadTable();
        });
    });

    document.querySelectorAll("#boxButtons .select-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#boxButtons .select-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedBox = btn.dataset.box;
            loadTable();
        });
    });
}

/* ============================
   🔵 중간표 로딩
============================ */
function loadTable() {
    if (!selectedTicket || !selectedBox) return;

    const key = `${selectedTicket}_${selectedBox}`;
    currentData = rewardData[key];

    let html = `
        <table>
            <thead>
                <tr>
                    <th>보상 종류</th>
                    <th>남은 개수 <span class="tooltip-icon">?</span></th>
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
                            <div class="dropdown-list" id="dropdown_${index}" style="display:none;">
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
            <td></td>
            <td></td>
            <td></td>
        </tr>
    `;

    html += "</tbody></table>";

    document.getElementById("table-area").innerHTML = html;

    attachInputEvents();
    updateAll();
}

/* ============================
   🔵 드롭다운 목록 생성
============================ */
function generateDropdownItems(max, index) {
    let list = "";
    for (let i = 0; i <= max; i++) {
        list += `<div class="dropdown-item" onclick="selectDropdown(${index}, ${i})">${i}</div>`;
    }
    return list;
}

/* ============================
   🔵 드롭다운 동작
============================ */
function toggleDropdown(index) {
    document.getElementById(`dropdown_${index}`).style.display =
        document.getElementById(`dropdown_${index}`).style.display === "none"
            ? "block"
            : "none";
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

        // 점수 (정수)
        const score = remain * row.price;
        document.getElementById(`score_${index}`).innerText = score;

        // 티켓화 (소수점 1자리)
        const ticket = (score / 30).toFixed(1);
        document.getElementById(`ticket_${index}`).innerText = ticket;
    });

    document.getElementById("sumRemaining").innerText = sumRemaining;
    document.getElementById("sumTotal").innerText = sumTotal;

    updateRequired(sumRemaining);
    updateResults(sumRemaining);
}

/* ============================
   🔵 전부 획득 시 필요한 티켓
============================ */
function updateRequired(sumRemaining) {
    const required = sumRemaining * selectedTicket;

    document.getElementById("required-box").innerHTML = `
        <h3>전부 획득 시 필요한 티켓 : ${required}</h3>
    `;
}

/* ============================
   🔵 결과 표
============================ */
function updateResults(sumRemaining) {
    // 전부반환 / 최종제외 / 최종&A 제외
    let totalRefund = 0;
    let exceptFinal = 0;
    let exceptFinalA = 0;

    currentData.forEach((row, index) => {
        const name = row.name;
        const ticket = parseFloat(document.getElementById(`ticket_${index}`).innerText);

        totalRefund += ticket;

        if (name !== "최종보상") exceptFinal += ticket;
        if (name !== "최종보상" && name !== "A") exceptFinalA += ticket;
    });

    const required = sumRemaining * selectedTicket;

    // 손익 계산 (양수 초록 / 음수 빨강)
    const getColored = (value) => {
        const color = value >= 0 ? "green" : "red";
        return `<span class="${color}">${value}</span>`;
    };

    let html = `
        <table>
            <tr><th colspan="2">결과</th></tr>
            <tr><td>전부 반환</td><td>${totalRefund.toFixed(1)}</td></tr>
            <tr><td>최종 제외</td><td>${exceptFinal.toFixed(1)}</td></tr>
            <tr><td>최종 & A 제외</td><td>${exceptFinalA.toFixed(1)}</td></tr>
            <tr><td>티켓 손익</td><td>${getColored((totalRefund - required).toFixed(1))}</td></tr>
            <tr><td>보석 가치</td><td>${getColored(((totalRefund - required) * 300).toFixed(0))}</td></tr>
        </table>
    `;

    document.getElementById("result-area").innerHTML = html;
}

/* ============================
   🔵 초기 실행
============================ */
initButtons();
