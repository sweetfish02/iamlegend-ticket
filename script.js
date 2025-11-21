function render(){
 let key=document.getElementById('select').value;
 let d=rewardData[key];
 let html='<tr><th>보상</th><th>전체 개수</th><th>단가</th><th>점수</th><th>티켓화</th></tr>';
 d.forEach(r=>{ html+=`<tr><td>${r.name}</td><td>${r.count}</td><td>${r.price}</td><td>${r.score}</td><td>${r.ticket}</td></tr>`; });
 document.getElementById('table').innerHTML=html;
}
document.getElementById('select').onchange=render;
render();
