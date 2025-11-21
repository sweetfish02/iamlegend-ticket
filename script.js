/* ===============================
   데이터 로드 (data.js에서 rewardData 사용)
================================ */
let selectedTicket = null;
let selectedBox = null;

/* 필요한 예시 목록 추출 */
function getValidBoxes(ticket) {
    return Object.keys(rewardData)
        .filter(key => key.startsWith(ticket + "_"))
        .map(key => Number(key.split("_")[1]));
}

/* ===============================
   버튼 클릭 설정
================================ */
document.querySelectorAll("#ticketButtons .select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        selectedTicket = Number(btn.dataset.ticket);

        /* 티켓 단가 선택 표시 */
        document.querySelectorAll("#ticketButtons .select-btn")
            .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        /* 상자 개수 버튼을 조건에 맞게 활성/비활성 */
        setBoxButtonState();

        /* 표 초기화 */
        document.getElementById("table-area").innerHTML = "";
        document.getElementById("required-box").innerHTML = "";
        document.getElementById("result-area").innerHTML = "";
    });
});

/* ===============================
   상자 개수 버튼 상태 구성
================================ */
function setBoxButtonState() {
    const boxButtons = document.querySelectorAll("#boxButtons .select-btn");
    const validBoxes = getValidBoxes(selectedTicket);

    boxButtons.forEach(b => {
        const val = Number(b.dataset.box);
        if (validBoxes.includes(val)) {
            b.classList.remove("disabled-btn");
            b.disabled = false;
        } else {
            b.classList.add("disabled-btn");
            b.disabled = true;
        }
        b.classList.remove("active");
    });
}

/* ===============================
   상자 개수 클릭
================================ */
document.querySelectorAll("#boxButtons .select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (btn.disabled) return;

        selectedBox = Number(btn.dataset.box);

        /* 선택 표시 */
        document.querySelectorAll("#boxButtons .select-btn")
            .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        buildTable();
    });
});

/* ===============================
   표 생성
================================ */
function buildTable() {

    const key = `${selectedTicket}_${selectedBox}`;
    const rows = rewardData[key];

    if (!rows) {
        document.getElementById("table-area").innerHTML =
            `<div style="color:red; font-size:20px; margin-top:20px;">만족하는 상자 없음</div>`;
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

        /* 드롭다운 목록 생성 */
        let listHtml = "";
        for (let i = 0; i <= total; i++) {
            listHtml += `<div class="dropdown-item" data-value="${i}" data-idx="${idx}">${i}</div>`;
        }

        /* 최종보상 고정 */
        let inputHtml = "";
        let dropdownHtml = "";

        if (idx === 0) {
            inputHtml = `<input type="number" id="remain_${idx}" value="1" readonly />`;
        } else {
            inputHtml = `<input type="number" id="remain_${idx}" value="0" />`;
            dropdownHtml = `
                <div class="dropdown-btn" data-idx="${idx}">▼</div>
                <div class="dropdown-list" id="list_${idx}" style="display:none;">
                    ${listHtml}
                </div>
            `;
        }

        html += `
        <tr>
            <td>${r.name}</td>
            <td class="input-cell">
                <div class="dropdown-wrapper">
                    ${inputHtml}
                    ${dropdownHtml}
                </div>
            </td>
            <td>${total}</td>
            <td>${r.price}</td>
            <td id="score_${idx}">0</td>
            <td id="ticket_${idx}">0</td>
        </tr>
        `;
    });

    /* 합계 행 */
    const totalCount = rows.slice(1).reduce((sum, r) => sum + r.count, 0);

    html += `
        <tr style="background:#e3f2fd; font-weight:bold;">
            <td>합계</td>
            <td id="sumRemain">0</td>
            <td>${totalCount}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </table>
    `;

    document.getElementById("table-area").innerHTML = html;

    activateDropdowns(rows);
    setupManualInput(rows);

    calculateAll(rows);
}

