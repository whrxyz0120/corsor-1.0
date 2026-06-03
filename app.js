"use strict";
/* === 小宇宙喂养记录 - 主应用 === */
/* === 工具函数 === */
const U = {
  pad2: function (n) { return String(n).padStart(2, "0"); },
  startOfDay: function (d) { var x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); return x; },
  sameDay: function (a, b) { return U.startOfDay(a).getTime() === U.startOfDay(b).getTime(); },
  fmtDate: function (d) { return d.getFullYear() + "-" + U.pad2(d.getMonth() + 1) + "-" + U.pad2(d.getDate()); },
  fmtTime: function (d) { return U.pad2(d.getHours()) + ":" + U.pad2(d.getMinutes()); },
  fmtDateTime: function (d) { return U.fmtDate(d) + " " + U.fmtTime(d); },
  fmtDayLabel: function (date) {
    var today = U.startOfDay(new Date()).getTime();
    var d = U.startOfDay(date).getTime();
    var diff = Math.round((today - d) / 86400000);
    if (diff === 0) return "今天";
    if (diff === 1) return "昨天";
    if (diff === 2) return "前天";
    return diff + "天前";
  },
  fmtWeekday: function (date) { return ["周日","周一","周二","周三","周四","周五","周六"][date.getDay()]; },
  fmtMonthDay: function (d) { return (d.getMonth() + 1) + "月" + d.getDate() + "日"; },
  fmtDuration: function (ms) {
    if (ms < 0) ms = 0;
    var totalMin = Math.floor(ms / 60000);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if (h > 0) return h + "小时" + m + "分钟";
    return m + "分钟";
  },
  fmtAgo: function (ms) {
    if (ms < 60000) return "刚刚";
    var totalMin = Math.floor(ms / 60000);
    if (totalMin < 60) return totalMin + "分钟前";
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if (h < 24) return h + "小时" + (m > 0 ? m + "分钟" : "") + "前";
    var d = Math.floor(h / 24);
    return d + "天前";
  },
  uuid: function () { return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); },
  escape: function (s) {
    var s2 = String(s == null ? "" : s);
    return s2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
};
  fmtAgo: function (ms) {
    if (ms < 60000) return "刚刚";
    var totalMin = Math.floor(ms / 60000);
    if (totalMin < 60) return totalMin + "分钟前";
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if (h < 24) return h + "小时" + (m > 0 ? m + "分钟" : "") + "前";
    var d = Math.floor(h / 24);
    return d + "天前";
  },
  uuid: function () { return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); },
  escape: function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {

/* === IndexedDB 数据层 === */
const DB = {
  _db: null,
  open: function () {
    if (DB._db) return Promise.resolve(DB._db);
    return new Promise(function (resolve, reject) {
          s.createIndex("startTime", "startTime");
        }
      };
      req.onsuccess = function (e) { DB._db = e.target.result; resolve(DB._db); };
      req.onerror = function () { reject(req.error); };
    });
  }
};
  put: function (store, data) {
    return new Promise(function (resolve, reject) {
      var tx = DB._db.transaction(store, "readwrite");
      var req = tx.objectStore(store).put(data);
      req.onsuccess = function () { resolve(data); };
      req.onerror = function () { reject(req.error); };
    });
  },
  del: function (store, id) {
    return new Promise(function (resolve, reject) {
      var tx = DB._db.transaction(store, "readwrite");
      var req = tx.objectStore(store).delete(id);
      req.onsuccess = function () { resolve(); };
      req.onerror = function () { reject(req.error); };
    });
  },
  all: function (store) {
    return new Promise(function (resolve, reject) {
      var tx = DB._db.transaction(store, "readonly");
      var req = tx.objectStore(store).getAll();
      req.onsuccess = function () { resolve(req.result || []); };
      req.onerror = function () { reject(req.error); };
    });
  }
};

/* === 状态 === */
const State = {
  sleep: null,
  homeTab: "feeding",
  init: async function () {
    var sleeps = await DB.all("sleeps");
    State.sleep = sleeps.find(function (s) { return !s.endTime; }) || null;
  }
};

