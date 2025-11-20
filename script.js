/* Data presets derived from user-provided images
   Keys: "{ticket}_{box}" e.g. "3_160"
   Rows order: 최종보상, A, B, C, D, E, F, G
*/
const defaultPresets = {
  "3_160": [
    {name:"최종보상", total:1, unit:540},
    {name:"A", total:2, unit:540},
    {name:"B", total:3, unit:360},
    {name:"C", total:6, unit:180},
    {name:"D", total:9, unit:120},
    {name:"E", total:40, unit:60},
    {name:"F", total:40, unit:27},
    {name:"G", total:60, unit:18}
  ],
  "3_80":[
    {name:"최종보상", total:1, unit:540},
    {name:"A", total:1, unit:540},
    {name:"B", total:1, unit:360},
    {name:"C", total:3, unit:180},
    {name:"D", total:4, unit:135},
    {name:"E", total:20, unit:60},
    {name:"F", total:20, unit:27},
    {name:"G", total:30, unit:18}
  ],
  "2_240":[
    {name:"최종보상", total:1, unit:540},
    {name:"A", total:0, unit:540},
    {name:"B", total:0, unit:360},
    {name:"C", total:0, unit:180},
    {name:"D", total:0, unit:120},
    {name:"E", total:0, unit:60},
    {name:"F", total:0, unit:27},
    {name:"G", total:0, unit:18}
  ],
  "2_160":[
    {name:"최종보상", total:1, unit:360},
    {name:"A", total:2, unit:360},
    {name:"B", total:3, unit:240},
    {name:"C", total:6, unit:120},
    {name:"D", total:9, unit:80},
    {name:"E", total:40, unit:40},
    {name:"F", total:40, unit:18},
    {name:"G", total:60, unit:12}
  ],
  "2_80":[
    {name:"최종보상", total:1, unit:360},
    {name:"A", total:1, unit:360},
    {name:"B", total:1, unit:240},
    {name:"C", total:3, unit:120},
    {name:"D", total:4, unit:90},
    {name:"E", total:20, unit:40},
    {name:"F", total:20, unit:18},
    {name:"G", total:30, unit:12}
  ],
  "2_120":[
    {name:"최종보상", total:1, unit:360},
    {name:"A", total:2, unit:360},
    {name:"B", total:2, unit:240},
    {name:"C", total:4, unit:120},
    {name:"D", total:7, unit:85},
    {name:"E", total:30, unit:40},
    {name:"F", total:30, unit:18},
    {name:"G", total:44, unit:12}
  ],
  "3_120": null,
  "3_240": null,
  "2_240_filled": null
};

let selectedTicketPrice = 3;
let selectedBoxCount = 160;
let currentRows = [];

function id(v){ return document.getElementById(v); }

function renderButtons(){
  const tBtns = id('ticketPriceButtons');
  tBtns.innerHTML = '';
  [3,2].forEach(v=>{
    const b = document.createElement('button');
    b.textContent = v;
    if(v===selectedTicketPrice) b.classList.add('active');
    b.onclick = () => { selectedTicketPrice = v; renderButtons(); loadPreset(); };
    tBtns.appendChild(b);
  });

  const boxBtns = id('boxCountButtons');
  boxBtns.innerHTML = '';
  [240,160,120,80].forEach(v=>{
    const b = document.createElement('button');
    b.textContent = v;
    if(v===selectedBoxCount) b.classList.add('active');
    b.onclick = () => { selectedBoxCount = v; renderButtons(); loadPreset(); };
    boxBtns.appendChild(b);
  });

  id('currentSelection').textContent = `${selectedTicketPrice} 티켓 / ${selectedBoxCount}개`;
}

function loadPreset(){
  const key = `${selectedTicketPrice}_${selectedBoxCount}`;
  const preset = defaultPresets[key];
  if(!preset){
    // leave table empty but with 8 rows (names present)
    currentRows = [
      {name:"최종보상", total:1, unit:0, remain:0},
      {name:"A", total:0, unit:0, remain:0},
      {name:"B", total:0, unit:0, remain:0},
      {name:"C", total:0, unit:0, remain:0},
      {name:"D", total:0, unit:0, remain:0},
      {name:"E", total:0, unit:0, remain:0},
      {name:"F", total:0, unit:0, remain:0},
      {name:"G", total:0, unit:0, remain:0}
    ];
  } else {
    currentRows = preset.map(r => ({ name:r.name, total: r.total, unit:r.unit, remain: 0 }));
  }
  renderMiddleTable();
  refreshPresetJson();
  recomputeAll();
}

