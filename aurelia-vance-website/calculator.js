/* Advanced property calculator. Standalone: no dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) =>
    (isFinite(n) ? n : 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const WA = "13105550142"; // agent WhatsApp number

  /* Presets by property type. ins/maint are % of price per year. */
  const TYPES = {
    studio: {
      n: "Studio",
      s: "Condo",
      price: 450000,
      hoa: 420,
      ins: 0.12,
      maint: 0.3,
      rent: 0,
    },
    one: {
      n: "1-Bed",
      s: "Condo",
      price: 650000,
      hoa: 550,
      ins: 0.12,
      maint: 0.3,
      rent: 0,
    },
    two: {
      n: "2-Bed",
      s: "Condo",
      price: 950000,
      hoa: 700,
      ins: 0.12,
      maint: 0.3,
      rent: 0,
    },
    three: {
      n: "3-Bed",
      s: "Condo",
      price: 1400000,
      hoa: 950,
      ins: 0.13,
      maint: 0.3,
      rent: 0,
    },
    pent: {
      n: "Penthouse",
      s: "Luxury condo",
      price: 3500000,
      hoa: 2400,
      ins: 0.14,
      maint: 0.4,
      rent: 0,
    },
    town: {
      n: "Townhouse",
      s: "Attached",
      price: 1100000,
      hoa: 350,
      ins: 0.28,
      maint: 0.7,
      rent: 0,
    },
    sfh: {
      n: "Single-family",
      s: "House",
      price: 1800000,
      hoa: 0,
      ins: 0.32,
      maint: 1,
      rent: 0,
    },
    estate: {
      n: "Estate",
      s: "Luxury home",
      price: 9000000,
      hoa: 0,
      ins: 0.3,
      maint: 1,
      rent: 0,
    },
    multi: {
      n: "Multi-family",
      s: "2 to 4 units",
      price: 2200000,
      hoa: 0,
      ins: 0.4,
      maint: 1,
      rent: 6500,
    },
  };
  /* Approximate effective property tax rates, % of price per year. Editable in the form. */
  const STATES = {
    CA: ["California", 1.2],
    NY: ["New York", 1.6],
    TX: ["Texas", 1.6],
    FL: ["Florida", 0.9],
    IL: ["Illinois", 2.1],
    NJ: ["New Jersey", 2.2],
    WA: ["Washington", 0.85],
    MA: ["Massachusetts", 1.05],
    CO: ["Colorado", 0.5],
    AZ: ["Arizona", 0.55],
    GA: ["Georgia", 0.85],
    NC: ["North Carolina", 0.75],
    VA: ["Virginia", 0.8],
    NV: ["Nevada", 0.55],
    HI: ["Hawaii", 0.3],
  };
  const PMI = { great: 0.4, good: 0.6, fair: 0.9 }; // % of loan per year (conventional, below 20% down)
  const COLORS = [
    "#f6ecd9",
    "#e6b422",
    "#c9677f",
    "#a8782a",
    "#8e5a68",
    "#bfaeb3",
  ];

  const S = {
    mode: "pay",
    type: "sfh",
    state: "CA",
    taxRate: 1.2,
    price: 1800000,
    downPct: 20,
    downUnit: "pct",
    loan: "conv",
    credit: "good",
    term: 30,
    rate: 6.5,
    insRate: 0.32,
    hoa: 0,
    maint: 1,
    rent: 0,
    extra: 0,
    close: 2.5,
    income: 350000,
    debts: 2500,
    dp: 400000,
    dti: 43,
  };
  const preset = (k) => {
    const t = TYPES[k];
    Object.assign(S, {
      type: k,
      price: t.price,
      hoa: t.hoa,
      insRate: t.ins,
      maint: t.maint,
      rent: t.rent,
    });
  };

  /* ---- Core math ---- */
  function calc(price, down) {
    const loan = Math.max(price - down, 0),
      ltv = price ? loan / price : 0;
    const fee =
      S.loan === "fha" ? loan * 0.0175 : S.loan === "va" ? loan * 0.0215 : 0; // upfront FHA / VA funding fee, financed
    const L0 = loan + fee,
      r = S.rate / 1200,
      n = S.term * 12;
    const pi = L0 ? (r ? (L0 * r) / (1 - Math.pow(1 + r, -n)) : L0 / n) : 0;
    const tax = (price * S.taxRate) / 1200,
      ins = (price * S.insRate) / 1200,
      maint = (price * S.maint) / 1200,
      hoa = +S.hoa || 0;
    const pmiRate =
      S.loan === "fha"
        ? 0.55
        : S.loan === "va"
          ? 0
          : ltv > 0.8
            ? PMI[S.credit]
            : 0;
    const pmi = (loan * pmiRate) / 1200;
    const total = pi + tax + ins + hoa + pmi + maint;
    return {
      price,
      down,
      loan,
      ltv,
      fee,
      L0,
      pi,
      tax,
      ins,
      hoa,
      pmi,
      maint,
      total,
      net: total - S.rent,
      close: (price * S.close) / 100,
    };
  }
  function schedule(L0, price, extra) {
    const r = S.rate / 1200,
      n = S.term * 12,
      pay = L0 ? (r ? (L0 * r) / (1 - Math.pow(1 + r, -n)) : L0 / n) : 0;
    let bal = L0,
      m = 0,
      interest = 0,
      yi = 0,
      yp = 0,
      pmiM = null;
    const yr = [];
    while (bal > 0.5 && m < n + 1) {
      const i = bal * r,
        p = Math.min(Math.max(pay - i + extra, 0), bal);
      bal -= p;
      interest += i;
      yi += i;
      yp += p;
      m++;
      if (pmiM === null && bal <= price * 0.8) pmiM = m;
      if (m % 12 === 0 || bal <= 0.5) {
        yr.push({ y: Math.ceil(m / 12), i: yi, p: yp, b: Math.max(bal, 0) });
        yi = yp = 0;
      }
    }
    return { months: m, interest, yr, pmiM: pmiM === null ? m : pmiM };
  }
  function maxPrice() {
    // largest price whose monthly cost fits the debt-to-income limit
    const cap = (S.income / 12) * (S.dti / 100) - S.debts;
    if (cap <= 0) return 0;
    let lo = 0,
      hi = 60e6;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      calc(mid, Math.min(S.dp, mid)).total <= cap ? (lo = mid) : (hi = mid);
    }
    return lo;
  }

  /* ---- Rendering ---- */
  function chart(yr, L0) {
    if (!yr.length) {
      $("#chart").innerHTML = "";
      return;
    }
    const W = 640,
      base = 200,
      top = 20,
      h = base - top,
      bw = (W - 30) / yr.length,
      mx = Math.max(...yr.map((d) => d.p + d.i), 1);
    let bars = "",
      pts = "";
    yr.forEach((d, k) => {
      const x = 15 + k * bw,
        hp = (d.p / mx) * h,
        hi = (d.i / mx) * h;
      bars += `<rect x="${x + bw * 0.12}" y="${base - hp}" width="${bw * 0.76}" height="${hp}" fill="#e6b422"/><rect x="${x + bw * 0.12}" y="${base - hp - hi}" width="${bw * 0.76}" height="${hi}" fill="#5b1427"/>`;
      pts += `${x + bw / 2},${base - (d.b / L0) * h} `;
    });
    const lab = (k, t) =>
      `<text x="${15 + k * bw + bw / 2}" y="222" font-size="11" text-anchor="middle" fill="#6d5a5f">${t}</text>`;
    $("#chart").innerHTML =
      `<line x1="10" x2="${W - 10}" y1="${base}" y2="${base}" stroke="#eadfd5"/>${bars}<polyline points="${pts}" fill="none" stroke="#2a1218" stroke-width="2"/>${lab(0, "Yr 1")}${yr.length > 2 ? lab(Math.floor(yr.length / 2), "Yr " + yr[Math.floor(yr.length / 2)].y) : ""}${yr.length > 1 ? lab(yr.length - 1, "Yr " + yr[yr.length - 1].y) : ""}`;
  }
  let last = {};
  function update() {
    const afford = S.mode === "afford";
    const price = afford ? maxPrice() : S.price,
      down = afford ? Math.min(S.dp, price) : (price * S.downPct) / 100;
    const c = calc(price, down),
      s = schedule(c.L0, price, +S.extra || 0),
      s0 = S.extra ? schedule(c.L0, price, 0) : s;
    last = { c, s };
    const warn = [];
    if (
      !afford &&
      c.price &&
      c.down <
        c.price * (S.loan === "fha" ? 0.035 : S.loan === "jumbo" ? 0.1 : 0.03) -
          1
    )
      warn.push(
        {
          fha: "FHA loans need at least 3.5% down.",
          jumbo: "Jumbo loans usually need 10% to 20% down.",
          conv: "Most conventional loans need at least 3% down.",
          va: "",
        }[S.loan] || "",
      );
    if (afford && !price)
      warn.push(
        "Your monthly debts already use up the limit at this debt-to-income ratio.",
      );
    if (S.loan === "va")
      warn.push(
        "VA loans are only for eligible veterans and service members. Funding fee assumes first use.",
      );
    $("#warn").textContent = warn.filter(Boolean).join(" ");

    $("#rTitle").textContent = afford
      ? "YOU COULD AFFORD UP TO"
      : "ESTIMATED MONTHLY PAYMENT";
    $("#rBig").textContent = fmt(afford ? price : c.net);
    $("#rSub").textContent = afford
      ? `About ${fmt(c.total)} per month with ${fmt(down)} down`
      : S.rent
        ? `${fmt(c.total)} before ${fmt(S.rent)} of rental income`
        : "Principal, interest, tax, insurance, HOA and upkeep";
    $("#useBtn").hidden = !(afford && price);
    $("#barL").textContent = afford ? "MAX PRICE" : "MONTHLY";
    $("#barV").textContent = fmt(afford ? price : c.net);

    const mi =
      S.loan === "fha"
        ? "Mortgage insurance (MIP)"
        : "Mortgage insurance (PMI)";
    const items = [
      ["Principal and interest", c.pi],
      ["Property tax", c.tax],
      ["Insurance", c.ins],
      ["HOA", c.hoa],
      [mi, c.pmi],
      ["Upkeep reserve", c.maint],
    ];
    const shown = items.map((it, i) => [...it, i]).filter((x) => x[1] > 0.5);
    let acc = 0;
    $("#donut").innerHTML =
      '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="5"/>' +
      shown
        .map(([, v, i]) => {
          const sh = (v / c.total) * 100,
            el = `<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${COLORS[i]}" stroke-width="5" stroke-dasharray="${sh} ${100 - sh}" stroke-dashoffset="${-acc}"/>`;
          acc += sh;
          return el;
        })
        .join("");
    $("#donutC").innerHTML = `<b>${fmt(c.total)}</b>per month`;
    $("#legend").innerHTML = shown
      .map(
        ([n, v, i]) =>
          `<li><i style="background:${COLORS[i]}"></i>${n}<span>${fmt(v)}</span></li>`,
      )
      .join("");

    const yrs = (m) =>
      `${Math.floor(m / 12)} yr${m % 12 ? " " + (m % 12) + " mo" : ""}`;
    const pmiCost = c.pmi * (S.loan === "fha" ? s.months : s.pmiM),
      saved = s0.interest - s.interest;
    const st = [
      ["Loan amount", fmt(c.L0)],
      [
        "Down payment",
        `${fmt(c.down)} (${(c.price ? (c.down / c.price) * 100 : 0).toFixed(1)}%)`,
      ],
      ["Cash needed to close", fmt(c.down + c.close)],
      ["Closing costs", fmt(c.close)],
      ["Total interest", fmt(s.interest)],
      ["Payoff time", yrs(s.months)],
    ];
    if (c.pmi > 0 && S.loan !== "fha")
      st.push(["Mortgage insurance ends", `after ${yrs(s.pmiM)}`]);
    if (c.pmi > 0) st.push(["Total mortgage insurance", fmt(pmiCost)]);
    if (S.extra > 0)
      st.push(
        ["Interest saved with extra", fmt(saved)],
        ["Time saved", yrs(Math.max(s0.months - s.months, 0))],
      );
    if (S.rent > 0 && c.price)
      st.push(
        ["Net monthly after rent", fmt(c.net)],
        [
          "Gross rental yield",
          (((S.rent * 12) / c.price) * 100).toFixed(2) + "%",
        ],
      );
    $("#stats").innerHTML = st
      .map(([l, v]) => `<div><span>${l}</span><b>${v}</b></div>`)
      .join("");
    chart(s.yr, c.L0);
    $("#sched").innerHTML = s.yr
      .map(
        (d) =>
          `<tr><td>${d.y}</td><td>${fmt(d.p)}</td><td>${fmt(d.i)}</td><td>${fmt(d.b)}</td></tr>`,
      )
      .join("");
    const msg = `Hi Aurelia, I used your calculator. ${TYPES[S.type].n} (${TYPES[S.type].s}), price ${fmt(price)}, down ${fmt(c.down)}, ${S.rate}% for ${S.term} years. Estimated monthly: ${fmt(c.total)}. I'd like to talk.`;
    $("#wa").href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
    $("#downHint").textContent =
      `${S.downPct.toFixed(1)}% down is ${fmt((S.price * S.downPct) / 100)}. Loan: ${fmt(S.price - (S.price * S.downPct) / 100)}.`;
  }

  /* ---- Form wiring ---- */
  function sync(skip) {
    $$("[data-k]").forEach((el) => {
      if (el === skip) return;
      const v = S[el.dataset.k];
      if (el.value !== String(v)) el.value = v;
    });
    $$("[data-seg]").forEach((g) =>
      $$("button", g).forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(S[g.dataset.seg]) === b.dataset.v,
        ),
      ),
    );
    $$("#types button").forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.v === S.type),
    );
    $("#state").value = S.state;
    const pct = S.downUnit === "pct";
    if (skip !== $("#downNum"))
      $("#downNum").value = pct
        ? +S.downPct.toFixed(1)
        : Math.round((S.price * S.downPct) / 100);
    if (skip !== $("#downR")) $("#downR").value = S.downPct;
    $$("[data-mode]").forEach((b) =>
      b.setAttribute("aria-selected", b.dataset.mode === S.mode),
    );
    $$("[data-show]").forEach((el) => (el.hidden = el.dataset.show !== S.mode));
  }
  $("#types").innerHTML = Object.entries(TYPES)
    .map(
      ([k, t]) =>
        `<button type="button" data-v="${k}" aria-pressed="false">${t.n}<small>${t.s}</small></button>`,
    )
    .join("");
  $("#state").innerHTML = Object.entries(STATES)
    .map(([k, v]) => `<option value="${k}">${v[0]}</option>`)
    .join("");
  $("#types").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) {
      preset(b.dataset.v);
      sync();
      update();
    }
  });
  $("#state").addEventListener("change", (e) => {
    S.state = e.target.value;
    S.taxRate = STATES[S.state][1];
    sync();
    update();
  });
  $("#f").addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "downNum") {
      const v = Math.max(+el.value || 0, 0);
      S.downPct =
        S.downUnit === "pct"
          ? Math.min(v, 100)
          : Math.min((v / (S.price || 1)) * 100, 100);
    } else if (el.id === "downR") S.downPct = +el.value;
    else if (el.dataset.k)
      S[el.dataset.k] =
        el.tagName === "SELECT" && isNaN(+el.value) ? el.value : +el.value || 0;
    sync(el);
    update();
  });
  $("#f").addEventListener("change", (e) => {
    if (e.target.dataset.k === "credit") {
      S.credit = e.target.value;
      update();
    }
  });
  $$("[data-seg]").forEach((g) =>
    g.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      S[g.dataset.seg] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
      sync();
      update();
    }),
  );
  $$(".tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      S.mode = b.dataset.mode;
      sync();
      update();
    }),
  );
  $("#useBtn").addEventListener("click", () => {
    const p = Math.round(last.c.price / 1000) * 1000;
    S.price = p;
    S.downPct = Math.min((last.c.down / (p || 1)) * 100, 90);
    S.mode = "pay";
    sync();
    update();
    scrollTo({ top: 0, behavior: "smooth" });
  });
  $("#csv").addEventListener("click", () => {
    const rows = [
      "Year,Principal,Interest,Balance",
      ...last.s.yr.map((d) =>
        [d.y, d.p.toFixed(2), d.i.toFixed(2), d.b.toFixed(2)].join(","),
      ),
    ];
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(
        new Blob([rows.join("\n")], { type: "text/csv" }),
      ),
      download: "amortization-schedule.csv",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const top = $("#top"),
    mb = $(".menu");
  const setMenu = (o) => {
    top.classList.toggle("open", o);
    mb.setAttribute("aria-expanded", o);
    document.body.style.overflow = o ? "hidden" : "";
  };
  mb.addEventListener("click", () => setMenu(!top.classList.contains("open")));
  $("nav", top).addEventListener(
    "click",
    (e) => e.target.closest("a") && setMenu(false),
  );

  preset("sfh");
  sync();
  update();
})();
