/* Pure logic (no DOM) so it can be tested in node. */
(function (g) {
  const P = g.PROGRAM;
  const TZ = "America/New_York";

  function todayISO(now) {
    const d = now || new Date();
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
  function addDays(iso, n) {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function dow(iso) { return new Date(iso + "T12:00:00Z").getUTCDay(); } // 0 Sun
  function weekDates(iso) { // Monday-start week
    const off = (dow(iso) + 6) % 7;
    const mon = addDays(iso, -off);
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtLong(iso) { const [y, m, d] = iso.split("-").map(Number); return `${DOW[dow(iso)]}, ${MON[m - 1]} ${d}`; }
  function fmtShort(iso) { const [, m, d] = iso.split("-").map(Number); return `${m}/${d}`; }

  function getPlan(iso) {
    const p = P.DAYS[iso];
    if (p) return p;
    if (iso < P.FIRST) return { title: "Before ramp-up", rest: true, week: -1, note: "Ramp-up starts Wed Nov 18. Tonight: aim for 7+ hours of sleep." };
    if (iso > P.LAST) return { title: "Block 1 complete", rest: true, week: 7, note: "Block 2 plan comes from your coach. Keep logging check-ins." };
    return { title: "Rest", rest: true, week: 0 };
  }
  function phaseLabel(plan) {
    if (plan.week === 0) return "Ramp-up · Nov 18–29";
    if (plan.week >= 1 && plan.week <= 6) return `Week ${plan.week} · ${P.PHASES[plan.week]}`;
    return "";
  }
  function sessionKey(plan, atHome) {
    if (!plan.lift) return null;
    const s = P.SESSIONS[plan.lift];
    if (atHome && s.loc === "equinox" && s.alt) return s.alt;
    return plan.lift;
  }

  function lastTime(state, exId, beforeISO) {
    const dates = Object.keys(state.sessions || {}).filter(d => d < beforeISO).sort().reverse();
    for (const d of dates) {
      const ex = state.sessions[d].exercises && state.sessions[d].exercises[exId];
      if (ex && ex.sets && ex.sets.some(s => s.done)) return { date: d, sets: ex.sets.filter(s => s.done) };
    }
    return null;
  }
  function benchNum(state, id) {
    const b = (state.benchmarks || {})[id] || {};
    const v = parseFloat(b.retest || b.baseline);
    return isNaN(v) ? null : v;
  }

  // Per-exercise set targets for a given day.
  function targetsFor(state, plan, exId, iso) {
    const ex = P.EX[exId];
    let sets = ex.fixedSets || plan.sets || 2;
    let reps = ex.reps;
    let note = "";
    const lo = ex.range ? ex.range[0] : null, hi = ex.range ? ex.range[1] : null;
    let range = ex.range;
    if (plan.heavy && ex.compound && ex.range) { reps = 8; range = [6, 10]; }
    if (exId === "pullup-strict") {
      if (plan.week === 1 || plan.week === 6) {
        if (plan.lift === "pullA") { sets = 1; reps = 0; note = "Max test: strict reps, stop 1 short if form breaks."; }
      }
      if (plan.lift === "pullB" && plan.week < 3) return { skip: true, note: "Skip strict sets this week (starts Week 3)." };
      if (!note) { const m = benchNum(state, "pullups"); reps = m ? Math.max(1, Math.round(m * 0.6)) : 2; note = "Work sets at RIR 1–2."; }
    }
    if (ex.halfOfTest) { const m = benchNum(state, ex.halfOfTest); if (m) reps = Math.max(5, Math.round(m / 2)); }
    let w = ex.w;
    const last = lastTime(state, exId, iso);
    if (last && last.sets[0] && last.sets[0].w !== "" && last.sets[0].w != null) w = Number(last.sets[0].w);
    return { sets, reps, w, range, note, last };
  }

  function fmtSets(sets) {
    const done = sets.filter(s => s.done);
    if (!done.length) return "";
    const ws = done.map(s => s.w);
    const same = ws.every(x => String(x) === String(ws[0]));
    const rirs = done.map(s => s.rir).filter(x => x !== "" && x != null);
    const rirTxt = rirs.length ? " RIR" + (rirs.every(r => String(r) === String(rirs[0])) ? rirs[0] : rirs.join("/")) : "";
    if (same) return `${ws[0] || "BW"}x${done.map(s => s.r).join(",")}${rirTxt}`;
    return done.map(s => `${s.w || "BW"}x${s.r}`).join(",") + rirTxt;
  }

  function progressionHint(exId, last, range) {
    const ex = P.EX[exId];
    if (!last || !ex.next) return "";
    const sets = last.sets;
    const top = range ? range[1] : null;
    const allRir2 = sets.every(s => s.rir !== "" && s.rir != null && Number(s.rir) >= 2);
    if (top != null) {
      if (sets.every(s => Number(s.r) >= top) && allRir2) return `Top of range at RIR 2+ last time → ${ex.next}, back to ${range[0]} reps.`;
      if (sets.some(s => Number(s.r) < range[0])) return "Missed the bottom of the range last time → repeat the weight.";
      return `Add reps toward ${top} before adding weight.`;
    }
    if (allRir2) return `Felt easy last time (RIR 2+) → ${ex.next}.`;
    return "";
  }

  function sessionSummary(state, iso) {
    const s = state.sessions[iso];
    const plan = getPlan(iso);
    const parts = [];
    if (s) {
      const where = s.location === "equinox" ? "Equinox" : "home";
      const head = `${s.title || plan.title} ${fmtShort(iso)}` + (plan.week >= 1 && plan.week <= 6 ? ` (W${plan.week}, ${where}` : ` (${where}`) + (s.durationMin ? `, ${s.durationMin} min` : "") + (s.effort ? `, effort ${s.effort}` : "") + ")";
      parts.push(head);
      Object.keys(s.exercises || {}).forEach(id => {
        const t = fmtSets(s.exercises[id].sets || []);
        if (t) parts.push(`${P.EX[id] ? P.EX[id].name : id} ${t}`);
      });
      if (s.finisherDone) parts.push("Finisher done");
      if (s.run && (s.run.duration || s.run.distance)) {
        const r = s.run;
        parts.push(`Run ${r.duration || "?"} min` + (r.distance ? ` ${r.distance} mi` : "") + (r.avgHr ? ` avg HR ${r.avgHr}` : "") + (r.walkBreaks !== "" && r.walkBreaks != null ? ` walk breaks ${r.walkBreaks}` : ""));
      }
      if (s.tests) Object.keys(s.tests).forEach(k => { if (s.tests[k] !== "") { const b = P.BENCH.find(x => x.id === k); parts.push(`Test ${b ? b.name : k}: ${s.tests[k]} ${b ? b.unit : ""}`.trim()); } });
      parts.push(`Pain: ${s.notes ? s.notes : "none"}`);
    } else {
      parts.push(`${plan.title} ${fmtShort(iso)}: not logged`);
    }
    const c = (state.checkins || {})[iso];
    if (c) {
      const ci = [];
      if (c.protein) ci.push(`protein ${c.protein}/${P.PROTEIN_GOAL} g`);
      if (c.weight) ci.push(`weight ${c.weight}`);
      if (c.sleep) ci.push(`sleep ${c.sleep} h`);
      if (ci.length) parts.push("Check-in: " + ci.join(", "));
    }
    return parts.join("\n");
  }

  const CSV_HEAD = ["date", "week", "day", "workout_type", "exercise", "set_number", "reps", "weight_lb", "rir", "tempo_or_variation", "session_duration_min", "avg_hr", "run_distance_mi", "run_time", "effort_1to10", "pain_or_discomfort_notes", "source"];
  function csvEsc(v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(state) {
    const rows = [CSV_HEAD];
    Object.keys(state.sessions || {}).sort().forEach(d => {
      const s = state.sessions[d], plan = getPlan(d), day = DOW[dow(d)];
      const wk = plan.week >= 0 ? plan.week : "";
      Object.keys(s.exercises || {}).forEach(id => {
        (s.exercises[id].sets || []).forEach((st, i) => {
          if (!st.done) return;
          rows.push([d, wk, day, s.title, P.EX[id] ? P.EX[id].name : id, i + 1, st.r, st.w, st.rir, P.EX[id] && P.EX[id].unit === "assist" ? "assist lb" : "", s.durationMin || "", "", "", "", s.effort || "", s.notes || "", "app"]);
        });
      });
      if (s.run && (s.run.duration || s.run.distance)) rows.push([d, wk, day, "Run", "Easy run", "", "", "", "", s.run.walkBreaks ? `walk breaks ${s.run.walkBreaks}` : "", s.run.duration || "", s.run.avgHr || "", s.run.distance || "", s.run.duration || "", s.effort || "", s.notes || "", "app"]);
    });
    return rows.map(r => r.map(csvEsc).join(",")).join("\n") + "\n";
  }

  function weightSeries(state) {
    return Object.keys(state.checkins || {}).sort().filter(d => parseFloat(state.checkins[d].weight)).map(d => ({ date: d, w: parseFloat(state.checkins[d].weight) }));
  }
  function avg7(state, iso) {
    const pts = weightSeries(state).filter(p => p.date <= iso && p.date > addDays(iso, -7));
    if (pts.length < 3) return null;
    return pts.reduce((a, p) => a + p.w, 0) / pts.length;
  }

  function emptyState() { return { v: 1, sessions: {}, checkins: {}, benchmarks: {} }; }

  g.LOGIC = { TZ, todayISO, addDays, dow, weekDates, fmtLong, fmtShort, getPlan, phaseLabel, sessionKey, lastTime, targetsFor, fmtSets, progressionHint, sessionSummary, toCSV, weightSeries, avg7, emptyState, benchNum, DOW, CSV_HEAD };
})(typeof window !== "undefined" ? window : globalThis);