function renderMiddleTable(){
  const tbody = id('middleBody');
  tbody.innerHTML = '';
  currentRows.forEach((r, idx)=>{
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = r.name;
    tr.appendChild(tdName);

    const tdRemain = document.createElement('td');
    tdRemain.className = 'yellow';
    const input = document.createElement('input');
    input.type = 'number';
    input.value = r.remain;
    input.min = 0;
    input.max = r.total;
    input.className = 'small';
    input.oninput = (e) => {
      let v = Number(e.target.value);
      if(isNaN(v)) v = 0;
      if(v < 0) v = 0;
      if(v > r.total) v = r.total;
      r.remain = Math.floor(v);
      e.target.value = r.remain;
      renderMiddleTable();
      recomputeAll();
    };
    tdRemain.appendChild(input);
    tr.appendChild(tdRemain);

    const tdTotal = document.createElement('td');
    tdTotal.textContent = r.total;
    tr.appendChild(tdTotal);

    const tdUnit = document.createElement('td');
    tdUnit.textContent = r.unit;
    tr.appendChild(tdUnit);

    const score = r.remain * r.unit;
    const tdScore = document.createElement('td');
    tdScore.textContent = formatNumber(score);
    tr.appendChild(tdScore);

    const tdTick = document.createElement('td');
    tdTick.textContent = formatNumber(score / 30);
    tr.appendChild(tdTick);

    tbody.appendChild(tr);
  });

  const sumRemaining = currentRows.slice(1).reduce((s,r)=>s + Number(r.remain), 0);
  const sumTotal = currentRows.slice(1).reduce((s,r)=>s + Number(r.total), 0);
  const sumScore = currentRows.slice(1).reduce((s,r)=>s + (Number(r.remain)*Number(r.unit)), 0);
  const sumTicketized = sumScore / 30;

  id('sumRemaining').textContent = sumRemaining;
  id('sumTotal').textContent = sumTotal;
  id('sumScore').textContent = formatNumber(sumScore);
  id('sumTicketized').textContent = formatNumber(sumTicketized);
}

function recomputeAll(){
  const sumRemaining = currentRows.slice(1).reduce((s,r)=>s + Number(r.remain), 0);
  const needed = selectedTicketPrice * sumRemaining;
  id('neededTickets').textContent = formatNumber(needed);

  const ticketizeds = currentRows.map(r => (r.remain * r.unit) / 30);
  const totalAll = ticketizeds.reduce((s,x)=>s + x, 0);
  const finalVal = ticketizeds[0] || 0;
  const aVal = ticketizeds[1] || 0;

  const refundAll = roundNumber(totalAll,3);
  const refundExFinal = roundNumber(totalAll - finalVal,3);
  const refundExFinalA = roundNumber(totalAll - finalVal - aVal,3);

  id('refundAll').textContent = formatNumber(refundAll);
  id('refundExFinal').textContent = formatNumber(refundExFinal);
  id('refundExFinalA').textContent = formatNumber(refundExFinalA);

  const profitAll = roundNumber(needed - refundAll,3);
  const profitExFinal = roundNumber(needed - refundExFinal,3);
  const profitExFinalA = roundNumber(needed - refundExFinalA,3);

  id('profitAll').textContent = formatNumber(profitAll);
  id('profitExFinal').textContent = formatNumber(profitExFinal);
  id('profitExFinalA').textContent = formatNumber(profitExFinalA);

  id('gemAll').textContent = formatNumber(profitAll * 300);
  id('gemExFinal').textContent = formatNumber(profitExFinal * 300);
  id('gemExFinalA').textContent = formatNumber(profitExFinalA * 300);
}

function formatNumber(x){
  if(typeof x !== 'number' || !isFinite(x)) return '0';
  if(Math.abs(Math.round(x) - x) < 1e-9) return String(Math.round(x));
  return String(Number(x.toFixed(3))).replace(/\.?0+$/,'');
}
function roundNumber(x,dec=3){ return Number(Number(x).toFixed(dec)); }

function refreshPresetJson(){
  const key = `${selectedTicketPrice}_${selectedBoxCount}`;
  const preset = defaultPresets[key] || currentRows.map(r=>({name:r.name,total:r.total,unit:r.unit}));
  id('presetJson').value = JSON.stringify(preset, null, 2);
}

function applyPresetFromJson(){
  try{
    const txt = id('presetJson').value;
    const parsed = JSON.parse(txt);
    if(!Array.isArray(parsed) || parsed.length < 8){
      alert('프리셋은 배열이어야 하며 8개 항목(최종,A~G)이 포함되어야 합니다.');
      return;
    }
    const rows = parsed.map(item => ({ name:String(item.name||''), total:Number(item.total||0), unit:Number(item.unit||0), remain:0 }));
    const key = `${selectedTicketPrice}_${selectedBoxCount}`;
    defaultPresets[key] = rows.map(r=>({name:r.name,total:r.total,unit:r.unit}));
    loadPreset();
    alert('프리셋 저장 및 적용 완료!');
  } catch(e){
    alert('JSON 파싱 오류: '+e.message);
  }
}
function resetPresetJson(){ refreshPresetJson(); }

document.getElementById('applyPresetBtn').onclick = applyPresetFromJson;
document.getElementById('resetPresetBtn').onclick = resetPresetJson;

function init(){ renderButtons(); loadPreset(); }
init();

window._ticketCalc = { getRows: ()=>currentRows, presets: defaultPresets };