/* === Toast === */
const Toast = {
  show: function (msg, icon) {
    var root = document.getElementById("toast-root");
    if (!root) return;
    var el = document.createElement("div");
    el.className = "toast";
    var html = "";
    if (icon) html += "<span class=ico>" + icon + "</span>";
    html += "<span>" + U.escape(msg) + "</span>";
    el.innerHTML = html;
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity 0.2s";
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 220);
    }, 1500);
  },
  ok: function (msg) { Toast.show(msg, "<svg><use href=#i-check/></svg>"); }
};
/* === Modal === */
const Modal = {
  _el: null,
  _onClose: null,
  open: function (opts) {
    Modal.close();
    var root = document.getElementById("modal-root");
    Modal._onClose = opts.onClose || null;
    var bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.addEventListener("click", function () { Modal.close(); });
    var card = document.createElement("div");
    card.className = "modal-card";
    var html = "";
    if (opts.title) html += "<h3 class=modal-title>" + U.escape(opts.title) + "</h3>";
    html += "<div class=modal-body>" + (opts.body || "") + "</div>";
    if (opts.actions) {
      html += "<div class=modal-actions>";
      opts.actions.forEach(function (a) {
        html += "<button class=btn " + (a.primary ? "primary" : "cancel") + " data-act=" + a.key + ">" + U.escape(a.label) + "</button>";
      });
      html += "</div>";
    }
    card.innerHTML = html;
    if (opts.actions) {
      card.querySelectorAll("button[data-act]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var act = opts.actions.find(function (a) { return a.key === btn.getAttribute("data-act"); });
          if (act && act.onClick) act.onClick();
        });
      });
    }
    root.appendChild(bg);
    root.appendChild(card);
    Modal._el = { root: root, bg: bg, card: card };
    requestAnimationFrame(function () { root.classList.add("open"); root.setAttribute("aria-hidden", "false"); });
  },
  close: function () {
    if (!Modal._el) return;
    var el = Modal._el;
    Modal._el = null;
    el.root.classList.remove("open");
    el.root.setAttribute("aria-hidden", "true");
    setTimeout(function () {
      el.bg.remove();
      el.card.remove();
      if (Modal._onClose) { var cb = Modal._onClose; Modal._onClose = null; cb(); }
    }, 200);
  },
  confirm: function (opts) {
    return new Promise(function (resolve) {
      Modal.open({
        title: opts.title,
        body: opts.body,
        actions: [
          { key: "cancel", label: opts.cancel || "取消" },
          { key: "ok", label: opts.ok || "确认", primary: true, onClick: function () { Modal.close(); resolve(true); } }
        ],
        onClose: function () { resolve(false); }
      });
    });
  }
};
/* === TimePicker (iOS 风格滚轮) === */
const TimePicker = {
  pick: function (opts) {
    opts = opts || {};
    var initial = opts.initial || new Date();
    return new Promise(function (resolve) {
      var curDate = U.startOfDay(initial);
      var curH = initial.getHours();
      var curM = initial.getMinutes();
      var root = document.getElementById("modal-root");
      var bg = document.createElement("div");
      bg.className = "modal-bg";
      var sheet = document.createElement("div");
      sheet.className = "picker";
      var hOpts = "";
      for (var h = 0; h < 24; h++) hOpts += "<div class=picker-opt data-v=" + h + ">" + U.pad2(h) + "</div>";
      var mOpts = "";
      for (var m = 0; m < 60; m++) mOpts += "<div class=picker-opt data-v=" + m + ">" + U.pad2(m) + "</div>";
      sheet.innerHTML = "<div class=picker-hd>" +
        "<button class=btn data-act=cancel>取消</button>" +
        "<div class=title>选择时间</div>" +
        "<button class=btn ok data-act=ok>完成</button>" +
        "</div>" +
        "<div class=picker-body>" +
        "<div class=picker-date>" + U.fmtMonthDay(curDate) + " " + U.fmtWeekday(curDate) + "</div>" +
        "<div class=picker-wheels>" +
        "<div class=picker-col data-type=hour><div class=picker-list id=tp-hour>" + hOpts + "</div></div>" +
        "<div class=picker-col data-type=minute><div class=picker-list id=tp-minute>" + mOpts + "</div></div>" +
        "</div></div>";
      root.appendChild(bg);
      root.appendChild(sheet);
      root.classList.add("open");
      root.setAttribute("aria-hidden", "false");
      /* 滚动列表到初始位置 */
      var hList = sheet.querySelector("#tp-hour");
      var mList = sheet.querySelector("#tp-minute");
      var ITEM_H = 36;
      hList.scrollTop = curH * ITEM_H;
      mList.scrollTop = curM * ITEM_H;
      function updateCur() {
        curH = Math.round(hList.scrollTop / ITEM_H);
        curM = Math.round(mList.scrollTop / ITEM_H);
        hList.querySelectorAll(".picker-opt").forEach(function (o) { o.classList.remove("cur"); });
        mList.querySelectorAll(".picker-opt").forEach(function (o) { o.classList.remove("cur"); });
        var hOpt = hList.querySelector("[data-v=" + curH + "]");
        var mOpt = mList.querySelector("[data-v=" + curM + "]");
        if (hOpt) hOpt.classList.add("cur");
        if (mOpt) mOpt.classList.add("cur");
      }
      hList.addEventListener("scroll", function () {
        clearTimeout(hList._t);
        hList._t = setTimeout(function () {
          hList.scrollTop = Math.round(hList.scrollTop / ITEM_H) * ITEM_H;
          updateCur();
        }, 80);
      });
      mList.addEventListener("scroll", function () {
        clearTimeout(mList._t);
        mList._t = setTimeout(function () {
          mList.scrollTop = Math.round(mList.scrollTop / ITEM_H) * ITEM_H;
          updateCur();
        }, 80);
      });
      setTimeout(updateCur, 50);
      function cleanup() {
        root.classList.remove("open");
        root.setAttribute("aria-hidden", "true");
        bg.remove(); sheet.remove();
      }
      sheet.querySelector("[data-act=cancel]").addEventListener("click", function () { cleanup(); if (opts.onCancel) opts.onCancel(); });
      bg.addEventListener("click", function () { cleanup(); if (opts.onCancel) opts.onCancel(); });
      sheet.querySelector("[data-act=ok]").addEventListener("click", function () {
        updateCur();
        var d = new Date(curDate);
        d.setHours(curH, curM, 0, 0);
        cleanup();
        if (opts.onConfirm) opts.onConfirm(d);
      });
    });
  }
};
/* === Router === */
const Router = {
  handle: function () {
    var hash = location.hash || "#/";
    var path = hash.replace(/^#/, "");
    if (path === "" || path === "/") return Views.home();
    if (path === "/feeding") return Views.today("feeding");
    if (path === "/diaper") return Views.today("diaper");
    if (path === "/sleep") return Views.today("sleep");
    if (path === "/summary") return Views.summary();
    var m = path.match(/^\/edit\/(feeding|diaper|sleep)\/(.+)$/);
    if (m) return Views.edit(m[1], m[2]);
    return Views.home();
  }
};
window.addEventListener("hashchange", function () { Router.handle(); });

/* === 视图 === */
const Views = {
  _setHTML: function (html) {
    var v = document.getElementById("view");
    v.innerHTML = html;
    window.scrollTo(0, 0);
  },
  icon: function (id) { return "<svg><use href=\"#" + id + "\"/></svg>"; }
};

  home: async function () {
    var feedings = await DB.all("feedings");
    var diapers = await DB.all("diapers");
    var sleeps = await DB.all("sleeps");
    feedings.sort(function (a, b) { return b.time - a.time; });
    diapers.sort(function (a, b) { return b.time - a.time; });
    sleeps.sort(function (a, b) { return b.startTime - a.startTime; });
    var lastF = feedings[0] || null;
    var lastD = diapers[0] || null;
    State.sleep = sleeps.find(function (s) { return !s.endTime; }) || null;
    var sInfo;
    if (State.sleep) {
      sInfo = "进行中<br>开始: <span class=v>" + U.fmtTime(new Date(State.sleep.startTime)) + "</span><br>已睡: <span class=v>" + U.fmtAgo(now - State.sleep.startTime) + "</span>";
    } else if (sleeps.length > 0) {
      var last = sleeps[0];
      sInfo = "上次睡醒: <span class=v>" + U.fmtTime(new Date(last.endTime)) + "</span><br>距睡醒: <span class=v>" + U.fmtAgo(now - last.endTime) + "</span>";
    } else {
      sInfo = "暂无记录";
    }
    var sBtn = State.sleep
      ? "<button class=\"sleep-btn\" data-act=\"end-sleep\">结束睡觉 (已睡 " + U.fmtAgo(now - State.sleep.startTime) + ")</button>"
      : "<button class=\"sleep-btn\" data-act=\"start-sleep\">开始睡觉</button>";
    var html = "";
    html += "<div class=app-header>";
    html += "<div class=app-title><div class=app-title-icon>" + Views.icon("i-baby") + "</div>宝宝记录</div>";
    html += "</div>";
    html += "<div class=cards>";
    html += "<div class=card>";
html += "<div class=\"card-hd\"><div class=\"card-icon feeding\">" + Views.icon("i-bottle") + "</div><div class=card-title>喂奶</div></div>";
html += "<div class=card-actions>";
html += "<button class=amount-btn data-amt=60>60</button>";
html += "<button class=amount-btn data-amt=90>90</button>";
html += "<button class=amount-btn data-amt=100>100</button>";
html += "<button class=amount-btn data-amt=120>120</button>";
html += "<button class=amount-btn data-amt=150>150</button>";
html += "<button class=\"amount-btn custom\" data-act=custom>自定义</button>";
html += "</div></div>";
html += "<div class=card>";
html += "<div class=\"card-hd\"><div class=\"card-icon diaper\">" + Views.icon("i-diaper") + "</div><div class=card-title>尿布</div></div>";
html += "<div class=card-info>" + dInfo + "</div>";
html += "<div class=card-actions>";
html += "<button class=\"type-btn\" data-type=pee>" + Views.icon("i-pee") + " 尿尿</button>";
html += "<button class=\"type-btn\" data-type=poop>" + Views.icon("i-poop") + " 大便</button>";
html += "<button class=\"type-btn\" data-type=mixed>" + Views.icon("i-mix") + " 混合</button>";
html += "</div></div>";
html += "<div class=card>";
html += "<div class=\"card-hd\"><div class=\"card-icon sleep\">" + Views.icon("i-moon") + "</div><div class=card-title>睡觉</div></div>";
html += "<div class=card-info>" + sInfo + "</div>";
html += "<div class=card-actions>" + sBtn + "</div>";
html += "</div>";
html += "</div>";
html += "<div class=section>";
html += "<div class=section-hd><h2>今天</h2></div>";
html += "<div class=tabs>";
html += "<button class=\"tab" + (State.homeTab === "feeding" ? " active" : "") + "\" data-tab=feeding>" + Views.icon("i-bottle") + " 喂奶</button>";
html += "<button class=\"tab" + (State.homeTab === "diaper" ? " active" : "") + "\" data-tab=diaper>" + Views.icon("i-diaper") + " 尿布</button>";
html += "<button class=\"tab" + (State.homeTab === "sleep" ? " active" : "") + "\" data-tab=sleep>" + Views.icon("i-moon") + " 睡觉</button>";
html += "</div>";
var tab = State.homeTab;
var todayStart = U.startOfDay(new Date()).getTime();
var todayEnd = todayStart + 86400000;
if (tab === "feeding") {
  var tList = feedings.filter(function (r) { return r.time >= todayStart && r.time < todayEnd; });
  tList.sort(function (a, b) { return b.time - a.time; });
  var total = tList.reduce(function (s, r) { return s + r.amount; }, 0);
  html += "<div class=stats-row>";
  html += "<div class=stat><div class=stat-label>今日总奶量</div><div class=stat-value>" + total + "<small>ml</small></div></div>";
  html += "<div class=stat><div class=stat-label>今日喂奶次数</div><div class=stat-value>" + tList.length + "<small>次</small></div></div>";
  html += "</div>";
  if (tList.length === 0) {
    html += "<div class=records><div class=empty>今天还没有喂奶记录</div></div>";
  } else {
    html += "<div class=records>";
    tList.forEach(function (r) {
      html += "<div class=rec><div class=rec-ico>" + Views.icon("i-bottle") + "</div><div class=rec-time>" + U.fmtTime(new Date(r.time)) + "</div><div class=rec-detail>" + r.amount + "ml</div><button class=rec-edit data-edit=feeding data-id=" + r.id + ">" + Views.icon("i-edit") + "</button></div>";
    });
    html += "</div>";
  }
} else if (tab === "diaper") {
  var tList2 = diapers.filter(function (r) { return r.time >= todayStart && r.time < todayEnd; });
  tList2.sort(function (a, b) { return b.time - a.time; });
  var cntPee = tList2.filter(function (r) { return r.type === "pee"; }).length;
  var cntPoop = tList2.filter(function (r) { return r.type === "poop"; }).length;
  var cntMix = tList2.filter(function (r) { return r.type === "mixed"; }).length;
  html += "<div class=stats-row>";
  html += "<div class=stat><div class=stat-label>尿尿</div><div class=stat-value>" + cntPee + "<small>次</small></div></div>";
  html += "<div class=stat><div class=stat-label>大便</div><div class=stat-value>" + cntPoop + "<small>次</small></div></div>";
  html += "</div>";
  if (tList2.length === 0) {
    html += "<div class=records><div class=empty>今天还没有尿布记录</div></div>";
  } else {
    html += "<div class=records>";
    tList2.forEach(function (r) {
      html += "<div class=rec><div class=rec-ico>" + Views.icon(Views._diaperIcon(r.type)) + "</div><div class=rec-time>" + U.fmtTime(new Date(r.time)) + "</div><div class=rec-detail>" + Views._diaperLabel(r.type) + "</div><button class=rec-edit data-edit=diaper data-id=" + r.id + ">" + Views.icon("i-edit") + "</button></div>";
    });
    html += "</div>";
  }
} else {
  var tList3 = sleeps.filter(function (r) { return (r.startTime >= todayStart && r.startTime < todayEnd) || (r.endTime && r.endTime >= todayStart && r.endTime < todayEnd) || (r.startTime < todayStart && (!r.endTime || r.endTime >= todayStart)); });
  tList3.sort(function (a, b) { return b.startTime - a.startTime; });
  var totalSleepMs = tList3.reduce(function (s, r) { return s + (r.duration || (r.endTime ? r.endTime - r.startTime : 0)); }, 0);
  html += "<div class=stats-row>";
  html += "<div class=stat><div class=stat-label>今日睡眠</div><div class=stat-value>" + (totalSleepMs > 0 ? U.fmtDuration(totalSleepMs) : "--") + "</div></div>";
  html += "<div class=stat><div class=stat-label>睡眠次数</div><div class=stat-value>" + tList3.length + "<small>次</small></div></div>";
  html += "</div>";
  if (tList3.length === 0) {
    html += "<div class=records><div class=empty>今天还没有睡觉记录</div></div>";
  } else {
    html += "<div class=records>";
    tList3.forEach(function (r) {
      var d = r.duration || (r.endTime ? r.endTime - r.startTime : 0);
      var dur = r.endTime ? U.fmtDuration(d) : "进行中";
      html += "<div class=rec><div class=rec-ico>" + Views.icon("i-moon") + "</div><div class=rec-time>" + U.fmtTime(new Date(r.startTime)) + "</div><div class=rec-detail>" + dur + "</div><button class=rec-edit data-edit=sleep data-id=" + r.id + ">" + Views.icon("i-edit") + "</button></div>";
    });
    html += "</div>";
  }
}
html += "<a class=summary-link href=#/summary><div class=ico>" + Views.icon("i-summary") + "</div><div class=lbl>最近7天汇总</div>" + Views.icon("i-chevron") + "</a>";
html += "</div>";
Views._setHTML(html);
Views._bindHomeEvents();
  },
_diaperLabel: function (t) { return t === "pee" ? "尿尿" : t === "poop" ? "大便" : "混合"; },
_diaperIcon: function (t) { return t === "pee" ? "i-pee" : t === "poop" ? "i-poop" : "i-mix"; },
_bindHomeEvents: function () {
  var v = document.getElementById("view");
  v.querySelectorAll(".amount-btn[data-amt]").forEach(function (b) {
    b.addEventListener("click", function () { Views._quickFeed(parseInt(b.getAttribute("data-amt"), 10)); });
  });
  v.querySelectorAll(".amount-btn[data-act=custom]").forEach(function (b) {
    b.addEventListener("click", Views._customFeedPrompt);
  });
  v.querySelectorAll(".type-btn[data-type]").forEach(function (b) {
    b.addEventListener("click", function () { Views._quickDiaper(b.getAttribute("data-type")); });
  });
  v.querySelectorAll(".sleep-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.getAttribute("data-act") === "start-sleep") Views._startSleep();
      else Views._endSleepPrompt();
    });
  });
  v.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      State.homeTab = t.getAttribute("data-tab");
      Views.home();
    });
  });
  v.querySelectorAll(".rec-edit").forEach(function (b) {
    b.addEventListener("click", function () {
      var type = b.getAttribute("data-edit");
      var id = b.getAttribute("data-id");
      location.hash = "#/edit/" + type + "/" + id;
    });
  });
},
_quickFeed: function (amount) {
  var now = new Date();
  var body = "<div class=modal-row><div class=lbl>时间</div><div class=v>" + U.fmtTime(now) + " <button class=tp-btn data-act=change-time style=color:var(--c-primary);font-size:13px;background:none;border:0;cursor:pointer>更改</button></div></div>";
  body += "<div class=modal-row><div class=lbl>奶量</div><div class=v>" + amount + " ml</div></div>";
  var selectedTime = now.getTime();
  Modal.open({
    title: "记录喂奶?",
    body: body,
    actions: [
      { key: "cancel", label: "取消" },
      { key: "ok", label: "确认", primary: true, onClick: function () {
        var data = { id: U.uuid(), time: selectedTime, amount: amount, note: "" };
        DB.put("feedings", data).then(function () {
          Modal.close();
          Toast.ok("已记录 " + amount + "ml");
          Views.home();
        });
      } }
    ]
  });
  var btn = document.querySelector(".tp-btn[data-act=change-time]");
  if (btn) btn.addEventListener("click", function () {
    Modal.close();
    TimePicker.pick({ initial: new Date(selectedTime), onConfirm: function (d) {
      selectedTime = d.getTime();
      Views._quickFeed(amount);
    } });
  });
},
_customFeedPrompt: function () {
  var body = "<div style=padding:8px><input class=amount-input type=number id=cf-amt placeholder=\"输入奶量 (ml)\" min=1 max=999 inputmode=numeric autofocus></div>";
  Modal.open({
    title: "自定义奶量",
    body: body,
    actions: [
      { key: "cancel", label: "取消" },
      { key: "ok", label: "继续", primary: true, onClick: function () {
        var v = document.getElementById("cf-amt");
        var n = parseInt(v ? v.value : "", 10);
        if (!n || n <= 0) { if (v) v.focus(); return; }
        Views._quickFeed(n);
      } }
    ]
  });
  setTimeout(function () { var v = document.getElementById("cf-amt"); if (v) v.focus(); }, 200);
},
_quickDiaper: function (type) {
  var now = new Date();
  var body = "<div class=modal-row><div class=lbl>时间</div><div class=v>" + U.fmtTime(now) + " <button class=tp-btn data-act=change-time style=color:var(--c-primary);font-size:13px;background:none;border:0;cursor:pointer>更改</button></div></div>";
  body += "<div class=modal-row><div class=lbl>类型</div><div class=v>" + Views.icon(Views._diaperIcon(type)) + " " + Views._diaperLabel(type) + "</div></div>";
  var selectedTime = now.getTime();
  Modal.open({
    title: "记录尿布?",
    body: body,
    actions: [
      { key: "cancel", label: "取消" },
      { key: "ok", label: "确认", primary: true, onClick: function () {
        var data = { id: U.uuid(), time: selectedTime, type: type };
        DB.put("diapers", data).then(function () {
          Modal.close();
          Toast.ok("已记录 " + Views._diaperLabel(type));
          Views.home();
        });
      } }
    ]
  });
  var btn = document.querySelector(".tp-btn[data-act=change-time]");
  if (btn) btn.addEventListener("click", function () {
    Modal.close();
    TimePicker.pick({ initial: new Date(selectedTime), onConfirm: function (d) {
      selectedTime = d.getTime();
      Views._quickDiaper(type);
    } });
  });
},
_startSleep: function () {
  var now = new Date();
  var body = "<div class=modal-row><div class=lbl>时间</div><div class=v>" + U.fmtTime(now) + " <button class=tp-btn data-act=change-time style=color:var(--c-primary);font-size:13px;background:none;border:0;cursor:pointer>更改</button></div></div>";
  var selectedTime = now.getTime();
  Modal.open({
    title: "开始睡觉?",
    body: body,
    actions: [
      { key: "cancel", label: "取消" },
      { key: "ok", label: "确认", primary: true, onClick: function () {
        var data = { id: U.uuid(), startTime: selectedTime, endTime: null, duration: null };
        DB.put("sleeps", data).then(function () {
          State.sleep = data;
          Modal.close();
          Toast.ok("已开始记录睡眠");
          Views.home();
        });
      } }
    ]
  });
  var btn = document.querySelector(".tp-btn[data-act=change-time]");
  if (btn) btn.addEventListener("click", function () {
    Modal.close();
    TimePicker.pick({ initial: new Date(selectedTime), onConfirm: function (d) {
      selectedTime = d.getTime();
      Views._startSleep();
    } });
  });
},
_endSleepPrompt: function () {
  if (!State.sleep) return;
  var now = new Date();
  var s = new Date(State.sleep.startTime);
  var d = now.getTime() - s.getTime();
  var startTime = s.getTime();
  var endTime = now.getTime();
  function openConfirm(st, et) {
    var dur = et - st;
    var body = "<div class=modal-row><div class=lbl>开始</div><div class=v>" + U.fmtTime(new Date(st)) + " <button class=sp-btn data-act=chg-start style=color:var(--c-primary);font-size:13px;background:none;border:0;cursor:pointer>更改</button></div></div>";
    body += "<div class=modal-row><div class=lbl>结束</div><div class=v>" + U.fmtTime(new Date(et)) + " <button class=sp-btn data-act=chg-end style=color:var(--c-primary);font-size:13px;background:none;border:0;cursor:pointer>更改</button></div></div>";
    body += "<div class=modal-row><div class=lbl>时长</div><div class=v>" + U.fmtDuration(dur) + "</div></div>";
    Modal.open({
      title: "结束睡觉?",
      body: body,
      actions: [
        { key: "cancel", label: "取消" },
        { key: "ok", label: "确认", primary: true, onClick: function () {
          State.sleep.endTime = et;
          State.sleep.duration = et - st;
          DB.put("sleeps", State.sleep).then(function () {
            State.sleep = null;
            Modal.close();
            Toast.ok("已结束睡眠, 时长" + U.fmtDuration(et - st));
            Views.home();
          });
        } }
      ]
    });
    document.querySelectorAll(".sp-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var act = b.getAttribute("data-act");
        Modal.close();
        var init = act === "chg-start" ? new Date(st) : new Date(et);
        TimePicker.pick({ initial: init, onConfirm: function (d) {
          if (act === "chg-start") startTime = d.getTime();
          else endTime = d.getTime();
          openConfirm(startTime, endTime);
        } });
      });
    });
  }
  openConfirm(startTime, endTime);
},
today: async function (type) {
  var store = type === "feeding" ? "feedings" : type === "diaper" ? "diapers" : "sleeps";
  var all = await DB.all(store);
  var todayStart = U.startOfDay(new Date()).getTime();
  var todayEnd = todayStart + 86400000;
  var list;
  if (type === "sleep") {
    list = all.filter(function (r) { return (r.startTime >= todayStart && r.startTime < todayEnd) || (r.endTime && r.endTime >= todayStart && r.endTime < todayEnd) || (r.startTime < todayStart && (!r.endTime || r.endTime >= todayStart)); });
  } else {
    list = all.filter(function (r) { return r.time >= todayStart && r.time < todayEnd; });
  }
  list.sort(function (a, b) { return (b.time || b.startTime) - (a.time || a.startTime); });
  var html = "";
  html += "<div class=subpage-header>";
  html += "<button class=subpage-back data-act=back>" + Views.icon("i-back") + "</button>";
  html += "<div class=subpage-title>今天</div>";
  html += "<div class=subpage-action></div>";
  html += "</div>";
  html += "<div class=tabs>";
  html += "<button class=\"tab" + (type === "feeding" ? " active" : "") + "\" data-tab=feeding>" + Views.icon("i-bottle") + " 喂奶</button>";
  html += "<button class=\"tab" + (type === "diaper" ? " active" : "") + "\" data-tab=diaper>" + Views.icon("i-diaper") + " 尿布</button>";
  html += "<button class=\"tab" + (type === "sleep" ? " active" : "") + "\" data-tab=sleep>" + Views.icon("i-moon") + " 睡觉</button>";
  html += "</div>";
  if (type === "feeding") {
    var total = list.reduce(function (s, r) { return s + r.amount; }, 0);
    html += "<div class=stats-row>";
    html += "<div class=stat><div class=stat-label>今日总奶量</div><div class=stat-value>" + total + "<small>ml</small></div></div>";
    html += "<div class=stat><div class=stat-label>今日喂奶次数</div><div class=stat-value>" + list.length + "<small>次</small></div></div>";
    html += "</div>";
  } else if (type === "diaper") {
    var p = list.filter(function (r) { return r.type === "pee"; }).length;
    var po = list.filter(function (r) { return r.type === "poop"; }).length;
    html += "<div class=stats-row>";
    html += "<div class=stat><div class=stat-label>尿尿</div><div class=stat-value>" + p + "<small>次</small></div></div>";
    html += "<div class=stat><div class=stat-label>大便</div><div class=stat-value>" + po + "<small>次</small></div></div>";
    html += "</div>";
  } else {
    var totalMs = list.reduce(function (s, r) { return s + (r.duration || (r.endTime ? r.endTime - r.startTime : 0)); }, 0);
    html += "<div class=stats-row>";
    html += "<div class=stat><div class=stat-label>今日睡眠</div><div class=stat-value>" + (totalMs > 0 ? U.fmtDuration(totalMs) : "--") + "</div></div>";
    html += "<div class=stat><div class=stat-label>睡眠次数</div><div class=stat-value>" + list.length + "<small>次</small></div></div>";
    html += "</div>";
  if (list.length === 0) {
    html += "<div class=records><div class=empty>今天还没有记录</div></div>";
  } else {
    html += "<div class=records>";
    list.forEach(function (r) {
      if (type === "feeding") {
        html += "<div class=rec><div class=rec-ico>" + Views.icon("i-bottle") + "</div><div class=rec-time>" + U.fmtTime(new Date(r.time)) + "</div><div class=rec-detail>" + r.amount + "ml</div><button class=rec-edit data-id=" + r.id + ">" + Views.icon("i-edit") + "</button></div>";
      } else if (type === "diaper") {
        html += "<div class=rec><div class=rec-ico>" + Views.icon(Views._diaperIcon(r.type)) + "</div><div class=rec-time>" + U.fmtTime(new Date(r.time)) + "</div><div class=rec-detail>" + Views._diaperLabel(r.type) + "</div><button class=rec-edit data-id=" + r.id + ">" + Views.icon("i-edit") + "</button></div>";
      } else {
        var d2 = r.duration || (r.endTime ? r.endTime - r.startTime : 0);
        var dur = r.endTime ? U.fmtDuration(d2) : "进行中";
        html += "<div class=rec><div class=rec-ico>" + Views.icon("i-moon") + "</div><div class=rec-time>" + U.fmtTime(new Date(r.startTime)) + "</div><div class=rec-detail>" + dur + "</div><button class=rec-edit data-id=" + r.id + ">" + Views.icon("i-edit") + "</button></div>";
      }
    });
    html += "</div>";
  }
  Views._setHTML(html);
  Views._bindTodayEvents(type);
  },
_bindTodayEvents: function (type) {
  var v = document.getElementById("view");
  var back = v.querySelector("[data-act=back]");
  if (back) back.addEventListener("click", function () { location.hash = "#/"; });
  v.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { location.hash = "#/" + t.getAttribute("data-tab"); });
  });
  v.querySelectorAll(".rec-edit").forEach(function (b) {
    b.addEventListener("click", function () { location.hash = "#/edit/" + type + "/" + b.getAttribute("data-id"); });
  });
},
summary: async function () {
  var feedings = await DB.all("feedings");
  var diapers = await DB.all("diapers");
  var sleeps = await DB.all("sleeps");
  var days = [];
  var now = new Date();
  for (var i = 0; i < 7; i++) {
    var d = new Date(now);
    d.setDate(d.getDate() - i);
    var s = U.startOfDay(d).getTime();
    var e = s + 86400000;
    var fList = feedings.filter(function (r) { return r.time >= s && r.time < e; });
    var dList = diapers.filter(function (r) { return r.time >= s && r.time < e; });
    var slList = sleeps.filter(function (r) { return (r.startTime >= s && r.startTime < e) || (r.endTime && r.endTime > s) || (!r.endTime && r.startTime < e); });
    slList = slList.filter(function (r) { return r.startTime < e; });
    var ft = fList.reduce(function (sum, r) { return sum + r.amount; }, 0);
    var cntPee = dList.filter(function (r) { return r.type === "pee"; }).length;
    var cntPoop = dList.filter(function (r) { return r.type === "poop"; }).length;
    var cntMix = dList.filter(function (r) { return r.type === "mixed"; }).length;
    var sleepMs = 0;
    slList.forEach(function (r) {
      if (r.duration) { sleepMs += r.duration; return; }
      if (r.endTime) { sleepMs += r.endTime - r.startTime; return; }
      sleepMs += e - r.startTime;
    });
    days.push({ date: d, ml: ft, cnt: fList.length, pee: cntPee, poop: cntPoop, mix: cntMix, sleepMs: sleepMs });
  }
  var html = "";
  html += "<div class=subpage-header>";
  html += "<button class=subpage-back data-act=back>" + Views.icon("i-back") + "</button>";
  html += "<div class=subpage-title>最近7天汇总</div>";
  html += "<div class=subpage-action></div>";
  html += "</div>";
  days.forEach(function (day) {
    html += "<div class=day-card>";
    html += "<div class=day-hd><div class=day-lbl>" + U.fmtDayLabel(day.date) + "</div><div class=day-date>" + U.fmtMonthDay(day.date) + "</div></div>";
    html += "<div class=day-stats>";
    html += "<div class=day-stat><div class=ico style=color:var(--c-feeding-2)>" + Views.icon("i-bottle") + "</div><div class=v>" + day.ml + "</div><div class=u>ml 喂奶 " + day.cnt + "次</div></div>";
    html += "<div class=day-stat><div class=ico style=color:var(--c-diaper-2)>" + Views.icon("i-pee") + "</div><div class=v>" + day.pee + "</div><div class=u>次 尿尿</div></div>";
    html += "<div class=day-stat><div class=ico style=color:#B45309>" + Views.icon("i-poop") + "</div><div class=v>" + day.poop + "</div><div class=u>次 大便</div></div>";
    html += "<div class=day-stat><div class=ico style=color:#9333EA>" + Views.icon("i-mix") + "</div><div class=v>" + day.mix + "</div><div class=u>次 混合</div></div>";
    var sleepStr = day.sleepMs > 0 ? U.fmtDuration(day.sleepMs) : "--";
    html += "<div class=day-stat><div class=ico style=color:var(--c-sleep-2)>" + Views.icon("i-moon") + "</div><div class=v style=font-size:12px>" + sleepStr + "</div><div class=u>睡眠</div></div>";
    html += "</div>";
    html += "</div>";
  });
  html += "<div style=padding:12px 4px 0;font-size:12px;color:var(--c-text-2)>注: 今天的数据可编辑, 昨天及以前仅显示汇总, 不可查看或编辑明细。</div>";
  Views._setHTML(html);
  var back = document.querySelector("[data-act=back]");
  if (back) back.addEventListener("click", function () { location.hash = "#/"; });
  },
