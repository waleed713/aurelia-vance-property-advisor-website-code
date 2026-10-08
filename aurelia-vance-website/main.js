const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const u = (id, w, h) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=75`;
const money = (n) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
const M = (n) => "$" + n + "M";
const ic = (p) =>
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  phone: ic(
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  ),
  msg: ic('<path d="M4 5h16v11H9l-5 4z"/>'),
  wa: ic(
    '<path d="M4 20l1.4-4.2A8 8 0 1 1 8.3 18.7z"/><path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 .8c-1-.4-1.800-1.200-2.200-2.200l.8-1-1-2z"/>',
  ),
  bed: ic('<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/>'),
  bath: ic(
    '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0"/>',
  ),
  sq: ic('<path d="M4 4h16v16H4zM4 10h6v10"/>'),
  pin: ic(
    '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  ),
};
const A = window.AGENT,
  L = window.LISTINGS,
  AR = window.AREAS;
const qs = new URLSearchParams(location.search);
const slug = (s) => s.toLowerCase().replace(/\s+/g, "-");

/* ---- Shell: header, footer, quick-contact dock ---- */
$("#ftr").outerHTML =
  `<footer class="ft"><div class="ft-top"><h2>Ready when you are.</h2><div class="row" style="margin:0"><a class="btn gold" href="tel:${A.phone}">${I.phone} Call Aurelia</a><a class="btn line" style="color:#fff;border-color:#fff" href="https://wa.me/${A.wa}">${I.wa} WhatsApp</a></div></div>
