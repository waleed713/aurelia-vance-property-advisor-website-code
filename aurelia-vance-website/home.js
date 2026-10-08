/* Home page: collection index, neighborhoods, and all scroll choreography. Runs after main.js */
(() => {
  if (document.body.dataset.page !== "home") return;
  const motion =
    window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Hero video ----
     Put your video in the "video" folder next to index.html and name it hero.mp4.
     Optional: hero-mobile.mp4 (lighter file for phones), hero.webm, hero-poster.jpg. Change names here if you like. */
  const HERO = {
    mp4: "video/hero.mp4",
    mobile: "video/hero-mobile.mp4",
    webm: "video/hero.webm",
  };
  const hv = $(".h-video"),
    pb = $(".h-pause"),
    note = $(".h-note");
  if (hv) {
    const canMp4 = !!hv.canPlayType('video/mp4; codecs="avc1.640028"'),
      canWebm = !!hv.canPlayType('video/webm; codecs="vp9"');
    const phone = matchMedia("(max-width: 700px)").matches,
      mp4s = phone ? [HERO.mobile, HERO.mp4] : [HERO.mp4];
    // each file is tried in its folder first, then next to index.html
    const list = (
      canWebm && !canMp4 ? [HERO.webm, ...mp4s] : [...mp4s, HERO.webm]
    ).flatMap((f) => [f, f.split("/").pop()]);
    let k = 0,
      userPaused = false;
    const next = () => {
      if (k < list.length) {
        hv.src = list[k++];
        hv.load();
        hv.play().catch(() => {});
        return;
      }
      const c = hv.error ? hv.error.code : 0;
      console.error(
        "Hero video failed to load. Tried:",
        list.join(", "),
        "error code",
        c,
      );
      note.hidden = false;
      note.textContent = `Hero video not found (code ${c}). Put your video at ${HERO.mp4} (a "video" folder next to index.html).`;
    };
    const ICON = {
      pause: ic('<path d="M9 5v14M15 5v14"/>'),
      play: ic('<path d="M8 5l11 7-11 7z"/>'),
    };
    const sync = () => {
      const on = !hv.paused;
      pb.innerHTML = on ? ICON.pause : ICON.play;
      pb.setAttribute(
        "aria-label",
        on ? "Pause background video" : "Play background video",
      );
    };
    hv.muted = true;
    hv.defaultMuted = true;
    hv.playsInline = true;
    hv.addEventListener("error", next);
    hv.addEventListener("play", sync);
    hv.addEventListener("pause", sync);
    hv.addEventListener("playing", () => (note.hidden = true));
    pb.addEventListener("click", () => {
      if (hv.error || !hv.src) {
        k = 0;
        note.hidden = true;
        return next();
      }
      userPaused = !hv.paused;
      hv.paused ? hv.play().catch(next) : hv.pause();
    });
    // if the browser blocks autoplay, start on the first touch, key or scroll
    ["pointerdown", "touchstart", "keydown", "wheel", "scroll"].forEach((ev) =>
      addEventListener(
        ev,
        () =>
          hv.paused && !userPaused && !hv.error && hv.play().catch(() => {}),
        { once: true, passive: true },
      ),
    );
    sync();
    next();
  }

  /* ---- Collection: filter chips, sort, saved homes, bento cards ---- */
  const ix = $("#ix"),
    S = {
      area: "",
      type: "",
      beds: 0,
      price: "",
      sort: "featured",
      saved: false,
    };
  let fav = [];
  try {
    fav = JSON.parse(localStorage.getItem("fav") || "[]");
  } catch {}
  const keepFav = () => {
    try {
      localStorage.setItem("fav", JSON.stringify(fav));
    } catch {}
  };
  const G = [
    ["Area", "area", [["", "All"], ...AR.map((a) => [a.name, a.name])]],
    [
      "Style",
      "type",
      [
        ["", "Any"],
        ["Estate", "Estate"],
        ["Modern", "Modern"],
        ["Beachfront", "Beachfront"],
      ],
    ],
    [
      "Bedrooms",
      "beds",
      [
        [0, "Any"],
        [4, "4+"],
        [6, "6+"],
      ],
    ],
    [
      "Budget",
      "price",
      [
        ["", "Any"],
        ["5", "$5M"],
        ["10", "$10M"],
        ["20", "$20M"],
      ],
    ],
  ];
  const heart = ic(
    '<path d="M12 20.5C5.5 15.8 3.5 12.5 3.5 9.5a4.2 4.2 0 0 1 8.5-1.7 4.2 4.2 0 0 1 8.5 1.7c0 3-2 6.3-8.5 11z"/>',
  );
  const chips = () =>
    ($("#chips").innerHTML =
      G.map(
        ([l, k, o]) =>
          `<div class="cg"><span>${l}</span><div>${o.map(([v, n]) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${String(S[k]) === String(v)}">${n}</button>`).join("")}</div></div>`,
      ).join("") +
      `<div class="cg"><span>Saved</span><div><button type="button" data-k="saved" aria-pressed="${S.saved}">${fav.length} saved</button></div></div>`);
  const cc = (
    p,
  ) => `<article class="cc"><img loading="lazy" width="900" height="900" src="${u(p.img, 900, 900)}" srcset="${u(p.img, 600, 750)} 600w, ${u(p.img, 1200, 1000)} 1200w" sizes="(min-width:900px) 45vw, 100vw" alt="${p.title}">
    <div class="cc-top"><span class="cc-tag">${p.type}</span></div>
    <a class="cc-in" href="property.html?id=${p.id}"><span class="cc-area">${p.area}</span><h3>${p.title}</h3><span class="cc-price">${M(p.price)}</span><span class="cc-meta">${p.beds} bd · ${p.baths} ba · ${p.sqft.toLocaleString()} sf</span><span class="cc-go">View home</span></a>
    <button class="fav" type="button" data-id="${p.id}" aria-pressed="${fav.includes(p.id)}" aria-label="Save ${p.title}">${heart}</button></article>`;
  const render = (animate) => {
    let out = L.filter(
      (p) =>
        (!S.area || p.area === S.area) &&
        (!S.type || p.type === S.type) &&
        (!S.price || p.price <= +S.price) &&
        p.beds >= S.beds &&
        (!S.saved || fav.includes(p.id)),
    );
    if (S.sort === "low") out = [...out].sort((a, b) => a.price - b.price);
    if (S.sort === "high") out = [...out].sort((a, b) => b.price - a.price);
    if (S.sort === "beds") out = [...out].sort((a, b) => b.beds - a.beds);
    $("#count").textContent =
      `${out.length} ${out.length === 1 ? "home" : "homes"}`;
    ix.innerHTML = out.length
      ? out.map(cc).join("")
      : `<p class="none">No homes match these filters. <button type="button" id="reset">Reset filters</button></p>`;
    chips();
    if (animate && motion)
      gsap.from(".cc", {
        opacity: 0,
        y: 30,
        stagger: 0.07,
        duration: 0.7,
        ease: "power3.out",
        clearProps: "all",
      });
  };
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const k = b.dataset.k;
    if (k === "saved") S.saved = !S.saved;
    else S[k] = k === "beds" ? +b.dataset.v : b.dataset.v;
    render(true);
  });
  $("#sort").addEventListener("change", (e) => {
    S.sort = e.target.value;
    render(true);
  });
  ix.addEventListener("click", (e) => {
    const f = e.target.closest(".fav");
    if (f) {
      const id = f.dataset.id;
      fav = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id];
      keepFav();
      f.setAttribute("aria-pressed", fav.includes(id));
      chips();
      return;
    }
    if (e.target.id === "reset")
      (Object.assign(S, {
        area: "",
        type: "",
        beds: 0,
        price: "",
        saved: false,
      }),
        render(true));
  });
  render();
  $("#quick").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    S.area = d.get("area") || "";
    S.price = d.get("price") || "";
    render(true);
    window.lenis
      ? lenis.scrollTo("#search", { offset: -70 })
      : $("#search").scrollIntoView({ behavior: "smooth" });
  });

  /* ---- Neighborhoods: sticky image stage + scroll chapters ---- */
  {
    const count = (ar) => L.filter((p) => p.area === ar.name).length;
    $("#nb-stage-imgs").innerHTML = AR.map(
      (a, i) =>
        `<div class="nb-img${i ? "" : " on"}" style="z-index:${i + 1}"><img ${i ? 'loading="lazy"' : ""} width="1000" height="1250" src="${u(a.img, 1000, 1250)}" alt=""></div>`,
    ).join("");
    $("#nb-chapters").innerHTML = AR.map(
      (
        a,
        i,
      ) => `<article class="nb-ch" data-i="${i}" data-n="0${i + 1}"><figure class="nb-fig"><img loading="lazy" width="900" height="720" src="${u(a.img, 900, 720)}" alt="${a.name} luxury homes"></figure><p class="nb-coord">${a.coord}</p><h3>${a.name}</h3><p class="nb-blurb">${a.blurb}</p>
      <dl class="nb-facts"><div><dt>Median price</dt><dd>${a.median}</dd></div><div><dt>Homes available</dt><dd>${count(a)}</dd></div><div><dt>Known for</dt><dd>${a.known}</dd></div></dl><a class="nb-link" href="area.html?a=${a.slug}">Explore ${a.name}</a></article>`,
    ).join("");
    const imgs = $$(".nb-img"),
      chs = $$(".nb-ch");
    const setActive = (i) => {
      imgs.forEach((el, k) => el.classList.toggle("on", k <= i));
      chs.forEach((el, k) => el.classList.toggle("active", k === i));
      $("#nb-n").textContent = "0" + (i + 1);
      $("#nb-cap").innerHTML =
        `<b>${AR[i].name}</b><span>Median ${AR[i].median}</span>`;
      $("#nb-bar").style.transform = `scaleY(${(i + 1) / AR.length})`;
    };
    setActive(0);
    if ("IntersectionObserver" in window) {
      document.documentElement.classList.add("rv-on");
      const mid = new IntersectionObserver(
        (es) =>
          es.forEach((e) => e.isIntersecting && setActive(+e.target.dataset.i)),
        { rootMargin: "-45% 0px -45% 0px" },
      );
      const show = new IntersectionObserver(
        (es) =>
          es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
        { threshold: 0.12 },
      );
      chs.forEach((c) => {
        mid.observe(c);
        show.observe(c);
      });
    } else chs.forEach((c) => c.classList.add("in"));
  }

  /* ---- Scrubbed statement: split into words ---- */
  const sc = $(".scrub");
  sc.innerHTML = sc.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`)
    .join(" ");

  /* ---- Scroll-linked effects: plain JS, no plugins, so nothing can stay hidden ---- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const words = $$(".w"),
    stmt = $(".stmt"),
    track = $(".xp-track"),
    xp = $(".xp"),
    xpImg = $(".xp-img"),
    xpPic = $(".xp-img img"),
    stats = $$(".xp-stats > div"),
    nums = $$(".xp-stats [data-n]"),
    cards = $$(".st");
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)),
    out = (t) => 1 - Math.pow(1 - t, 3);
  const frame = () => {
    const vh = innerHeight;
    const r = stmt.getBoundingClientRect(),
      lead =
        (reduce ? 1 : clamp((vh * 0.8 - r.top) / (r.height + vh * 0.1))) *
        (words.length + 8);
    words.forEach(
      (w, i) => (w.style.opacity = 0.16 + 0.84 * clamp((lead - i) / 8)),
    );
    const t = track.getBoundingClientRect(),
      p = reduce ? 1 : clamp(-t.top / Math.max(t.height - xp.offsetHeight, 1)),
      e = out(clamp(p / 0.6));
    xpImg.style.clipPath = `inset(${16 * (1 - e)}% ${30 * (1 - e)}% ${16 * (1 - e)}% ${30 * (1 - e)}%)`;
    xpPic.style.transform = `scale(${1 + 0.35 * (1 - e)})`;
    stats.forEach((s, i) => {
      const o = clamp((p - 0.45 - i * 0.08) / 0.2);
      s.style.opacity = o;
      s.style.transform = `translateY(${40 * (1 - o)}px)`;
    });
    nums.forEach((n) => {
      const v = +n.dataset.n * clamp((p - 0.35) / 0.5);
      n.textContent =
        (n.dataset.pre || "") + v.toFixed(+n.dataset.d) + (n.dataset.suf || "");
    });
    if (!reduce)
      cards.forEach((c, i) => {
        if (i === cards.length - 1) return;
        const nx = cards[i + 1],
          q = clamp(
            (vh - nx.getBoundingClientRect().top) /
              (vh - (parseFloat(getComputedStyle(nx).top) || 0)),
          );
        c.style.transform = `scale(${1 - 0.06 * q})`;
      });
  };
  let queued = false;
  const tick = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        frame();
      });
    }
  };
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick);
  addEventListener("load", tick);
  frame();

  if (!motion) {
    $(".pre") && $(".pre").remove();
    return;
  }

  /* ---- Intro: preloader curtain, then hero ---- */
  $$(".h-in h1 span").forEach(
    (s) =>
      (s.innerHTML = `<i style="display:block;font-style:normal">${s.textContent}</i>`),
  );
  window.lenis && lenis.stop();
  const endIntro = () => {
    const p = $(".pre");
    if (p) p.remove();
    window.lenis && lenis.start();
  };
  setTimeout(endIntro, 7000); // safety: never leave the curtain up
  gsap
    .timeline({ defaults: { ease: "power4.out" }, onComplete: endIntro })
    .to(".pre i", { scaleX: 1, duration: 1, ease: "power2.inOut" })
    .to(".pre-logo", { opacity: 0, y: -16, duration: 0.4 })
    .to(".pre", { yPercent: -100, duration: 1.1, ease: "power4.inOut" })
    .from(".h-video", { scale: 1.12, duration: 2.2 }, "<")
    .from(
      ".h-in h1 i",
      { yPercent: 110, stagger: 0.12, duration: 1.2 },
      "<0.35",
    )
    .from(
      [".h-in p", ".h-bar"],
      { opacity: 0, y: 30, stagger: 0.15, duration: 1 },
      "<0.5",
    );
})();
