/* 瀹濆疂璁板綍 */
(() => {
  'use strict';
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const pad = n => String(n).padStart(2,"0");
  const fmtTime = ts => { const d=new Date(ts); return pad(d.getHours())+":"+pad(d.getMinutes()); };
  const toLocalInput = ts => { const d=new Date(ts); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes()); };
  const fromLocalInput = s => new Date(s).getTime();
  const dayKey = ts => { const d=new Date(ts); return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate()); };
  const todayKey = () => dayKey(Date.now());
  const sleepKindLabel = k => k==='pee'?'灏垮翱':k==='poop'?'澶т究':'娣峰悎';
  const fmtRel = ms => {
    if (ms < 0) return "--";
    const m = Math.floor(ms/60000);
    if (m < 1) return '鍒氬垰';
    if (m < 60) return m+"鍒嗛挓";
    const h = Math.floor(m/60); const mm = m%60;
    if (h < 24) return mm>0 ? (h+"灏忔椂"+mm+"鍒嗛挓") : (h+"灏忔椂");
    const d = Math.floor(h/24); const hh = h%24;
    return hh>0 ? (d+"澶?+hh+"灏忔椂") : (d+"澶?);
  };
  // ---------- IndexedDB ----------
  const DB_NAME = 'baby-record'; const DB_VERSION = 1; const STORE = 'records'; let db;
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const _db = e.target.result;
        if (!_db.objectStoreNames.contains(STORE)) {
          const store = _db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("kind", "kind", { unique: false });
          store.createIndex("time", "time", { unique: false });
          store.createIndex("start", "start", { unique: false });
        }
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = e => reject(e.target.error);
    });
  }
  function reqToPromise(req) { return new Promise((res, rej) => { req.onsuccess = ()=>res(req.result); req.onerror = ()=>rej(req.error); }); }
  async function putRecord(rec) { return reqToPromise(db.transaction(STORE,"readwrite").objectStore(STORE).put(rec)); }
  async function deleteRecord(id) { return reqToPromise(db.transaction(STORE,"readwrite").objectStore(STORE).delete(id)); }
  async function getAll() { return reqToPromise(db.transaction(STORE).objectStore(STORE).getAll()); }
  async function getById(id) { return reqToPromise(db.transaction(STORE).objectStore(STORE).get(id)); }
  async function getOpenSleep() {
    const list = await reqToPromise(db.transaction(STORE).objectStore(STORE).index("kind").getAll("sleep"));
    return list.find(s => !s.end) || null;
  }
  async function cleanupOld() {
    const cutoff = Date.now() - 7*24*60*60*1000;
    const all = await getAll();
    let n = 0;
    for (const r of all) { const t = r.time || r.start || 0; if (t < cutoff) { await deleteRecord(r.id); n++; } }
    return n;
  }
  // ---------- 鐘舵€?/ Toast ----------
  const state = { pendingEditId: null, ticker: null };
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 1800);
  }
  // ---------- 瑙嗗浘瀵艰埅 ----------
  const viewStack = ["view-home"];
  function goto(id) {
    $$(".view").forEach(v => v.classList.add("hidden"));
    const el = $("#" + id);
    if (!el) return;
    el.classList.remove("hidden");
    const idx = viewStack.indexOf(id);
    if (idx >= 0) viewStack.splice(idx+1); else viewStack.push(id);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (id === "view-summary") renderSummary();
    if (id === "view-home") renderHome();
  }
  function back() {
    if (viewStack.length <= 1) return;
    viewStack.pop();
    const prev = viewStack[viewStack.length-1];
    $$(".view").forEach(v => v.classList.add("hidden"));
    $("#" + prev).classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "instant" });
    if (prev === "view-home") renderHome();
    if (prev === "view-summary") renderSummary();
  }
  // ---------- 娓叉煋锛氫富椤?----------
  async function renderHome() {
    const all = await getAll();
    const today = todayKey();
    const feeds = all.filter(r => r.kind==="feed" && dayKey(r.time)===today).sort((a,b)=>b.time-a.time);
    const diapers = all.filter(r => r.kind==="diaper" && dayKey(r.time)===today).sort((a,b)=>b.time-a.time);
    const sleeps = all.filter(r => r.kind==="sleep" && dayKey(r.start)===today).sort((a,b)=>b.start-a.start);
    const lastFeed = feeds[0];
    $("#feed-last-text").textContent = lastFeed ? "涓婃锛?+fmtTime(lastFeed.time)+"锛?+lastFeed.amount+"ml锛? : "涓婃锛?-:--锛?-锛?;
    $("#feed-since").textContent = "馃晲 璺濅笂娆★細" + (lastFeed ? fmtRel(Date.now()-lastFeed.time) : "--");
    const lastDiaper = diapers[0];
    $("#diaper-last-text").textContent = lastDiaper ? "涓婃锛?+fmtTime(lastDiaper.time)+"锛?+sleepKindLabel(lastDiaper.subKind)+"锛? : "涓婃锛?-:--锛?-锛?;
    $("#diaper-since").textContent = "馃晲 璺濅笂娆★細" + (lastDiaper ? fmtRel(Date.now()-lastDiaper.time) : "--");
    const openSleep = await getOpenSleep();
    const todayOpenSleep = openSleep && dayKey(openSleep.start)===today ? openSleep : null;
    const lastSleep = sleeps[0];
    if (todayOpenSleep) {
      $("#sleep-now").textContent = "褰撳墠锛氬凡鐫?"+fmtRel(Date.now()-todayOpenSleep.start);
      $("#sleep-start").textContent = "寮€濮嬫椂闂达細"+fmtTime(todayOpenSleep.start);
      $("#sleep-toggle").textContent = "鈽€锔?鐫￠啋";
    } else {
      const lastWake = lastSleep && lastSleep.end ? lastSleep : null;
      $("#sleep-now").textContent = lastWake ? "涓婃鐫￠啋锛?+fmtTime(lastWake.end) : "褰撳墠锛氭湭鍦ㄧ潯瑙?;
      $("#sleep-start").textContent = lastWake ? "鐫′簡 "+fmtRel(lastWake.end-lastWake.start) : "寮€濮嬫椂闂达細--";
      $("#sleep-toggle").textContent = "馃寵 寮€濮嬬潯瑙?;
    }
    const totalMl = feeds.reduce((s,r)=>s+(r.amount||0),0);
    $("#home-feed-ml").textContent = totalMl;
    $("#home-feed-count").textContent = feeds.length;
    $("#view-feed-ml").textContent = totalMl;
    $("#view-feed-count").textContent = feeds.length;
    renderFeedList($("#home-feed-list"), feeds);
    renderFeedList($("#view-feed-list"), feeds);
    renderDiaperList($("#home-diaper-list"), diapers);
    renderDiaperList($("#view-diaper-list"), diapers);
    renderDiaperList($("#view-diaper-list2"), diapers);
    renderSleepList($("#home-sleep-list"), sleeps);
    renderSleepList($("#view-sleep-list"), sleeps);
    renderSleepList($("#view-sleep-list2"), sleeps);
  }
  // ---------- 鍒楄〃娓叉煋 ----------
  function recordRow(emoji, time, sub, amt, kind, id) {
    const li = document.createElement("li");
    li.className = "record";
    li.dataset.id = id;
    li.dataset.kind = kind;
    li.innerHTML = `<span class="record-emoji"><img src="${emoji}" alt=""></span><div class="record-mid"><div class="record-time">${time}</div><div class="record-sub">${sub||""}</div></div><div class="record-amt">${amt||""}</div><div class="record-chev">›</div>`;
    li.addEventListener("click", () => openEdit(kind, id));
    return li;
  }
  function renderFeedList(ul, list) { ul.innerHTML = ""; if (!list.length) { ul.innerHTML = "<li class=\u0022record empty\u0022>浠婂ぉ杩樻病鏈夊杺濂惰褰?/li>"; return; } list.forEach(r => { const sub = r.note || ""; ul.appendChild(recordRow("icons/feed-24.png", fmtTime(r.time), sub, r.amount+"<small>ml</small>", "feed", r.id)); }); }
  function renderDiaperList(ul, list) { ul.innerHTML = ""; if (!list.length) { ul.innerHTML = "<li class=\u0022record empty\u0022>浠婂ぉ杩樻病鏈夊翱甯冭褰?/li>"; return; } list.forEach(r => { const sub = sleepKindLabel(r.subKind)+(r.note?(" \u00b7 "+r.note):""); ul.appendChild(recordRow("icons/diaper-24.png", fmtTime(r.time), sub, "", "diaper", r.id)); }); }
  function renderSleepList(ul, list) { ul.innerHTML = ""; if (!list.length) { ul.innerHTML = "<li class=\u0022record empty\u0022>浠婂ぉ杩樻病鏈夌潯瑙夎褰?/li>"; return; } list.forEach(r => { const dur = r.end ? (r.end - r.start) : (Date.now() - r.start); const sub = (r.end?("宸茬潯 "+fmtRel(r.end-r.start)):("杩涜涓?\u00b7 "+fmtRel(dur)))+(r.note?(" \u00b7 "+r.note):""); ul.appendChild(recordRow("icons/sleep-24.png", fmtTime(r.start), sub, "", "sleep", r.id)); }); }
  // ---------- 缂栬緫 ----------
  async function openEdit(kind, id) {
    const r = await getById(id);
    if (!r) return;
    state.pendingEditId = id;
    if (kind === "feed") {
      const f = $("#form-edit-feed");
      f.time.value = toLocalInput(r.time);
      f.amount.value = r.amount;
      f.note.value = r.note || "";
      goto("view-edit-feed");
    } else if (kind === "diaper") {
      const f = $("#form-edit-diaper");
      f.time.value = toLocalInput(r.time);
      f.note.value = r.note || "";
      f.type.value = r.subKind;
      goto("view-edit-diaper");
    } else if (kind === "sleep") {
      const f = $("#form-edit-sleep");
      f.start.value = toLocalInput(r.start);
      f.end.value = r.end ? toLocalInput(r.end) : "";
      f.note.value = r.note || "";
      updateSleepDuration();
      goto("view-edit-sleep");
    }
  }
  async function editLastOf(kind) {
    const all = await getAll();
    const today = todayKey();
    const list = all.filter(r => r.kind===kind && dayKey(r.time||r.start)===today).sort((a,b)=>(b.time||b.start)-(a.time||a.start));
    if (!list.length) { toast("浠婂ぉ杩樻病鏈夎璁板綍"); return; }
    openEdit(kind, list[0].id);
  }
  function updateSleepDuration() {
    const f = $("#form-edit-sleep");
    const s = f.start.value, e = f.end.value;
    if (s && e) { const ms = fromLocalInput(e) - fromLocalInput(s); $("#sleep-duration").textContent = ms>=0 ? fmtRel(ms) : "鏃堕棿涓嶅悎娉?; }
    else $("#sleep-duration").textContent = "--";
  }
  // ---------- 妯℃€?----------
  function openModal(html) { $("#modal-card").innerHTML = html; $("#modal-root").classList.remove("hidden"); }
  function closeModal() { $("#modal-root").classList.add("hidden"); $("#modal-card").innerHTML = ""; }
  function bindModalActions(onConfirm) {
    $("#modal-card").querySelectorAll("[data-modal=confirm]").forEach(b => b.addEventListener("click", () => { const r = onConfirm && onConfirm(); if (r !== false) closeModal(); }));
  }
  // ---------- 鍠傚ザ蹇嵎 ----------
  function feedConfirmModal(amount, time) {
    const html = `<div class="modal-title">璁板綍鍠傚ザ锛?/div><div class="modal-row"><div class="modal-row-label">鏃堕棿</div><div class="modal-row-value"><input type="datetime-local" class="time-input" id="fc-time" value="${toLocalInput(time)}"></div></div><div class="modal-amount">${amount}<small>ml</small></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">鍙栨秷</button><button class="btn primary" type="button" data-modal="confirm">纭</button></div>`;
    openModal(html);
    bindModalActions(() => { const v = $("#fc-time").value; if (!v) { toast("璇烽€夋嫨鏃堕棿"); return false; } feedConfirm(amount, fromLocalInput(v)); });
  }
  function feedQuick(amount) { feedConfirmModal(amount, Date.now()); }
  async function feedConfirm(amount, time) {
    const rec = { id: "f_"+time+"_"+Math.random().toString(36).slice(2,7), kind: "feed", time, amount: Number(amount), note: "" };
    await putRecord(rec);
    toast("鉁?宸茶褰?+amount+"ml");
    renderHome();
  }
  // ---------- 鑷畾涔夊ザ閲?----------
  function feedCustomModal(time) {
    time = time || Date.now();
    const html = `<div class="modal-title">鑷畾涔夊ザ閲?/div><div class="modal-row"><div class="modal-row-label">鏃堕棿</div><div class="modal-row-value"><input type="datetime-local" class="time-input" id="cc-time" value="${toLocalInput(time)}"></div></div><div class="custom-amount"><input type="number" inputmode="numeric" id="cc-amt" min="0" max="9999" placeholder="0"><small>ml</small></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">鍙栨秷</button><button class="btn primary" type="button" data-modal="confirm">纭</button></div>`;
    openModal(html);
    setTimeout(() => $("#cc-amt").focus(), 60);
    bindModalActions(() => { const tv = $("#cc-time").value; const amt = Number($("#cc-amt").value); if (!tv) { toast("璇烽€夋嫨鏃堕棿"); return false; } if (!amt || amt<=0) { toast("璇疯緭鍏ュザ閲?); return false; } feedConfirm(amt, fromLocalInput(tv)); });
  }
  function feedCustom() { feedCustomModal(Date.now()); }
  // ---------- 灏垮竷蹇嵎 ----------
  function diaperConfirmModal(type, time) {
    const label = sleepKindLabel(type);
    const html = `<div class="modal-title">璁板綍灏垮竷锛?/div><div class="modal-row"><div class="modal-row-label">鏃堕棿</div><div class="modal-row-value"><input type="datetime-local" class="time-input" id="dc-time" value="${toLocalInput(time)}"></div></div><div class="modal-row"><div class="modal-row-label">绫诲瀷</div><div class="modal-row-value"><span class="text" style="min-width:80px">${label}</span></div></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">鍙栨秷</button><button class="btn primary" type="button" data-modal="confirm">纭</button></div>`;
    openModal(html);
    bindModalActions(() => { const v = $("#dc-time").value; if (!v) { toast("璇烽€夋嫨鏃堕棿"); return false; } diaperConfirm(type, fromLocalInput(v)); });
  }
  function diaperQuick(type) { diaperConfirmModal(type, Date.now()); }
  async function diaperConfirm(type, time) {
    const rec = { id: "d_"+time+"_"+Math.random().toString(36).slice(2,7), kind: "diaper", time, subKind: type, note: "" };
    await putRecord(rec);
    toast("鉁?宸茶褰?+sleepKindLabel(type));
    renderHome();
  }
  // ---------- 鐫¤ ----------
  async function sleepToggle() {
    const openSleep = await getOpenSleep();
    if (openSleep) endSleepModal(openSleep);
    else startSleepModal();
  }
  function startSleepModal(time) {
    time = time || Date.now();
    const html = `<div class="modal-title">寮€濮嬬潯瑙夛紵</div><div class="modal-row"><div class="modal-row-label">鏃堕棿</div><div class="modal-row-value"><input type="datetime-local" class="time-input" id="sc-time" value="${toLocalInput(time)}"></div></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">鍙栨秷</button><button class="btn primary" type="button" data-modal="confirm">纭</button></div>`;
    openModal(html);
    bindModalActions(() => { const v = $("#sc-time").value; if (!v) { toast("璇烽€夋嫨鏃堕棿"); return false; } sleepStart(fromLocalInput(v)); });
  }
  function endSleepModal(rec, startTs, endTs) {
    startTs = startTs || rec.start;
    endTs = endTs || Date.now();
    const html = `<div class="modal-title">缁撴潫鐫¤锛?/div><div class="modal-row"><div class="modal-row-label">寮€濮?/div><div class="modal-row-value"><input type="datetime-local" class="time-input" id="ec-start" value="${toLocalInput(startTs)}"></div></div><div class="modal-row"><div class="modal-row-label">缁撴潫</div><div class="modal-row-value"><input type="datetime-local" class="time-input" id="ec-end" value="${toLocalInput(endTs)}"></div></div><div class="modal-row"><div class="modal-row-label">鏃堕暱</div><div class="modal-row-value"><span class="text" id="ec-dur">${fmtRel(endTs-startTs)}</span></div></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">鍙栨秷</button><button class="btn primary" type="button" data-modal="confirm">纭</button></div>`;
    openModal(html);
    const updateDur = () => { const s = $("#ec-start").value, e = $("#ec-end").value; if (s && e) { const ms = fromLocalInput(e) - fromLocalInput(s); $("#ec-dur").textContent = ms>=0 ? fmtRel(ms) : "鏃堕棿涓嶅悎娉?; } };
    $("#ec-start").addEventListener("input", updateDur);
    $("#ec-end").addEventListener("input", updateDur);
    bindModalActions(() => { const s = $("#ec-start").value, e = $("#ec-end").value; if (!s || !e) { toast("璇烽€夋嫨鏃堕棿"); return false; } const sTs = fromLocalInput(s), eTs = fromLocalInput(e); if (eTs <= sTs) { toast("缁撴潫鏃堕棿蹇呴』鏅氫簬寮€濮嬫椂闂?); return false; } endSleepConfirm(rec, sTs, eTs); });
  }
  // ---------- 7 澶╂眹鎬?----------
  async function renderSummary() {
    const all = await getAll();
    const ul = $('#summary-list');
    ul.innerHTML = '';
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i=0; i<7; i++) {
      const d = new Date(today.getTime() - i*24*60*60*1000);
      const key = dayKey(d.getTime());
      const label = i===0 ? '浠婂ぉ' : (i===1 ? '鏄ㄥぉ' : (pad(d.getMonth()+1)+'-'+pad(d.getDate())));
      const feeds = all.filter(r => r.kind==='feed' && dayKey(r.time)===key);
      const diapers = all.filter(r => r.kind==='diaper' && dayKey(r.time)===key);
      const sleeps = all.filter(r => r.kind==='sleep' && dayKey(r.start)===key && r.end);
      const ml = feeds.reduce((s,r)=>s+(r.amount||0),0);
      const sleepMs = sleeps.reduce((s,r)=>s+(r.end-r.start),0);
      addSummaryRow(ul, label, ml, feeds.length, diapers.length, sleepMs);
    }
  }
    function addSummaryRow(ul, label, ml, feedCount, diaperCount, sleepMs) {
    const li = document.createElement("li");
    li.className = "summary-item";
    const sleepText = sleepMs>0 ? fmtRel(sleepMs) : "--";
    const row = [];
    row.push("<div class=\u0022date\u0022>"+label+"</div>");
    row.push("<div class=\u0022num\u0022>"+ml+"<small> ml</small></div>");
    row.push("<div class=\u0022sub\u0022>鍠傚ザ "+feedCount+" 娆?路 灏垮竷 "+diaperCount+" 娆?/div>");
    row.push("<div class=\u0022sub-r\u0022>鐫?"+sleepText+"</div>");
    li.innerHTML = row.join("");
    ul.appendChild(li);
  }

  // ---------- 浜嬩欢缁戝畾 ----------
  function bindEvents() {
    $$("#feed-quick .pill").forEach(b => { b.addEventListener("click", () => { const v = b.dataset.amount; if (v === "custom") feedCustom(); else feedQuick(Number(v)); }); });
    $$("#diaper-quick .pill").forEach(b => { b.addEventListener("click", () => diaperQuick(b.dataset.type)); });
    $$("#sleep-toggle").forEach(b => b.addEventListener("click", sleepToggle));
  }

  function bindTabEvents() {
    $$(".tabs").forEach(tabs => {
      tabs.addEventListener("click", e => {
        const t = e.target.closest(".tab");
        if (!t) return;
        if (t.dataset.action === "goto") { goto(t.dataset.target); return; }
        const name = t.dataset.tab;
        tabs.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x===t));
        const root = tabs.closest(".view, .card");
        if (root) { root.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === name)); }
      });
    });
  }

function bindGlobalActions() {
    document.body.addEventListener("click", e => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      const act = a.dataset.action;
      if (act === "back") back();
      else if (act === "goto") goto(a.dataset.target);
      else if (act === "edit-last") editLastOf(a.dataset.type);
      else if (act === "close-modal") closeModal();
      else if (act === "delete") {
        if (confirm("纭畾鍒犻櫎杩欐潯璁板綍锛?)) {
          if (state.pendingEditId) {
            deleteRecord(state.pendingEditId).then(() => { state.pendingEditId = null; toast("宸插垹闄?); back(); renderHome(); });
          }
        }
      }
    });
  }

  // ---------- 琛ㄥ崟鎻愪氦 ----------
  function bindForms() {
    $("#form-edit-feed").addEventListener("submit", async e => {
      e.preventDefault();
      if (!state.pendingEditId) return;
      const f = e.target;
      const r = await getById(state.pendingEditId);
      r.time = fromLocalInput(f.time.value);
      r.amount = Number(f.amount.value);
      r.note = f.note.value.trim();
      await putRecord(r);
      state.pendingEditId = null;
      toast("宸蹭繚瀛?);
      back();
      renderHome();
    });
    $("#form-edit-diaper").addEventListener("submit", async e => {
      e.preventDefault();
      if (!state.pendingEditId) return;
      const f = e.target;
      const r = await getById(state.pendingEditId);
      r.time = fromLocalInput(f.time.value);
      r.subKind = f.type.value;
      r.note = f.note.value.trim();
      await putRecord(r);
      state.pendingEditId = null;
      toast("宸蹭繚瀛?);
      back();
      renderHome();
    });
    $("#form-edit-sleep").addEventListener("submit", async e => {
      e.preventDefault();
      if (!state.pendingEditId) return;
      const f = e.target;
      const r = await getById(state.pendingEditId);
      r.start = fromLocalInput(f.start.value);
      r.end = f.end.value ? fromLocalInput(f.end.value) : null;
      r.note = f.note.value.trim();
      await putRecord(r);
      state.pendingEditId = null;
      toast("宸蹭繚瀛?);
      back();
      renderHome();
    });
    $("#form-edit-sleep").addEventListener("input", updateSleepDuration);
  }

  // ---------- PWA ----------
  function registerSW() { if ("serviceWorker" in navigator) { window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(()=>{}); }); } }

  // ---------- 鍛ㄦ湡鍒锋柊 ----------
  function startTicker() { if (state.ticker) clearInterval(state.ticker); state.ticker = setInterval(() => { if (!$("#view-home").classList.contains("hidden")) renderHome(); }, 30000); }

  // ---------- 鍚姩 ----------
  async function main() { await openDB(); await cleanupOld(); bindEvents(); bindTabEvents(); bindGlobalActions(); bindForms(); await renderHome(); startTicker(); registerSW(); }
  document.addEventListener("DOMContentLoaded", main);
  window.__babyApp = { getAll, putRecord, deleteRecord, goto, renderHome };
})();