/* ===============================
   드롭다운 기능
================================ */
function activateDropdowns(rows) {

    document.querySelectorAll(".dropdown-btn").forEach(btn => {
        btn.addEventListener("click", () => {

            /* 모든 드롭다운 닫기 */
            document.querySelectorAll(".dropdown-list").forEach(l => l.style.display = "none");

            const idx = btn.dataset.idx;
            const list = document.getElementById("list_" + idx);
            list.style.display = (list.style.display === "block" ? "none" : "block");
        });
    });

    /* 항목 클릭 */
    document.querySelectorAll(".dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
            const idx = item.dataset.idx;
            const value = Number(item.dataset.value);

            const input = document.getElementById("remain_" + idx);
            input.value = value;

            document.getElementById("list_" + idx).style.display = "none";

            calculateAll(rows);
        });
    });
}

/* ===============================
   직접 입력 기능
================================ */
function setupManualInput(rows) {

    rows.forEach((r, idx) => {

        if (idx === 0) return; // 최종보상 제외

        const input = document.getElementById(`remain_${idx}`);
        const maxVal = r.count;

        input.addEventListener("input", () => {
            let v = Number(input.value);

            if (isNaN(v) || v < 0) v = 0;
            if (v > maxVal) v = maxVal;

            input.value = v;
            calculateAll(rows);
        });
    });
}

/* ===============================
   계산
================================ */
function calculateAll(rows) {

    let totalRemain = 0;

    rows.forEach((r, idx) => {

        let remain = Number(document.getElementById(`remain_${idx}`).value);
        if (idx !== 0) totalRemain += remain;

        const score = remain * r.price;
        const ticket = score / 30;

        document.getElementById(`score_${idx}`).textContent = score.toFixed(0);
        document.getElementById(`ticket_${idx}`).textContent = ticket.toFixed(1);
    });

    document.getElementById("sumRemain").textContent = totalRemain;

    buildRequiredTicket(totalRemain);
    buildResultTable(rows, totalRemain);
}

/* ===============================
   전부 획득 시 필요한 티켓
================================ */
function buildRequiredTicket(sumRemain) {
    const needed = selectedTicket * sumRemain;

    document.getElementById("required-box").innerHTML = `
        <div style="margin-top:18px; font-size:20px;">
            <b>전부 획득 시 필요한 티켓:</b> ${needed}
        </div>
    `;
}

/* ===============================
   아래 결과표
================================ */
function buildResultTable(rows, sumRemain) {

    const needed = selectedTicket * sumRemain;

    /* 전체 티켓화 합 */
    const totalTickets = rows.reduce((s, r, i) =>
        s + (Number(document.getElementById(`ticket_${i}`).textContent)), 0);

    /* 최종보상 제외 */
    const exceptFinal = rows.slice(1).reduce((s, r, i) =>
        s + Number(document.getElementById(`ticket_${i+1}`).textContent), 0);

    /* 최종 & A 제외 */
    const exceptFA = rows.slice(2).reduce((s, r, i) =>
        s + Number(document.getElementById(`ticket_${i+2}`).textContent), 0);

    /* 손익 */
    const p1 = totalTickets - needed;
    const p2 = exceptFinal - needed;
    const p3 = exceptFA - needed;

    /* 보석 가치 */
    const j1 = p1 * 300;
    const j2 = p2 * 300;
    const j3 = p3 * 300;

    function color(v) {
        return v >= 0 ? "green" : "red";
    }

    const html = `
    <table style="margin-top:20px;">
        <tr><th>구분</th><th>전부 반환</th><th>최종 제외</th><th>최종 & A 제외</th></tr>

        <tr>
            <td>반환 시 돌려받는 티켓</td>
            <td>${totalTickets.toFixed(1)}</td>
            <td>${exceptFinal.toFixed(1)}</td>
            <td>${exceptFA.toFixed(1)}</td>
        </tr>

        <tr>
            <td>티켓 손익</td>
            <td class="${color(p1)}">${p1.toFixed(1)}</td>
            <td class="${color(p2)}">${p2.toFixed(1)}</td>
            <td class="${color(p3)}">${p3.toFixed(1)}</td>
        </tr>

        <tr>
            <td>보석 가치</td>
            <td class="${color(j1)}">${j1.toFixed(0)}</td>
            <td class="${color(j2)}">${j2.toFixed(0)}</td>
            <td class="${color(j3)}">${j3.toFixed(0)}</td>
        </tr>
    </table>
    `;

    document.getElementById("result-area").innerHTML = html;
}
