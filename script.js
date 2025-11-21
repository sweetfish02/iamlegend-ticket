/******************************************************
 *  데이터 로드
 ******************************************************/
const boxData = DATA; // data.js에 있는 데이터

let selectedTicket = null;
let selectedBox = null;

const ticketButtons = document.querySelectorAll("#ticketButtons .select-btn");
const boxButtons = document.querySelectorAll("#boxButtons .select-btn");

const tableArea = document.getElementById("table-area");
const resultArea = document.getElementById("result-area");
const requiredBox = document.getElementById("required-box");

let openDropdown = null;

/******************************************************
 *  티켓 단가 선택
 ******************************************************/
ticketButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        selectedTicket = Number(btn.dataset.ticket);

        ticketButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // 상자 버튼 활성/비활성 업데이트
        updateBoxButtons();

        // 표 초기화
        clearTables();
    });
});

/******************************************************
 *  상자 개수 버튼 활성화 로직
 ******************************************************/
function updateBoxButtons() {
    boxButtons.forEach(btn => {
        const boxCount = Number(btn.dataset.box);

        if (selectedTicket && boxData[selectedTicket][boxCount]) {
            btn.classList.remove("disabled-btn");
            btn.disabled = false;
        } else {
            btn.classList.add("disabled-btn");
            btn.disabled = true;
        }

        btn.classList.remove("active");
    });
}

/******************************************************
 *  상자 클릭 처리
 ******************************************************/
boxButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.classList.contains("disabled-btn")) return;

        selectedBox = Number(btn.dataset.box);

        boxButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        loadTable();
    });
});

/******************************************************
 *  표 그리기
 ******************************************************/
function loadTable() {
    if (!selectedTicket || !selectedBox) return;

    const data = boxData[selectedTicket][selectedBox];
    if (!data) {
        tableArea.innerHTML = `<p style="color:red; font-weight:bold; text-align:center;">만족하는 상자 없음</p>`;
        resultArea.innerHTML = "";
        requiredBox.innerHTML = "";
        return;
    }

    const rows = Object.keys(data);

    let html = `
        <table>
            <tr>
                <th>보상 종류</th>
                <th>남은 개수 <span class="tooltip-icon">?</span>
                    <span class="tooltip-box">현재 이벤트 창의 수량을 직접 입력하세요.</span>
                </th>
                <th>전체 개수</th>
                <th>단가</th>
                <th>점수</th>
                <th>티켓화</th>
            </tr>
    `;

    rows.forEach(r => {
        const maxVal = data[r].total;

        html += `
            <tr>
                <td>${r}</td>
                <td class="input-cell">
                    <div class="dropdown-wrapper" data-row="${r}">
                        <input type="number" value="${data[r].left}" min="0" max="${maxVal}" readonly />
                        <div class="dropdown-btn">▼</div>
                        <div class="dropdown-list" style="display:none;">
                            ${Array.from({ length: maxVal + 1 }, (_, i) => `<div class="dropdown-item">${i}</div>`).join("")}
                        </div>
                    </div>
                </td>
                <td>${data[r].total}</td>
                <td>${data[r].value}</td>
                <td class="score-cell">0</td>
                <td class="ticket-cell">0</td>
            </tr>
        `;
    });

    html += `</table>`;

    tableArea.innerHTML = html;

    attachDropdownEvents();
    calculate();
}

/******************************************************
 *  드롭다운 이벤트
 ******************************************************/
function attachDropdownEvents() {
    document.querySelectorAll(".dropdown-wrapper").forEach(wrap => {
        const btn = wrap.querySelector(".dropdown-btn");
        const list = wrap.querySelector(".dropdown-list");
        const input = wrap.querySelector("input");

        btn.addEventListener("click", () => {
            if (openDropdown && openDropdown !== list) openDropdown.style.display = "none";
            list.style.display = list.style.display === "block" ? "none" : "block";
            openDropdown = list;
        });

        wrap.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", () => {
                input.value = item.textContent;
                list.style.display = "none";
                calculate();
            });
        });
    });

    document.body.addEventListener("click", e => {
        if (!e.target.closest(".dropdown-wrapper")) {
            if (openDropdown) openDropdown.style.display = "none";
        }
    });
}

/******************************************************
 *  계산 실행
 ******************************************************/
function calculate() {
    const rows = document.querySelectorAll("#table-area table tr");
    if (rows.length <= 1) return;

    let totalLeft = 0;

    rows.forEach((row, i) => {
        if (i === 0) return;

        const tds = row.querySelectorAll("td");
        const left = Number(tds[1].querySelector("input").value);
        const total = Number(tds[2].textContent);
        const value = Number(tds[3].textContent);

        if (i > 1) totalLeft += left;

        const score = left * value;
        const ticket = score / 30;

        tds[4].textContent = score.toFixed(0);
        tds[5].textContent = ticket.toFixed(1);
    });

    const required = totalLeft * selectedTicket;

    requiredBox.innerHTML = `
        <h3>전부 획득 시 필요한 티켓: <b>${required}</b></h3>
    `;

    calculateResult(required);
}

/******************************************************
 *  결과표 계산
 ******************************************************/
function calculateResult(required) {
    const ticketCells = document.querySelectorAll(".ticket-cell");

    let sumFull = 0, sumNoFinal = 0, sumNoFinalA = 0;

    ticketCells.forEach((cell, i) => {
        const v = Number(cell.textContent);

        sumFull += v;
        if (i !== 0) sumNoFinal += v;
        if (i !== 0 && i !== 1) sumNoFinalA += v;
    });

    const p1 = sumFull - required;
    const p2 = sumNoFinal - required;
    const p3 = sumNoFinalA - required;

    const g1 = p1 * 300;
    const g2 = p2 * 300;
    const g3 = p3 * 300;

    resultArea.innerHTML = `
        <table>
            <tr>
                <th>구분</th>
                <th>전부 반환</th>
                <th>최종 제외</th>
                <th>최종 & A 제외</th>
            </tr>

            <tr>
                <td>반환 시 돌려받는 티켓</td>
                <td>${sumFull.toFixed(1)}</td>
                <td>${sumNoFinal.toFixed(1)}</td>
                <td>${sumNoFinalA.toFixed(1)}</td>
            </tr>

            <tr>
                <td>티켓 손익</td>
                <td class="${p1 >= 0 ? "green" : "red"}">${p1.toFixed(1)}</td>
                <td class="${p2 >= 0 ? "green" : "red"}">${p2.toFixed(1)}</td>
                <td class="${p3 >= 0 ? "green" : "red"}">${p3.toFixed(1)}</td>
            </tr>

            <tr>
                <td>보석 가치</td>
                <td class="${g1 >= 0 ? "green" : "red"}">${g1.toFixed(0)}</td>
                <td class="${g2 >= 0 ? "green" : "red"}">${g2.toFixed(0)}</td>
                <td class="${g3 >= 0 ? "green" : "red"}">${g3.toFixed(0)}</td>
            </tr>
        </table>
    `;
}

/******************************************************
 *  표 초기화
 ******************************************************/
function clearTables() {
    tableArea.innerHTML = "";
    resultArea.innerHTML = "";
    requiredBox.innerHTML = "";
}
