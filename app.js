/* Coach app UI. Vanilla JS, data in localStorage. */
(function () {
  const P = window.PROGRAM, L = window.LOGIC;
  const KEY = "coach.ryan.v1";
  let S = load();
  const ui = { tab: "today", date: L.todayISO(), view: "day", sumDate: null };
  let rest = null, restTick = null, clockTick = null, audio = null, wake = null;

  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.sessions) return Object.assign(L.emptyState(), s); } catch (e) {} return L.emptyState(); }
  function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
  const $ = (q) => document.querySelector(q);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.remove("hidden"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.add("hidden"), 1800); }
  const benchDef = (id) => P.BENCH.find(b => b.id === id);
  function bval(id) { const b = S.benchmarks[id] || {}; return b; }
  function benchBaseline(id) { const b = bval(id); return b.baseline != null && b.baseline !== "" ? b.baseline : (benchDef(id) || {}).baseline || ""; }

  // ---------- Day / home ----------
  function dayKind(iso) { const p = L.getPlan(iso); return p.lift ? "lift" : p.run ? "run" : "rest"; }
  function renderStrip(iso) {
    const today = L.todayISO();
    return `<div class="strip">${L.weekDates(iso).map(d => {
      const k = dayKind(d), logged = S.sessions[d] && S.sessions[d].finishedAt;
      return `<button data-act="goto" data-d="${d}" class="${d === iso ? "sel" : ""} ${d === today ? "today" : ""}">${L.DOW[L.dow(d)]}<b>${+d.slice(8)}</b><span class="dot ${logged ? "ok" : k === "lift" ? "lift" : k === "run" ? "run" : ""}"></span></button>`;
    }).join("")}</div>`;
  }
  function locPill(plan, sess) {
    if (!plan.lift) return "";
    const key = (sess && sess.sessionKey) || plan.lift;
    const loc = P.SESSIONS[key].loc;
    return `<span class="pill ${loc === "equinox" ? "eq" : "home"}">${loc === "equinox" ? "Equinox" : "Home gym"}</span>`;
  }
  function renderDay() {
    const iso = ui.date, plan = L.getPlan(iso), sess = S.sessions[iso];
    let h = `<div class="row between"><button class="icon" data-act="prev" aria-label="Previous day">‹</button>
      <div class="center"><div class="muted small">${iso === L.todayISO() ? "Today" : ""}</div><h2 style="margin:0">${L.fmtLong(iso)}</h2></div>
      <button class="icon" data-act="next" aria-label="Next day">›</button></div>`;
    h += renderStrip(iso);
    h += `<div class="card"><div class="muted small">${esc(L.phaseLabel(plan))}</div><h1>${esc(plan.title)}${plan.optional ? " (optional)" : ""}</h1><div class="row">${locPill(plan, sess)}${plan.sets ? `<span class="pill">${plan.sets} sets · RIR ${plan.rir}</span>` : ""}${plan.run ? `<span class="pill">Run ${plan.run.walk ? "/ walk " : ""}${plan.run.min}${plan.run.max ? "–" + plan.run.max : ""} min</span>` : ""}</div>`;
    if (plan.note) h += `<p class="muted small">${esc(plan.note)}</p>`;
    if (plan.tests) h += `<p class="small">Tests today: ${plan.tests.map(t => esc(benchDef(t).name)).join(", ")}</p>`;
    if (plan.lift) {
      const s = P.SESSIONS[plan.lift];
      const hasLift = sess && sess.sessionKey;
      if (s.alt && !hasLift) h += `<div class="grid2"><button class="btn" data-act="start" data-home="0">Start at ${s.loc === "equinox" ? "Equinox" : "home"}</button><button class="btn sec" data-act="start" data-home="1">Start home version</button></div>`;
      else h += `<button class="btn" data-act="start">${hasLift ? (sess.finishedAt ? "Open logged workout" : "Resume workout") : "Start workout"}</button>`;
      if (plan.run) h += `<button class="btn sec" data-act="run">Log ${plan.run.min}-min run</button><p class="muted small">${esc(plan.run.label)}</p>`;
      h += `<details><summary>Exercises</summary><ul class="small">${P.SESSIONS[(sess && sess.sessionKey) || plan.lift].ex.map(id => `<li>${esc(P.EX[id].name)}</li>`).join("")}</ul></details>`;
    } else if (plan.run) {
      h += `<p>${esc(plan.run.label)}</p><button class="btn" data-act="run">${sess ? "Open logged " + (plan.run.walk ? "walk" : "run") : "Start " + (plan.run.walk ? "walk" : "run")}</button>`;
    } else {
      h += `<p class="muted">Recovery day. Walk, stretch, sleep 7+ h, hit 180 g protein.</p><button class="btn sec" data-act="run">Log a walk</button>`;
    }
    if (sess && sess.finishedAt) h += `<button class="btn sec small" data-act="summary">Summary + Share with Coach</button>`;
    h += `</div>`;
    h += renderCheckin(iso);
    h += `<button class="btn sec" data-act="share" data-d="${iso}">Share with Coach</button>`;
    return h;
  }
  function renderCheckin(iso) {
    const c = S.checkins[iso] || {};
    const p = Number(c.protein || 0), pct = Math.min(100, Math.round(p / P.PROTEIN_GOAL * 100));
    return `<div class="card"><h3>Daily check-in</h3>
      <div class="row between"><b>Protein</b><span><b>${p}</b> / ${P.PROTEIN_GOAL} g</span></div>
      <div class="bar ${p >= P.PROTEIN_GOAL ? "good" : ""}"><i style="width:${pct}%"></i></div>
      <div class="quick"><button data-act="prot" data-n="20">+20</button><button data-act="prot" data-n="30">+30</button><button data-act="prot" data-n="40">+40</button></div>
      <div class="grid2" style="margin-top:8px">
        <div class="fld"><label>Protein total (g)</label><input class="f" inputmode="numeric" data-ci="protein" value="${esc(c.protein || "")}"></div>
        <div class="fld"><label>Body weight (lb)</label><input class="f" inputmode="decimal" data-ci="weight" value="${esc(c.weight || "")}"></div>
        <div class="fld"><label>Sleep (hours)</label><input class="f" inputmode="decimal" data-ci="sleep" value="${esc(c.sleep || "")}"></div>
        <div class="fld"><label>Soreness 0–10</label><input class="f" inputmode="numeric" data-ci="soreness" value="${esc(c.soreness || "")}"></div>
      </div>
      ${Number(c.soreness) >= 7 || (c.sleep && Number(c.sleep) < 6) ? `<div class="warnbox">Soreness 7+ or sleep under 6 h: do today's session at 2 sets, RIR 4.</div>` : ""}
    </div>`;
  }

  // ---------- Workout ----------
  function startSession(iso, atHome) {
    const plan = L.getPlan(iso);
    const prev = S.sessions[iso];
    if (!prev || !prev.sessionKey) {
      const key = L.sessionKey(plan, atHome);
      const s = Object.assign({ notes: "", effort: "", run: {}, tests: {} }, prev || {}, { title: P.SESSIONS[key].name, sessionKey: key, location: P.SESSIONS[key].loc, startedAt: Date.now(), exercises: {}, finisherDone: false });
      delete s.finishedAt;
      P.SESSIONS[key].ex.forEach(id => {
        const t = L.targetsFor(S, plan, id, iso);
        if (t.skip) return;
        s.exercises[id] = { sets: Array.from({ length: t.sets }, () => ({ w: P.EX[id].unit === "bw" ? "" : t.w, r: t.reps || "", rir: "", done: false })) };
      });
      S.sessions[iso] = s; save();
    }
    ui.view = "workout"; requestWake(); render(); window.scrollTo(0, 0);
  }
  function unitLabel(id) { const u = P.EX[id].unit; return u === "each" ? "lb each" : u === "assist" ? "assist lb" : u === "bw" ? "+lb (BW)" : "lb"; }
  function currentEx(sess) { const ids = Object.keys(sess.exercises); return ids.find(id => sess.exercises[id].sets.some(s => !s.done)); }
  function renderWorkout() {
    const iso = ui.date, plan = L.getPlan(iso), sess = S.sessions[iso];
    const key = sess.sessionKey, def = P.SESSIONS[key], cur = currentEx(sess);
    let h = `<div class="topbar"><div class="row between"><button class="icon" data-act="back" aria-label="Back">‹</button>
      <div class="center"><b>${esc(sess.title)}</b><div class="muted small">${L.fmtShort(iso)} · ${esc(L.phaseLabel(plan))}</div></div>
      <div class="center"><div id="clock" class="timer">0:00</div><div class="muted small">of 45:00</div></div></div></div>`;
    h += `<div class="row" style="margin-top:8px">${locPill(plan, sess)}<span class="pill">RIR ${plan.rir || "3–4"}</span>${def.alt && !sess.finishedAt ? `<button class="pill" data-act="swap">Switch to ${P.SESSIONS[def.alt].loc === "equinox" ? "Equinox" : "home"} version</button>` : ""}</div>`;
    if (plan.note) h += `<p class="muted small">${esc(plan.note)}</p>`;
    h += `<p class="muted small">Short on time: 30 min = warm-up + first 3 exercises. 20 min = first 2 exercises. Never skip the warm-up.</p>`;
    h += `<div class="card"><b>Warm-up 5 min</b><div class="muted small">3 min bike or incline walk, then arm circles, hip hinges, bodyweight squats, arm swings.</div></div>`;
    if (plan.tests && plan.tests.length && plan.lift) h += renderTests(iso, plan, sess);
    Object.keys(sess.exercises).forEach((id, idx) => { h += renderExercise(iso, plan, sess, id, idx, id === cur); });
    const skipped = def.ex.filter(id => !sess.exercises[id]);
    skipped.forEach(id => { const t = L.targetsFor(S, plan, id, iso); h += `<div class="card done"><b>${esc(P.EX[id].name)}</b><div class="muted small">${esc(t.note || "Skipped this week.")}</div></div>`; });
    h += `<div class="card"><h3>Finisher + cool-down</h3><p class="small">${esc(def.finisher)}</p><button class="btn ${sess.finisherDone ? "good" : "sec"} small" data-act="fin">${sess.finisherDone ? "✓ Finisher done" : "Mark finisher done"}</button></div>`;
    if (plan.run) h += renderRunCard(iso, plan, sess, true);
    h += `<div class="card"><div class="fld"><label>Notes / pain or discomfort</label><textarea class="f" data-sf="notes" placeholder="e.g. left shoulder pinch on press (2/10)">${esc(sess.notes)}</textarea></div>
      <div class="fld"><label>Session effort 1–10</label><input class="f" inputmode="numeric" data-sf="effort" value="${esc(sess.effort)}"></div>
      <div class="warnbox small">Stop for sharp or joint pain, dizziness, chest pain or unusual shortness of breath.</div></div>`;
    h += `<button class="btn good" data-act="finish">Finish workout</button>`;
    return h;
  }
  function renderExercise(iso, plan, sess, id, idx, isCur) {
    const ex = P.EX[id], t = L.targetsFor(S, plan, id, iso), sets = sess.exercises[id].sets;
    const doneAll = sets.every(s => s.done);
    const last = L.lastTime(S, id, iso);
    const tgt = t.reps ? `${t.reps}${ex.perSide ? "/side" : ""}` : "max";
    let h = `<div class="card ${isCur ? "cur" : ""} ${doneAll ? "done" : ""}" id="ex-${id}">
      <div class="row between"><h3 style="margin:0">${idx + 1}. ${esc(ex.name)}</h3><span class="pill">Rest ${ex.rest >= 120 ? ex.rest / 60 + " min" : ex.rest + " s"}</span></div>
      <div class="small">Target: ${sets.length} x ${tgt}${t.range ? ` (range ${t.range[0]}–${t.range[1]})` : ""} · ${ex.unit === "bw" ? "bodyweight" : esc(ex.load)}</div>
      ${t.note ? `<div class="small muted">${esc(t.note)}</div>` : ""}
      <div class="last">${last ? `Last time (${L.fmtShort(last.date)}): ${esc(L.fmtSets(last.sets))}` : "Last time: first session"}</div>
      ${last ? `<div class="hint">${esc(L.progressionHint(id, last, t.range))}</div>` : ""}`;
    sets.forEach((s, i) => {
      h += `<div class="set ${s.done ? "isdone" : ""}"><div class="n">${i + 1}</div>
        <div><label>${unitLabel(id)}</label><input inputmode="decimal" data-set="${id}|${i}|w" value="${esc(s.w)}"></div>
        <div><label>reps</label><input inputmode="numeric" data-set="${id}|${i}|r" value="${esc(s.r)}"></div>
        <div><label>RIR</label><input inputmode="numeric" data-set="${id}|${i}|rir" value="${esc(s.rir)}"></div>
        <button class="chk ${s.done ? "on" : ""}" data-act="check" data-id="${id}" data-i="${i}" aria-label="Log set">✓</button></div>`;
    });
    h += `<div class="grid2"><button class="btn sec small" data-act="addset" data-id="${id}">+ Set</button><button class="btn sec small" data-act="rmset" data-id="${id}">− Set</button></div>
      <details><summary>How to · easier / harder</summary><p class="small"><b>Cues:</b> ${esc(ex.cues)}</p><p class="small"><b>Easier:</b> ${esc(ex.easier)}<br><b>Harder:</b> ${esc(ex.harder)}</p><p class="small muted">${esc(ex.muscles)}</p></details></div>`;
    return h;
  }
  function renderTests(iso, plan, sess) {
    const wk = plan.week;
    return `<div class="card"><h3>${wk === 6 ? "Retests" : "Baseline tests"} today</h3><p class="muted small">Only test max effort if you're not sore or run-down. Otherwise push it a day.</p>${plan.tests.map(tid => {
      const b = benchDef(tid);
      return `<div class="fld"><label>${esc(b.name)} (${esc(b.unit)}): ${esc(b.protocol)}</label><input class="f" data-test="${tid}" value="${esc((sess.tests || {})[tid] || "")}"></div>`;
    }).join("")}</div>`;
  }
  function renderRunCard(iso, plan, sess, inWorkout) {
    const r = sess.run || {};
    const walk = plan.run && plan.run.walk;
    return `<div class="card"><h3>${walk ? "Walk" : "Easy run"}${plan.run ? ` · ${plan.run.min}${plan.run.max ? "–" + plan.run.max : ""} min` : ""}</h3>
      ${plan.run ? `<p class="small">${esc(plan.run.label)}</p>` : ""}
      ${walk ? "" : `<div class="warnbox"><b>Zone 2: ${P.ZONE2[0]}–${P.ZONE2[1]} bpm</b> (your Garmin zones, max HR 192). Your last two cardio sessions averaged 164 bpm (Zone 4), so go slower. If HR passes 134, walk 60 s, then resume. Full sentences = right pace.</div>`}
      <div class="grid2" style="margin-top:8px">
        <div class="fld"><label>Duration (min)</label><input class="f" inputmode="decimal" data-run="duration" value="${esc(r.duration || "")}"></div>
        <div class="fld"><label>Distance (mi)</label><input class="f" inputmode="decimal" data-run="distance" value="${esc(r.distance || "")}"></div>
        <div class="fld"><label>Avg HR (bpm)</label><input class="f" inputmode="numeric" data-run="avgHr" value="${esc(r.avgHr || "")}"></div>
        <div class="fld"><label>Walk breaks (#)</label><input class="f" inputmode="numeric" data-run="walkBreaks" value="${esc(r.walkBreaks != null ? r.walkBreaks : "")}"></div>
      </div>
      ${r.avgHr && Number(r.avgHr) > P.ZONE2[1] ? `<div class="hint">Avg HR ${esc(r.avgHr)} is above Zone 2. Next run: slower pace, more walk breaks.</div>` : ""}
    </div>`;
  }
  function renderRun() {
    const iso = ui.date, plan = L.getPlan(iso);
    if (!S.sessions[iso]) { S.sessions[iso] = { title: plan.run ? plan.title : "Walk", sessionKey: null, location: "home", startedAt: Date.now(), exercises: {}, notes: "", effort: "", run: {}, tests: {} }; save(); }
    const sess = S.sessions[iso];
    let h = `<div class="topbar"><div class="row between"><button class="icon" data-act="back" aria-label="Back">‹</button><div class="center"><b>${esc(sess.title)}</b><div class="muted small">${L.fmtShort(iso)} · ${esc(L.phaseLabel(plan))}</div></div><span style="width:48px"></span></div></div>`;
    h += renderRunCard(iso, plan.run ? plan : { run: { min: 30, walk: true, label: "Easy walk, 20–40 min." } }, sess, false);
    if (plan.tests && plan.tests.length) h += renderTests(iso, plan, sess);
    h += `<div class="card"><div class="fld"><label>Notes / pain or discomfort</label><textarea class="f" data-sf="notes">${esc(sess.notes)}</textarea></div><div class="fld"><label>Effort 1–10</label><input class="f" inputmode="numeric" data-sf="effort" value="${esc(sess.effort)}"></div></div>`;
    h += `<button class="btn good" data-act="finish">Save</button>`;
    return h;
  }
  function renderSummary() {
    const iso = ui.date, txt = L.sessionSummary(S, iso);
    return `<div class="row between"><button class="icon" data-act="back">‹</button><h2 style="margin:0">Summary</h2><span style="width:48px"></span></div>
      <div class="card"><pre class="share">${esc(txt)}</pre></div>
      <button class="btn" data-act="share" data-d="${iso}">Share with Coach</button>
      <button class="btn sec" data-act="reopen">Edit workout</button>
      <button class="btn sec" data-act="back">Done</button>`;
  }

  // ---------- Plan ----------
  function renderPlan() {
    const days = Object.keys(P.DAYS).sort();
    let h = `<h1>Plan</h1><p class="muted small">Tap any day to open it.</p>`;
    let curWk = null;
    days.forEach(d => {
      const p = P.DAYS[d];
      if (p.week !== curWk) { if (curWk !== null) h += `</div></div>`; curWk = p.week; h += `<div class="card"><h3>${esc(L.phaseLabel(p))}</h3><div class="list">`; }
      const logged = S.sessions[d] && S.sessions[d].finishedAt;
      h += `<button data-act="goto" data-d="${d}" data-tab="today"><b>${L.DOW[L.dow(d)]} ${L.fmtShort(d)}</b> · ${esc(p.title)}${p.lift && P.SESSIONS[p.lift].loc === "equinox" ? " @ Equinox" : ""}${p.run && p.lift ? " + run" : ""} ${logged ? "✓" : ""}<div class="muted small">${p.sets ? p.sets + " sets · RIR " + p.rir : p.run ? esc(p.run.label) : esc(p.note || "")}</div></button>`;
    });
    h += `</div></div>`;
    return h;
  }

  // ---------- History ----------
  function sparkline(pts) {
    if (pts.length < 2) return `<p class="muted small">Log your weight in the daily check-in to see the trend.</p>`;
    const W = 320, H = 90, pad = 8, ws = pts.map(p => p.w);
    const lo = Math.min(...ws, P.GOAL_WEIGHT) - 1, hi = Math.max(...ws) + 1;
    const x = i => pad + i * (W - 2 * pad) / (pts.length - 1), y = v => H - pad - (v - lo) * (H - 2 * pad) / (hi - lo);
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.w).toFixed(1)}`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}"><line x1="0" x2="${W}" y1="${y(P.GOAL_WEIGHT)}" y2="${y(P.GOAL_WEIGHT)}" stroke="var(--good)" stroke-dasharray="4 4"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="3"/><circle cx="${x(pts.length - 1)}" cy="${y(ws[ws.length - 1])}" r="4" fill="var(--accent)"/></svg>
      <div class="row between small muted"><span>${L.fmtShort(pts[0].date)}: ${pts[0].w}</span><span>goal ${P.GOAL_WEIGHT}</span><span>${L.fmtShort(pts[pts.length - 1].date)}: ${ws[ws.length - 1]}</span></div>`;
  }
  function renderHistory() {
    const pts = L.weightSeries(S), today = L.todayISO(), a7 = L.avg7(S, today);
    const last7 = Array.from({ length: 7 }, (_, i) => L.addDays(today, -i));
    const hits = last7.filter(d => Number((S.checkins[d] || {}).protein) >= P.PROTEIN_GOAL).length;
    let h = `<h1>History</h1><div class="card"><h3>Weight trend</h3>${sparkline(pts)}${a7 ? `<p class="small">7-day average: <b>${a7.toFixed(1)} lb</b></p>` : ""}</div>
      <div class="card"><h3>Protein</h3><p>${hits} of last 7 days at ${P.PROTEIN_GOAL} g+</p></div>`;
    const ds = Object.keys(S.sessions).sort().reverse();
    h += `<div class="card"><h3>Sessions (${ds.length})</h3><div class="list">${ds.length ? ds.map(d => {
      const s = S.sessions[d], n = Object.values(s.exercises || {}).reduce((a, e) => a + e.sets.filter(x => x.done).length, 0);
      return `<button data-act="goto" data-d="${d}" data-tab="today"><b>${L.fmtShort(d)} · ${esc(s.title)}</b> ${s.finishedAt ? "✓" : "(in progress)"}<div class="muted small">${n ? n + " sets" : ""}${s.durationMin ? " · " + s.durationMin + " min" : ""}${s.run && s.run.duration ? " · run " + esc(s.run.duration) + " min" : ""}${s.notes ? " · " + esc(s.notes) : ""}</div></button>`;
    }).join("") : `<p class="muted small">Logged workouts show up here.</p>`}</div></div>`;
    h += `<div class="card"><h3>Backup</h3><p class="muted small">Data lives only in this browser on this phone. Export a backup now and then.</p>
      <button class="btn sec small" data-act="csv">Export CSV</button><button class="btn sec small" data-act="json">Export JSON backup</button>
      <button class="btn sec small" data-act="import">Import JSON backup</button><input type="file" id="importFile" accept="application/json,.json" class="hidden"></div>`;
    return h;
  }

  // ---------- Goals ----------
  function longestRun() { let m = 0; Object.values(S.sessions).forEach(s => { const d = parseFloat(s.run && s.run.distance); if (d > m) m = d; }); return m; }
  function renderGoals() {
    const pts = L.weightSeries(S), curW = pts.length ? pts[pts.length - 1].w : P.START_WEIGHT;
    const pu = L.benchNum(S, "pushups"), pl = L.benchNum(S, "pullups");
    const run = Math.max(longestRun(), parseFloat(benchBaseline("continuous")) || 0);
    const goals = [
      { name: "50 strict push-ups", cur: pu || 25, goal: 50, txt: pu ? `${pu} reps` : "20–30 (est.)" },
      { name: "20 strict pull-ups", cur: pl || 2.5, goal: 20, txt: pl ? `${pl} reps` : "2–3 (est.)" },
      { name: "Comfortable 5K", cur: run, goal: 3.1, txt: `${run} of 3.1 mi` },
      { name: "230 lb", cur: Math.max(0, P.START_WEIGHT - curW), goal: P.START_WEIGHT - P.GOAL_WEIGHT, txt: `${curW} lb now` },
    ];
    let h = `<h1>Goals</h1><div class="card"><h3>Long-term</h3>${goals.map(g => `<div style="margin:10px 0"><div class="row between"><b>${g.name}</b><span class="small muted">${esc(g.txt)}</span></div><div class="bar"><i style="width:${Math.min(100, Math.round(g.cur / g.goal * 100))}%"></i></div></div>`).join("")}</div>`;
    h += `<div class="card"><h3>Benchmarks</h3><p class="muted small">Baseline = Week 1 test. Retest = Week 6. Edit any value.</p><table><tr><th>Test</th><th>Baseline</th><th>W6 retest</th></tr>${P.BENCH.map(b => `<tr><td><b>${esc(b.name)}</b><div class="muted small">${esc(b.unit)}${b.testDay ? " · test " + b.testDay : ""}</div></td><td><input data-bench="${b.id}|baseline" value="${esc(benchBaseline(b.id))}"></td><td><input data-bench="${b.id}|retest" value="${esc(bval(b.id).retest || "")}" placeholder="${esc(b.retestDay || "")}"></td></tr>`).join("")}</table></div>`;
    h += `<div class="card small"><h3>Rules</h3><ul><li>Double progression: hit the top of the rep range on every set at RIR 2+, then add load and drop to the bottom of the range.</li><li>DBs +5 lb per hand. Barbell loads: 35, 55, 85, 105 only.</li><li>Maxed at 50 lb DBs: 3 s lowering → pause → single-arm/leg → +2 reps → +1 set.</li><li>Missed a session: do the next one. Never double up.</li><li>Sleep target 7+ h. Protein 180 g.</li></ul></div>`;
    return h;
  }

  // ---------- Render ----------
  function render() {
    let h = "";
    if (ui.tab === "today") h = ui.view === "workout" ? renderWorkout() : ui.view === "run" ? renderRun() : ui.view === "summary" ? renderSummary() : renderDay();
    else if (ui.tab === "plan") h = renderPlan();
    else if (ui.tab === "history") h = renderHistory();
    else h = renderGoals();
    $("#app").innerHTML = h;
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("on", b.dataset.tab === ui.tab));
    tickClock();
  }
  function tickClock() {
    const el = $("#clock"); const s = S.sessions[ui.date];
    if (!el || !s) return;
    const end = s.finishedAt || Date.now();
    const sec = Math.floor((end - s.startedAt) / 1000);
    el.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    el.classList.toggle("over", sec > 45 * 60);
  }
  clockTick = setInterval(tickClock, 1000);

  // ---------- Rest timer ----------
  function beep() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach(t => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audio.destination); g.gain.setValueAtTime(0.25, audio.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + t + 0.25); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + 0.3); });
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 300]);
  }
  function startRest(sec) {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume(); } catch (e) {}
    rest = { end: Date.now() + sec * 1000, fired: false };
    clearInterval(restTick); restTick = setInterval(drawRest, 250); drawRest();
  }
  function drawRest() {
    const bar = $("#restbar");
    if (!rest) { bar.classList.add("hidden"); return; }
    const left = Math.ceil((rest.end - Date.now()) / 1000);
    if (left <= 0 && !rest.fired) { rest.fired = true; beep(); }
    const t = Math.max(0, left);
    bar.classList.remove("hidden"); bar.classList.toggle("end", left <= 0);
    bar.innerHTML = `<div><div class="small">${left <= 0 ? "Rest done. Go." : "Rest"}</div><div class="t">${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}</div></div><div class="row"><button data-act="rest+">+30</button><button data-act="restx">${left <= 0 ? "OK" : "Skip"}</button></div>`;
    if (left < -20) stopRest();
  }
  function stopRest() { rest = null; clearInterval(restTick); $("#restbar").classList.add("hidden"); }
  async function requestWake() { try { if ("wakeLock" in navigator && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); } } catch (e) {} }

  // ---------- Share / export ----------
  async function share(iso) {
    const txt = L.sessionSummary(S, iso);
    try { if (navigator.share) { await navigator.share({ text: txt }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(txt); toast("Copied. Paste it to your coach."); return; } catch (e) {}
    ui.view = "summary"; render();
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type }); const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- Events ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act],[data-tab]"); if (!b) return;
    const act = b.dataset.act;
    if (!act && b.dataset.tab) { ui.tab = b.dataset.tab; if (ui.tab === "today" && ui.view !== "workout" && ui.view !== "run") ui.view = "day"; render(); window.scrollTo(0, 0); return; }
    const iso = ui.date, sess = S.sessions[iso];
    switch (act) {
      case "prev": ui.date = L.addDays(iso, -1); ui.view = "day"; break;
      case "next": ui.date = L.addDays(iso, 1); ui.view = "day"; break;
      case "goto": ui.date = b.dataset.d; ui.view = "day"; ui.tab = "today"; window.scrollTo(0, 0); break;
      case "start": startSession(iso, b.dataset.home === "1"); return;
      case "run": ui.view = L.getPlan(iso).lift && sess && sess.sessionKey ? "workout" : "run"; if (ui.view === "workout") { render(); const c = document.querySelectorAll("[data-run]")[0]; if (c) c.scrollIntoView({ block: "center" }); return; } break;
      case "back": ui.view = "day"; break;
      case "summary": ui.view = "summary"; break;
      case "reopen": ui.view = sess && sess.sessionKey ? "workout" : "run"; break;
      case "swap": {
        const alt = P.SESSIONS[sess.sessionKey].alt;
        const logged = Object.values(sess.exercises).some(x => x.sets.some(s => s.done));
        if (logged && !confirm("Switch versions? Sets logged so far stay in the log.")) return;
        delete S.sessions[iso]; save(); startSession(iso, P.SESSIONS[alt].loc === "home"); 
        if (logged) toast("Switched."); return;
      }
      case "check": {
        const id = b.dataset.id, i = +b.dataset.i, st = sess.exercises[id].sets[i];
        st.done = !st.done; save();
        if (st.done) { startRest(P.EX[id].rest); }
        render();
        const cur = currentEx(sess); if (st.done && cur) { const el = document.getElementById("ex-" + cur); if (el && cur !== id) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
        return;
      }
      case "addset": { const sets = sess.exercises[b.dataset.id].sets, l = sets[sets.length - 1] || {}; sets.push({ w: l.w || "", r: l.r || "", rir: "", done: false }); save(); break; }
      case "rmset": { const sets = sess.exercises[b.dataset.id].sets; if (sets.length > 1 && !sets[sets.length - 1].done) { sets.pop(); save(); } break; }
      case "fin": sess.finisherDone = !sess.finisherDone; save(); break;
      case "finish": sess.finishedAt = Date.now(); if (sess.sessionKey) sess.durationMin = Math.round((sess.finishedAt - sess.startedAt) / 60000); save(); stopRest(); ui.view = "summary"; window.scrollTo(0, 0); break;
      case "rest+": if (rest) { rest.end = Math.max(rest.end, Date.now()) + 30000; rest.fired = false; } drawRest(); return;
      case "restx": stopRest(); return;
      case "prot": { const c = S.checkins[iso] = S.checkins[iso] || {}; c.protein = Number(c.protein || 0) + Number(b.dataset.n); save(); break; }
      case "share": share(b.dataset.d || iso); return;
      case "csv": download(`coach-log-${L.todayISO()}.csv`, L.toCSV(S), "text/csv"); return;
      case "json": download(`coach-backup-${L.todayISO()}.json`, JSON.stringify(S, null, 1), "application/json"); return;
      case "import": $("#importFile").click(); return;
      default: return;
    }
    render();
  });
  document.addEventListener("input", (e) => {
    const t = e.target, d = t.dataset, iso = ui.date, sess = S.sessions[iso];
    if (d.set) { const [id, i, f] = d.set.split("|"); sess.exercises[id].sets[+i][f] = t.value; }
    else if (d.ci) { const c = S.checkins[iso] = S.checkins[iso] || {}; c[d.ci] = t.value; }
    else if (d.sf) { sess[d.sf] = t.value; }
    else if (d.run) { sess.run = sess.run || {}; sess.run[d.run] = t.value; }
    else if (d.test) {
      sess.tests = sess.tests || {}; sess.tests[d.test] = t.value;
      const wk = L.getPlan(iso).week, b = S.benchmarks[d.test] = S.benchmarks[d.test] || {};
      b[wk === 6 ? "retest" : "baseline"] = t.value;
    }
    else if (d.bench) { const [id, f] = d.bench.split("|"); const b = S.benchmarks[id] = S.benchmarks[id] || {}; b[f] = t.value; }
    else return;
    save();
  });
  document.addEventListener("change", (e) => {
    if (e.target.dataset.ci === "protein" || e.target.dataset.ci === "soreness" || e.target.dataset.ci === "sleep") render();
    if (e.target.id === "importFile" && e.target.files[0]) {
      const r = new FileReader();
      r.onload = () => { try { const s = JSON.parse(r.result); if (!s.sessions) throw 0; if (!confirm("Replace all data on this phone with this backup?")) return; S = Object.assign(L.emptyState(), s); save(); render(); toast("Backup imported."); } catch (err) { alert("That file isn't a Coach backup."); } };
      r.readAsText(e.target.files[0]);
    }
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { if (ui.view === "workout") requestWake(); drawRest(); } });

  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
  render();
  window.__coach = { S: () => S, ui, render };
})();
