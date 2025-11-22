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
        document.querySelector(`button[data-ticket="${selectedTicket}"]`)
            .classList.add("active");

        boxBtns.forEach(btn => {
            const key = `${selectedTicket}_${btn.dataset.box}`;
            if (!imageMap[key]) {
                btn.classList.add("disabled-btn");
                btn.disabled = true;
            }
        });
    }

    if (selectedBox) {
        document.querySelector(`button[data-box="${selectedBox}"]`)
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

    if (!data) return;

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
        const isFinal = item.name === "최종보상";

        html += `
        <tr>
            <td>${item.name}</td>
            <td class="input-cell">
                ${
                    isFinal ? `<input type="number" value="1" readonly />` :
                    `<div class="dropdown-wrapper">
                        <input type="number" class="remain-input" data-row="${i}" min="0" max="${item.count}" value="${item.count}">
                        <div class="dropdown-btn" onclick="toggleDropdown(${i})">▼</div>
                        <div class="dropdown-list" id="drop-${i}">
                            ${Array.from({length:item.count+1},(_,v)=>`<div class="dropdown-item" onclick="selectRemain(${i},${v})">${v}</div>`).join("")}
                        </div>
                    </div>`
                }
            </td>
            <td>${item.count}</td>
            <td>${item.price}</td>
            <td class="score-cell"></td>
            <td class="ticket-cell"></td>
        </tr>`;
    });

    html += "</table>";
    area.innerHTML = html;

    calculate();
}

window.toggleDropdown = function(i){
    document.querySelectorAll(".dropdown-list").forEach(e=>e.style.display="none");
    document.getElementById(`drop-${i}`).style.display="block";
}

window.selectRemain = function(i,val){
    document.querySelector(`input[data-row="${i}"]`).value = val;
    calculate();
}

/* ===============================
   CALCULATION
=============================== */
function calculate() {
    const key = `${selectedTicket}_${selectedBox}`;
    const data = rewardData[key];
    if (!data) return;

    let remains = [];

    document.querySelectorAll(".remain-input").forEach((inp, i) => {
        const max = data[i + 1].count;
        let v = Math.min(Number(inp.value), max);
        inp.value = v;
        remains[i] = v;
    });

    const totalRemain = remains.reduce((a,b)=>a+b,0);
    const required = totalRemain * Number(selectedTicket);

    document.getElementById("required-box").innerHTML = `
        <div style="text-align:center; margin:20px 0; font-size:18px; font-weight:bold;">
            전부 획득 시 필요한 티켓 → <span style="color:red">${required}</span>
        </div>
    `;

    const rows = document.querySelectorAll("#table-area tr");

    rows.forEach((row, i) => {
        if (i===0) return;
        const item = data[i-1];
        const remain = (i===1)?1:remains[i-2];

        const score = item.price * remain;
        const ticket = score / 30;

        row.querySelector(".score-cell").textContent = score;
        row.querySelector(".ticket-cell").textContent = ticket.toFixed(1);
    });

    renderResult(required);
}

/* ===============================
   RESULT TABLE
=============================== */
function renderResult(required){
    const rows = document.querySelectorAll("#table-area tr");
    let total=0, exFinal=0, exAFinal=0;

    rows.forEach((row,i)=>{
        if(i===0) return;
        let t = parseFloat(row.querySelector(".ticket-cell").textContent) || 0;
        let name = row.children[0].textContent;

        total += t;
        if(name!=="최종보상") exFinal += t;
        if(name!=="최종보상" && name!=="A") exAFinal += t;
    });

    document.getElementById("result-area").innerHTML = `
        <table>
            <tr><th>구분</th><th>전부 반환</th><th>최종 제외</th><th>최종&A 제외</th></tr>
            <tr><td>티켓</td><td>${total.toFixed(1)}</td><td>${exFinal.toFixed(1)}</td><td>${exAFinal.toFixed(1)}</td></tr>
            <tr><td>손익</td><td>${(total-required).toFixed(1)}</td><td>${(exFinal-required).toFixed(1)}</td><td>${(exAFinal-required).toFixed(1)}</td></tr>
        </table>
    `;
}

/* ===============================
   IMAGE RENDER
=============================== */
function renderImages(){
    const key = `${selectedTicket}_${selectedBox}`;
    const imgs = imageMap[key];

    const area = document.getElementById("image-area");
    area.innerHTML = "";

    if(!imgs) return;

    area.innerHTML = imgs.map(src=>`<img src="${src}" style="width:90px; margin-left:10px;">`).join("");
}