edit: async function (type, id) {
  var store = type === "feeding" ? "feedings" : type === "diaper" ? "diapers" : "sleeps";
  var all = await DB.all(store);
  var rec = all.find(function (r) { return r.id === id; });
  if (!rec) { location.hash = "#/"; return; }
  /* 只允许编辑今天的数据 */
  var recTime = rec.time || rec.startTime;
  if (!U.sameDay(new Date(recTime), new Date())) {
    Toast.show("仅可编辑今天的数据");
    location.hash = "#/";
    return;
  }
  var title = type === "feeding" ? "编辑喂奶记录" : type === "diaper" ? "编辑尿布记录" : "编辑睡觉记录";
  var html = "";
  html += "<div class=subpage-header>";
  html += "<button class=subpage-back data-act=back>" + Views.icon("i-back") + "</button>";
  html += "<div class=subpage-title>" + title + "</div>";
  html += "<button class=subpage-action data-act=del>删除</button>";
  html += "</div>";
  html += "<div class=form id=edit-form>";
  if (type === "feeding") {
    html += "<div class=field><div class=field-label>时间</div><div class=field-value data-field=time>" + U.fmtDateTime(new Date(rec.time)) + " " + Views.icon("i-chevron") + "</div></div>";
    html += "<div class=field><div class=field-label>奶量 (ml)</div><input class=field-input type=number inputmode=numeric min=1 max=999 id=f-amt value=\"" + rec.amount + "\"></div>";
    html += "<div class=field><div class=field-label>备注</div><div class=field-row><textarea class=field-ta id=f-note placeholder=\"可输入备注...\">" + U.escape(rec.note || "") + "</textarea></div></div>";
  } else if (type === "diaper") {
    html += "<div class=field><div class=field-label>时间</div><div class=field-value data-field=time>" + U.fmtDateTime(new Date(rec.time)) + " " + Views.icon("i-chevron") + "</div></div>";
    html += "<div class=field><div class=field-label>类型</div><div class=field-row>";
    ["pee", "poop", "mixed"].forEach(function (t) {
      var on = rec.type === t ? " on" : "";
      html += "<div class=\"radio-opt" + on + "\" data-d-type=" + t + "><div class=dot></div><div class=ico>" + Views.icon(Views._diaperIcon(t)) + "</div><div class=lbl>" + Views._diaperLabel(t) + "</div></div>";
    });
    html += "</div></div>";
  } else {
    html += "<div class=field><div class=field-label>开始时间</div><div class=field-value data-field=stime>" + U.fmtDateTime(new Date(rec.startTime)) + " " + Views.icon("i-chevron") + "</div></div>";
    var et = rec.endTime ? new Date(rec.endTime) : null;
    var etStr = et ? U.fmtDateTime(et) : "未结束";
    html += "<div class=field><div class=field-label>结束时间</div><div class=field-value data-field=etime>" + etStr + " " + Views.icon("i-chevron") + "</div></div>";
    var durStr = "--";
    if (et) durStr = U.fmtDuration(et.getTime() - rec.startTime);
    html += "<div class=field><div class=field-label>睡眠时长</div><div class=field-value style=background:var(--c-divider);color:var(--c-text-2);cursor:default data-field=dur>" + durStr + "</div></div>";
  }
  html += "</div>";
  html += "<button class=save-btn data-act=save>保存修改</button>";
  Views._setHTML(html);
  Views._bindEditEvents(type, rec);
  },
