/* ================================
    🔵 설정 및 초기 변수
================================ */

let selectedTicket = null;  // "2" 또는 "3"
let selectedBox = null;     // "80", "120", ...
const tableArea = document.getElementById("table-area");
const resultArea = document.getElementById("result-area");
const requiredBox = document.getElementById("required-box");

/* 버튼 목록 */
const ticketButtons = document.querySelectorAll("#ticketButtons .select-btn");
const boxButtons = document.querySelectorAll("#boxButtons .select-btn");

/* ================================
    🔵 티켓 단가 선택
================================ */
ticketButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        ticketButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        selectedTicket = btn.dataset.ticket;   // 문자열 그대로
        selectedBox = null;

        clearAllBelow();
        updateBoxButtonState();
    });
});

/* ================================
    🔵 상자 개수 버튼 활성/비활성
================================ */
function updateBoxButtonState() {
    boxButtons.forEach(btn => {
        const box = btn.dataset.box;
        const key = `${selectedTicket}_${box}`;

        if (rewardData[key]) {
            btn.disabled = false;
            btn.classList.remove("disabled-btn");
        } else {
            btn.disabled = true;
            btn.classList.add("disabled-btn");
        }

        btn.classList.remove("active");
    });
}

/* ================================
    🔵 상자 개수 클릭
================================ */
boxButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.disabled) return;

        boxButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        selectedBox = btn.dataset.box;
        renderMainTable();
    });
});

/* ================================
    🔵 표 생성
================================ */
function renderMainTable() {
    clearAllBelow();
    const key = `${selectedTicket}_${selectedBox}`;
    const rows = rewardData[key];

    if (!rows) {
        tableArea.innerHTML = `<p style="color:red; font-weight:bold;">만족하는 상자 없음</p>`;
        return;
    }

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

    rows.forEach((r, idx) => {
        const total = r.count;

        const list = Array.from({ length: total + 1 }, (_, i) => `
            <div class="dropdown-item" data-value="${i}">${i}</div>
        `).join("");

        html += `
            <tr>
                <td>${r.name}</td>

                <td class="input-cell">
                    <div class="dropdown-wrapper">
                        <input type="number" id="remain_${idx}" value="0" readonly />
                        <div class="dropdown-btn" data-idx="${idx}">▼</div>
                        <div class="dropdown-list" id="list_${idx}" style="display:none;">
                            ${list}
                        </div>
                    </div>
                </td>

                <td>${total}</td>
                <td>${r.price}</td>
                <td id="score_${idx}">0</td>
                <td id="ticket_${idx}">0</td>
            </tr>
        `;
    });

    // 🔵 합계 행
    const sumTotal = rows
        .filter(r => r.name !== "최종보상")
        .reduce((a, b) => a + b.count, 0);

    html += `
        <tr>
            <th>합계</th>
            <td id="sumRemain"></td>
            <td>${sumTotal}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>`;

    tableArea.innerHTML = html;

    activateDropdowns(rows);
}

/* ================================
    🔵 드롭다운 동작
================================ */
function activateDropdowns(rows) {
    const dropdownBtns = document.querySelectorAll(".dropdown-btn");

    dropdownBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            closeDropdowns();
            const idx = btn.dataset.idx;
            document.getElementById(`list_${idx}`).style.display = "block";
        });
    });

    document.querySelectorAll(".dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
            const list = item.parentElement;
            const idx = list.id.split("_")[1];
            const maxVal = rows[idx].count;

            let v = Number(item.dataset.value);
            if (v > maxVal) v = maxVal;

            document.getElementById(`remain_${idx}`).value = v;

            closeDropdowns();
            calculateAll(rows);
        });
    });

    document.body.addEventListener("click", e => {
        if (!e.target.closest(".dropdown-wrapper")) closeDropdowns();
    });
}

function closeDropdowns() {
    document.querySelectorAll(".dropdown-list").forEach(list => {
        list.style.display = "none";
    });
}

/* ================================
    🔵 계산
================================ */
function calculateAll(rows) {
    let sumRemain = 0;
    let fullReturn = 0;
    let noFinal = 0;
    let noFinalA = 0;

    rows.forEach((r, idx) => {
        const left = Number(document.getElementById(`remain_${idx}`).value);
        const price = r.price;

        const score = left * price;
        const ticket = score / 30;

        document.getElementById(`score_${idx}`).innerText = Math.round(score);
        document.getElementById(`ticket_${idx}`).innerText = ticket.toFixed(1);

        if (r.name !== "최종보상") sumRemain += left;

        fullReturn += ticket;
        if (r.name !== "최종보상") noFinal += ticket;
        if (r.name !== "최종보상" && r.name !== "A") noFinalA += ticket;
    });

    document.getElementById("sumRemain").innerText = sumRemain;

    const required = sumRemain * Number(selectedTicket);
    requiredBox.innerHTML = `<h3>전부 획득 시 필요한 티켓: <b>${required}</b></h3>`;

    renderResult(fullReturn, noFinal, noFinalA, required);
}

/* ================================
    🔵 결과표 출력
================================ */
function renderResult(full, noF, noFA, need) {
    function color(v) {
        return v >= 0 ? `<span class="green">${v}</span>`
                      : `<span class="red">${v}</span>`;
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
                <td>${full.toFixed(1)}</td>
                <td>${noF.toFixed(1)}</td>
                <td>${noFA.toFixed(1)}</td>
            </tr>
            <tr>
                <td>티켓 손익</td>
                <td>${color((full - need).toFixed(1))}</td>
                <td>${color((noF - need).toFixed(1))}</td>
                <td>${color((noFA - need).toFixed(1))}</td>
            </tr>
            <tr>
                <td>보석 가치</td>
                <td>${color(((full - need) * 300).toFixed(0))}</td>
                <td>${color(((noF - need) * 300).toFixed(0))}</td>
                <td>${color(((noFA - need) * 300).toFixed(0))}</td>
            </tr>
        </table>
    `;
}

/* ================================
    🔵 초기화
================================ */
function clearAllBelow() {
    tableArea.innerHTML = "";
    requiredBox.innerHTML = "";
    resultArea.innerHTML = "";
}
