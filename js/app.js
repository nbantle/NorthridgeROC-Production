/* ROC Production Hub: one small app, no build step.
   Content lives in /data. This file only renders it. */
(function () {
  "use strict";

  var ROC = window.ROC || {};
  var view = document.getElementById("view");

  /* ---------------------------------------------------------------- utils */
  var store = {
    get: function (key, fallback) {
      try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage blocked */ }
    }
  };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function icons() { if (window.lucide) window.lucide.createIcons(); }
  function pad(n) { return String(n).padStart(2, "0"); }

  var DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MON_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MON_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function fmtTime(t) {
    var p = t.split(":").map(Number), h = p[0], m = p[1], s = p[2] || 0;
    return (h % 12 || 12) + ":" + pad(m) + (s ? ":" + pad(s) : "") + " " + (h < 12 ? "AM" : "PM");
  }
  function fmtShortDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return DAY_SHORT[d.getDay()] + ", " + MON_SHORT[d.getMonth()] + " " + d.getDate();
  }
  function startOfWeek(d) { // Monday
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  function quarterOf(d) { return Math.floor(d.getMonth() / 3) + 1; }

  /* --------------------------------------------------------------- router */
  var ROUTES = ["home", "boot", "schedule", "tasks", "troubleshooting"];
  function currentRoute() {
    var r = location.hash.replace("#", "");
    return ROUTES.indexOf(r) >= 0 ? r : "home";
  }
  var route = currentRoute();

  function render(focus) {
    route = currentRoute();
    document.querySelectorAll("[data-route]").forEach(function (a) {
      if (a.dataset.route === route) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    var titles = { home: "", boot: "Boot Up/Down", schedule: "Schedule", tasks: "Tasks", troubleshooting: "Troubleshooting" };
    document.title = (titles[route] ? titles[route] + " · " : "") + "ROC Production Hub";
    RENDER[route]();
    icons();
    if (focus) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
  }
  window.addEventListener("hashchange", function () { render(true); });

  /* ================================================================ BOOT */
  var BOOT_KEY = "roc-boot-checklist-v1";
  var bootState = store.get(BOOT_KEY, {});
  var bootMode = store.get("roc-boot-mode", "up");
  var confirmingReset = false;

  function bootItemDone(item) {
    var s = bootState[item.id];
    if (!s) return false;
    if (item.parts) return item.parts.every(function (p) { return s.parts && s.parts[p]; });
    return !!s.done;
  }

  function renderBoot() {
    var proc = ROC.boot[bootMode];
    var html = '<div class="page-head"><span class="eyebrow">Auditorium</span><h1>Boot Up / Down</h1></div>' +
      '<div class="segment" role="group" aria-label="Procedure">' +
      '<button type="button" data-boot="up" aria-pressed="' + (bootMode === "up") + '"><i data-lucide="power"></i>Boot Up</button>' +
      '<button type="button" data-boot="down" aria-pressed="' + (bootMode === "down") + '"><i data-lucide="power-off"></i>Boot Down</button>' +
      '</div>';

    html += '<div class="section-head"><h2>Procedure</h2><span class="meta">' + proc.steps.length + ' steps, in order</span></div><ol class="steps">';
    proc.steps.forEach(function (s, i) {
      html += '<li class="step card"><div class="num">' + (i + 1) + '</div><div>' +
        '<div class="where eyebrow"><i data-lucide="' + esc(s.icon) + '"></i>' + esc(s.where) + '</div>' +
        '<h3>' + esc(s.title) + '</h3><ul>' + s.items.map(function (t) { return "<li>" + t + "</li>"; }).join("") + '</ul></div></li>';
    });
    html += "</ol>";

    if (proc.checklist.length) {
      var done = proc.checklist.filter(bootItemDone).length, total = proc.checklist.length;
      html += '<div class="section-head"><h2>Checklist</h2><span class="meta">' + done + " of " + total + ' done</span></div>' +
        '<div class="progress" aria-hidden="true"><span style="width:' + (done / total) * 100 + '%"></span></div><div class="checklist">';
      proc.checklist.forEach(function (item) {
        var s = bootState[item.id] || {}, d = bootItemDone(item);
        html += '<div class="check-row' + (d ? " done" : "") + '">' +
          '<input type="checkbox" class="box" id="boot-' + item.id + '" data-boot-item="' + item.id + '"' + (d ? " checked" : "") + '>' +
          '<div class="check-text"><label for="boot-' + item.id + '">' + esc(item.text) + '</label>';
        if (item.parts) {
          html += '<div class="chips">' + item.parts.map(function (p) {
            var on = !!(s.parts && s.parts[p]);
            return '<button type="button" class="chip" id="part-' + item.id + "-" + p.replace(/\W/g, "") + '" data-boot-part="' + item.id + '" data-part="' + esc(p) + '" aria-pressed="' + on + '">' +
              '<i data-lucide="' + (on ? "check" : (item.partIcon || "circle")) + '"></i>' + esc(p) + "</button>";
          }).join("") + "</div>";
        }
        if (item.weekly && s.at) html += '<div class="sub">Last checked ' + fmtShortDate(s.at) + "</div>";
        html += "</div>" + (item.weekly ? '<span class="tag">Weekly</span>' : "<span></span>") + "</div>";
      });
      html += '</div><div class="actions"><button type="button" class="ghost' + (confirmingReset ? " confirm" : "") + '" id="boot-reset">' +
        '<i data-lucide="rotate-ccw"></i>' + (confirmingReset ? "Tap again to clear all" : "Reset checklist") + "</button></div>" +
        '<p class="footnote">Checks are saved on this device only.</p>';
    }
    view.innerHTML = html;
  }

  /* ============================================================ SCHEDULE */
  var SCHED = ROC.schedule;

  function runsOnDow(dow) {
    var out = [];
    SCHED.automations.forEach(function (a) {
      a.times.forEach(function (t) {
        if (t[0] === "Daily" || DOW[t[0]] === dow) out.push({ a: a, t: t[1], note: t[2], daily: t[0] === "Daily" });
      });
    });
    return out.sort(function (x, y) { return x.t.localeCompare(y.t); });
  }

  function nextRuns(now) {
    var best = null, list = [];
    SCHED.automations.forEach(function (a) {
      a.times.forEach(function (t) {
        var hms = t[1].split(":").map(Number);
        for (var off = 0; off < 8; off++) {
          var at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off, hms[0], hms[1], hms[2] || 0);
          if (t[0] !== "Daily" && DOW[t[0]] !== at.getDay()) continue;
          if (at <= now) continue;
          if (!best || at < best) { best = at; list = [{ a: a, t: t[1] }]; }
          else if (+at === +best) list.push({ a: a, t: t[1] });
          break;
        }
      });
    });
    return best ? { at: best, list: list } : null;
  }

  function fmtIn(ms) {
    var mins = Math.round(ms / 60000);
    if (mins < 1) return "in under a minute";
    var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
    return "in " + [d ? d + " d" : "", h ? h + " h" : "", (!d && m) ? m + " min" : ""].filter(Boolean).join(" ");
  }

  function nextCard(now, link) {
    var next = nextRuns(now);
    if (!next) return "";
    var today = next.at.toDateString() === now.toDateString();
    var tag = link ? "a" : "div";
    return "<" + tag + ' class="next"' + (link ? ' href="#schedule"' : "") + ' aria-live="polite">' +
      '<span class="eyebrow">Next automation</span>' +
      '<span class="next-name">' + next.list.map(function (r) { return esc(r.a.name); }).join(" + ") + "</span>" +
      '<span class="next-when">' + (today ? "Today" : DAY_LONG[next.at.getDay()]) + " at " + fmtTime(next.list[0].t) + ", " + fmtIn(next.at - now) + "</span>" +
      "</" + tag + ">";
  }

  function renderSchedule() {
    var now = new Date(), todayDow = now.getDay(), next = nextRuns(now);
    var html = '<div class="page-head"><span class="eyebrow">Companion</span><h1>Automation Schedule</h1>' +
      "<p>What Companion runs on its own, and when. Times use this device's clock.</p></div>" +
      '<div style="margin-top:20px">' + nextCard(now, false) + "</div>";

    html += '<div class="section-head"><h2>By day</h2><span class="meta">In time order</span></div><div class="days">';
    SCHED.days.forEach(function (day) {
      var dow = DOW[day.key], runs = runsOnDow(dow), isToday = dow === todayDow;
      html += '<section class="day card"><div class="day-head"><h3>' + esc(day.name) + "</h3>" +
        (isToday ? '<span class="tag solid">Today</span>' : '<span class="meta">' + runs.length + " automations</span>") + "</div>";
      if (day.manual) {
        html += '<div class="run"><div class="run-time">Manual</div><div>' +
          '<div class="run-name"><i data-lucide="hand"></i>' + esc(day.manual.name) + ' <span class="tag quiet">Not automated</span></div>' +
          '<div class="run-group">' + esc(day.manual.note) + "</div></div></div>";
      }
      runs.forEach(function (r) {
        var hit = next && isToday && next.at.toDateString() === now.toDateString() &&
          next.list.some(function (n) { return n.a === r.a && n.t === r.t; });
        html += '<div class="run' + (hit ? " is-next" : "") + '"><div class="run-time">' + fmtTime(r.t) + "</div><div>" +
          '<div class="run-name"><i data-lucide="' + esc(r.a.icon) + '"></i>' + esc(r.a.name) +
          (r.daily ? ' <span class="tag quiet">Daily</span>' : "") + "</div>" +
          '<div class="run-group">' + esc(r.a.group) + (r.note ? " · " + esc(r.note) : "") + "</div></div></div>";
      });
      html += "</section>";
    });
    html += "</div>";

    var groups = [];
    SCHED.automations.forEach(function (a) { if (groups.indexOf(a.group) < 0) groups.push(a.group); });
    html += '<div class="section-head"><h2>As set in Companion</h2><span class="meta">' + SCHED.automations.length + ' triggers</span></div><div class="ref">';
    groups.forEach(function (g) {
      html += "<div><h3>" + esc(g) + "</h3>";
      SCHED.automations.filter(function (a) { return a.group === g; }).forEach(function (a) {
        html += '<div class="ref-row"><div>' + esc(a.name) + '</div><div class="t">' +
          a.times.map(function (t) { return t[0] + " " + fmtTime(t[1]); }).join(" · ") + "</div></div>";
      });
      html += "</div>";
    });
    html += '</div><p class="footnote">Copied from the Companion triggers on ' + esc(SCHED.updated) +
      ". If a trigger changes in Companion, update it here too.</p>";
    view.innerHTML = html;
  }

  /* =============================================================== TASKS */
  var TASK_KEY = "roc-tasks-v1";
  var taskState = store.get(TASK_KEY, {}); // { taskId: { periodKey: isoDate } }
  var teamFilter = store.get("roc-team-filter", "all");

  var PERIODS = {
    weekly: {
      label: "Weekly",
      key: function (d) { var s = startOfWeek(d); return "W" + s.getFullYear() + "-" + pad(s.getMonth() + 1) + "-" + pad(s.getDate()); },
      name: function (d) {
        var s = startOfWeek(d), e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
        return "Week of " + MON_SHORT[s.getMonth()] + " " + s.getDate() + " – " +
          (e.getMonth() !== s.getMonth() ? MON_SHORT[e.getMonth()] + " " : "") + e.getDate();
      },
      resets: function () { return "Resets Monday"; }
    },
    monthly: {
      label: "Monthly",
      key: function (d) { return "M" + d.getFullYear() + "-" + pad(d.getMonth() + 1); },
      name: function (d) { return MON_LONG[d.getMonth()] + " " + d.getFullYear(); },
      resets: function (d) { return "Resets " + MON_SHORT[(d.getMonth() + 1) % 12] + " 1"; }
    },
    quarterly: {
      label: "Quarterly",
      key: function (d) { return "Q" + d.getFullYear() + "-" + quarterOf(d); },
      name: function (d) {
        var q = quarterOf(d);
        return "Q" + q + " " + d.getFullYear() + " · " + MON_SHORT[(q - 1) * 3] + " – " + MON_SHORT[(q - 1) * 3 + 2];
      },
      resets: function (d) { return "Resets " + MON_SHORT[(quarterOf(d) * 3) % 12] + " 1"; }
    }
  };
  var FREQS = ["weekly", "monthly", "quarterly"];

  function taskDoneAt(task, freq, now) {
    var s = taskState[task.id];
    return s ? s[PERIODS[freq].key(now)] : null;
  }
  function taskLastDone(task, freq, now) {
    var s = taskState[task.id];
    if (!s) return null;
    var cur = PERIODS[freq].key(now), latest = null;
    Object.keys(s).forEach(function (k) { if (k !== cur && (!latest || s[k] > latest)) latest = s[k]; });
    return latest;
  }
  function visibleTasks(freq) {
    return ROC.tasks[freq].filter(function (t) {
      return teamFilter === "all" || t.team === teamFilter || t.team === "S";
    });
  }
  function taskCounts(freq, now) {
    var list = visibleTasks(freq);
    return { done: list.filter(function (t) { return !!taskDoneAt(t, freq, now); }).length, total: list.length };
  }

  function renderTasks() {
    var now = new Date();
    var html = '<div class="page-head"><span class="eyebrow">Production + Worship</span><h1>Recurring Tasks</h1>' +
      "<p>Checks reset on their own when each week, month or quarter starts.</p></div>" +
      '<div class="filters" role="group" aria-label="Team">' +
      [["all", "All teams"], ["P", "Production"], ["W", "Worship"]].map(function (f) {
        return '<button type="button" class="chip" data-team="' + f[0] + '" aria-pressed="' + (teamFilter === f[0]) + '">' + f[1] + "</button>";
      }).join("") + "</div>";

    FREQS.forEach(function (freq) {
      var P = PERIODS[freq], list = visibleTasks(freq), c = taskCounts(freq, now);
      html += '<div class="section-head"><div><h2>' + P.label + '</h2><div class="meta">' + P.name(now) + " · " + P.resets(now) + "</div></div>" +
        '<span class="meta">' + c.done + " of " + c.total + " done</span></div>" +
        '<div class="progress" aria-hidden="true"><span style="width:' + (c.total ? (c.done / c.total) * 100 : 0) + '%"></span></div><div class="checklist">';
      list.forEach(function (t) {
        var at = taskDoneAt(t, freq, now), last = taskLastDone(t, freq, now), team = ROC.teams[t.team] || { name: t.team };
        html += '<div class="check-row' + (at ? " done" : "") + '">' +
          '<input type="checkbox" class="box" id="task-' + t.id + '" data-task="' + t.id + '" data-freq="' + freq + '"' + (at ? " checked" : "") + ">" +
          '<div class="check-text"><label for="task-' + t.id + '"><strong>' + esc(t.area) + ":</strong> " + esc(t.task) + "</label>" +
          '<div class="sub">' + (at ? "Done " + fmtShortDate(at) : (last ? "Last done " + fmtShortDate(last) : "Not done yet this " + (freq === "weekly" ? "week" : freq === "monthly" ? "month" : "quarter"))) + "</div></div>" +
          '<span class="tag team' + (t.team === "S" ? "" : " quiet") + '" title="' + esc(team.name) + '">' + esc(team.name) + "</span></div>";
      });
      if (!list.length) html += '<div class="check-row"><span></span><div class="sub">No ' + P.label.toLowerCase() + " tasks for this team.</div><span></span></div>";
      html += "</div>";
    });
    html += '<p class="footnote">Checks are saved on this device only.</p>';
    view.innerHTML = html;
  }

  /* ===================================================== TROUBLESHOOTING */
  var tsQuery = "", tsSystem = "all";

  function renderTroubleshooting() {
    var guides = ROC.troubleshooting || [];
    var html = '<div class="page-head"><span class="eyebrow">When something breaks</span><h1>Troubleshooting</h1>' +
      "<p>Search by what you're seeing, then work through the steps in order.</p></div>";
    if (!guides.length) {
      html += '<div class="card empty" style="margin-top:24px"><div class="tile-icon"><i data-lucide="wrench"></i></div>' +
        "<h3>No guides yet</h3><p>Troubleshooting guides will show up here, grouped by system: audio, video, lighting, stream and network.</p></div>";
      view.innerHTML = html;
      return;
    }
    var systems = [];
    guides.forEach(function (g) { if (systems.indexOf(g.system) < 0) systems.push(g.system); });
    html += '<input class="search" id="ts-search" type="search" placeholder="Search problems, e.g. no sound" aria-label="Search troubleshooting" value="' + esc(tsQuery) + '">' +
      '<div class="filters" role="group" aria-label="System">' +
      ["all"].concat(systems).map(function (s) {
        return '<button type="button" class="chip" data-system="' + esc(s) + '" aria-pressed="' + (tsSystem === s) + '">' + (s === "all" ? "All" : esc(s)) + "</button>";
      }).join("") + '</div><div class="section-head"><h2>Guides</h2><span class="meta" id="ts-count"></span></div><div class="guides" id="ts-list"></div>';
    view.innerHTML = html;
    renderGuideList();
  }

  function renderGuideList() {
    var q = tsQuery.trim().toLowerCase();
    var list = (ROC.troubleshooting || []).filter(function (g) {
      if (tsSystem !== "all" && g.system !== tsSystem) return false;
      if (!q) return true;
      return [g.title, g.symptoms, g.system].concat(g.steps || []).join(" ").toLowerCase().indexOf(q) >= 0;
    });
    var el = document.getElementById("ts-list");
    if (!el) return;
    document.getElementById("ts-count").textContent = list.length + (list.length === 1 ? " guide" : " guides");
    el.innerHTML = list.length ? list.map(function (g) {
      return '<details class="guide card"><summary><div><span class="eyebrow">' + esc(g.system) + "</span><h3>" + esc(g.title) + "</h3></div>" +
        '<i data-lucide="chevron-down"></i></summary><div class="guide-body">' +
        (g.symptoms ? '<p class="sub">' + esc(g.symptoms) + "</p>" : "") +
        "<ol>" + (g.steps || []).map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol>" +
        (g.escalate ? '<p><span class="eyebrow">Still broken?</span><br>' + esc(g.escalate) + "</p>" : "") +
        "</div></details>";
    }).join("") : '<div class="card empty"><p>No guides match that search.</p></div>';
    icons();
  }

  /* ================================================================ HOME */
  function renderHome() {
    var now = new Date();
    var html = '<div class="page-head"><span class="eyebrow">' + DAY_LONG[now.getDay()] + ", " + MON_LONG[now.getMonth()] + " " + now.getDate() + "</span>" +
      "<h1>Rochester Production</h1><p>Everything the team needs to run the room.</p></div>" +
      '<div style="margin-top:20px">' + nextCard(now, true) + "</div>";

    html += '<div class="section-head"><h2>Recurring tasks</h2><a class="meta" href="#tasks">Open tasks</a></div><div class="meters">';
    FREQS.forEach(function (freq) {
      var c = taskCounts(freq, now);
      html += '<a class="card meter" href="#tasks"><span class="eyebrow">' + PERIODS[freq].label + "</span>" +
        '<span class="meter-count">' + c.done + " <small>of " + c.total + " done</small></span>" +
        '<div class="progress" aria-hidden="true"><span style="width:' + (c.total ? (c.done / c.total) * 100 : 0) + '%"></span></div></a>';
    });
    html += "</div>";

    var bootList = ROC.boot.up.checklist, bootDone = bootList.filter(bootItemDone).length;
    var guides = (ROC.troubleshooting || []).length;
    var tiles = [
      { href: "#boot", icon: "power", title: "Boot Up / Down", text: "Step-by-step power on and power off for the auditorium.", status: bootDone + " of " + bootList.length + " boot-up checks done" },
      { href: "#schedule", icon: "clock", title: "Automation Schedule", text: "What Companion turns on and off, and when.", status: SCHED.automations.length + " automations" },
      { href: "#tasks", icon: "list-checks", title: "Recurring Tasks", text: "Weekly, monthly and quarterly upkeep for both teams.", status: FREQS.reduce(function (n, f) { return n + ROC.tasks[f].length; }, 0) + " tasks" },
      { href: "#troubleshooting", icon: "wrench", title: "Troubleshooting", text: "Fixes for the problems that come up most.", status: guides ? guides + " guides" : "Coming soon" }
    ];
    html += '<div class="section-head"><h2>Sections</h2></div><div class="home-grid">' + tiles.map(function (t) {
      return '<a class="card tile" href="' + t.href + '"><div class="tile-icon"><i data-lucide="' + t.icon + '"></i></div>' +
        "<h3>" + t.title + "</h3><p>" + t.text + '</p><span class="status">' + t.status + "</span></a>";
    }).join("") + "</div>";
    view.innerHTML = html;
  }

  var RENDER = { home: renderHome, boot: renderBoot, schedule: renderSchedule, tasks: renderTasks, troubleshooting: renderTroubleshooting };

  /* ============================================================== EVENTS */
  view.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.bootItem) {
      var item = ROC.boot[bootMode].checklist.filter(function (i) { return i.id === t.dataset.bootItem; })[0];
      if (item.parts) {
        var parts = {};
        item.parts.forEach(function (p) { parts[p] = t.checked; });
        bootState[item.id] = { parts: parts };
      } else {
        bootState[item.id] = t.checked ? { done: true, at: new Date().toISOString() }
          : { done: false, at: (bootState[item.id] || {}).at };
      }
      confirmingReset = false;
      store.set(BOOT_KEY, bootState);
      render();
    } else if (t.dataset.task) {
      var freq = t.dataset.freq, key = PERIODS[freq].key(new Date());
      var s = taskState[t.dataset.task] || {};
      if (t.checked) s[key] = new Date().toISOString(); else delete s[key];
      taskState[t.dataset.task] = s;
      store.set(TASK_KEY, taskState);
      render();
    }
  });

  view.addEventListener("click", function (e) {
    var el;
    if ((el = e.target.closest("[data-boot]"))) {
      bootMode = el.dataset.boot; confirmingReset = false;
      store.set("roc-boot-mode", bootMode);
      render();
    } else if ((el = e.target.closest("[data-boot-part]"))) {
      var s = bootState[el.dataset.bootPart] || {};
      s.parts = s.parts || {};
      s.parts[el.dataset.part] = !s.parts[el.dataset.part];
      bootState[el.dataset.bootPart] = s;
      confirmingReset = false;
      store.set(BOOT_KEY, bootState);
      var id = el.id;
      render();
      var again = document.getElementById(id);
      if (again) again.focus();
    } else if ((el = e.target.closest("#boot-reset"))) {
      if (!confirmingReset) { confirmingReset = true; render(); document.getElementById("boot-reset").focus(); return; }
      ROC.boot[bootMode].checklist.forEach(function (item) {
        var keepAt = item.weekly && bootState[item.id] ? bootState[item.id].at : undefined;
        bootState[item.id] = keepAt ? { done: false, at: keepAt } : {};
      });
      confirmingReset = false;
      store.set(BOOT_KEY, bootState);
      render();
    } else if ((el = e.target.closest("[data-team]"))) {
      teamFilter = el.dataset.team;
      store.set("roc-team-filter", teamFilter);
      render();
    } else if ((el = e.target.closest("[data-system]"))) {
      tsSystem = el.dataset.system;
      document.querySelectorAll("[data-system]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); });
      renderGuideList();
    }
  });

  view.addEventListener("input", function (e) {
    if (e.target.id === "ts-search") { tsQuery = e.target.value; renderGuideList(); }
  });

  // Keep "next automation" and period labels fresh while the app sits open.
  setInterval(function () {
    if (document.hidden) return;
    if (route === "schedule" || route === "home") render();
  }, 60000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && route !== "troubleshooting") render();
  });

  render();
})();