_bindEditEvents: function (type, rec) {
  var v = document.getElementById("view");
  v.querySelector("[data-act=back]").addEventListener("click", function () { history.back(); });
  v.querySelector("[data-act=del]").addEventListener("click", function () {
    Modal.confirm({ title: "确认删除?", body: "此操作不可撤销", ok: "删除", cancel: "取消" }).then(function (ok) {
      if (!ok) return;
      var store = type === "feeding" ? "feedings" : type === "diaper" ? "diapers" : "sleeps";
      DB.del(store, rec.id).then(function () {
        Toast.ok("已删除");
        history.back();
      });
    });
  });
  v.querySelectorAll("[data-field=time],[data-field=stime],[data-field=etime]").forEach(function (el) {
    el.addEventListener("click", function () {
      var f = el.getAttribute("data-field");
      var init = new Date();
      if (f === "time" || f === "stime") init = new Date(rec.time || rec.startTime);
      else if (f === "etime") init = rec.endTime ? new Date(rec.endTime) : new Date();
      TimePicker.pick({ initial: init, onConfirm: function (d) {
        if (f === "time") rec.time = d.getTime();
        else if (f === "stime") rec.startTime = d.getTime();
        else { rec.endTime = d.getTime(); rec.duration = d.getTime() - rec.startTime; }
        Views.edit(type, rec.id);
      } });
    });
  });
  if (type === "diaper") {
    v.querySelectorAll("[data-d-type]").forEach(function (el) {
      el.addEventListener("click", function () {
        v.querySelectorAll("[data-d-type]").forEach(function (e) { e.classList.remove("on"); });
        el.classList.add("on");
        rec.type = el.getAttribute("data-d-type");
      });
    });
  }
  v.querySelector("[data-act=save]").addEventListener("click", function () {
    if (type === "feeding") {
      var amt = parseInt((document.getElementById("f-amt") || {}).value || "", 10);
      if (!amt || amt <= 0) { Toast.show("请输入奶量"); return; }
      rec.amount = amt;
      rec.note = ((document.getElementById("f-note") || {}).value || "").trim();
    }
    var store = type === "feeding" ? "feedings" : type === "diaper" ? "diapers" : "sleeps";
    DB.put(store, rec).then(function () {
      Toast.ok("已保存");
      history.back();
    });
  });
},
};
/* === 初始化 === */
async function init() {
  try {
    await DB.open();
    await State.init();
    Router.handle();
  } catch (e) {
    console.error("Init error:", e);
    document.getElementById("view").innerHTML = "<div style=padding:40px 20px;text-align:center;color:#FF3B30>初始化失败: " + U.escape(e.message || String(e)) + "</div>";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