<div class="ft-grid"><div><span class="brand b-cream ft-logo" role="img" aria-label="Aurelia Vance Property Advisor"></span><p>Private luxury real estate across Beverly Hills, Bel Air and Malibu.</p></div>
<div><h3>Neighborhoods</h3>${AR.map((a) => `<a href="area.html?a=${a.slug}">${a.name}</a>`).join("")}</div>
<div><h3>Explore</h3><a href="index.html#search">The collection</a><a href="calculator.html">Calculator</a><a href="index.html#agent">About Aurelia</a><a href="index.html#contact">Contact</a></div>
<div><h3>Visit</h3><p>${A.addr}</p><a href="tel:${A.phone}">${A.phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, "$1 ($2) $3-$4")}</a><a href="sms:${A.phone}">Text us</a></div></div>
<div class="ft-name" aria-hidden="true">Aurelia Vance</div>
<div class="ft-base"><span>© 2026 ${A.name} · DRE #${A.dre}</span><span>Equal Housing Opportunity</span><a href="#top" onclick="scrollTo({top:0,behavior:'smooth'});return false">Back to top</a></div></footer>
<div class="dock" aria-label="Contact"><a href="tel:${A.phone}" aria-label="Call">${I.phone}</a><a href="sms:${A.phone}" aria-label="Text">${I.msg}</a><a href="https://wa.me/${A.wa}" rel="noopener" aria-label="WhatsApp">${I.wa}</a></div>`;
{
  const nav = $("#nav"),
    mb = $(".menu");
  const setMenu = (o) => {
    nav.classList.toggle("open", o);
    mb.setAttribute("aria-expanded", o);
    document.body.style.overflow = o ? "hidden" : "";
    window.lenis && (o ? lenis.stop() : lenis.start());
  };
  mb.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener(
    "click",
    (e) => e.target.closest("nav a") && setMenu(false),
  );
}
addEventListener(
  "scroll",
  () => {
    $("#nav").classList.toggle("solid", scrollY > 60);
    document.body.classList.toggle("scrolled", scrollY > 200);
  },
  { passive: true },
);
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || a.target || e.metaKey || e.ctrlKey) return;
  const href = a.getAttribute("href");
  if (/^(tel|sms|mailto|http)/.test(href)) return;
  if (href.startsWith("#") || (a.pathname === location.pathname && a.hash)) {
    // same-page section link
    const t = $(a.hash || href);
    if (!t) return;
    e.preventDefault();
    window.lenis
      ? lenis.scrollTo(t, { offset: -70 })
      : t.scrollIntoView({ behavior: "smooth" });
    return;
  }
  e.preventDefault();
  document.body.classList.add("leaving");
  setTimeout(() => (location.href = a.href), 320); // page transition
});
addEventListener("pageshow", () => document.body.classList.remove("leaving"));

/* ---- Components ---- */
const card = (
  p,
) => `<a class="card rv" href="property.html?id=${p.id}"><div class="ph"><img loading="lazy" width="520" height="650" src="${u(p.img, 520, 650)}" srcset="${u(p.img, 520, 650)} 520w, ${u(p.img, 900, 1125)} 900w" sizes="(min-width:900px) 380px, 90vw" alt="${p.title}"><span class="chip">${p.type}</span></div>
<span class="price">${M(p.price)}</span><h3>${p.title}</h3><div class="meta"><span>${I.pin} ${p.area}</span><span>${I.bed} ${p.beds}</span><span>${I.bath} ${p.baths}</span><span>${I.sq} ${p.sqft.toLocaleString()} sf</span></div></a>`;

const leadForm = (
  ctx = {},
) => `<form class="form" id="lead" novalidate><h3>Request a private ${ctx.prop ? "showing" : "consultation"}</h3>
<label>Name<input name="name" autocomplete="name" required></label><label>Email<input name="email" type="email" autocomplete="email" required></label>
<label>Phone<input name="phone" type="tel" autocomplete="tel"></label>
<label>Area<select name="area">${AR.map((a) => `<option ${a.name === ctx.area ? "selected" : ""}>${a.name}</option>`).join("")}</select></label>
<label>Message<textarea name="message" rows="3">${ctx.prop ? "I'd like to see " + ctx.prop + "." : ""}</textarea></label>
<input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn" type="submit">Send request</button>
<div class="row" style="margin:0"><a class="btn line" href="tel:${A.phone}">${I.phone} Call</a><a class="btn line" href="sms:${A.phone}">${I.msg} Text</a><a class="btn line" href="https://wa.me/${A.wa}">${I.wa} WhatsApp</a></div><p class="status" id="status" role="status"></p></form>`;

const calcHTML = (
  price,
) => `<form class="calc" id="calc"><label>Price <output id="o1"></output><input type="range" name="price" min="1000000" max="25000000" step="250000" value="${price}"></label>
<label>Down payment <output id="o2"></output><input type="range" name="down" min="10" max="60" step="5" value="25"></label>
<label>Interest rate <output id="o3"></output><input type="range" name="rate" min="4" max="9" step="0.125" value="6.5"></label>
<div class="result"><span>Estimated monthly</span><strong id="monthly"></strong></div></form>`;
function calc() {
  const f = Object.fromEntries(new FormData($("#calc"))),
    price = +f.price,
    r = +f.rate / 1200;
  const loan = price * (1 - f.down / 100),
    pi = (loan * r) / (1 - Math.pow(1 + r, -360));
  $("#o1").textContent = money(price);
  $("#o2").textContent = f.down + "%";
  $("#o3").textContent = (+f.rate).toFixed(3) + "%";
  $("#monthly").textContent = money(pi + (price * 0.0147) / 12); // + CA tax & insurance estimate
}
const map = (q) =>
  `<iframe title="Map of ${q}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed"></iframe>`;

const CRM_ENDPOINT = null; // Follow Up Boss / HubSpot / Zapier webhook URL
function mount() {
  const lm = $("#lead-mount");
  if (lm) lm.innerHTML = leadForm(window.CTX || {});
  const cm = $("#calc-mount");
  if (cm) {
    cm.innerHTML = calcHTML((window.CTX || {}).price || 6e6);
    $("#calc").addEventListener("input", calc);
    calc();
  }
  const f = $("#lead");
  if (!f) return;
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)),
      s = $("#status");
    if (d.company) return;
    if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email)) {
      s.textContent = "Enter your name and a valid email.";
      return;
    }
    const body = {
      ...d,
      page: location.href,
      utm: Object.fromEntries(qs),
      listing: (window.CTX || {}).prop || null,
      at: new Date().toISOString(),
    };
    try {
      CRM_ENDPOINT
        ? await fetch(CRM_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : console.info("Lead", body);
      s.textContent = "Received. Aurelia replies within one business hour.";
      f.reset();
    } catch {
      s.textContent = "Could not send. Please call or text instead.";
    }
  });
}
function seo(title, desc, ld) {
  document.title = title;
  $("meta[name=description]").content = desc;
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(ld);
  document.head.append(s);
}

/* ---- Pages ---- */
const page = document.body.dataset.page;
if (page === "home") {
  window.CTX = { area: "Beverly Hills" };
  mount();
}
if (page === "property") {
  const p = L.find((x) => x.id === qs.get("id")) || L[0];
  $("#crumb").innerHTML =
    `<a href="index.html">Homes</a> / <a href="area.html?a=${slug(p.area)}">${p.area}</a> / ${p.title}`;
  $("#gallery").innerHTML = [p.img, ...INT]
    .map(
      (id, i) =>
        `<div class="ph rv-clip"><img ${i ? 'loading="lazy"' : 'fetchpriority="high"'} width="${i ? 640 : 1200}" height="${i ? 480 : 675}" src="${u(id, i ? 640 : 1200, i ? 480 : 675)}" srcset="${u(id, i ? 640 : 900, i ? 480 : 506)} 640w, ${u(id, i ? 1000 : 1600, i ? 750 : 900)} 1200w" sizes="(min-width:900px) 60vw, 100vw" alt="${p.title}, view ${i + 1}"></div>`,
    )
    .join("");
  $("#info").innerHTML =
    `<h1 style="font-size:clamp(1.6rem,4vw,2.6rem)">${p.title}</h1><p>${I.pin} ${p.addr}, ${p.area}, CA</p><p class="price" style="font-size:1.8rem;margin-top:.6rem">${money(p.price * 1e6)}</p>
  <div class="specs"><div><b>${p.beds}</b>Bedrooms</div><div><b>${p.baths}</b>Bathrooms</div><div><b>${p.sqft.toLocaleString()}</b>Sq ft</div><div><b>${p.type}</b>Style</div></div>
  <p>${p.desc}</p><ul class="feats">${p.feats.map((f) => `<li>${f}</li>`).join("")}</ul>`;
  window.CTX = { area: p.area, prop: p.title, price: p.price * 1e6 };
  mount();
  $("#map-mount").innerHTML = map(`${p.addr}, ${p.area}, CA`);
  seo(
    `${p.title}, ${p.area} | ${money(p.price * 1e6)} | Aurelia Vance`,
    p.desc,
    {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: p.title,
      description: p.desc,
      url: location.href,
      image: u(p.img, 1200, 675),
      offers: { "@type": "Offer", price: p.price * 1e6, priceCurrency: "USD" },
      about: {
        "@type": "SingleFamilyResidence",
        numberOfBedrooms: p.beds,
        numberOfBathroomsTotal: p.baths,
        floorSize: {
          "@type": "QuantitativeValue",
          value: p.sqft,
          unitCode: "FTK",
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: p.addr,
          addressLocality: p.area,
          addressRegion: "CA",
        },
      },
    },
  );
}
if (page === "area") {
  const a = AR.find((x) => x.slug === qs.get("a")) || AR[0],
    list = L.filter((p) => p.area === a.name);
  $("#area-head").innerHTML =
    `<p class="crumb"><a href="index.html">Home</a> / ${a.name}</p><h1 style="font-size:clamp(1.8rem,5vw,3.6rem)">Luxury homes for sale in ${a.name}</h1><p style="margin-top:1rem">${a.blurb}</p><div class="facts">${a.facts.map((f) => `<span>${f}</span>`).join("")}</div>`;
  $("#area-img").innerHTML =
    `<img width="900" height="1125" src="${u(a.img, 900, 1125)}" alt="${a.name} luxury home">`;
  $("#area-grid").innerHTML = list.map(card).join("");
  $("#area-title").textContent = `${list.length} homes in ${a.name}`;
  $("#map-mount").innerHTML = map(`${a.name}, CA`);
  window.CTX = { area: a.name };
  mount();
  seo(
    `Luxury Homes for Sale in ${a.name}, CA | Aurelia Vance`,
    `Browse luxury homes in ${a.name}. ${a.blurb}`,
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Luxury homes in ${a.name}`,
      about: { "@type": "Place", name: a.name },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: list.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: new URL(`property.html?id=${p.id}`, location.href).href,
          name: p.title,
        })),
      },
    },
  );
}

/* ---- Smooth scroll (Lenis only; nothing depends on it) ---- */
if (window.Lenis && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const lenis = (window.lenis = new Lenis({ lerp: 0.09 }));
  const raf = (t) => {
    lenis.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

/* ---- Scroll reveals. Content stays visible if this never runs ---- */
let revealIO;
const reveal = () => {
  if (!("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("rv-on");
  revealIO =
    revealIO ||
    new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            revealIO.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -6% 0px" },
    );
  $$(".rv:not(.in),.rv-clip:not(.in)").forEach((el) => revealIO.observe(el));
};
reveal();
