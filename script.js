let curT=2, curB=80;
function setTicket(t){curT=t;render();}
function setBox(b){curB=b;render();}
function render(){
 let key=curT+"_"+curB;
 if(!rewardData[key]){document.getElementById('table-area').innerHTML="데이터 없음";return;}
 let rows=rewardData[key];
 let html='<table><tr><th>보상</th><th>남은</th><th>전체</th><th>단가</th><th>점수</th><th>티켓화</th></tr>';
 rows.forEach((r,i)=>{
   let max=r.count;
   let dis = r.name==='최종보상'?'disabled':'';
   html+=`<tr>
<td>${r.name}</td>
<td><input type="number" min="0" max="${max}" value="${r.name==='최종보상'?1:0}" ${dis} onchange="calc()"></td>
<td>${r.count}</td>
<td>${r.price}</td>
<td class="score">0</td>
<td class="ticket">0</td>
</tr>`;
 });
 html+='</table>';
 document.getElementById('table-area').innerHTML=html;
 calc();
}
function calc(){
 let table=document.querySelector("#table-area table");
 if(!table) return;
 let rows=table.querySelectorAll("tr");
 let sumRemain=0, sumTicket=0;
 rows.forEach((tr,i)=>{
   if(i===0) return;
   let tds=tr.querySelectorAll("td");
   let name=tds[0].innerText;
   let inp=tds[1].querySelector("input");
   let remain = name==='최종보상'?1:parseInt(inp.value||0);
   let price=parseFloat(tds[3].innerText);
   let score=remain*price;
   let ticket=score/30;
   tds[4].innerText=score.toFixed(1);
   tds[5].innerText=ticket.toFixed(1);
   if(name!=='최종보상') sumRemain+=remain;
   sumTicket+=ticket;
 });
 // results
 let need=curT*sumRemain;
 let finalRow=document.querySelectorAll("#table-area table tr")[1];
 let finalTicket=parseFloat(finalRow.querySelectorAll("td")[5].innerText);
 let afront=parseFloat(document.querySelectorAll("#table-area table tr")[2].querySelectorAll("td")[5].innerText);

 let ret_all=sumTicket;
 let ret_noFinal=sumTicket-finalTicket;
 let ret_noFA=sumTicket-finalTicket-afront;

 function fmt(n){return n.toFixed(1);}
 function red(n){return n<0?'<span class="red">'+n.toFixed(1)+'</span>':n.toFixed(1);}

 let html=`<table>
<tr><th></th><th>전부반환</th><th>최종제외</th><th>최종&A제외</th></tr>
<tr><td>돌려받는 티켓</td><td>${fmt(ret_all)}</td><td>${fmt(ret_noFinal)}</td><td>${fmt(ret_noFA)}</td></tr>
<tr><td>티켓 손익</td><td>${red(need-ret_all)}</td><td>${red(need-ret_noFinal)}</td><td>${red(need-ret_noFA)}</td></tr>
<tr><td>보석 가치</td><td>${red((need-ret_all)*300)}</td><td>${red((need-ret_noFinal)*300)}</td><td>${red((need-ret_noFA)*300)}</td></tr>
</table>`;
 document.getElementById('result-area').innerHTML=html;
}
render();