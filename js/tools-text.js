/* PDF.tools - TEXT category tools */
(function () {
  "use strict";
  const { register, ui } = window.PDFT;
  const { el, toast } = ui;

  function textareaPanel(ctx, initialValue, runFn, btnLabel, opts){
    const ta=el("textarea",{id:"txt",style:"width:100%;min-height:200px;font-family:monospace;font-size:14px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"},initialValue||"");
    ctx.workspace.appendChild(ta);
    const outWrap=el("div",{class:"mt"});ctx.workspace.appendChild(outWrap);
    const btn=el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",onclick:()=>runFn(ta.value,outWrap)},btnLabel));
    ctx.workspace.appendChild(btn);
    return {ta,outWrap};
  }
  function statsBox(text){
    const words=(text.trim().match(/\S+/g)||[]).length;
    const chars=text.length,charsNoSpace=text.replace(/\s/g,"").length;
    const lines=text.split(/\n/).length,sent=(text.match(/[.!?]+/g)||[]).length;
    const readMin=Math.max(1,Math.round(words/200));
    return el("div",{class:"options"},
      el("h4",{},"Statistics"),
      el("div",{class:"opt-row"},
        el("span",{class:"badge"},words+" words"),
        el("span",{class:"badge"},chars+" characters"),
        el("span",{class:"badge"},charsNoSpace+" (no spaces)"),
        el("span",{class:"badge"},lines+" lines"),
        el("span",{class:"badge"},sent+" sentences"),
        el("span",{class:"badge"},"\u23F1 ~"+readMin+" min read")
      )
    );
  }

  // 1) WORD COUNTER
  register("word-count", {
    title: "Word Counter", icon: "\u{1F4DD}", category: "text",
    desc: "Count words, characters and reading time.",
    longDesc: "Live word, character, sentence and reading-time counter. Paste or type your text.",
    render(ctx){
      const ta=el("textarea",{id:"wc",placeholder:"Start typing or paste your text...",style:"width:100%;min-height:220px;font-size:15px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"});
      const box=el("div",{class:"mt"});
      ctx.workspace.appendChild(ta);ctx.workspace.appendChild(box);
      function upd(){box.innerHTML="";box.appendChild(statsBox(ta.value));}
      ta.addEventListener("input",upd);upd();
    }
  });

  // 2) CASE CONVERTER
  register("case-converter", {
    title: "Case Converter", icon: "\u{1F524}", category: "text",
    desc: "Convert text to UPPER, lower, Title or Camel case.",
    longDesc: "Instantly change text casing: UPPERCASE, lowercase, Title Case, camelCase, snake_case and more.",
    render(ctx){
      const ta=el("textarea",{id:"cc",placeholder:"Paste text here...",style:"width:100%;min-height:180px;font-size:15px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"});
      ctx.workspace.appendChild(ta);
      const row=el("div",{class:"row mt"});
      const out=el("div",{class:"mt"});
      const ops=[
        ["UPPERCASE",t=>t.toUpperCase()],
        ["lowercase",t=>t.toLowerCase()],
        ["Title Case",t=>t.replace(/\w\S*/g,w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())],
        ["Sentence case",t=>t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g,c=>c.toUpperCase())],
        ["camelCase",t=>t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g,(m,c)=>c.toUpperCase())],
        ["snake_case",t=>t.trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"")],
        ["kebab-case",t=>t.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")]
      ];
      ops.forEach(([label,fn])=>row.appendChild(el("button",{class:"btn btn-ghost btn-sm",onclick:()=>{
        const v=ta.value;if(!v){toast("Enter text first","error");return;}
        const res=fn(v);
        out.innerHTML="";
        out.appendChild(el("textarea",{readonly:"readonly",style:"width:100%;height:120px;font-family:monospace;font-size:14px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"},res));
        out.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-sm",onclick:()=>{navigator.clipboard.writeText(res);toast("Copied!","success");}},"Copy")));
      }},label)));
      ctx.workspace.appendChild(row);ctx.workspace.appendChild(out);
    }
  });

  // 3) LOREM IPSUM GENERATOR
  register("lorem-ipsum", {
    title: "Lorem Ipsum", icon: "\u{1F4D6}", category: "text",
    desc: "Generate placeholder text for designs.",
    longDesc: "Generate Lorem Ipsum placeholder paragraphs, sentences or words for your mockups and designs.",
    render(ctx){
      const words="lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");
      function r(n){let s=[];for(let i=0;i<n;i++)s.push(words[Math.floor(Math.random()*words.length)]);return s.join(" ");}
      function sentence(){let n=8+Math.floor(Math.random()*10);let s=r(n);return s.charAt(0).toUpperCase()+s.slice(1)+".";}
      const opts=el("div",{class:"options"},
        el("h4",{},"Generate"),
        el("div",{class:"opt-row"},
          el("label",{},"Count"),el("input",{type:"number",id:"lc",value:"3",min:"1",max:"50",style:"width:90px"}),
          el("select",{id:"lt"},el("option",{value:"p"},"paragraphs"),el("option",{value:"s"},"sentences"),el("option",{value:"w"},"words"))
        )
      );
      ctx.workspace.appendChild(opts);
      const out=el("textarea",{readonly:"readonly",style:"width:100%;min-height:200px;font-family:inherit;font-size:14px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px;margin-top:12px"});
      ctx.workspace.appendChild(out);
      ctx.workspace.appendChild(el("div",{class:"row mt"},
        el("button",{class:"btn btn-primary btn-lg",onclick:()=>{
          const c=parseInt(document.getElementById("lc").value,10)||1;const t=document.getElementById("lt").value;let res=[];
          if(t==="w")res=[r(c)];
          else if(t==="s"){for(let i=0;i<c;i++)res.push(sentence());}
          else{for(let i=0;i<c;i++){let p=[];for(let j=0;j<4+Math.floor(Math.random()*3);j++)p.push(sentence());res.push(p.join(" "));}}
          out.value=res.join("\n\n");
        }},"Generate"),
        el("button",{class:"btn btn-ghost",onclick:()=>{navigator.clipboard.writeText(out.value);toast("Copied!","success");}},"Copy")
      ));
    }
  });

  // 4) TEXT DIFF CHECKER
  register("text-diff", {
    title: "Text Diff", icon: "\u{1F50D}", category: "text",
    desc: "Compare two blocks of text and see differences.",
    longDesc: "Paste two versions of text and instantly see what changed. Great for comparing documents.",
    render(ctx){
      const grid=el("div",{style:"display:grid;grid-template-columns:1fr 1fr;gap:12px"});
      const a=el("textarea",{placeholder:"Original text...",style:"width:100%;height:200px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px;font-family:monospace;font-size:13px"});
      const b=el("textarea",{placeholder:"Modified text...",style:"width:100%;height:200px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px;font-family:monospace;font-size:13px"});
      grid.appendChild(a);grid.appendChild(b);
      ctx.workspace.appendChild(grid);
      const out=el("div",{class:"mt"});
      ctx.workspace.appendChild(out);
      ctx.workspace.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",onclick:()=>{
        const la=a.value.split(/\n/),lb=b.value.split(/\n/);
        const max=Math.max(la.length,lb.length);
        out.innerHTML="";
        const box=el("div",{class:"options",style:"font-family:monospace;font-size:13px"});
        box.appendChild(el("h4",{},"Differences"));
        let diffs=0;
        for(let i=0;i<max;i++){
          if(la[i]!==lb[i]){
            diffs++;
            if(la[i]!==undefined)box.appendChild(el("div",{style:"color:#ffb4b4;background:rgba(239,68,68,.08);padding:4px 8px;border-radius:6px;margin:2px 0"},"- "+(la[i]||"")));
            if(lb[i]!==undefined)box.appendChild(el("div",{style:"color:#a7f3d0;background:rgba(16,185,129,.08);padding:4px 8px;border-radius:6px;margin:2px 0"},"+ "+(lb[i]||"")));
          }
        }
        if(!diffs)box.appendChild(el("p",{class:"muted"},"No differences found - the texts match."));
        else box.appendChild(el("p",{class:"muted",style:"margin-top:8px"},diffs+" line"+(diffs===1?"":"s")+" differ."));
        out.appendChild(box);
      }},"Compare text")));
    }
  });

  // 5) SLUG GENERATOR
  register("slug-generator", {
    title: "Slug Generator", icon: "\u{1F517}", category: "text",
    desc: "Make SEO-friendly URL slugs from titles.",
    longDesc: "Convert any title or phrase into a clean, SEO-friendly URL slug.",
    render(ctx){
      const inp=el("input",{type:"text",id:"slugIn",placeholder:"e.g. My Awesome Blog Post!",style:"width:100%;font-size:16px;padding:12px"});
      ctx.workspace.appendChild(inp);
      const out=el("div",{class:"options mt"});
      ctx.workspace.appendChild(out);
      inp.addEventListener("input",()=>{
        const slug=inp.value.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
        out.innerHTML="";out.appendChild(el("h4",{},"URL slug"));out.appendChild(el("code",{style:"font-size:18px;color:var(--accent)"},slug||"-"));
        if(slug)out.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-sm",onclick:()=>{navigator.clipboard.writeText(slug);toast("Copied!","success");}},"Copy slug")));
      });
    }
  });

})();
