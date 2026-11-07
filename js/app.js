(() => {
  const shop = window.SHOP || {};
  const $ = (s) => document.querySelector(s);
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const TYPE_LABEL = { home: "Home", away: "Away", third: "Third", retro: "Retro" };

  const state = { q: "", league: "", size: "", type: "", inStock: false, sort: "featured" };
  let kits = [];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => Number(n).toLocaleString("en-TT", { maximumFractionDigits: 0 });
  const waNumber = String(shop.whatsapp || "").replace(/\D/g, "");
  const waLink = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  const sortSizes = (a) => [...a].sort((x, y) => {
    const i = SIZE_ORDER.indexOf(x), j = SIZE_ORDER.indexOf(y);
    return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || String(x).localeCompare(y);
  });

  // ----- Shop text -----
  document.querySelectorAll("[data-shop]").forEach((el) => {
    const v = shop[el.dataset.shop];
    if (v) el.textContent = v;
  });
  if (shop.name) document.title = `${shop.name} | Football Kits in Trinidad & Tobago`;
  $("#general-enquiry").href = waLink(`Hi ${shop.name || ""}! I'm browsing your kits and have a question.`);
  if (shop.instagram) { $("#insta").href = shop.instagram; $("#insta-wrap").hidden = false; }
  const d = new Date();
  $("#issue").textContent = `Issue ${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;

  // ----- Load catalogue -----
  fetch("kits.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      kits = (Array.isArray(data) ? data : []).filter((k) => k && k.id && k.name).map((k, i) => ({
        ...k,
        _i: i,
        price: Number(k.price) || 0,
        sizes: Array.isArray(k.sizes) ? sortSizes(k.sizes) : [],
        inStock: k.inStock !== false,
        type: String(k.type || "").toLowerCase(),
      }));
      buildSelects();
      readUrl();
      render();
      openFromUrl();
    })
    .catch((err) => {
      console.error(err);
      $("#grid").innerHTML = `<p class="empty">Couldn't load the kits right now. Please refresh, or message us on WhatsApp.</p>`;
    });

  function buildSelects() {
    const leagues = [...new Set(kits.map((k) => k.league).filter(Boolean))].sort();
    $("#league").insertAdjacentHTML("beforeend", leagues.map((l) => `<option>${esc(l)}</option>`).join(""));
    const sizes = sortSizes([...new Set(kits.flatMap((k) => k.sizes))]);
    $("#size").insertAdjacentHTML("beforeend", sizes.map((s) => `<option>${esc(s)}</option>`).join(""));
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    let list = kits.filter((k) =>
      (!q || [k.name, k.team, k.league, k.season, k.type, k.description].join(" ").toLowerCase().includes(q)) &&
      (!state.league || k.league === state.league) &&
      (!state.size || k.sizes.includes(state.size)) &&
      (!state.type || k.type === state.type) &&
      (!state.inStock || k.inStock)
    );
    const by = {
      featured: (a, b) => (b.inStock - a.inStock) || a._i - b._i,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      team: (a, b) => String(a.team).localeCompare(b.team) || a._i - b._i,
    }[state.sort];
    return list.sort(by);
  }

  function render() {
    const list = filtered();
    $("#grid").innerHTML = list.map((k, n) => `
      <button type="button" class="card${k.inStock ? "" : " oos"}" data-id="${esc(k.id)}" aria-label="${esc(k.name)}, ${esc(k.season)}, TT$${money(k.price)}${k.inStock ? "" : ", sold out"}">
        <span class="card-no">${String(n + 1).padStart(2, "0")}</span>
        ${k.type ? `<span class="card-type ${esc(k.type)}">${esc(TYPE_LABEL[k.type] || k.type)}</span>` : ""}
        ${k.inStock ? "" : `<span class="stamp">Sold out</span>`}
        <span class="card-img"><img src="${esc(k.image || "images/placeholder.svg")}" alt="" loading="lazy" onerror="this.onerror=null;this.src='images/placeholder.svg'"></span>
        <span class="card-body">
          <span class="card-team">${esc(k.team)}${k.league ? " · " + esc(k.league) : ""}</span>
          <span class="card-name">${esc(k.name)}</span>
          <span class="card-season">Season ${esc(k.season)}</span>
          <span class="card-foot">
            <span class="price"><small>TT$</small>${money(k.price)}</span>
            <span class="card-sizes">${esc(k.sizes.join(" · "))}</span>
          </span>
        </span>
      </button>`).join("");
    $("#count").textContent = `${list.length} of ${kits.length} kits on the team sheet`;
    $("#empty").hidden = list.length > 0;
  }

  // ----- Filter controls -----
  const writeUrl = () => {
    const p = new URLSearchParams();
    Object.entries({ q: state.q, league: state.league, size: state.size, type: state.type, sort: state.sort === "featured" ? "" : state.sort, instock: state.inStock ? "1" : "" })
      .forEach(([k, v]) => v && p.set(k, v));
    const kit = new URLSearchParams(location.search).get("kit");
    if (kit) p.set("kit", kit);
    history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
  };
  function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = p.get("q") || ""; state.league = p.get("league") || ""; state.size = p.get("size") || "";
    state.type = p.get("type") || ""; state.sort = p.get("sort") || "featured"; state.inStock = p.get("instock") === "1";
    syncControls();
  }
  function syncControls() {
    $("#q").value = state.q; $("#league").value = state.league; $("#size").value = state.size;
    $("#sort").value = state.sort; $("#instock").checked = state.inStock;
    document.querySelectorAll("#types .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.type === state.type)));
  }
  const update = () => { render(); writeUrl(); };
  $("#q").addEventListener("input", (e) => { state.q = e.target.value; update(); });
  $("#league").addEventListener("change", (e) => { state.league = e.target.value; update(); });
  $("#size").addEventListener("change", (e) => { state.size = e.target.value; update(); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; update(); });
  $("#instock").addEventListener("change", (e) => { state.inStock = e.target.checked; update(); });
  $("#types").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip"); if (!chip) return;
    state.type = chip.dataset.type; syncControls(); update();
  });
  $("#reset").addEventListener("click", () => {
    Object.assign(state, { q: "", league: "", size: "", type: "", inStock: false, sort: "featured" });
    syncControls(); update();
  });

  // ----- Kit detail dialog -----
  const dlg = $("#kit-dialog");
  let current = null, chosenSize = "";

  $("#grid").addEventListener("click", (e) => {
    const card = e.target.closest(".card"); if (card) openKit(card.dataset.id);
  });

  function setKitParam(id) {
    const p = new URLSearchParams(location.search);
    id ? p.set("kit", id) : p.delete("kit");
    history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
  }
  function openFromUrl() {
    const id = new URLSearchParams(location.search).get("kit");
    if (id) openKit(id);
  }

  function openKit(id) {
    current = kits.find((k) => k.id === id);
    if (!current) return;
    chosenSize = current.sizes.length === 1 ? current.sizes[0] : "";
    const img = $("#d-img");
    img.onerror = () => { img.onerror = null; img.src = "images/placeholder.svg"; };
    img.src = current.image || "images/placeholder.svg";
    img.alt = current.name;
    $("#d-meta").textContent = [current.team, current.league, TYPE_LABEL[current.type] || current.type, current.season].filter(Boolean).join(" · ");
    $("#d-name").textContent = current.name;
    $("#d-price").textContent = `TT$${money(current.price)}`;
    $("#d-desc").textContent = current.description || "";
    $("#d-sizes").innerHTML = current.sizes.map((s) => `<button type="button" data-size="${esc(s)}" aria-pressed="${s === chosenSize}">${esc(s)}</button>`).join("")
      || `<span class="small">Ask us about sizes</span>`;
    updateWa();
    setKitParam(current.id);
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
    const shareUrl = `${location.origin}${location.pathname}?kit=${encodeURIComponent(k.id)}`;
    const size = chosenSize ? `Size: ${chosenSize}` : "Size: not sure yet";
    const msg = k.inStock
      ? `Hi ${shop.name || ""}! I'm interested in the ${k.name} (${k.season}).\n${size}\nPrice: TT$${money(k.price)}\nIs it available?\n${shareUrl}`
      : `Hi ${shop.name || ""}! The ${k.name} (${k.season}) shows as sold out. Will you be restocking it?\n${size}\n${shareUrl}`;
    const a = $("#d-wa");
    a.href = waLink(msg);
    a.textContent = k.inStock ? (chosenSize ? `Enquire about size ${chosenSize}` : "Enquire on WhatsApp") : "Ask about restock";
    $("#d-note").textContent = k.inStock
      ? (chosenSize ? "Opens WhatsApp with your message ready to send." : "Pick a size first, or just ask us.")
      : "Sold out right now. Message us and we'll let you know when it's back.";
  }

  dlg.addEventListener("close", () => setKitParam(null));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // click backdrop to close
})();
