/* PDF.tools - tool implementations (pdf-lib + pdf.js) */
(function () {
  "use strict";
  const { register, ui } = window.PDFT;
  const { el, showLoading, hideLoading, handleError, toast } = ui;
  const PDFLib = window.PDFLib || window["pdf-lib"];
  const pdfjs = window.pdfjsLib;

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  }
  function fnameNoExt(name) { return name.replace(/\.[^.]+$/, ""); }
  function isPdf(file) { return file.type === "application/pdf" || /\.pdf$/i.test(file.name); }
  function isImage(file) { return /^image\/(png|jpe?g|webp|bmp)$/i.test(file.type) || /\.(png|jpe?g|webp|bmp)$/i.test(file.name); }
  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function makeDropzone(opts) {
    const input = el("input", { type: "file", accept: opts.accept, multiple: opts.multiple !== false });
    const dz = el("div", { class: "dropzone", onclick: () => input.click() },
      el("div", { class: "ico-big" }, opts.icon || "📄"),
      el("h3", {}, opts.title || "Drop files here or click to browse"),
      el("p", {}, opts.hint || "Your files are processed locally and never uploaded.")
    );
    input.addEventListener("change", () => { if (input.files.length) opts.onFiles(Array.from(input.files)); });
    ["dragenter", "dragover"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("drag"); }));
    ["dragleave", "drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("drag"); }));
    dz.addEventListener("drop", e => {
      const files = Array.from(e.dataTransfer.files).filter(f => opts.filter ? opts.filter(f) : true);
      if (files.length) opts.onFiles(files);
    });
    dz.appendChild(input);
    return dz;
  }

  function renderPageToCanvas(pdfDoc, pageNum, scale) {
    return pdfDoc.getPage(pageNum).then(page => {
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      return page.render({ canvasContext: ctx, viewport }).promise.then(() => canvas);
    });
  }

  // 1) MERGE PDF
  register("merge", {
    title: "Merge PDF", icon: "🔗", category: "pdf",
    desc: "Combine multiple PDFs into one, in any order.",
    longDesc: "Combine two or more PDF files into a single document. Reorder files with the up/down buttons.",
    render(ctx) {
      let files = [];
      const listWrap = el("div");
      const dz = makeDropzone({
        accept: "application/pdf", icon: "🔗",
        title: "Drop PDF files here or click to browse",
        hint: "Add 2 or more PDFs to combine. Use arrows to reorder.",
        filter: isPdf,
        onFiles(fs) { files = files.concat(fs); draw(); }
      });
      const btnRow = el("div", { class: "row mt", style: "display:none" });
      ctx.workspace.appendChild(dz);
      ctx.workspace.appendChild(listWrap);
      ctx.workspace.appendChild(btnRow);

      function draw() {
        listWrap.innerHTML = ""; btnRow.innerHTML = "";
        btnRow.style.display = files.length ? "flex" : "none";
        if (!files.length) return;
        const list = el("div", { class: "file-list" });
        files.forEach((f, i) => {
          list.appendChild(el("div", { class: "file-row" },
            el("div", { class: "thumb" }, "📄"),
            el("div", { class: "meta" },
              el("div", { class: "name" }, (i + 1) + ". " + f.name),
              el("div", { class: "info" }, fmtSize(f.size))
            ),
            el("div", { class: "actions" },
              el("button", { class: "icon-btn move-btn", title: "Move up", onclick: () => move(i, -1) }, "▲"),
              el("button", { class: "icon-btn move-btn", title: "Move down", onclick: () => move(i, 1) }, "▼"),
              el("button", { class: "icon-btn", title: "Remove", onclick: () => remove(i) }, "✕")
            )
          ));
        });
        listWrap.appendChild(list);
        btnRow.appendChild(el("button", { class: "btn btn-primary btn-lg", onclick: run }, "🔗 Merge " + files.length + " files"));
        btnRow.appendChild(el("button", { class: "btn btn-ghost", onclick: () => { files = []; draw(); } }, "Clear"));
      }
      function move(i, dir) { const j = i + dir; if (j < 0 || j >= files.length) return; [files[i], files[j]] = [files[j], files[i]]; draw(); }
      function remove(i) { files.splice(i, 1); draw(); }

      async function run() {
        ctx.reset();
        if (files.length < 2) { toast("Add at least 2 PDFs to merge.", "error"); return; }
        try {
          showLoading("Merging PDFs...");
          const out = await PDFLib.PDFDocument.create();
          for (let i = 0; i < files.length; i++) {
            ctx.setProgress(Math.round((i / files.length) * 90));
            const bytes = await files[i].arrayBuffer();
            const src = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            const pages = await out.copyPages(src, src.getPageIndices());
            pages.forEach(p => out.addPage(p));
          }
          ctx.setProgress(95);
          const merged = await out.save();
          ctx.success("merged.pdf", new Blob([merged], { type: "application/pdf" }), "Merged PDF ready!", files.length + " files combined.");
        } catch (err) { handleError(err, ctx.errorBox); }
        finally { hideLoading(); }
      }
      draw();
    }
  });

  function parseRanges(raw, total) {
    if (!raw) { const a = []; for (let i = 0; i < total; i++) a.push(i); return a; }
    const set = new Set();
    raw.split(",").forEach(part => {
      part = part.trim();
      const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) { let a = +m[1], b = +m[2]; if (a > b) [a, b] = [b, a]; for (let i = a; i <= b; i++) { if (i >= 1 && i <= total) set.add(i - 1); } }
      else if (/^\d+$/.test(part)) { const n = +part; if (n >= 1 && n <= total) set.add(n - 1); }
      else throw new Error("Invalid page range: " + part);
    });
    if (!set.size) throw new Error("No valid pages selected.");
    return Array.from(set).sort((a, b) => a - b);
  }

  // 2) SPLIT / EXTRACT
  register("split", {
    title: "Split PDF", icon: "✂️", category: "pdf",
    desc: "Extract a page range or split into separate files.",
    longDesc: "Extract specific pages or a page range from a PDF. Use ranges (1-3) and single pages (5), separated by commas.",
    render(ctx) {
      let file = null;
      const dz = makeDropzone({
        accept: "application/pdf", icon: "✂️", multiple: false, filter: isPdf,
        title: "Drop a PDF here or click to browse",
        hint: "Pick one PDF to extract pages from.",
        onFiles(fs) { file = fs[0]; draw(); }
      });
      const panel = el("div");
      ctx.workspace.appendChild(dz); ctx.workspace.appendChild(panel);
      function draw() {
        panel.innerHTML = "";
        if (!file) return;
        panel.appendChild(el("div", { class: "file-row" },
          el("div", { class: "thumb" }, "📄"),
          el("div", { class: "meta" }, el("div", { class: "name" }, file.name), el("div", { class: "info" }, fmtSize(file.size))),
          el("div", { class: "actions" }, el("button", { class: "btn btn-ghost btn-sm", onclick: () => { file = null; draw(); } }, "Change"))
        ));
        panel.appendChild(el("div", { class: "options" },
          el("h4", {}, "Extract options"),
          el("div", { class: "opt-row" },
            el("label", { for: "splitRange" }, "Pages to extract"),
            el("input", { type: "text", id: "splitRange", placeholder: "e.g. 1-3, 5, 8-10", style: "flex:1" })
          ),
          el("p", { class: "muted", style: "font-size:12.5px;margin:4px 0 0" }, "Use ranges (1-3) and single pages (5), separated by commas. Leave empty to keep all pages.")
        ));
        panel.appendChild(el("div", { class: "row mt" },
          el("button", { class: "btn btn-primary btn-lg", onclick: run }, "✂️ Extract pages")
        ));
      }
      async function run() {
        ctx.reset();
        const raw = document.getElementById("splitRange").value.trim();
        try {
          showLoading("Extracting pages...");
          const bytes = await file.arrayBuffer();
          const src = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          const total = src.getPageCount();
          const indices = parseRanges(raw, total);
          const out = await PDFLib.PDFDocument.create();
          const copied = await out.copyPages(src, indices);
          copied.forEach(p => out.addPage(p));
          const data = await out.save();
          ctx.success("extracted.pdf", new Blob([data], { type: "application/pdf" }), "Extracted PDF ready!", copied.length + " of " + total + " pages.");
        } catch (err) { handleError(err, ctx.errorBox); }
        finally { hideLoading(); }
      }
      draw();
    }
  });

  // 3) COMPRESS
  register("compress", {
    title: "Compress PDF", icon: "🗜️", category: "pdf",
    desc: "Reduce PDF file size with adjustable quality.",
    longDesc: "Shrink large PDFs by rasterizing pages to optimized images. Great for email and uploads.",
    render(ctx) {
      let file = null;
      const dz = makeDropzone({
        accept: "application/pdf", icon: "🗜️", multiple: false, filter: isPdf,
        title: "Drop a PDF here or click to browse",
        hint: "We'll reduce its size while keeping it readable.",
        onFiles(fs) { file = fs[0]; draw(); }
      });
      const panel = el("div");
      ctx.workspace.appendChild(dz); ctx.workspace.appendChild(panel);
      function draw() {
        panel.innerHTML = "";
        if (!file) return;
        panel.appendChild(el("div", { class: "file-row" },
          el("div", { class: "thumb" }, "📄"),
          el("div", { class: "meta" }, el("div", { class: "name" }, file.name), el("div", { class: "info" }, "Original: " + fmtSize(file.size))),
          el("div", { class: "actions" }, el("button", { class: "btn btn-ghost btn-sm", onclick: () => { file = null; draw(); } }, "Change"))
        ));
        const opts = el("div", { class: "options" },
          el("h4", {}, "Compression level"),
          el("div", { class: "opt-row" },
            el("label", {}, "Quality"),
            el("input", { type: "range", id: "qRange", min: "30", max: "85", value: "60" }),
            el("span", { class: "val", id: "qVal" }, "60%")
          ),
          el("p", { class: "muted", style: "font-size:12.5px;margin:6px 0 0" }, "Lower quality = smaller file. 60% is a good balance for most documents.")
        );
        panel.appendChild(opts);
        const q = opts.querySelector("#qRange");
        q.addEventListener("input", () => opts.querySelector("#qVal").textContent = q.value + "%");
        panel.appendChild(el("div", { class: "row mt" },
          el("button", { class: "btn btn-primary btn-lg", onclick: run }, "🗜️ Compress PDF")
        ));
      }
      async function run() {
        ctx.reset();
        const quality = parseInt(document.getElementById("qRange").value, 10) / 100;
        try {
          showLoading("Compressing... this can take a moment.");
          const buf = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: buf }).promise;
          const out = await PDFLib.PDFDocument.create();
          const total = pdf.numPages;
          for (let i = 1; i <= total; i++) {
            ctx.setProgress(Math.round((i / total) * 90));
            const canvas = await renderPageToCanvas(pdf, i, 1.5);
            const jpg = canvas.toDataURL("image/jpeg", quality);
            const jpgBytes = await fetch(jpg).then(r => r.arrayBuffer());
            const img = await out.embedJpg(jpgBytes);
            const page = out.addPage([canvas.width, canvas.height]);
            page.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
          }
          ctx.setProgress(95);
          const data = await out.save();
          const blob = new Blob([data], { type: "application/pdf" });
          const saved = file.size - blob.size;
          const note = saved > 0
            ? "Reduced from " + fmtSize(file.size) + " to " + fmtSize(blob.size) + " (saved " + fmtSize(saved) + ", " + Math.round(saved / file.size * 100) + "% smaller)."
            : "Output is " + fmtSize(blob.size) + ". (Scanned PDFs may not shrink further - try lower quality.)";
          ctx.success("compressed.pdf", blob, "Compressed PDF ready!", note);
        } catch (err) { handleError(err, ctx.errorBox); }
        finally { hideLoading(); }
      }
      draw();
    }
  });

  function dataURLtoBlob(dataURL) {
    const [head, body] = dataURL.split(",");
    const mime = head.match(/:(.*?);/)[1];
    const bin = atob(body);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  // 4) PDF TO IMAGES
  register("pdf-to-images", {
    title: "PDF to JPG", icon: "🖼️", category: "pdf",
    desc: "Convert each PDF page into a JPG or PNG image.",
    longDesc: "Turn a PDF into a set of images - one per page. Download them individually or all at once.",
    render(ctx) {
      let file = null;
      const dz = makeDropzone({
        accept: "application/pdf", icon: "🖼️", multiple: false, filter: isPdf,
        title: "Drop a PDF here or click to browse",
        hint: "Each page becomes a downloadable image.",
        onFiles(fs) { file = fs[0]; draw(); }
      });
      const panel = el("div");
      ctx.workspace.appendChild(dz); ctx.workspace.appendChild(panel);
      function draw() {
        panel.innerHTML = "";
        if (!file) return;
        panel.appendChild(el("div", { class: "file-row" },
          el("div", { class: "thumb" }, "📄"),
          el("div", { class: "meta" }, el("div", { class: "name" }, file.name), el("div", { class: "info" }, fmtSize(file.size))),
          el("div", { class: "actions" }, el("button", { class: "btn btn-ghost btn-sm", onclick: () => { file = null; draw(); } }, "Change"))
        ));
        const opts = el("div", { class: "options" },
          el("h4", {}, "Image options"),
          el("div", { class: "opt-row" },
            el("label", {}, "Format"),
            el("select", { id: "fmt" }, el("option", { value: "jpeg" }, "JPG (smaller)"), el("option", { value: "png" }, "PNG (lossless)")),
            el("label", { style: "margin-left:14px" }, "Quality"),
            el("input", { type: "range", id: "imgQ", min: "40", max: "100", value: "80" }),
            el("span", { class: "val", id: "imgQVal" }, "80%")
          )
        );
        panel.appendChild(opts);
        const q = opts.querySelector("#imgQ");
        q.addEventListener("input", () => opts.querySelector("#imgQVal").textContent = q.value + "%");
        panel.appendChild(el("div", { class: "row mt" },
          el("button", { class: "btn btn-primary btn-lg", onclick: run }, "🖼️ Convert to images")
        ));
      }
      async function run() {
        ctx.reset();
        const fmt = document.getElementById("fmt").value;
        const quality = parseInt(document.getElementById("imgQ").value, 10) / 100;
        try {
          showLoading("Rendering pages to images...");
          const buf = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: buf }).promise;
          const total = pdf.numPages;
          const results = [];
          for (let i = 1; i <= total; i++) {
            ctx.setProgress(Math.round((i / total) * 90));
            const canvas = await renderPageToCanvas(pdf, i, 2);
            const dataUrl = canvas.toDataURL("image/" + fmt, quality);
            results.push({ name: fnameNoExt(file.name) + "-page-" + String(i).padStart(2, "0") + (fmt === "png" ? ".png" : ".jpg"), dataUrl });
          }
          ctx.setProgress(100);
          hideLoading();
          renderResults(results);
        } catch (err) { handleError(err, ctx.errorBox); hideLoading(); }
      }
      function renderResults(results) {
        ctx.resultBox.innerHTML = "";
        ctx.resultBox.classList.add("show");
        ctx.resultBox.appendChild(el("div", { class: "ico" }, "🖼️"));
        ctx.resultBox.appendChild(el("h3", {}, results.length + " images ready"));
        ctx.resultBox.appendChild(el("p", { class: "muted" }, "Download individually or all at once (opens downloads - allow pop-ups)."));
        const grid = el("div", { class: "thumb-grid" });
        results.forEach(r => {
          grid.appendChild(el("div", { class: "page-card" },
            el("img", { src: r.dataUrl, alt: r.name }),
            el("a", { class: "btn btn-ghost btn-sm btn-block", href: r.dataUrl, download: r.name, style: "margin-top:8px" }, "⬇ " + r.name)
          ));
        });
        ctx.resultBox.appendChild(grid);
        const all = el("button", { class: "btn btn-primary btn-lg mt", onclick: () => results.forEach((r, i) => setTimeout(() => downloadBlob(r.name, dataURLtoBlob(r.dataUrl)), i * 350)) }, "⬇ Download all " + results.length);
        ctx.resultBox.appendChild(all);
      }
      draw();
    }
  });

  // 5) IMAGES TO PDF
  register("images-to-pdf", {
    title: "JPG to PDF", icon: "📕", category: "pdf",
    desc: "Convert JPG/PNG images into a single PDF.",
    longDesc: "Combine images (JPG, PNG, WebP) into one PDF - perfect for documents, receipts, or photo albums.",
    render(ctx) {
      let files = [];
      const dz = makeDropzone({
        accept: "image/*", icon: "📕",
        title: "Drop images here or click to browse",
        hint: "JPG, PNG, WebP. Reorder by moving up/down.",
        filter: isImage,
        onFiles(fs) { files = files.concat(fs); draw(); }
      });
      const panel = el("div");
      ctx.workspace.appendChild(dz); ctx.workspace.appendChild(panel);
      function draw() {
        panel.innerHTML = "";
        if (!files.length) return;
        const list = el("div", { class: "file-list" });
        files.forEach((f, i) => {
          list.appendChild(el("div", { class: "file-row" },
            el("div", { class: "thumb" }, "🖼️"),
            el("div", { class: "meta" }, el("div", { class: "name" }, (i + 1) + ". " + f.name), el("div", { class: "info" }, fmtSize(f.size))),
            el("div", { class: "actions" },
              el("button", { class: "icon-btn move-btn", onclick: () => move(i, -1) }, "▲"),
              el("button", { class: "icon-btn move-btn", onclick: () => move(i, 1) }, "▼"),
              el("button", { class: "icon-btn", onclick: () => { files.splice(i, 1); draw(); } }, "✕")
            )
          ));
        });
        panel.appendChild(list);
        panel.appendChild(el("div", { class: "row mt" },
          el("button", { class: "btn btn-primary btn-lg", onclick: run }, "📕 Create PDF"),
          el("button", { class: "btn btn-ghost", onclick: () => { files = []; draw(); } }, "Clear")
        ));
      }
      function move(i, dir) { const j = i + dir; if (j < 0 || j >= files.length) return; [files[i], files[j]] = [files[j], files[i]]; draw(); }
      async function run() {
        ctx.reset();
        if (!files.length) { toast("Add at least one image.", "error"); return; }
        try {
          showLoading("Building PDF...");
          const out = await PDFLib.PDFDocument.create();
          for (let i = 0; i < files.length; i++) {
            ctx.setProgress(Math.round((i / files.length) * 90));
            const bytes = await files[i].arrayBuffer();
            let img;
            if (/png$/i.test(files[i].name)) img = await out.embedPng(bytes);
            else img = await out.embedJpg(bytes);
            const page = out.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
          }
          ctx.setProgress(95);
          const data = await out.save();
          ctx.success("images.pdf", new Blob([data], { type: "application/pdf" }), "PDF created!", files.length + " images.");
        } catch (err) { handleError(err, ctx.errorBox); }
        finally { hideLoading(); }
      }
      draw();
    }
  });

  // 6) ROTATE
  register("rotate", {
    title: "Rotate PDF", icon: "🔄", category: "pdf",
    desc: "Rotate all pages or fix sideways PDFs.",
    longDesc: "Rotate every page in a PDF by 90, 180 or 270 degrees. Great for fixing scans that came out sideways.",
    render(ctx) {
      let file = null, angle = 90;
      const dz = makeDropzone({
        accept: "application/pdf", icon: "🔄", multiple: false, filter: isPdf,
        title: "Drop a PDF here or click to browse",
        hint: "Rotate all pages at once.",
        onFiles(fs) { file = fs[0]; draw(); }
      });
      const panel = el("div");
      ctx.workspace.appendChild(dz); ctx.workspace.appendChild(panel);
      function draw() {
        panel.innerHTML = "";
        if (!file) return;
        panel.appendChild(el("div", { class: "file-row" },
          el("div", { class: "thumb" }, "📄"),
          el("div", { class: "meta" }, el("div", { class: "name" }, file.name), el("div", { class: "info" }, fmtSize(file.size))),
          el("div", { class: "actions" }, el("button", { class: "btn btn-ghost btn-sm", onclick: () => { file = null; draw(); } }, "Change"))
        ));
        const opts = el("div", { class: "options" },
          el("h4", {}, "Rotation"),
          el("div", { class: "opt-row" },
            el("label", {}, "Rotate by"),
            el("select", { id: "rotAngle", onchange: () => { angle = +document.getElementById("rotAngle").value; } },
              el("option", { value: "90" }, "90 degrees clockwise"),
              el("option", { value: "180" }, "180 degrees"),
              el("option", { value: "270" }, "270 degrees clockwise")
            )
          )
        );
        panel.appendChild(opts);
        panel.appendChild(el("div", { class: "row mt" }, el("button", { class: "btn btn-primary btn-lg", onclick: run }, "🔄 Rotate PDF")));
      }
      async function run() {
        ctx.reset();
        try {
          showLoading("Rotating...");
          const bytes = await file.arrayBuffer();
          const pdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          pdf.getPages().forEach(p => {
            const cur = p.getRotation().angle || 0;
            p.setRotation(PDFLib.degrees((cur + angle) % 360));
          });
          const data = await pdf.save();
          ctx.success("rotated.pdf", new Blob([data], { type: "application/pdf" }), "Rotated PDF ready!", "All pages rotated " + angle + " degrees.");
        } catch (err) { handleError(err, ctx.errorBox); }
        finally { hideLoading(); }
      }
      draw();
    }
  });

  // 7) ORGANIZE / DELETE PAGES
  register("organize", {
    title: "Delete Pages", icon: "🗂️", category: "pdf",
    desc: "Visually remove or rearrange pages.",
    longDesc: "See thumbnails of every page, then delete the ones you don't need. Everything stays private.",
    render(ctx) {
      let file = null, selected = new Set();
      const dz = makeDropzone({
        accept: "application/pdf", icon: "🗂️", multiple: false, filter: isPdf,
        title: "Drop a PDF here or click to browse",
        hint: "We'll show thumbnails of every page.",
        onFiles(fs) { file = fs[0]; load(); }
      });
      const panel = el("div");
      ctx.workspace.appendChild(dz); ctx.workspace.appendChild(panel);

      async function load() {
        panel.innerHTML = "";
        panel.appendChild(el("p", { class: "muted" }, "Loading page thumbnails..."));
        try {
          const buf = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
          const grid = el("div", { class: "thumb-grid" });
          for (let i = 1; i <= pdf.numPages; i++) {
            const canvas = await renderPageToCanvas(pdf, i, 0.5);
            const card = el("div", { class: "page-card", "data-idx": i - 1 });
            card.appendChild(el("span", { class: "page-num" }, "p." + i));
            card.appendChild(el("img", { src: canvas.toDataURL("image/jpeg", 0.6), alt: "Page " + i }));
            card.appendChild(el("button", { class: "del", title: "Delete page", onclick: (e) => { e.stopPropagation(); toggle(i - 1, card); } }, "🗑"));
            grid.appendChild(card);
          }
          panel.innerHTML = "";
          panel.appendChild(el("div", { class: "file-row" },
            el("div", { class: "thumb" }, "📄"),
            el("div", { class: "meta" }, el("div", { class: "name" }, file.name), el("div", { class: "info" }, pdf.numPages + " pages")),
            el("div", { class: "actions" }, el("button", { class: "btn btn-ghost btn-sm", onclick: () => { file = null; panel.innerHTML = ""; } }, "Change"))
          ));
          panel.appendChild(grid);
          panel.appendChild(el("div", { class: "row mt" },
            el("button", { class: "btn btn-danger btn-lg", onclick: run }, "✓ Apply changes"),
            el("span", { class: "muted", id: "selCount" }, "0 pages selected to delete")
          ));
        } catch (err) { handleError(err, ctx.errorBox); }
      }
      function toggle(idx, card) {
        if (selected.has(idx)) { selected.delete(idx); card.classList.remove("selected"); }
        else { selected.add(idx); card.classList.add("selected"); }
        const sc = document.getElementById("selCount");
        if (sc) sc.textContent = selected.size + " page" + (selected.size === 1 ? "" : "s") + " selected to delete";
      }
      async function run() {
        ctx.reset();
        if (!selected.size) { toast("Select pages to delete first.", "error"); return; }
        try {
          showLoading("Applying changes...");
          const bytes = await file.arrayBuffer();
          const src = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          const keep = src.getPageIndices().filter(i => !selected.has(i));
          if (!keep.length) throw new Error("You can't delete every page.");
          const out = await PDFLib.PDFDocument.create();
          const copied = await out.copyPages(src, keep);
          copied.forEach(p => out.addPage(p));
          const data = await out.save();
          ctx.success("organized.pdf", new Blob([data], { type: "application/pdf" }), "Updated PDF ready!", "Removed " + selected.size + " page" + (selected.size === 1 ? "" : "s") + ".");
        } catch (err) { handleError(err, ctx.errorBox); }
        finally { hideLoading(); }
      }
    }
  });

  // 8) WATERMARK
  register("watermark", {
    title: "Watermark PDF", icon: "💧", category: "pdf",
    desc: "Stamp text across every page.",
    longDesc: "Add a diagonal text watermark (like CONFIDENTIAL or DRAFT) to every page of your PDF.",
    render(ctx) {
      let file = null;
      const dz = makeDropzone({
        accept: "application/pdf", icon: "💧", multiple: false, filter: isPdf,
        title: "Drop a PDF here or click to browse",
        hint: "Add a text watermark to every page.",
        onFiles(fs) { file = fs[0]; draw(); }
      });
      const panel = el("div");
      ctx.workspace.appendChild(dz); ctx.workspace.appendChild(panel);
      function draw() {
        panel.innerHTML = "";
        if (!file) return;
        panel.appendChild(el("div", { class: "file-row" },
          el("div", { class: "thumb" }, "📄"),
          el("div", { class: "meta" }, el("div", { class: "name" }, file.name), el("div", { class: "info" }, fmtSize(file.size))),
          el("div", { class: "actions" }, el("button", { class: "btn btn-ghost btn-sm", onclick: () => { file = null; draw(); } }, "Change"))
        ));
        const opts = el("div", { class: "options" },
          el("h4", {}, "Watermark text"),
          el("div", { class: "opt-row" },
            el("input", { type: "text", id: "wmText", placeholder: "e.g. CONFIDENTIAL", value: "CONFIDENTIAL", style: "flex:1" })
          ),
          el("div", { class: "opt-row" },
            el("label", {}, "Opacity"),
            el("input", { type: "range", id: "wmOpacity", min: "10", max: "60", value: "25" }),
            el("span", { class: "val", id: "wmOpacityVal" }, "25%")
          )
        );
        panel.appendChild(opts);
        const o = opts.querySelector("#wmOpacity");
        o.addEventListener("input", () => opts.querySelector("#wmOpacityVal").textContent = o.value + "%");
        panel.appendChild(el("div", { class: "row mt" }, el("button", { class: "btn btn-primary btn-lg", onclick: run }, "💧 Add watermark")));
      }
      async function run() {
        ctx.reset();
        const text = document.getElementById("wmText").value.trim() || "CONFIDENTIAL";
        const opacity = parseInt(document.getElementById("wmOpacity").value, 10) / 100;
        try {
          showLoading("Adding watermark...");
          const bytes = await file.arrayBuffer();
          const pdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          const font = await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
          const pages = pdf.getPages();
          pages.forEach((page, idx) => {
            ctx.setProgress(Math.round((idx / pages.length) * 90));
            const { width, height } = page.getSize();
            const size = Math.min(width, height) / 5;
            const textWidth = font.widthOfTextAtSize(text, size);
            page.drawText(text, {
              x: width / 2 - textWidth / 2,
              y: height / 2,
              size, font,
              color: PDFLib.rgb(0.6, 0.1, 0.1),
              opacity,
              rotate: PDFLib.degrees(45)
            });
          });
          const data = await pdf.save();
          ctx.success("watermarked.pdf", new Blob([data], { type: "application/pdf" }), "Watermarked PDF ready!", "Stamped on " + pages.length + " pages.");
        } catch (err) { handleError(err, ctx.errorBox); }
        finally { hideLoading(); }
      }
      draw();
    }
  });

})();
