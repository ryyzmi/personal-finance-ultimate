(() => {
  "use strict";
  const KEY = "pf_ultimate_v1";
  const $ = id => document.getElementById(id);
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const monthNow = () => today().slice(0,7);
  const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const money = value => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(value)||0);
  const monthLabel = value => {
    if (!value) return "";
    const [y,m] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID",{month:"long",year:"numeric"}).format(new Date(y,m-1,1));
  };
  const defaults = () => ({
    profile:{name:"Pengguna"},
    transactions:[],
    categories:{
      income:[{id:"inc-salary",name:"Gaji",emoji:"💰"},{id:"inc-pocket",name:"Uang saku",emoji:"🪙"},{id:"inc-bonus",name:"Bonus",emoji:"🎁"},{id:"inc-other",name:"Lainnya",emoji:"➕"}],
      expense:[{id:"exp-food",name:"Makanan",emoji:"🍔"},{id:"exp-transport",name:"Transportasi",emoji:"🚗"},{id:"exp-shopping",name:"Belanja",emoji:"🛍️"},{id:"exp-bills",name:"Tagihan",emoji:"🧾"},{id:"exp-education",name:"Pendidikan",emoji:"📚"},{id:"exp-entertainment",name:"Hiburan",emoji:"🎮"},{id:"exp-health",name:"Kesehatan",emoji:"💊"},{id:"exp-other",name:"Lainnya",emoji:"➕"}]
    },
    goals:[],budgets:[],
    wallets:[{id:"wallet-cash",name:"Tunai"},{id:"wallet-bank",name:"Bank"},{id:"wallet-ewallet",name:"E-Wallet"}]
  });
  function load(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw) return defaults();
      const saved=JSON.parse(raw), base=defaults();
      return {
        ...base,...saved,
        profile:{...base.profile,...(saved.profile||{})},
        categories:{
          income:Array.isArray(saved.categories?.income)?saved.categories.income:base.categories.income,
          expense:Array.isArray(saved.categories?.expense)?saved.categories.expense:base.categories.expense
        },
        transactions:Array.isArray(saved.transactions)?saved.transactions:[],
        goals:Array.isArray(saved.goals)?saved.goals:[],
        budgets:Array.isArray(saved.budgets)?saved.budgets:[],
        wallets:Array.isArray(saved.wallets)?saved.wallets:base.wallets
      };
    }catch(e){console.error("Gagal membaca data",e);return defaults();}
  }
  let data=load();
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(e){toast("Penyimpanan penuh atau tidak tersedia.");return false}}
  function toast(message){const el=$("toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600)}
  function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function total(type, list=data.transactions){return list.filter(t=>t.type===type).reduce((s,t)=>s+Number(t.amount||0),0)}
  function walletBalance(id){return data.transactions.filter(t=>t.walletId===id).reduce((s,t)=>s+(t.type==="income"?1:-1)*Number(t.amount||0),0)}
  function categoryFor(type,id){return data.categories[type].find(c=>c.id===id)}
  function renderProfile(){
    const name=data.profile.name||"Pengguna";
    $("profile-name").textContent=name;$("welcome-name").textContent=`${name} 👋`;
    $("avatar-initial").textContent=name.trim().charAt(0).toUpperCase()||"P";
    $("profile-input").value=name;
  }
  function renderDashboard(){
    const income=total("income"),expense=total("expense");
    $("total-income").textContent=money(income);$("total-expense").textContent=money(expense);$("total-balance").textContent=money(income-expense);
    const m=monthNow(), list=data.transactions.filter(t=>(t.date||"").startsWith(m));
    const mi=total("income",list),me=total("expense",list);
    $("dashboard-month").textContent=monthLabel(m);$("month-income").textContent=money(mi);$("month-expense").textContent=money(me);$("month-net").textContent=money(mi-me);
    const recent=[...data.transactions].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);
    $("dashboard-recent").innerHTML=transactionTable(recent,false);
    const goals=data.goals.slice(0,3);
    $("dashboard-goals").innerHTML=goals.length?goals.map(g=>{
      const p=Math.min(100,Math.round((g.saved/g.target)*100));
      return `<div class="mini-goal"><div class="mini-goal-top"><strong>${escapeHTML(g.name)}</strong><span>${p}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${p}%"></div></div></div>`;
    }).join(""):'<p class="empty-state">Belum ada target.</p>';
  }
  function transactionTable(list,actions=true){
    if(!list.length)return '<p class="empty-state">Belum ada transaksi.</p>';
    return `<table class="data-table"><thead><tr><th>TRANSAKSI</th><th>TANGGAL</th><th>DOMPET</th><th>NOMINAL</th>${actions?'<th></th>':''}</tr></thead><tbody>${list.map(t=>{
      const cat=categoryFor(t.type,t.categoryId);
      const catName=cat?.name||t.categoryName||"Lainnya";
      const wallet=data.wallets.find(w=>w.id===t.walletId);
      return `<tr><td>${escapeHTML(t.emoji||cat?.emoji||"•")} ${escapeHTML(catName)}<span class="table-sub">${escapeHTML(t.note|| (t.type==="income"?"Pemasukan":"Pengeluaran"))}</span></td><td>${escapeHTML(t.date||"-")}</td><td>${escapeHTML(wallet?.name||"Dompet")}</td><td class="table-amount ${t.type==="income"?"positive":"negative"}">${t.type==="income"?"+":"−"}${money(t.amount)}</td>${actions?`<td><button class="delete-button" data-delete-transaction="${escapeHTML(t.id)}">Hapus</button></td>`:""}</tr>`;
    }).join("")}</tbody></table>`;
  }
  function fillSelect(selectId,items,placeholder=false){
    const el=$(selectId);if(!el)return;
    el.innerHTML=(placeholder?'<option value="">Pilih...</option>':"")+items.map(x=>`<option value="${escapeHTML(x.id)}">${escapeHTML(x.emoji?x.emoji+" ":"")}${escapeHTML(x.name)}</option>`).join("");
  }
  function refreshTransactionOptions(){
    const type=$("transaction-type").value;
    fillSelect("transaction-category",data.categories[type]);
    fillSelect("transaction-wallet",data.wallets);
  }
  function renderTransactions(){
    const q=$("transaction-search").value.trim().toLowerCase(),type=$("transaction-filter").value,month=$("transaction-month-filter").value;
    const list=[...data.transactions].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).filter(t=>{
      const cat=categoryFor(t.type,t.categoryId);
      const text=`${t.note||""} ${cat?.name||t.categoryName||""}`.toLowerCase();
      return (!q||text.includes(q))&&(type==="all"||t.type===type)&&(!month||(t.date||"").startsWith(month));
    });
    $("transaction-count").textContent=`${list.length} transaksi`;
    $("transaction-list").innerHTML=transactionTable(list,true);
  }
  function renderGoals(){
    fillSelect("goal-fund-select",data.goals);
    $("goals-list").innerHTML=data.goals.length?data.goals.map(g=>{
      const pct=Math.min(100,Math.round(g.saved/g.target*100));
      return `<article class="goal-card"><h3>◎ ${escapeHTML(g.name)}</h3><p>${escapeHTML(g.description||"Target tabungan pribadi")}</p><div class="budget-numbers"><span>Terkumpul: <b>${money(g.saved)}</b></span><span>Target: <b>${money(g.target)}</b></span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><p class="goal-meta">${pct}% tercapai ${g.deadline?"• Deadline "+escapeHTML(g.deadline):""}</p><div class="card-actions"><button data-delete-goal="${escapeHTML(g.id)}">Hapus target</button></div></article>`;
    }).join(""):'<p class="empty-state">Belum ada target keuangan.</p>';
  }
  function renderBudgets(){
    const list=[...data.budgets].sort((a,b)=>b.month.localeCompare(a.month));
    $("budget-list").innerHTML=list.length?list.map(b=>{
      const spent=data.transactions.filter(t=>t.type==="expense"&&t.month===b.month&&(t.categoryId===b.categoryId||(!t.categoryId&&t.categoryName===b.categoryName))).reduce((s,t)=>s+Number(t.amount),0);
      const pct=Math.round(spent/b.amount*100),width=Math.min(100,pct),left=b.amount-spent;
      return `<article class="budget-card"><h3>${escapeHTML(b.emoji||"📌")} ${escapeHTML(b.categoryName)}</h3><p>${escapeHTML(monthLabel(b.month))}</p><div class="budget-numbers"><span>Terpakai: <b>${money(spent)}</b></span><span>Batas: <b>${money(b.amount)}</b></span></div><div class="progress-track"><div class="progress-fill" style="width:${width}%;${pct>100?"background:var(--red)":""}"></div></div><p class="${left<0?"over-budget":""}">${left>=0?"Sisa: "+money(left):"Melebihi batas: "+money(-left)} • ${pct}%</p><div class="card-actions"><button data-delete-budget="${escapeHTML(b.id)}">Hapus</button></div></article>`;
    }).join(""):'<p class="empty-state">Belum ada anggaran.</p>';
  }
  function renderWallets(){
    $("wallet-list").innerHTML=data.wallets.map(w=>`<article class="wallet-card"><h3>▣ ${escapeHTML(w.name)}</h3><p>Saldo saat ini</p><h2>${money(walletBalance(w.id))}</h2>${data.wallets.length>1?`<div class="card-actions"><button data-delete-wallet="${escapeHTML(w.id)}">Hapus dompet</button></div>`:""}</article>`).join("");
  }
  function renderAnalytics(){
    const months=[];const now=new Date();
    for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`)}
    const values=months.map(m=>({m,income:total("income",data.transactions.filter(t=>(t.date||"").startsWith(m))),expense:total("expense",data.transactions.filter(t=>(t.date||"").startsWith(m)))}));
    const max=Math.max(1,...values.flatMap(v=>[v.income,v.expense]));
    $("analytics-chart").innerHTML=values.map(v=>`<div class="chart-column"><div class="bar-pair"><div class="chart-bar income" title="Pemasukan ${money(v.income)}" style="height:${Math.max(2,v.income/max*100)}%"></div><div class="chart-bar expense" title="Pengeluaran ${money(v.expense)}" style="height:${Math.max(2,v.expense/max*100)}%"></div></div><span class="chart-label">${escapeHTML(v.m.slice(5))}/${v.m.slice(2,4)}</span></div>`).join("")+'<div class="chart-legend"><span><i class="legend-dot" style="background:#5ee0ae"></i>Pemasukan</span><span><i class="legend-dot" style="background:#a78bfa"></i>Pengeluaran</span></div>';
    const groups={};data.transactions.filter(t=>t.type==="expense").forEach(t=>{const c=categoryFor("expense",t.categoryId);const n=c?.name||t.categoryName||"Lainnya";groups[n]=(groups[n]||0)+Number(t.amount)});
    const sorted=Object.entries(groups).sort((a,b)=>b[1]-a[1]);
    $("category-analytics").innerHTML=sorted.length?sorted.map(([n,v])=>`<div class="category-row"><span>${escapeHTML(n)}</span><strong>${money(v)}</strong></div>`).join(""):'<p class="empty-state">Belum ada data pengeluaran.</p>';
    $("analytics-summary").innerHTML=`<div class="cashflow-row"><span>Total pemasukan</span><strong class="positive">${money(total("income"))}</strong></div><div class="cashflow-row"><span>Total pengeluaran</span><strong class="negative">${money(total("expense"))}</strong></div><div class="cashflow-row total-row"><span>Selisih</span><strong>${money(total("income")-total("expense"))}</strong></div><p class="hint">Grafik memakai enam bulan kalender terakhir berdasarkan tanggal transaksi.</p>`;
  }
  function renderCategories(){
    $("category-list").innerHTML=["income","expense"].map(type=>data.categories[type].map(c=>`<span class="category-chip">${escapeHTML(c.emoji)} ${escapeHTML(c.name)} <button title="Hapus kategori" data-delete-category="${escapeHTML(c.id)}" data-category-type="${type}">×</button></span>`).join("")).join("");
  }
  function renderAll(){renderProfile();renderDashboard();renderTransactions();renderGoals();renderBudgets();renderWallets();renderAnalytics();renderCategories();refreshTransactionOptions();fillSelect("budget-category",data.categories.expense)}
  function showPage(page){
    const target=$(page+"-page");if(!target)return;
    document.querySelectorAll(".page-section").forEach(s=>{s.hidden=true;s.classList.remove("active")});
    target.hidden=false;target.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
    const labels={dashboard:"Dashboard",transactions:"Transaksi",goals:"Target Keuangan",budget:"Anggaran",analytics:"Analitik",wallets:"Dompet",settings:"Pengaturan"};
    $("page-title").textContent=labels[page]||"Dashboard";
    if(page==="dashboard")renderDashboard();
  }
  function bind(){
    $("main-nav").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b)showPage(b.dataset.page)});
    document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.goto)));
    $("transaction-type").addEventListener("change",refreshTransactionOptions);
    $("transaction-form").addEventListener("submit",e=>{
      e.preventDefault();
      const type=$("transaction-type").value,categoryId=$("transaction-category").value,category=categoryFor(type,categoryId),amount=Number($("transaction-amount").value);
      if(!category||!Number.isFinite(amount)||amount<=0)return toast("Periksa kategori dan nominal transaksi.");
      data.transactions.push({id:makeId("tx"),type,amount,categoryId,categoryName:category.name,emoji:category.emoji,walletId:$("transaction-wallet").value,date:$("transaction-date").value,note:$("transaction-note").value.trim(),month:$("transaction-date").value.slice(0,7)});
      persist();e.target.reset();$("transaction-date").value=today();refreshTransactionOptions();renderAll();toast("Transaksi berhasil disimpan.");
    });
    ["transaction-search","transaction-filter","transaction-month-filter"].forEach(id=>$(id).addEventListener("input",renderTransactions));
    $("clear-transaction-filter").addEventListener("click",()=>{$("transaction-search").value="";$("transaction-filter").value="all";$("transaction-month-filter").value="";renderTransactions()});
    $("goal-form").addEventListener("submit",e=>{
      e.preventDefault();const target=Number($("goal-target").value),saved=Number($("goal-saved").value||0);
      if(target<=0||saved<0||saved>target)return toast("Nominal target atau tabungan awal tidak valid.");
      data.goals.push({id:makeId("goal"),name:$("goal-name").value.trim(),target,saved,deadline:$("goal-deadline").value,description:$("goal-description").value.trim()});
      persist();e.target.reset();$("goal-saved").value=0;renderAll();toast("Target berhasil dibuat.");
    });
    $("goal-fund-form").addEventListener("submit",e=>{
      e.preventDefault();const goal=data.goals.find(g=>g.id===$("goal-fund-select").value),amount=Number($("goal-fund-amount").value);
      if(!goal||amount<=0)return toast("Pilih target dan nominal yang benar.");
      goal.saved=Math.min(goal.target,goal.saved+amount);persist();e.target.reset();renderAll();toast("Tabungan target diperbarui.");
    });
    $("budget-form").addEventListener("submit",e=>{
      e.preventDefault();const category=categoryFor("expense",$("budget-category").value),amount=Number($("budget-amount").value),month=$("budget-month").value;
      if(!category||amount<=0||!month)return toast("Lengkapi data anggaran.");
      const old=data.budgets.find(b=>b.categoryId===category.id&&b.month===month);
      if(old){old.amount=amount}else{data.budgets.push({id:makeId("budget"),categoryId:category.id,categoryName:category.name,emoji:category.emoji,amount,month})}
      persist();e.target.reset();$("budget-month").value=monthNow();renderAll();toast("Anggaran berhasil disimpan.");
    });
    $("wallet-form").addEventListener("submit",e=>{
      e.preventDefault();const name=$("wallet-name").value.trim();
      if(!name)return;
      if(data.wallets.some(w=>w.name.toLowerCase()===name.toLowerCase()))return toast("Nama dompet sudah digunakan.");
      data.wallets.push({id:makeId("wallet"),name});persist();e.target.reset();renderAll();toast("Dompet berhasil ditambahkan.");
    });
    $("profile-form").addEventListener("submit",e=>{e.preventDefault();const name=$("profile-input").value.trim();if(!name||name.length>30)return toast("Nama harus 1–30 karakter.");data.profile.name=name;persist();renderProfile();toast("Nama profil disimpan.")});
    $("category-form").addEventListener("submit",e=>{
      e.preventDefault();const type=$("category-type").value,name=$("category-name").value.trim(),emoji=$("category-emoji").value.trim()||"📌";
      if(!name)return;
      if(data.categories[type].some(c=>c.name.toLowerCase()===name.toLowerCase()))return toast("Kategori sudah ada.");
      data.categories[type].push({id:makeId("cat"),name,emoji});persist();e.target.reset();renderAll();toast("Kategori ditambahkan.");
    });
    document.addEventListener("click",e=>{
      const tx=e.target.closest("[data-delete-transaction]");
      if(tx&&confirm("Hapus transaksi ini?")){data.transactions=data.transactions.filter(t=>t.id!==tx.dataset.deleteTransaction);persist();renderAll();toast("Transaksi dihapus.");}
      const goal=e.target.closest("[data-delete-goal]");
      if(goal&&confirm("Hapus target ini?")){data.goals=data.goals.filter(g=>g.id!==goal.dataset.deleteGoal);persist();renderAll();toast("Target dihapus.");}
      const budget=e.target.closest("[data-delete-budget]");
      if(budget&&confirm("Hapus anggaran ini?")){data.budgets=data.budgets.filter(b=>b.id!==budget.dataset.deleteBudget);persist();renderAll();toast("Anggaran dihapus.");}
      const wallet=e.target.closest("[data-delete-wallet]");
      if(wallet){const id=wallet.dataset.deleteWallet;if(data.transactions.some(t=>t.walletId===id))return toast("Dompet masih memiliki transaksi. Hapus atau pindahkan transaksinya terlebih dahulu.");if(data.wallets.length<=1)return toast("Minimal harus ada satu dompet.");if(confirm("Hapus dompet ini?")){data.wallets=data.wallets.filter(w=>w.id!==id);persist();renderAll();}}
      const cat=e.target.closest("[data-delete-category]");
      if(cat){const id=cat.dataset.deleteCategory,type=cat.dataset.categoryType;const used=data.transactions.some(t=>t.categoryId===id);if(used)return toast("Kategori sudah dipakai transaksi dan tidak bisa dihapus.");if(data.categories[type].length<=1)return toast("Minimal harus ada satu kategori.");if(confirm("Hapus kategori ini?")){data.categories[type]=data.categories[type].filter(c=>c.id!==id);persist();renderAll();}}
    });
    $("export-data").addEventListener("click",()=>{
      const blob=new Blob([JSON.stringify({app:"PERSONAL FINANCE ULTIMATE",version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`personal-finance-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("File backup dibuat.");
    });
    $("import-data").addEventListener("change",async e=>{
      const file=e.target.files[0];if(!file)return;
      try{const parsed=JSON.parse(await file.text()),incoming=parsed.data||parsed;
        if(!incoming||!Array.isArray(incoming.transactions)||!incoming.categories||!Array.isArray(incoming.wallets))throw new Error("Format backup tidak cocok.");
        if(!confirm("Impor akan mengganti data yang ada di browser ini. Lanjutkan?"))return;
        const base=defaults();data={...base,...incoming,profile:{...base.profile,...incoming.profile},categories:{income:incoming.categories.income||base.categories.income,expense:incoming.categories.expense||base.categories.expense},transactions:incoming.transactions,goals:Array.isArray(incoming.goals)?incoming.goals:[],budgets:Array.isArray(incoming.budgets)?incoming.budgets:[],wallets:incoming.wallets};
        persist();renderAll();toast("Backup berhasil diimpor.");
      }catch(err){toast("Gagal impor: "+err.message)}fin
