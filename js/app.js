/* ============================================================
   PDF.tools — app core: router, layout, helpers, UI state
   ============================================================ */
(function () {
  "use strict";

  // ---- Tiny SPA router (hash based) ----
  const app = document.getElementById("app");
  const topNav = document.getElementById("topNav");
  const footerNav = document.getElementById("footerNav");
  document.getElementById("year").textContent = new Date().getFullYear();

  // Tool registry (filled by tools.js via window.PDFT.register)
  const tools = {};
  const order = [];

  window.PDFT = {
    register(id, cfg) {
      tools[id] = cfg;
      order.push(id);
    },
    tools,
    order,
    // utilities exposed to tools.js
    ui: { renderTool, goHome, toast, showLoading, hideLoading, handleError, el }
  };

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function goHome() { location.hash = "#/"; }

  function toast(msg, type) {
    const wrap = el("div", { class: "toast-wrap" });
    if (!document.querySelector(".toast-wrap")) document.body.appendChild(wrap);
    const t = el("div", { class: "toast " + (type || "") }, msg);
    document.querySelector(".toast-wrap").appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, 2600);
    setTimeout(() => t.remove(), 3000);
  }

  function showLoading(msg) {
    let ov = document.querySelector(".loading-overlay");
    if (!ov) {
      ov = el("div", { class: "loading-overlay" });
      ov.appendChild(el("div", { class: "spinner" }));
      ov.appendChild(el("p", {}, msg || "Working..."));
      document.body.appendChild(ov);
    }
    ov.querySelector("p").textContent = msg || "Working...";
    ov.classList.add("show");
  }
  function hideLoading() {
    const ov = document.querySelector(".loading-overlay");
    if (ov) ov.classList.remove("show");
  }

  function handleError(err, box) {
    console.error(err);
    hideLoading();
    const msg = (err && err.message) ? err.message : "Something went wrong. Please try a different file.";
    if (box) { box.textContent = "⚠ " + msg; box.classList.add("show"); }
    else toast(msg, "error");
  }

  // ---- Build navigation ----
  function buildNav() {
    topNav.innerHTML = "";
    footerNav.innerHTML = "";
    order.forEach(id => {
      const t = tools[id];
      const a = el("a", { href: "#/tool/" + id }, t.title.split(" ")[0]);
      topNav.appendChild(a);
      const fa = el("a", { href: "#/tool/" + id }, t.title);
      footerNav.appendChild(fa);
    });
  }

  // ---- Category metadata ----
  const categories = {
    pdf:    { label: "PDF",       icon: "\u{1F4D5}" },
    image:  { label: "Image",     icon: "\u{1F5BC}\uFE0F" },
    text:   { label: "Text",      icon: "\u{1F4DD}" },
    dev:    { label: "Developer", icon: "\u{2699}\uFE0F" }
  };
  window.PDFT.categories = categories;

  function faq(q, a) {
    const d = el("details", {},
      el("summary", {}, q),
      el("p", {}, a)
    );
    d.setAttribute("itemscope", "");
    d.setAttribute("itemtype", "https://schema.org/Question");
    return d;
  }

  // ---- Home page ----
  function renderHome() {
    app.innerHTML = "";
    const hero = el("section", { class: "hero" },
      el("h1", { html: 'Every <span class="grad">free tool</span> you need' }),
      el("p", { class: "sub" }, "PDF, image, text and developer tools that run entirely in your browser. Free, fast and 100% private - your files never leave your device."),
      el("div", { class: "badges" },
        el("span", { class: "badge" }, "\u{1F512} 100% private"),
        el("span", { class: "badge" }, "\u26A1 No sign-up"),
        el("span", { class: "badge" }, "\u2728 20+ tools"),
        el("span", { class: "badge" }, "\u{1F4B8} Free forever")
      ),
      el("div", { class: "trust" },
        el("span", {}, "\u{1F4E6} No upload to servers"),
        el("span", {}, "\u{1F5A5}\uFE0F Works offline after load"),
        el("span", {}, "\u{1F30D} Used worldwide")
      )
    );
    app.appendChild(hero);

    // group tools by category
    const byCat = {};
    order.forEach(id => {
      const t = tools[id];
      const cat = t.category || "other";
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(id);
    });
    const catOrder = ["pdf", "image", "text", "dev", "other"];
    catOrder.forEach(cat => {
      if (!byCat[cat]) return;
      const meta = categories[cat] || { label: cat, icon: "\u{1F9F0}" };
      app.appendChild(el("h2", { class: "section-title" }, meta.icon + " " + meta.label + " tools"));
      const grid = el("div", { class: "tool-grid" });
      byCat[cat].forEach(id => {
        const t = tools[id];
        grid.appendChild(el("div", { class: "tool-card", onclick: () => { location.hash = "#/tool/" + id; } },
          el("div", { class: "ico" }, t.icon),
          el("h3", {}, t.title),
          el("p", {}, t.desc),
          el("div", { class: "arrow" }, "\u2192")
        ));
      });
      app.appendChild(grid);
    });

    app.appendChild(el("section", { class: "faq" },
      el("h2", { class: "section-title" }, "Frequently asked questions"),
      faq("Is it really free?", "Yes. Every tool here is completely free with no limits on the number of files or uses. We are supported by optional donations and unobtrusive ads."),
      faq("Are my files uploaded to a server?", "No. All processing happens locally in your browser using JavaScript. Your files never leave your device, which makes these tools safe for confidential documents."),
      faq("Do I need to install anything?", "No installation required. Just open a tool in any modern browser (Chrome, Firefox, Safari, Edge) and you are ready to go. It works on your phone too."),
      faq("Does it work on mobile?", "Yes. The tools are fully responsive and work on iOS and Android devices."),
      faq("Can I use this offline?", "Once the page is loaded, processing works without an internet connection because everything runs in your browser.")
    ));
  }

  // ---- Tool workspace shell ----
  function renderTool(id) {
    const t = tools[id];
    if (!t) { renderHome(); return; }
    app.innerHTML = "";
    const view = el("div", { class: "tool-view" });
    view.appendChild(el("div", { class: "tool-head" },
      el("a", { class: "back", href: "#/", onclick: (e) => { e.preventDefault(); goHome(); } }, "← All tools"),
    ));
    view.appendChild(el("h1", {}, t.icon + " " + t.title));
    view.appendChild(el("p", { class: "tool-lead" }, t.longDesc || t.desc));

    const errorBox = el("div", { class: "error-box" });
    const progress = el("div", { class: "progress" }, el("div", { class: "bar" }));
    const resultBox = el("div", { class: "result-box" });

    const workspace = el("div", { class: "workspace" });
    view.appendChild(workspace);
    view.appendChild(progress);
    view.appendChild(resultBox);
    view.appendChild(errorBox);

    app.appendChild(view);

    // hand control to the tool's render function
    t.render({
      workspace, progress, resultBox, errorBox,
      setProgress(pct) { progress.classList.add("show"); progress.querySelector(".bar").style.width = pct + "%"; },
      reset() { progress.classList.remove("show"); progress.querySelector(".bar").style.width = "0%"; resultBox.classList.remove("show"); errorBox.classList.remove("show"); },
      success(filename, blob, label, note) {
        progress.classList.remove("show");
        const url = URL.createObjectURL(blob);
        resultBox.innerHTML = "";
        resultBox.appendChild(el("div", { class: "ico" }, "✅"));
        resultBox.appendChild(el("h3", {}, label || "Done! Your file is ready"));
        if (note) resultBox.appendChild(el("p", { class: "muted" }, note));
        const dl = el("a", { class: "btn btn-primary btn-lg", href: url, download: filename }, "⬇ Download " + filename);
        resultBox.appendChild(dl);
        resultBox.classList.add("show");
        resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("File ready! 🎉", "success");
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---- Modal (pro / etc) ----
  window.PDFT.openProModal = function () {
    let m = document.querySelector(".modal");
    if (!m) {
      m = el("div", { class: "modal", onclick: (e) => { if (e.target === m) m.classList.remove("show"); } });
      const card = el("div", { class: "modal-card" });
      card.appendChild(el("div", { class: "ico", style: "font-size:40px" }, "⚡"));
      card.appendChild(el("h2", {}, "Go Pro"));
      card.appendChild(el("p", { class: "muted" }, "Unlock advanced tools and support development."));
      card.appendChild(el("div", { class: "price" }, "$9", el("small", {}, " one-time")));
      card.appendChild(el("ul", {},
        proLi("Unlock all advanced tools"),
        proLi("Priority processing queue"),
        proLi("No ads, forever"),
        proLi("Support independent development")
      ));
      // Replace this href with your Gumroad / Stripe / Lemon Squeezy link
      const buy = el("a", { class: "btn btn-primary btn-lg btn-block", href: "https://YOUR-GUMROAD-OR-STRIPE-LINK.com", target: "_blank", rel: "noopener" }, "Get Pro →");
      card.appendChild(buy);
      card.appendChild(el("p", { class: "muted", style: "margin-top:12px;font-size:12px" }, "One-time payment · Instant access · 30-day refund"));
      m.appendChild(card);
      document.body.appendChild(m);
    }
    m.classList.add("show");
  };
  function proLi(text) { return el("li", {}, el("span", { class: "feat" }, "✓"), text); }

  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "proCta") { e.preventDefault(); window.PDFT.openProModal(); }
  });

  // ---- Router ----
  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    // highlight nav
    document.querySelectorAll(".top-nav a").forEach(a => a.classList.remove("active"));
    if (hash.indexOf("tool/") === 0) {
      const id = hash.split("/")[1];
      document.querySelectorAll(".top-nav a").forEach(a => { if (a.getAttribute("href") === location.hash) a.classList.add("active"); });
      renderTool(id);
    } else {
      renderHome();
    }
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("load", () => { buildNav(); route(); });
})();
