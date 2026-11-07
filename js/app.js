(() => {
  const shop = window.SHOP || {};
  const $ = (s) => document.querySelector(s);
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const TYPES = { home: "Home", away: "Away", third: "Third", retro: "Retro" };
  const PRICES = [
    { id: "u400", label: "Under $400", test: (p) => p < 400 },
    { id: "400-499", label: "$400 – $499", test: (p) => p >= 400 && p < 500 },
    { id: "500-599", label: "$500 – $599", test: (p) => p >= 500 && p < 600 },
    { id: "600", label: "$600 and over", test: (p) => p >= 600 },
  ];

  const blank = () => ({ q: "", league: "", teams: new Set(), types: new Set(), sizes: new Set(), prices: new Set(), inStock: false, sort: "featured" });
  let state = blank();
  let kits = [];
  let teamQ = "";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "TT$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const waNumber = String(shop.whatsapp || "").replace(/\D/g, "");
  const waLink = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  const sizeRank = (s) => { const i = SIZE_ORDER.indexOf(s); return i < 0 ? 99 : i; };
  const sortSizes = (a) => [...a].sort((x, y) => sizeRank(x) - sizeRank(y) || String(x).localeCompare(y));
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  const seasonYear = (s) => parseInt(String(s).slice(0, 4), 10) || 0;

  // ----- Shop text -----
  document.querySelectorAll("[data-shop]").forEach((el) => { if (shop[el.dataset.shop]) el.textContent = shop[el.dataset.shop]; });
  if (shop.name) document.title = `${shop.name} | Football Kits in Trinidad & Tobago`;
  $("#general-enquiry").href = waLink(`Hi ${shop.name || ""}! I'm browsing your kits and have a question.`);
  if (shop.instagram) { $("#insta").href = shop.instagram; $("#insta-wrap").hidden = false; }
  if (!/^\d{10,15}$/.test(waNumber)) console.warn("Set your WhatsApp number in js/config.js");

  // ----- Load -----
  fetch("kits.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      kits = (Array.isArray(data) ? data : []).filter((k) => k && k.id && k.name).map((k, i) => ({
        ...k, _i: i,
        price: Number(k.price) || 0,
        sizes: Array.isArray(k.sizes) ? sortSizes(k.sizes) : [],
        inStock: k.inStock !== false,
        type: String(k.type || "").toLowerCase(),
        league: k.league || "Other",
        team: k.team || "Other",
      }));
      readUrl();
      render();
      openFromUrl();
    })
    .catch((err) => {
      console.error(err);
      $("#grid").innerHTML = `<p class="empty">Couldn't load the kits right now. Please refresh, or message us on WhatsApp.</p>`;
    });

  // ----- Filtering -----
  // `skip` lets each filter group count results while ignoring its own selection (faceted counts).
  function matches(k, skip = "") {
    const q = state.q.trim().toLowerCase();
    if (q && ![k.name, k.team, k.league, k.season, k.type, k.description].join(" ").toLowerCase().includes(q)) return false;
    if (skip !== "league" && state.league && k.league !== state.league) return false;
    if (skip !== "teams" && state.teams.size && !state.teams.has(k.team)) return false;
    if (skip !== "types" && state.types.size && !state.types.has(k.type)) return false;
    if (skip !== "sizes" && state.sizes.size && !k.sizes.some((s) => state.sizes.has(s))) return false;
    if (skip !== "prices" && state.prices.size && !PRICES.some((p) => state.prices.has(p.id) && p.test(k.price))) return false;
    if (skip !== "inStock" && state.inStock && !k.inStock) return false;
    return true;
  }
  const countBy = (skip, fn) => kits.filter((k) => matches(k, skip)).reduce((m, k) => { [].concat(fn(k)).forEach((v) => m.set(v, (m.get(v) || 0) + 1)); return m; }, new Map());

  function results() {
    const by = {
      featured: (a, b) => (b.inStock - a.inStock) || a._i - b._i,
      "price-asc": (a, b) => a.price - b.price || a._i - b._i,
      "price-desc": (a, b) => b.price - a.price || a._i - b._i,
      team: (a, b) => a.team.localeCompare(b.team) || a._i - b._i,
      newest: (a, b) => seasonYear(b.season) - seasonYear(a.season) || a._i - b._i,
    }[state.sort] || ((a, b) => a._i - b._i);
    return kits.filter((k) => matches(k)).sort(by);
  }

  // ----- Rendering -----
  function render() {
    renderLeagues(); renderTeams(); renderTypes(); renderSizes(); renderPrices();
    $("#instock").checked = state.inStock;
    $("#sort").value = state.sort;
    if (document.activeElement !== $("#q")) $("#q").value = state.q;

    const list = results();
    $("#grid").innerHTML = list.map(card).join("");
    $("#empty").hidden = list.length > 0;
    $("#count").textContent = `${list.length} ${list.length === 1 ? "kit" : "kits"}`;
    $("#apply-count").textContent = list.length;
    renderHeading(); renderActive();
    writeUrl();
  }

  function card(k) {
    return `<button type="button" class="card${k.inStock ? "" : " oos"}" data-id="${esc(k.id)}">
      <span class="card-img">
        <img src="${esc(k.image || "images/placeholder.svg")}" alt="" loading="lazy" onerror="this.onerror=null;this.src='images/placeholder.svg'">
        ${k.type ? `<span class="tag ${esc(k.type)}">${esc(TYPES[k.type] || k.type)}</span>` : ""}
        ${k.inStock ? "" : `<span class="oos-tag">Sold out</span>`}
      </span>
      <span class="card-body">
        <span class="card-team">${esc(k.team)}</span>
        <span class="card-name">${esc(k.name)}</span>
        <span class="card-season">${esc(k.season)}</span>
        <span class="card-foot">
          <span class="price">${money(k.price)}</span>
          <span class="card-sizes">${esc(k.sizes.join(" "))}</span>
        </span>
      </span>
    </button>`;
  }

  function renderLeagues() {
    const counts = countBy("league", (k) => k.league);
    const total = kits.filter((k) => matches(k, "league")).length;
    const leagues = uniq(kits.map((k) => k.league)).sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || a.localeCompare(b));
    $("#league-tabs").innerHTML = [["", "All kits", total], ...leagues.map((l) => [l, l, counts.get(l) || 0])]
      .map(([v, label, n]) => `<button type="button" class="ltab" data-league="${esc(v)}" aria-current="${state.league === v}">${esc(label)} <span class="n">${n}</span></button>`).join("");
  }

  function renderTeams() {
    const counts = countBy("teams", (k) => k.team);
    const pool = kits.filter((k) => !state.league || k.league === state.league);
    const tq = teamQ.trim().toLowerCase();
    const byLeague = new Map();
    uniq(pool.map((k) => k.team)).sort().forEach((t) => {
      if (tq && !t.toLowerCase().includes(tq) && !state.teams.has(t)) return;
      const lg = pool.find((k) => k.team === t).league;
      if (!byLeague.has(lg)) byLeague.set(lg, []);
      byLeague.get(lg).push(t);
    });
    const grouped = !state.league && byLeague.size > 1;
    let html = "";
    [...byLeague.keys()].sort().forEach((lg) => {
      if (grouped) html += `<div class="group-label">${esc(lg)}</div>`;
      html += byLeague.get(lg).map((t) => checkRow("team", t, t, counts.get(t) || 0, state.teams.has(t))).join("");
    });
    $("#team-list").innerHTML = html || `<p class="muted">No teams found</p>`;
  }

  function renderTypes() {
    const counts = countBy("types", (k) => k.type);
    $("#type-list").innerHTML = Object.entries(TYPES).filter(([v]) => kits.some((k) => k.type === v))
      .map(([v, label]) => checkRow("type", v, label, counts.get(v) || 0, state.types.has(v))).join("");
  }

  function renderPrices() {
    const pool = kits.filter((k) => matches(k, "prices"));
    $("#price-list").innerHTML = PRICES.filter((p) => kits.some((k) => p.test(k.price)))
      .map((p) => checkRow("price", p.id, p.label, pool.filter((k) => p.test(k.price)).length, state.prices.has(p.id))).join("");
  }

  function renderSizes() {
    const counts = countBy("sizes", (k) => k.sizes);
    $("#size-list").innerHTML = sortSizes(uniq(kits.flatMap((k) => k.sizes)))
      .map((s) => `<button type="button" class="size-btn" data-size="${esc(s)}" aria-pressed="${state.sizes.has(s)}" ${counts.get(s) || state.sizes.has(s) ? "" : "disabled style=\"opacity:.4\""}>${esc(s)}</button>`).join("");
  }

  const checkRow = (kind, value, label, n, checked) =>
    `<label class="check${n || checked ? "" : " zero"}"><input type="checkbox" data-kind="${kind}" value="${esc(value)}" ${checked ? "checked" : ""}><span class="lbl">${esc(label)}</span><span class="n">${n}</span></label>`;

  function renderHeading() {
    const teams = [...state.teams];
    const title = teams.length === 1 ? `${teams[0]} kits` : state.league ? `${state.league} kits` : state.q ? `Results for “${state.q}”` : "All kits";
    $("#heading").textContent = title;
    const crumbs = [`<button type="button" data-crumb="all">All kits</button>`];
    if (state.league) crumbs.push(`<button type="button" data-crumb="league">${esc(state.league)}</button>`);
    if (teams.length === 1) crumbs.push(`<span>${esc(teams[0])}</span>`);
    $("#crumbs").innerHTML = crumbs.join(`<span class="sep">/</span>`);
  }

  function renderActive() {
    const pills = [];
    if (state.q) pills.push(["q", "", `“${state.q}”`]);
    if (state.league) pills.push(["league", "", state.league]);
    state.teams.forEach((t) => pills.push(["teams", t, t]));
    state.types.forEach((t) => pills.push(["types", t, TYPES[t] || t]));
    state.sizes.forEach((s) => pills.push(["sizes", s, `Size ${s}`]));
    state.prices.forEach((p) => pills.push(["prices", p, (PRICES.find((x) => x.id === p) || {}).label || p]));
    if (state.inStock) pills.push(["inStock", "", "In stock"]);
    $("#active").innerHTML = pills.map(([k, v, label]) => `<button type="button" class="pill" data-k="${k}" data-v="${esc(v)}" aria-label="Remove filter ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`).join("")
      + (pills.length > 1 ? `<button type="button" class="pill clear" data-k="all">Clear all</button>` : "");
    const n = pills.length - (state.q ? 1 : 0) - (state.league ? 1 : 0);
    $("#filter-badge").textContent = n; $("#filter-badge").hidden = n === 0;
  }

  // ----- URL state (shareable links) -----
  function writeUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.league) p.set("league", state.league);
    [["team", state.teams], ["type", state.types], ["size", state.sizes], ["price", state.prices]].forEach(([k, set]) => set.size && p.set(k, [...set].join(",")));
    if (state.inStock) p.set("instock", "1");
    if (state.sort !== "featured") p.set("sort", state.sort);
    const kit = new URLSearchParams(location.search).get("kit");
    if (kit) p.set("kit", kit);
    history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
  }
  function readUrl() {
    const p = new URLSearchParams(location.search);
    const set = (k) => new Set((p.get(k) || "").split(",").filter(Boolean));
    state = { q: p.get("q") || "", league: p.get("league") || "", teams: set("team"), types: set("type"), sizes: set("size"), prices: set("price"), inStock: p.get("instock") === "1", sort: p.get("sort") || "featured" };
  }

  // ----- Events -----
  let qTimer;
  $("#q").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; render(); }, 150); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#instock").addEventListener("change", (e) => { state.inStock = e.target.checked; render(); });
  $("#team-q").addEventListener("input", (e) => { teamQ = e.target.value; renderTeams(); });

  $("#league-tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".ltab"); if (!b) return;
    setLeague(b.dataset.league);
    b.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  function setLeague(lg) {
    state.league = lg;
    if (lg) state.teams = new Set([...state.teams].filter((t) => kits.some((k) => k.team === t && k.league === lg)));
    render();
  }

  $("#sidebar").addEventListener("change", (e) => {
    const i = e.target.closest("input[data-kind]"); if (!i) return;
    const set = { team: state.teams, type: state.types, price: state.prices }[i.dataset.kind];
    i.checked ? set.add(i.value) : set.delete(i.value);
    render();
  });
  $("#size-list").addEventListener("click", (e) => {
    const b = e.target.closest(".size-btn"); if (!b) return;
    state.sizes.has(b.dataset.size) ? state.sizes.delete(b.dataset.size) : state.sizes.add(b.dataset.size);
    render();
  });

  $("#active").addEventListener("click", (e) => {
    const b = e.target.closest(".pill"); if (!b) return;
    const { k, v } = b.dataset;
    if (k === "all") return clearAll();
    if (k === "q") state.q = "";
    else if (k === "league") state.league = "";
    else if (k === "inStock") state.inStock = false;
    else state[k].delete(v);
    render();
  });
  $("#crumbs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.crumb === "all") clearAll(); else { state.teams.clear(); render(); }
  });
  function clearAll() { const sort = state.sort; state = blank(); state.sort = sort; teamQ = ""; $("#team-q").value = ""; render(); }
  $("#reset").addEventListener("click", clearAll);
  $("#clear-side").addEventListener("click", clearAll);

  // Mobile filter drawer
  const sidebar = $("#sidebar"), scrim = $("#scrim");
  const openDrawer = () => { sidebar.classList.add("open"); scrim.hidden = false; document.body.style.overflow = "hidden"; $("#close-filters").focus(); };
  const closeDrawer = () => { sidebar.classList.remove("open"); scrim.hidden = true; document.body.style.overflow = ""; };
  $("#open-filters").addEventListener("click", openDrawer);
  $("#close-filters").addEventListener("click", closeDrawer);
  $("#apply-filters").addEventListener("click", () => { closeDrawer(); $("#heading").scrollIntoView({ block: "start" }); });
  scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sidebar.classList.contains("open")) closeDrawer(); });

  // ----- Kit detail dialog -----
  const dlg = $("#kit-dialog");
  let current = null, chosenSize = "";
  $("#grid").addEventListener("click", (e) => { const c = e.target.closest(".card"); if (c) openKit(c.dataset.id); });

  function setKitParam(id) {
    const p = new URLSearchParams(location.search);
    id ? p.set("kit", id) : p.delete("kit");
    history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
  }
  function openFromUrl() { const id = new URLSearchParams(location.search).get("kit"); if (id) openKit(id); }

  function openKit(id) {
    current = kits.find((k) => k.id === id);
    if (!current) return;
    const k = current;
    chosenSize = k.sizes.length === 1 ? k.sizes[0] : "";
    const img = $("#d-img");
    img.onerror = () => { img.onerror = null; img.src = "images/placeholder.svg"; };
    img.src = k.image || "images/placeholder.svg"; img.alt = k.name;
    $("#d-meta").textContent = `${k.team} · ${k.league}`;
    $("#d-name").textContent = k.name;
    $("#d-price").textContent = money(k.price);
    const st = $("#d-stock"); st.textContent = k.inStock ? "In stock" : "Sold out"; st.className = "stock" + (k.inStock ? "" : " out");
    $("#d-desc").textContent = k.description || "";
    $("#d-sizes").innerHTML = k.sizes.map((s) => `<button type="button" class="size-btn" data-size="${esc(s)}" aria-pressed="${s === chosenSize}">${esc(s)}</button>`).join("") || `<span class="muted">Ask us about sizes</span>`;
    $("#d-facts").innerHTML = [["Team", k.team], ["League", k.league], ["Season", k.season], ["Kit", TYPES[k.type] || k.type]]
      .filter(([, v]) => v).map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("");
    updateWa();
    setKitParam(k.id);
    if (!dlg.open) dlg.showModal();
  }

  $("#d-sizes").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-size]"); if (!b) return;
    chosenSize = chosenSize === b.dataset.size ? "" : b.dataset.size;
    $("#d-sizes").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.size === chosenSize)));
    updateWa();
  });

  function updateWa() {
    const k = current;
    const link = `${location.origin}${location.pathname}?kit=${encodeURIComponent(k.id)}`;
    const size = chosenSize ? `Size: ${chosenSize}` : "Size: not sure yet";
    const msg = k.inStock
      ? `Hi ${shop.name || ""}! I'm interested in the ${k.name} (${k.season}).\n${size}\nPrice: ${money(k.price)}\nIs it available?\n${link}`
      : `Hi ${shop.name || ""}! The ${k.name} (${k.season}) shows as sold out. Will you be restocking it?\n${size}\n${link}`;
    const a = $("#d-wa");
    a.href = waLink(msg);
    a.textContent = k.inStock ? (chosenSize ? `Enquire about size ${chosenSize} on WhatsApp` : "Enquire on WhatsApp") : "Ask about restock on WhatsApp";
    $("#d-note").textContent = k.inStock
      ? (chosenSize ? "Opens WhatsApp with your message ready to send." : "Pick a size, or just ask us.")
      : "Sold out right now. Message us and we'll tell you when it's back.";
  }

  dlg.addEventListener("close", () => setKitParam(null));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
})();
