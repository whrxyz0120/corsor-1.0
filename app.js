/* 宝宝记录 */
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
  const sleepKindLabel = k => k==='pee'?'尿尿':k==='poop'?'大便':'混合';
  const fmtRel = ms => {
    if (ms < 0) return "--";
    const m = Math.floor(ms/60000);
    if (m < 1) return '刚刚';
    if (m < 60) return m+"分钟";
    const h = Math.floor(m/60); const mm = m%60;
    if (h < 24) return mm>0 ? (h+"小时"+mm+"分钟") : (h+"小时");
    const d = Math.floor(h/24); const hh = h%24;
    return hh>0 ? (d+"天"+hh+"小时") : (d+"天");
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
  // ---------- 状态 / Toast ----------
  const state = { pendingEditId: null, ticker: null };
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 1800);
  }
  // ---------- 视图导航 ----------
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
  // ---------- 渲染：主页 ----------
  async function renderHome() {
    const all = await getAll();
    const today = todayKey();
    const feeds = all.filter(r => r.kind==="feed" && dayKey(r.time)===today).sort((a,b)=>b.time-a.time);
    const diapers = all.filter(r => r.kind==="diaper" && dayKey(r.time)===today).sort((a,b)=>b.time-a.time);
    const sleeps = all.filter(r => r.kind==="sleep" && dayKey(r.start)===today).sort((a,b)=>b.start-a.start);
    const lastFeed = feeds[0];
    $("#feed-last-text").textContent = lastFeed ? "上次："+fmtTime(lastFeed.time)+"（"+lastFeed.amount+"ml）" : "上次：--:--（--）";
    $("#feed-since").textContent = "🕐 距上次：" + (lastFeed ? fmtRel(Date.now()-lastFeed.time) : "--");
    const lastDiaper = diapers[0];
    $("#diaper-last-text").textContent = lastDiaper ? "上次："+fmtTime(lastDiaper.time)+"（"+sleepKindLabel(lastDiaper.subKind)+"）" : "上次：--:--（--）";
    $("#diaper-since").textContent = "🕐 距上次：" + (lastDiaper ? fmtRel(Date.now()-lastDiaper.time) : "--");
    const openSleep = await getOpenSleep();
    const todayOpenSleep = openSleep && dayKey(openSleep.start)===today ? openSleep : null;
    const lastSleep = sleeps[0];
    if (todayOpenSleep) {
      $("#sleep-now").textContent = "当前：已睡 "+fmtRel(Date.now()-todayOpenSleep.start);
      $("#sleep-start").textContent = "开始时间："+fmtTime(todayOpenSleep.start);
      $("#sleep-toggle").textContent = "☀️ 睡醒";
    } else {
      const lastWake = lastSleep && lastSleep.end ? lastSleep : null;
      $("#sleep-now").textContent = lastWake ? "上次睡醒："+fmtTime(lastWake.end) : "当前：未在睡觉";
      $("#sleep-start").textContent = lastWake ? "睡了 "+fmtRel(lastWake.end-lastWake.start) : "开始时间：--";
      $("#sleep-toggle").textContent = "🌙 开始睡觉";
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
  // ---------- 列表渲染 ----------
  function recordRow(emoji, time, sub, amt, kind, id) {
    const li = document.createElement("li");
    li.className = "record";
    li.dataset.id = id;
    li.dataset.kind = kind;
    li.innerHTML = "<span class=\"record-emoji\">"+emoji+"</span><div class=\"record-mid\"><div class=\"record-time\">"+time+"</div><div class=\"record-sub\">"+(sub||"")+"</div></div><div class=\"record-amt\">"+(amt||"")+"</div><div class=\"record-chev\">›</div>";
    li.addEventListener("click", () => openEdit(kind, id));
    return li;
  }
  function renderFeedList(ul, list) { ul.innerHTML = ""; if (!list.length) { ul.innerHTML = "<li class=\u0022record empty\u0022>今天还没有喂奶记录</li>"; return; } list.forEach(r => { const sub = r.note || ""; ul.appendChild(recordRow("\ud83c\udf7c", fmtTime(r.time), sub, r.amount+"<small>ml</small>", "feed", r.id)); }); }
  function renderDiaperList(ul, list) { ul.innerHTML = ""; if (!list.length) { ul.innerHTML = "<li class=\u0022record empty\u0022>今天还没有尿布记录</li>"; return; } list.forEach(r => { const sub = sleepKindLabel(r.subKind)+(r.note?(" \u00b7 "+r.note):""); ul.appendChild(recordRow("\ud83e\uddf7", fmtTime(r.time), sub, "", "diaper", r.id)); }); }
  function renderSleepList(ul, list) { ul.innerHTML = ""; if (!list.length) { ul.innerHTML = "<li class=\u0022record empty\u0022>今天还没有睡觉记录</li>"; return; } list.forEach(r => { const dur = r.end ? (r.end - r.start) : (Date.now() - r.start); const sub = (r.end?("已睡 "+fmtRel(r.end-r.start)):("进行中 \u00b7 "+fmtRel(dur)))+(r.note?(" \u00b7 "+r.note):""); ul.appendChild(recordRow("\ud83d\ude34", fmtTime(r.start), sub, "", "sleep", r.id)); }); }
  // ---------- 编辑 ----------
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
    if (!list.length) { toast("今天还没有该记录"); return; }
    openEdit(kind, list[0].id);
  }
  function updateSleepDuration() {
    const f = $("#form-edit-sleep");
    const s = f.start.value, e = f.end.value;
    if (s && e) { const ms = fromLocalInput(e) - fromLocalInput(s); $("#sleep-duration").textContent = ms>=0 ? fmtRel(ms) : "时间不合法"; }
    else $("#sleep-duration").textContent = "--";
  }
  // ---------- 模态 ----------
  function openModal(html) { $("#modal-card").innerHTML = html; $("#modal-root").classList.remove("hidden"); }
  function closeModal() { $("#modal-root").classList.add("hidden"); $("#modal-card").innerHTML = ""; }
  function bindModalActions(onConfirm) {
    $("#modal-card").querySelectorAll("[data-modal=cancel]").forEach(b => b.addEventListener("click", closeModal));
    $("#modal-card").querySelectorAll("[data-modal=confirm]").forEach(b => b.addEventListener("click", () => { const r = onConfirm && onConfirm(); if (r !== false) closeModal(); }));
  }
  function showTimePicker(value, onPicked) {
    const html = `<div class="time-picker"><div class="modal-title">选择时间</div><label class="field"><span class="field-label">日期 & 时间</span><input type="datetime-local" id="tp-input" value="${value}"></label><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">取消</button><button class="btn primary" type="button" data-modal="confirm">完成</button></div></div>`;
    openModal(html);
    bindModalActions(() => { const v = $("#tp-input").value; if (!v) { toast("请选择时间"); return false; } onPicked(v); });
  }
  // ---------- 喂奶快捷 ----------
  function feedConfirmModal(amount, time) {
    const html = `<div class="modal-title">记录喂奶？</div><div class="modal-row"><div class="modal-row-label">时间</div><div class="modal-row-value"><span class="text" id="fc-time">${fmtTime(time)}</span><button class="edit-btn" id="fc-edit">✏️</button></div></div><div class="modal-amount">${amount}<small>ml</small></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">取消</button><button class="btn primary" type="button" data-modal="confirm">确认</button></div>`;
    openModal(html);
    $("#fc-edit").addEventListener("click", () => { showTimePicker(toLocalInput(time), v => feedConfirmModal(amount, fromLocalInput(v))); });
    bindModalActions(() => feedConfirm(amount, time));
  }
  function feedQuick(amount) { feedConfirmModal(amount, Date.now()); }
  async function feedConfirm(amount, time) {
    const rec = { id: "f_"+time+"_"+Math.random().toString(36).slice(2,7), kind: "feed", time, amount: Number(amount), note: "" };
    await putRecord(rec);
    toast("✓ 已记录"+amount+"ml");
    renderHome();
  }
  // ---------- 自定义奶量 ----------
  function feedCustomModal(time) {
    time = time || Date.now();
    const html = `<div class="modal-title">自定义奶量</div><div class="modal-row"><div class="modal-row-label">时间</div><div class="modal-row-value"><span class="text" id="cc-time">${fmtTime(time)}</span><button class="edit-btn" id="cc-edit">✏️</button></div></div><div class="custom-amount"><input type="number" inputmode="numeric" id="cc-amt" min="0" max="9999" placeholder="0"><small>ml</small></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">取消</button><button class="btn primary" type="button" data-modal="confirm">确认</button></div>`;
    openModal(html);
    setTimeout(() => $("#cc-amt").focus(), 60);
    $("#cc-edit").addEventListener("click", () => { showTimePicker(toLocalInput(time), v => feedCustomModal(fromLocalInput(v))); });
    bindModalActions(() => { const amt = Number($("#cc-amt").value); if (!amt || amt<=0) { toast("请输入奶量"); return false; } feedConfirm(amt, time); });
  }
  function feedCustom() { feedCustomModal(Date.now()); }
  // ---------- 尿布快捷 ----------
  function diaperConfirmModal(type, time) {
    const label = sleepKindLabel(type);
    const html = `<div class="modal-title">记录尿布？</div><div class="modal-row"><div class="modal-row-label">时间</div><div class="modal-row-value"><span class="text">${fmtTime(time)}</span><button class="edit-btn" id="dc-edit">✏️</button></div></div><div class="modal-row"><div class="modal-row-label">类型</div><div class="modal-row-value"><span class="text" style="min-width:80px">${label}</span></div></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">取消</button><button class="btn primary" type="button" data-modal="confirm">确认</button></div>`;
    openModal(html);
    $("#dc-edit").addEventListener("click", () => { showTimePicker(toLocalInput(time), v => diaperConfirmModal(type, fromLocalInput(v))); });
    bindModalActions(() => diaperConfirm(type, time));
  }
  function diaperQuick(type) { diaperConfirmModal(type, Date.now()); }
  async function diaperConfirm(type, time) {
    const rec = { id: "d_"+time+"_"+Math.random().toString(36).slice(2,7), kind: "diaper", time, subKind: type, note: "" };
    await putRecord(rec);
    toast("✓ 已记录"+sleepKindLabel(type));
    renderHome();
  }
  // ---------- 睡觉 ----------
  async function sleepToggle() {
    const openSleep = await getOpenSleep();
    if (openSleep) endSleepModal(openSleep);
    else startSleepModal();
  }
  function startSleepModal(time) {
    time = time || Date.now();
    const html = `<div class="modal-title">开始睡觉？</div><div class="modal-row"><div class="modal-row-label">时间</div><div class="modal-row-value"><span class="text">${fmtTime(time)}</span><button class="edit-btn" id="sc-edit">✏️</button></div></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">取消</button><button class="btn primary" type="button" data-modal="confirm">确认</button></div>`;
    openModal(html);
    $("#sc-edit").addEventListener("click", () => { showTimePicker(toLocalInput(time), v => startSleepModal(fromLocalInput(v))); });
    bindModalActions(() => sleepStart(time));
  }
  function endSleepModal(rec, startTs, endTs) {
    startTs = startTs || rec.start;
    endTs = endTs || Date.now();
    const html = `<div class="modal-title">结束睡觉？</div><div class="modal-row"><div class="modal-row-label">开始</div><div class="modal-row-value"><span class="text" id="ec-start">${fmtTime(startTs)}</span><button class="edit-btn" id="ec-es">✏️</button></div></div><div class="modal-row"><div class="modal-row-label">结束</div><div class="modal-row-value"><span class="text" id="ec-end">${fmtTime(endTs)}</span><button class="edit-btn" id="ec-ee">✏️</button></div></div><div class="modal-row"><div class="modal-row-label">时长</div><div class="modal-row-value"><span class="text" id="ec-dur">${fmtRel(endTs-startTs)}</span></div></div><div class="modal-actions"><button class="btn" type="button" style="background:#f3f4f6;color:#1f2937" data-modal="cancel">取消</button><button class="btn primary" type="button" data-modal="confirm">确认</button></div>`;
    openModal(html);
    $("#ec-es").addEventListener("click", () => { showTimePicker(toLocalInput(startTs), v => { const ns = fromLocalInput(v); if (ns >= endTs) { toast("开始时间不能晚于结束时间"); return; } endSleepModal(rec, ns, endTs); }); });
    $("#ec-ee").addEventListener("click", () => { showTimePicker(toLocalInput(endTs), v => { const ne = fromLocalInput(v); if (ne <= startTs) { toast("结束时间不能早于开始时间"); return; } endSleepModal(rec, startTs, ne); }); });
    bindModalActions(() => endSleepConfirm(rec, startTs, endTs));
  }
  async function endSleepConfirm(rec, startTs, endTs) { rec.start = startTs; rec.end = endTs; await putRecord(rec); toast("✓ 已结束睡觉，"+fmtRel(endTs-startTs)); renderHome(); }
  async function sleepStart(time) { const rec = { id: "s_"+time+"_"+Math.random().toString(36).slice(2,7), kind: "sleep", start: time, end: null, note: "" }; await putRecord(rec); toast("✓ 已开始睡觉"); renderHome(); }
  // ---------- 7 天汇总 ----------
  async function renderSummary() {
    const all = await getAll();
    const ul = $("#summary-list");
    ul.innerHTML = "";
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i=0; i<7; i++) {
      const d = new Date(today.getTime() - i*24*60*60*1000);
      const key = dayKey(d.getTime());
      const label = i===0 ? "今天" : (i===1 ? "昨天" : (pad(d.getMonth()+1)+"-"+pad(d.getDate())));
      const feeds = all.filter(r => r.kind==="feed" && dayKey(r.time)===key);
      const diapers = all.filter(r => r.kind==="diaper" && dayKey(r.time)===key);
      const sleeps = all.filter(r => r.kind==="sleep" && dayKey(r.start)===key && r.end);
      const ml = feeds.reduce((s,r)=>s+(r.amount||0),0);
      const sleepMs = sleeps.reduce((s,r)=>s+(r.end-r.start),0);
      addSummaryRow(ul, label, ml, feeds.length, diapers.length, sleepMs);
    }
  }
  function addSummaryRow(ul, label, ml, feedCount, diaperCount, sleepMs) {
    const li = document.createElement("li");
    li.className = "summary-item";
    const sleepText = sleepMs>0 ? fmtRel(sleepMs) : "--";
    li.innerHTML = `<div class="date">${label}</div><div class="num">${ml}<small style="font-size:11px;font-weight:500;color:#6b7280"> ml</small></div><div class="sub">喂奶 ${feedCount} 次 · 尿布 ${diaperCount} 次</div><div class="sub-r">睡 ${sleepText}</div>`;
    ul.appendChild(li);
  }
  // ---------- 事件绑定 ----------
  function bindEvents() {
    $$("#feed-quick .pill").forEach(b => { b.addEventListener("click", () => { const v = b.dataset.amount; if (v === "custom") feedCustom(); else feedQuick(Number(v)); }); });
    $$("#diaper-quick .pill").forEach(b => { b.addEventListener("click", () => diaperQuick(b.dataset.type)); });
    $("#sleep-toggle").addEventListener("click", sleepToggle);
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
  // ---------- 全局点击委托 ----------
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
        if (confirm("确定删除这条记录？")) {
          if (state.pendingEditId) {
            deleteRecord(state.pendingEditId).then(() => { state.pendingEditId = null; toast("已删除"); back(); renderHome(); });
          }
        }
      }
    });
  }
  // ---------- 表单提交 ----------
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
      toast("已保存");
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
      toast("已保存");
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
      toast("已保存");
      back();
      renderHome();
    });
    $("#form-edit-sleep").addEventListener("input", updateSleepDuration);
  }
  // ---------- PWA ----------
  function registerSW() { if ("serviceWorker" in navigator) { window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(()=>{}); }); } }
  // ---------- 周期刷新 ----------
  function startTicker() { if (state.ticker) clearInterval(state.ticker); state.ticker = setInterval(() => { if (!$("#view-home").classList.contains("hidden")) renderHome(); }, 30000); }
  // ---------- 启动 ----------
  async function main() { await openDB(); await cleanupOld(); bindEvents(); bindTabEvents(); bindGlobalActions(); bindForms(); await renderHome(); startTicker(); registerSW(); }
  document.addEventListener("DOMContentLoaded", main);
  window.__babyApp = { getAll, putRecord, deleteRecord, goto, renderHome };
})();
