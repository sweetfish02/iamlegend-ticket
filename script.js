/* --------------------------
   🔵 데이터 불러오기
--------------------------- */

let selectedTicket = null;  // 문자열로 저장
let selectedBox = null;

const tableArea = document.getElementById("table-area");
const resultArea = document.getElementById("result-area");
const requiredBox = document.getElementById("required-box");

const ticketButtons = document.querySelectorAll("#ticketButtons .select-btn");
const boxButtons = document.querySelectorAll("#boxButtons .select-btn");

/* --------------------------
   🔵 티켓 단가 버튼 클릭
--------------------------- */
ticketButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        ticketButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        selectedTicket = btn.dataset.ticket; // **문자열 그대로 저장**

        selectedBox = null;
        clearLowerSections();
        updateBoxButtons();
    });
});

/* --------------------------
   🔵 상자 개수 버튼 활성/비활성
--------------------------- */
function updateBoxButtons() {
    const ticketKey = String(selectedTicket);

    boxButtons.forEach(btn => {
        const boxCount = btn.dataset.box;

        if (selectedTicket && DATA[ticketKey] && DATA[ticketKey][boxCount]) {
            btn.classList.remove("disabled-btn");
            btn.disabled = false;
        } else {
            btn.classList.add("disabled-btn");
            btn.disabled = true;
        }

        btn.classList.remove("active");
    });
}

/* --------------------------
   🔵 상자 개수 클릭
--------------------------- */
boxButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.disabled) return;

        boxButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        selectedBox = btn.dataset.box; // 문자열 그대로 저장

        renderTable();
    });
});

/* --------------------------
   🔵 중간 표 + 드롭다운 + 계산
--------------------------- */
function renderTable() {
    clearLowerSections();

    if (!DATA[selectedTicket] || !DATA[selectedTicket][selectedBox]) {
        tableArea.innerHTML = `<p style="color:red; font-weight:bold;">만족하는 상자 없음</p>`;
        return;
    }

    const info = DATA[selectedTicket][selectedBox];
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

    info.rows.forEach((row, idx) => {
        const type = row.type;
        const total = row.total;
        const price = row.price;

        html += `
            <tr>
                <td>${type}</td>
                <td class="input-cell">
                    ${createDropdown(idx, total)}
                </td>
                <td>${total}</td>
                <td>${price}</td>
                <td id="score_${idx}">0</td>
                <td id="ticket_${idx}">0</td>
            </tr>
        `;
    });

    // ⭐ 합계 행
    html += `
        <tr>
            <th>합계</th>
            <td id="sumRemain"></td>
            <td id="sumTotal">${info.totalWithoutFinal}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>`;

    tableArea.innerHTML = html;

    activateDropdowns(info.rows);
}

/* --------------------------
   🔵 드롭다운 UI 구성
--------------------------- */
function createDropdown(idx, maxVal) {
    let listItems = "";
    for (let i = 0; i <= maxVal; i++) {
        listItems += `<div class="dropdown-item" data-value="${i}">${i}</div>`;
    }

    return `
        <div class="dropdown-wrapper">
            <input type="number" id="remain_${idx}" value="0" readonly />
            <span class="dropdown-btn" data-idx="${idx}">▼</span>
            <div class="dropdown-list" id="list_${idx}" style="display:none;">
                ${listItems}
            </div>
        </div>
    `;
}

/* --------------------------
   🔵 드롭다운 동작
--------------------------- */
function activateDropdowns(rows) {
    const dropdownBtns = document.querySelectorAll(".dropdown-btn");

    dropdownBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            closeAllDropdowns();

            const idx = btn.dataset.idx;
            document.getElementById(`list_${idx}`).style.display = "block";
        });
    });

    const items = document.querySelectorAll(".dropdown-item");
    items.forEach(item => {
        item.addEventListener("click", () => {
            const idx = item.parentElement.id.split("_")[1];
            const value = Number(item.dataset.value);
            const maxVal = rows[idx].total;

            let v = Math.min(value, maxVal);

            document.getElementById(`remain_${idx}`).value = v;

            closeAllDropdowns();
            calculate();
        });
    });
}

function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-list").forEach(list => {
        list.style.display = "none";
    });
}

/* --------------------------
   🔵 계산 수행
--------------------------- */
function calculate() {
    const info = DATA[selectedTicket][selectedBox];
    const rows = info.rows;

    let sumRemain = 0;
    let totalReturn = 0;
    let returnNoFinal = 0;
    let returnNoFinalA = 0;

    rows.forEach((row, idx) => {
        const n = Number(document.getElementById(`remain_${idx}`).value);
        const price = row.price;

        const score = n * price;
        const ticket = score / 30;

        document.getElementById(`score_${idx}`).innerText = Math.round(score);
        document.getElementById(`ticket_${idx}`).innerText = ticket.toFixed(1);

        if (idx > 0) sumRemain += n; // 최종보상 제외
        totalReturn += ticket;
        if (idx !== 0) returnNoFinal += ticket;
        if (idx !== 0 && idx !== 1) returnNoFinalA += ticket;
    });

    document.getElementById("sumRemain").innerText = sumRemain;

    const need = sumRemain * Number(selectedTicket);

    requiredBox.innerHTML = `
        <h3>전부 획득 시 필요한 티켓: <b>${need}</b></h3>
    `;

    renderResult(totalReturn, returnNoFinal, returnNoFinalA, need);
}

/* --------------------------
   🔵 결과 표 출력
--------------------------- */
function renderResult(all, noFinal, noFinalA, need) {
    function colored(v) {
        if (v < 0) return `<span class="red">${v}</span>`;
        return `<span class="green">${v}</span>`;
    }

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
            <td>${all.toFixed(1)}</td>
            <td>${noFinal.toFixed(1)}</td>
            <td>${noFinalA.toFixed(1)}</td>
        </tr>
        <tr>
            <td>티켓 손익</td>
            <td>${colored((all - need).toFixed(1))}</td>
            <td>${colored((noFinal - need).toFixed(1))}</td>
            <td>${colored((noFinalA - need).toFixed(1))}</td>
        </tr>
        <tr>
            <td>보석 가치</td>
            <td>${colored(((all - need) * 300).toFixed(0))}</td>
            <td>${colored(((noFinal - need) * 300).toFixed(0))}</td>
            <td>${colored(((noFinalA - need) * 300).toFixed(0))}</td>
        </tr>
    </table>
    `;
}

/* --------------------------
   🔵 하위 섹션 초기화
--------------------------- */
function clearLowerSections() {
    tableArea.innerHTML = "";
    resultArea.innerHTML = "";
    requiredBox.innerHTML = "";
}
