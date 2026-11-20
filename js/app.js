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
  var ROUTES = ["home", "boot", "schedule", "edits", "pco", "roaming", "tasks", "troubleshooting", "support"];
  function currentRoute() {
    var r = location.hash.replace("#", "");
    return ROUTES.indexOf(r) >= 0 ? r : "home";
  }
  var route = currentRoute();

  function render(focus) {
    route = currentRoute();
    ensureBootDay();
    document.querySelectorAll("[data-route]").forEach(function (a) {
      if (a.dataset.route === route) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    var titles = { home: "", boot: "Boot Up/Down", schedule: "Automation Schedule", edits: "Sunday Edits", pco: "PCO", roaming: "Roaming Camera", tasks: "Recurring Tasks", troubleshooting: "Troubleshooting", support: "Support" };
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

  function todayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  // The boot checklist clears itself at the start of each day, keeping the
  // "last checked" date on weekly items.
  function ensureBootDay() {
    var key = todayKey(new Date());
    if (bootState._day === key) return;
    var fresh = { _day: key };
    ROC.boot.up.checklist.concat(ROC.boot.down.checklist).forEach(function (item) {
      if (item.weekly && bootState[item.id] && bootState[item.id].at) fresh[item.id] = { done: false, at: bootState[item.id].at };
    });
    bootState = fresh;
    store.set(BOOT_KEY, bootState);
  }

  function bootItemDone(item) {
    var s = bootState[item.id];
    if (!s) return false;
    if (item.parts) return item.parts.every(function (p) { return s.parts && s.parts[p]; });
    return !!s.done;
  }

  function renderBoot() {
    var proc = ROC.boot[bootMode];
    var html = '<div class="page-head"><span class="eyebrow">Auditorium</span><h1>Boot Up/Down</h1></div>' +
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
        '<p class="footnote">Checks clear at the start of each day and are saved on this device only.</p>';
    }
    html += supportPrompt("boot");
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

    // Days not listed above still get any "Daily" automations.
    var listed = SCHED.days.map(function (d) { return DOW[d.key]; });
    var otherDays = [0, 1, 2, 3, 4, 5, 6].filter(function (d) { return listed.indexOf(d) < 0; });
    var dailyRuns = runsOnDow(-1);
    if (otherDays.length && dailyRuns.length) {
      var otherToday = otherDays.indexOf(todayDow) >= 0;
      html += '<section class="day card"><div class="day-head"><h3>Other days</h3>' +
        (otherToday ? '<span class="tag solid">Today</span>' : '<span class="meta">' + otherDays.map(function (d) { return DAY_SHORT[d]; }).join(", ") + "</span>") + "</div>";
      if (otherToday) html += '<div class="run"><div class="run-time"></div><div class="run-group">' + otherDays.map(function (d) { return DAY_LONG[d]; }).join(", ") + "</div></div>";
      dailyRuns.forEach(function (r) {
        var hit = next && otherToday && next.at.toDateString() === now.toDateString() &&
          next.list.some(function (n) { return n.a === r.a && n.t === r.t; });
        html += '<div class="run' + (hit ? " is-next" : "") + '"><div class="run-time">' + fmtTime(r.t) + "</div><div>" +
          '<div class="run-name"><i data-lucide="' + esc(r.a.icon) + '"></i>' + esc(r.a.name) + ' <span class="tag quiet">Daily</span></div>' +
          '<div class="run-group">' + esc(r.a.group) + (r.note ? " · " + esc(r.note) : "") + "</div></div></div>";
      });
      html += "</section>";
    }
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
      ". If a trigger changes in Companion, update it here too.</p>" + supportPrompt("schedule");
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
  function taskCounts(freq, now, allTeams) {
    var list = allTeams ? ROC.tasks[freq] : visibleTasks(freq);
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
    html += '<p class="footnote">Checks are saved on this device only.</p>' + supportPrompt("tasks");
    view.innerHTML = html;
  }

  /* ===================================================== TROUBLESHOOTING */
  var tsQuery = "", tsSystem = "all", tsOpen = null;

  function renderTroubleshooting() {
    var guides = ROC.troubleshooting || [];
    var html = '<div class="page-head"><span class="eyebrow">When something breaks</span><h1>Troubleshooting</h1>' +
      "<p>Search by what you're seeing, then work through the steps in order.</p></div>";
    if (!guides.length) {
      html += '<div class="card empty" style="margin-top:24px"><div class="tile-icon"><i data-lucide="wrench"></i></div>' +
        "<h3>No guides yet</h3><p>Troubleshooting guides will show up here, grouped by system: audio, video, lighting, stream and network.</p></div>" + supportPrompt("troubleshooting", "Have a problem that isn't here?");
      view.innerHTML = html;
      return;
    }
    var systems = [];
    guides.forEach(function (g) { if (systems.indexOf(g.system) < 0) systems.push(g.system); });
    html += '<input class="search" id="ts-search" type="search" placeholder="Search problems, e.g. no sound" aria-label="Search troubleshooting" value="' + esc(tsQuery) + '">' +
      '<div class="filters" role="group" aria-label="System">' +
      ["all"].concat(systems).map(function (s) {
        return '<button type="button" class="chip" data-system="' + esc(s) + '" aria-pressed="' + (tsSystem === s) + '">' + (s === "all" ? "All" : esc(s)) + "</button>";
      }).join("") + '</div><div class="section-head"><h2>Guides</h2><span class="meta" id="ts-count"></span></div><div class="guides" id="ts-list"></div>' +
      supportPrompt("troubleshooting", "Didn't fix it, or your problem isn't here?");
    view.innerHTML = html;
    renderGuideList();
  }

  function renderGuideList() {
    var q = tsQuery.trim().toLowerCase();
    var list = (ROC.troubleshooting || []).filter(function (g) {
      if (tsSystem !== "all" && g.system !== tsSystem) return false;
      if (!q) return true;
      var text = [g.title, g.symptoms, g.info, g.system, g.escalate].concat((g.steps || []).map(function (s) {
        return typeof s === "string" ? s : [s.text, s.warn].join(" ");
      })).join(" ").replace(/<[^>]+>/g, "");
      return text.toLowerCase().indexOf(q) >= 0;
    });
    var el = document.getElementById("ts-list");
    if (!el) return;
    document.getElementById("ts-count").textContent = list.length + (list.length === 1 ? " guide" : " guides");
    el.innerHTML = list.length ? list.map(function (g) {
      return '<details class="guide card" id="guide-' + esc(g.id) + '"' + (g.id === tsOpen ? " open" : "") + ">" +
        '<summary><div><span class="eyebrow">' + esc(g.system) + "</span><h3>" + esc(g.title) + "</h3></div>" +
        '<i data-lucide="chevron-down"></i></summary><div class="guide-body">' +
        (g.symptoms ? '<p class="symptoms">' + g.symptoms + "</p>" : "") +
        (g.info || g.image ? '<div class="info">' + (g.info ? "<p>" + g.info + "</p>" : "") + (g.image ? figure(g.image) : "") + "</div>" : "") +
        '<ol class="fix-steps">' + (g.steps || []).map(stepHtml).join("") + "</ol>" +
        (g.escalate ? '<div class="escalate"><i data-lucide="phone"></i><div><span class="eyebrow">Still broken?</span><p>' + esc(g.escalate) + "</p>" +
          '<a class="item-link" href="#support" data-support-from="troubleshooting">Or send ' + esc(SUP.contactName) + " a support request" +
          '<i data-lucide="chevron-right"></i></a></div></div>' : "") +
        "</div></details>";
    }).join("") : '<div class="card empty"><p>No guides match that search.</p></div>';
    icons();
  }

  function guideById(id) {
    return (ROC.troubleshooting || []).filter(function (g) { return g.id === id; })[0];
  }
  function figure(img) {
    return '<figure><a href="' + esc(img.src) + '" target="_blank" rel="noopener" aria-label="Open full-size picture">' +
      '<img src="' + esc(img.src) + '" alt="' + esc(img.alt || "") + '" loading="lazy"></a>' +
      "<figcaption>" + (img.caption ? esc(img.caption) + " · " : "") + "Tap to enlarge</figcaption></figure>";
  }
  function stepHtml(s) {
    if (typeof s === "string") return "<li>" + s + "</li>";
    var h = "<li>";
    if (s.see) {
      var g = guideById(s.see);
      h += 'Check <button type="button" class="guide-link" data-open-guide="' + esc(s.see) + '">' + esc(g ? g.title : s.see) + "</button> first.";
    }
    if (s.text) h += (s.see ? " " : "") + s.text;
    if (s.warn) h += '<div class="warn"><i data-lucide="triangle-alert"></i><span>' + s.warn + "</span></div>";
    if (s.image) h += figure(s.image);
    return h + "</li>";
  }
  function openGuide(id) {
    tsOpen = id; tsQuery = ""; tsSystem = "all";
    var search = document.getElementById("ts-search");
    if (search) search.value = "";
    document.querySelectorAll("[data-system]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.system === "all")); });
    renderGuideList();
    var el = document.getElementById("guide-" + id);
    if (el) { el.open = true; el.scrollIntoView({ behavior: "smooth", block: "start" }); el.querySelector("summary").focus({ preventScroll: true }); }
  }

  /* ================================================================ HOME */
  function renderHome() {
    var now = new Date();
    var html = '<div class="page-head"><span class="eyebrow">' + DAY_LONG[now.getDay()] + ", " + MON_LONG[now.getMonth()] + " " + now.getDate() + "</span>" +
      "<h1>Production Hub</h1><p>Everything the Rochester team needs to run the room.</p></div>" +
      '<div style="margin-top:20px">' + nextCard(now, true) + "</div>";

    var ew = editsWeek(now), ec = editsCounts(ew);
    html += '<div class="section-head"><h2>Sunday edits</h2><a class="meta" href="#edits">Open edits</a></div>' +
      '<a class="card meter" href="#edits"><span class="eyebrow">Edits for Sunday, ' + MON_SHORT[ew.sunday.getMonth()] + " " + ew.sunday.getDate() + "</span>" +
      '<span class="meter-count">' + ec.done + " <small>of " + ec.total + " done</small></span>" +
      '<div class="progress" aria-hidden="true"><span style="width:' + (ec.total ? (ec.done / ec.total) * 100 : 0) + '%"></span></div></a>';

    html += '<div class="section-head"><h2>Recurring tasks</h2><a class="meta" href="#tasks">Open tasks</a></div><div class="meters">';
    FREQS.forEach(function (freq) {
      var c = taskCounts(freq, now, true);
      html += '<a class="card meter" href="#tasks"><span class="eyebrow">' + PERIODS[freq].label + "</span>" +
        '<span class="meter-count">' + c.done + " <small>of " + c.total + " done</small></span>" +
        '<div class="progress" aria-hidden="true"><span style="width:' + (c.total ? (c.done / c.total) * 100 : 0) + '%"></span></div></a>';
    });
    html += "</div>";

    var bootList = ROC.boot.up.checklist, bootDone = bootList.filter(bootItemDone).length;
    var guides = (ROC.troubleshooting || []).length;
    var tiles = [
      { href: "#boot", icon: "power", title: "Boot Up/Down", text: "Step-by-step power on and power off for the auditorium.", status: bootDone + " of " + bootList.length + " boot-up checks done today" },
      { href: "#schedule", icon: "clock", title: "Automation Schedule", text: "What Companion turns on and off, and when.", status: SCHED.automations.length + " automations" },
      { href: "#edits", icon: "clapperboard", title: "Sunday Edits", text: "Edit, export and upload the message and baptisms.", status: ec.done + " of " + ec.total + " done this week" },
      { href: "#pco", icon: "calendar-clock", title: "PCO", text: "Who's serving at the next Rochester service.", status: (ROC.pco && ROC.pco.plan) ? ROC.pco.plan.dates : "Waiting for Planning Center" },
      { href: "#roaming", icon: "video", title: "Roaming Camera", text: "Setup and operating notes for the roaming camera.", status: (ROC.roaming && ROC.roaming.sections.length) ? ROC.roaming.sections.length + " sections" : "Coming soon" },
      { href: "#tasks", icon: "list-checks", title: "Recurring Tasks", text: "Weekly, monthly and quarterly upkeep for both teams.", status: FREQS.reduce(function (n, f) { return n + ROC.tasks[f].length; }, 0) + " tasks" },
      { href: "#troubleshooting", icon: "wrench", title: "Troubleshooting", text: "Fixes for the problems that come up most.", status: guides ? guides + " guides" : "Coming soon" }
    ];
    html += '<div class="section-head"><h2>Sections</h2></div><div class="home-grid">' + tiles.map(function (t) {
      return '<a class="card tile" href="' + t.href + '"><div class="tile-icon"><i data-lucide="' + t.icon + '"></i></div>' +
        "<h3>" + t.title + "</h3><p>" + t.text + '</p><span class="status">' + t.status + "</span></a>";
    }).join("") + "</div>" + supportPrompt("general", "Have a question or need something added?");
    view.innerHTML = html;
  }

  /* ======================================================== SUNDAY EDITS */
  var EDITS_KEY = "roc-edits-v1";
  var editsState = store.get(EDITS_KEY, {}); // { "YYYY-MM-DD" (Sunday): { checks } }

  function sundayOf(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - x.getDay());
    return x;
  }
  function editsWeek(now) {
    var s = sundayOf(now);
    var key = s.getFullYear() + "-" + pad(s.getMonth() + 1) + "-" + pad(s.getDate());
    if (!editsState[key]) {
      editsState[key] = { checks: {} };
      // keep the last 8 weeks so storage doesn't grow forever
      Object.keys(editsState).sort().slice(0, -8).forEach(function (k) { delete editsState[k]; });
    }
    return { key: key, sunday: s, st: editsState[key] };
  }
  function saveEdits() { store.set(EDITS_KEY, editsState); }

  function fillText(str, ctx, html) {
    return String(str)
      .replace(/\{year\}/g, String(ctx.year))
      .replace(/\{name\}/g, html ? esc(ctx.name || "") : (ctx.name || ""));
  }
  function editItems(list) {
    var out = [];
    list.forEach(function (g) { g.items.forEach(function (i) { out.push(i); }); });
    return out;
  }
  function editsCounts(w) {
    var ids = editItems(ROC.edits.message).map(function (i) { return i.id; });
    // Baptism steps only count once someone starts them, so weeks
    // without baptisms can still reach "all done".
    var bapIds = editItems(ROC.edits.baptism).map(function (i) { return "bap:" + i.id; });
    if (bapIds.some(function (id) { return !!w.st.checks[id]; })) ids = ids.concat(bapIds);
    return { done: ids.filter(function (id) { return !!w.st.checks[id]; }).length, total: ids.length };
  }

  function editRow(cid, item, ctx, st) {
    var at = st.checks[cid], domId = "ed-" + cid.replace(/[^\w-]/g, "-");
    var h = '<div class="check-row' + (at ? " done" : "") + '">' +
      '<input type="checkbox" class="box" id="' + domId + '" data-edit="' + esc(cid) + '"' + (at ? " checked" : "") + ">" +
      '<div class="check-text"><label for="' + domId + '">' + fillText(item.text, ctx, true) + "</label>";
    if (item.note) h += '<div class="sub">' + fillText(item.note, ctx, true) + "</div>";
    if (item.path) h += copyLine(fillText(item.path, ctx, false));
    if (item.copy) h += copyLine(fillText(item.copy, ctx, false));
    if (item.link && item.link.href) {
      h += '<a class="item-link" href="' + esc(item.link.href) + '" target="_blank" rel="noopener">' +
        esc(item.link.label || "Open link") + '<i data-lucide="external-link"></i></a>';
    }
    if (at) h += '<div class="sub">Done ' + fmtShortDate(at) + "</div>";
    return h + "</div><span></span></div>";
  }
  function copyLine(text) {
    return '<div class="copy-line"><code>' + esc(text) + "</code>" +
      '<button type="button" class="ghost small" data-copy-text="' + esc(text) + '"><i data-lucide="copy"></i>Copy</button></div>';
  }
  function editGroups(groups, ctx, st, prefix) {
    return groups.map(function (g) {
      return '<div class="edit-group"><h3>' + esc(g.title) + "</h3>" +
        (g.note ? '<p class="sub">' + esc(g.note) + "</p>" : "") +
        '<div class="checklist">' + g.items.map(function (i) { return editRow(prefix + i.id, i, ctx, st); }).join("") + "</div></div>";
    }).join("");
  }

  function renderEdits() {
    var now = new Date(), w = editsWeek(now), st = w.st, c = editsCounts(w), year = w.sunday.getFullYear();
    var html = '<div class="page-head"><span class="eyebrow">Edits for ' + DAY_LONG[0] + ", " + MON_LONG[w.sunday.getMonth()] + " " + w.sunday.getDate() + "</span>" +
      "<h1>Sunday Edits</h1><p>Edit, export and upload this week's message and baptisms. Checks reset every Sunday.</p></div>" +
      '<div class="section-head"><h2>This week</h2><span class="meta">' + c.done + " of " + c.total + " done · Resets Sunday</span></div>" +
      '<div class="progress" aria-hidden="true"><span style="width:' + (c.total ? (c.done / c.total) * 100 : 0) + '%"></span></div>';

    html += '<section class="edit-block card"><div class="edit-block-head"><span class="tile-icon"><i data-lucide="mic"></i></span><h2>Message</h2></div>' +
      editGroups(ROC.edits.message, { year: year }, st, "") + "</section>";

    html += '<section class="edit-block card">' +
      '<div class="edit-block-head"><span class="tile-icon"><i data-lucide="droplets"></i></span><h2>Baptisms</h2></div>' +
      '<p class="sub edit-block-note">Repeat these steps for each baptism.</p>' +
      '<div class="edit-block-body">' + editGroups(ROC.edits.baptism, { year: year }, st, "bap:") + "</div></section>";
    html += '<p class="footnote">Checks are saved on this device only.</p>' + supportPrompt("edits");
    view.innerHTML = html;
  }

  function flashCopied(btn) {
    var original = btn.innerHTML;
    btn.textContent = "Copied";
    setTimeout(function () { btn.innerHTML = original; }, 1500);
  }

  /* ================================================================= PCO */
  var PCO_ICONS = { Audio: "audio-lines", Production: "video", Music: "music", Choir: "users" };

  function fmtClock(d) {
    var h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ":" + pad(m) + " " + (h < 12 ? "AM" : "PM");
  }
  function fmtDayTime(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : DAY_SHORT[d.getDay()] + " " + fmtClock(d);
  }

  function renderPco() {
    var P = ROC.pco;
    var html = '<div class="page-head"><span class="eyebrow">Planning Center</span><h1>PCO</h1>' +
      "<p>Who's serving at the next Rochester service. Updates every morning around 9 AM.</p></div>";

    if (!P || !P.plan) {
      html += '<div class="card empty" style="margin-top:24px"><div class="tile-icon"><i data-lucide="calendar-clock"></i></div>' +
        (P ? "<h3>No upcoming service</h3><p>Planning Center doesn't have an upcoming Rochester service yet.</p>"
           : "<h3>Waiting for Planning Center</h3><p>The volunteer list shows up here after the first morning update.</p>") +
        "</div>" + supportPrompt("pco");
      view.innerHTML = html;
      return;
    }

    var plan = P.plan, updated = new Date(P.updated);
    // only show service times that haven't happened yet (a plan can cover Thursday and Sunday)
    var upcomingTimes = (plan.times || []).filter(function (t) { return new Date(t.startsAt).getTime() + 2 * 3600 * 1000 >= Date.now(); });
    var all = [];
    P.groups.forEach(function (g) { all = all.concat(g.members); });
    var count = function (s) { return all.filter(function (m) { return m.status === s; }).length; };
    var stale = !isNaN(updated) && (Date.now() - updated) > 30 * 3600 * 1000;

    html += '<div class="next pco-plan"><span class="eyebrow">Next service</span>' +
      '<span class="next-name">' + esc(plan.dates || "") + "</span>" +
      ((plan.series || plan.title) ? '<span class="next-when">' + esc([plan.series, plan.title].filter(Boolean).join(" · ")) + "</span>" : "") +
      (upcomingTimes.length ? '<span class="pco-times">' + upcomingTimes.map(function (t) {
        return '<span class="pco-time">' + fmtDayTime(t.startsAt) + "</span>";
      }).join("") + "</span>" : "") +
      '<a class="pco-link" href="' + esc(plan.url) + '" target="_blank" rel="noopener">Open in Planning Center<i data-lucide="external-link"></i></a></div>';

    html += '<div class="section-head"><h2>Team</h2><span class="meta">' +
      [count("confirmed") + " confirmed", count("pending") ? count("pending") + " pending" : "", count("open") ? count("open") + " open" : ""]
        .filter(Boolean).join(" · ") + "</span></div>";

    if (!P.groups.length) {
      html += '<div class="card empty"><p>No one is scheduled on the Audio, Production, Music or Choir teams yet.</p></div>';
    }
    html += '<div class="roster">' + P.groups.map(function (g) {
      // Label positions from a team whose name isn't the group's (e.g. "Stage Crew" under Production).
      var label = function (m) {
        var pos = m.position || m.team || "";
        var team = m.team || "";
        return team && team.toLowerCase().indexOf(g.name.toLowerCase()) < 0 && pos.toLowerCase().indexOf(team.toLowerCase()) < 0 &&
          !(g.name === "Choir" && /choir/i.test(pos)) ? team + " · " + pos : pos;
      };
      // Fold unfilled spots for the same position into one row ("8 open").
      var rows = [], openAt = {};
      g.members.forEach(function (m) {
        if (m.status !== "open") { rows.push(m); return; }
        var k = label(m);
        if (openAt[k] !== undefined) rows[openAt[k]].count++;
        else { openAt[k] = rows.length; rows.push({ status: "open", position: m.position, team: m.team, count: 1 }); }
      });
      return '<section class="card roster-card"><div class="edit-block-head"><span class="tile-icon"><i data-lucide="' + (PCO_ICONS[g.name] || "users") + '"></i></span>' +
        "<h2>" + esc(g.name) + '</h2><span class="meta">' + g.members.filter(function (m) { return m.status !== "open"; }).length + "</span></div>" +
        rows.map(function (m) {
          var open = m.status === "open";
          return '<div class="roster-row' + (open ? " is-open" : "") + '">' +
            '<span class="roster-pos">' + esc(label(m)) + "</span>" +
            '<span class="roster-name">' + (open ? (m.count > 1 ? m.count + " spots not filled" : "Not filled") : esc(m.name)) + "</span>" +
            (m.status === "pending" ? '<span class="tag quiet" title="Hasn\'t accepted yet in Planning Center">Pending</span>'
              : open ? '<span class="tag">' + (m.count > 1 ? m.count + " open" : "Open") + "</span>" : "<span></span>") +
            "</div>";
        }).join("") + "</section>";
    }).join("") + "</div>";

    html += '<p class="footnote' + (stale ? " stale" : "") + '">' +
      (stale ? "This hasn't updated since " : "Updated ") +
      (isNaN(updated) ? "recently" : fmtShortDate(P.updated) + " at " + fmtClock(updated)) +
      (stale ? ". The morning refresh may have stopped; check the repo's Actions tab." : " from Planning Center.") +
      " Names show first name and last initial only.</p>" + supportPrompt("pco");
    view.innerHTML = html;
  }

  /* ====================================================== ROAMING CAMERA */
  function renderRoaming() {
    var R = ROC.roaming || { sections: [] }, sections = R.sections || [];
    var html = '<div class="page-head"><span class="eyebrow">Cameras</span><h1>Roaming Camera</h1>' +
      (R.intro ? "<p>" + R.intro + "</p>" : "") + "</div>";
    if (!sections.length) {
      html += '<div class="card empty" style="margin-top:24px"><div class="tile-icon"><i data-lucide="video"></i></div>' +
        "<h3>Coming soon</h3><p>Roaming camera setup, operation and tips will show up here.</p></div>";
    } else {
      html += '<div class="roaming">' + sections.map(function (s) {
        return '<section class="card roaming-card"><h2>' + esc(s.title || "") + "</h2>" +
          (s.text ? "<p>" + s.text + "</p>" : "") +
          (s.steps && s.steps.length ? '<ol class="fix-steps">' + s.steps.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ol>" : "") +
          (s.items && s.items.length ? "<ul>" + s.items.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>" : "") +
          (s.image ? figure(s.image) : "") + "</section>";
      }).join("") + "</div>";
    }
    view.innerHTML = html + supportPrompt("roaming");
  }

  /* ============================================================= SUPPORT */
  var SUP = ROC.support;
  var SECTIONS = [["general", "General / other"], ["boot", "Boot Up/Down"], ["schedule", "Automation Schedule"],
    ["edits", "Sunday Edits"], ["pco", "PCO"], ["roaming", "Roaming Camera"], ["tasks", "Recurring Tasks"], ["troubleshooting", "Troubleshooting"]];
  var supportForm = { type: SUP.types[0].id, section: "general", name: store.get("roc-support-name", ""), details: "" };
  var supportSent = null;

  function supportAddress() { return SUP.to.join("@"); }
  function supportType() { return SUP.types.filter(function (t) { return t.id === supportForm.type; })[0] || SUP.types[0]; }

  function supportPrompt(from, lead) {
    return '<a class="card support-prompt" href="#support" data-support-from="' + from + '">' +
      '<span class="tile-icon"><i data-lucide="message-circle-question"></i></span>' +
      "<span><strong>" + esc(lead || "Question, or something missing?") + '</strong><span class="sub">Send ' + esc(SUP.contactName) + " a request.</span></span>" +
      '<i data-lucide="chevron-right"></i></a>';
  }

  function renderSupport() {
    var html = '<div class="page-head"><span class="eyebrow">Ask a question</span><h1>Support</h1>' +
      "<p>Send " + esc(SUP.contactName) + " a technical question, report something that isn't working, or ask for something to be added to this app.</p></div>";
    if (supportSent) {
      html += '<div class="card support-done"><div class="tile-icon"><i data-lucide="mail-check"></i></div>' +
        "<h3>Almost done</h3><p>Your email app should have opened with your request filled in. <b>Press Send there to finish.</b></p>" +
        '<p class="sub">Email app didn\'t open? Copy your request and email it to <b>' + esc(supportAddress()) + "</b>.</p>" +
        '<div class="form-foot"><button type="button" class="ghost" data-copy="request"><i data-lucide="copy"></i>Copy request</button>' +
        '<button type="button" class="ghost" data-copy="address"><i data-lucide="copy"></i>Copy address</button>' +
        '<button type="button" class="ghost" data-support-new><i data-lucide="square-pen"></i>Write another</button>' +
        '<span class="meta" id="copy-status" role="status"></span></div></div>';
      view.innerHTML = html;
      return;
    }
    var t = supportType();
    html += '<form class="card support-form" id="support-form" novalidate>' +
      '<fieldset><legend class="eyebrow">What do you need?</legend><div class="type-grid">' +
      SUP.types.map(function (o) {
        return '<label class="type-option"><input type="radio" name="sup-type" value="' + o.id + '"' + (o.id === t.id ? " checked" : "") + ">" +
          '<span><i data-lucide="' + o.icon + '"></i>' + esc(o.label) + "</span></label>";
      }).join("") + "</div></fieldset>" +
      '<label class="field" for="sup-section"><span class="eyebrow">Which part of the app?</span><select id="sup-section">' +
      SECTIONS.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === supportForm.section ? " selected" : "") + ">" + s[1] + "</option>"; }).join("") +
      "</select></label>" +
      '<label class="field" for="sup-name"><span class="eyebrow">Your name</span><input id="sup-name" type="text" autocomplete="name" value="' + esc(supportForm.name) + '"></label>' +
      '<label class="field" for="sup-details"><span class="eyebrow">Details</span><textarea id="sup-details" rows="6" placeholder="' + esc(t.placeholder) + '">' + esc(supportForm.details) + "</textarea></label>" +
      '<p class="form-error" id="sup-error" role="alert" hidden></p>' +
      '<div class="form-foot"><button class="btn-primary" type="submit"><i data-lucide="send"></i>Write email</button>' +
      '<span class="sub">Opens your email app with everything filled in. You still press Send.</span></div></form>';
    view.innerHTML = html;
  }

  function buildSupportEmail() {
    var t = supportType();
    var section = SECTIONS.filter(function (s) { return s[0] === supportForm.section; })[0][1];
    var firstLine = supportForm.details.trim().split(/\n/)[0];
    if (firstLine.length > 60) firstLine = firstLine.slice(0, 57).trim() + "...";
    var subject = SUP.subjectPrefix + " " + t.label + ": " + firstLine;
    var body = supportForm.details.trim() + "\n\n---\nFrom: " + supportForm.name.trim() +
      "\nType: " + t.label + "\nSection: " + section +
      "\nSent from the ROC Production Hub, " + new Date().toLocaleString();
    return { subject: subject, body: body };
  }

  function copyText(text) {
    var status = document.getElementById("copy-status");
    function done(ok) { if (status) status.textContent = ok ? "Copied" : "Couldn't copy. Select the text and copy it yourself."; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else { done(fallbackCopy(text)); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  var RENDER = { home: renderHome, boot: renderBoot, schedule: renderSchedule, edits: renderEdits, pco: renderPco, roaming: renderRoaming, tasks: renderTasks, troubleshooting: renderTroubleshooting, support: renderSupport };

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
        if (keepAt) bootState[item.id] = { done: false, at: keepAt }; else delete bootState[item.id];
      });
      confirmingReset = false;
      store.set(BOOT_KEY, bootState);
      render();
    } else if ((el = e.target.closest("[data-team]"))) {
      teamFilter = el.dataset.team;
      store.set("roc-team-filter", teamFilter);
      render();
    } else if ((el = e.target.closest("[data-support-from]"))) {
      supportForm.section = el.dataset.supportFrom;
      supportSent = null;
    } else if ((el = e.target.closest("[data-copy-text]"))) {
      var btn = el;
      var text = el.dataset.copyText;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flashCopied(btn); },
          function () { if (fallbackCopy(text)) flashCopied(btn); });
      } else if (fallbackCopy(text)) flashCopied(btn);
    } else if ((el = e.target.closest("[data-copy]"))) {
      copyText(el.dataset.copy === "address" ? supportAddress()
        : "To: " + supportAddress() + "\nSubject: " + supportSent.subject + "\n\n" + supportSent.body);
    } else if ((el = e.target.closest("[data-support-new]"))) {
      supportSent = null; supportForm.details = "";
      render();
    } else if ((el = e.target.closest("[data-open-guide]"))) {
      openGuide(el.dataset.openGuide);
    } else if ((el = e.target.closest("[data-system]"))) {
      tsSystem = el.dataset.system;
      document.querySelectorAll("[data-system]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); });
      renderGuideList();
    }
  });

  view.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "ts-search") { tsQuery = t.value; renderGuideList(); }
    else if (t.id === "sup-name") supportForm.name = t.value;
    else if (t.id === "sup-details") supportForm.details = t.value;
  });
  view.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "sup-type") {
      supportForm.type = t.value;
      var d = document.getElementById("sup-details");
      if (d) d.placeholder = supportType().placeholder;
    } else if (t.id === "sup-section") supportForm.section = t.value;
    else if (t.dataset.edit) {
      var wk = editsWeek(new Date());
      if (t.checked) wk.st.checks[t.dataset.edit] = new Date().toISOString();
      else delete wk.st.checks[t.dataset.edit];
      saveEdits(); render();
    }
  });
  view.addEventListener("submit", function (e) {
    if (e.target.id !== "support-form") return;
    e.preventDefault();
    var err = document.getElementById("sup-error");
    var missing = !supportForm.name.trim() ? "sup-name" : !supportForm.details.trim() ? "sup-details" : null;
    if (missing) {
      err.textContent = missing === "sup-name" ? "Add your name so " + SUP.contactName + " knows who to reply to."
        : "Add a few details about what you need.";
      err.hidden = false;
      document.getElementById(missing).focus();
      return;
    }
    store.set("roc-support-name", supportForm.name.trim());
    supportSent = buildSupportEmail();
    var href = "mailto:" + supportAddress() + "?subject=" + encodeURIComponent(supportSent.subject) +
      "&body=" + encodeURIComponent(supportSent.body);
    render();
    window.location.href = href;
  });

  // Keep "next automation" and period labels fresh while the app sits open.
  setInterval(function () {
    if (document.hidden) return;
    if (route === "schedule" || route === "home") render();
  }, 60000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && ["troubleshooting", "support", "edits"].indexOf(route) < 0) render();
  });

  render();
})();
