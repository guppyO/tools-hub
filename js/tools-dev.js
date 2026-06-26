/* PDF.tools - DEVELOPER category tools */
(function () {
  "use strict";
  const { register, ui } = window.PDFT;
  const { el, toast } = ui;

  function ta(value, ph){return el("textarea",{placeholder:ph,value:value||"",style:"width:100%;min-height:200px;font-family:monospace;font-size:13px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"});}

  // 1) JSON FORMATTER
  register("json-formatter", {
    title: "JSON Formatter", icon: "\u{1F7E9}", category: "dev",
    desc: "Format, validate and minify JSON.",
    longDesc: "Beautify, validate and minify JSON data. Catches syntax errors and shows where they are.",
    render(ctx){
      const inp=ta("",'Paste JSON here...');
      ctx.workspace.appendChild(inp);
      const out=el("div",{class:"mt"});ctx.workspace.appendChild(out);
      ctx.workspace.appendChild(el("div",{class:"row mt"},
        el("button",{class:"btn btn-primary",onclick:()=>{
          out.innerHTML="";
          try{
            const obj=JSON.parse(inp.value);
            out.appendChild(el("div",{class:"options"},
              el("h4",{},"\u2705 Valid JSON ("+Object.keys(obj).length+" root keys)"),
              el("textarea",{readonly:"readonly",style:"width:100%;height:240px;font-family:monospace;font-size:13px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"},JSON.stringify(obj,null,2))
            ));
            toast("Formatted!","success");
          }catch(e){
            out.appendChild(el("div",{class:"error-box show"},"Invalid JSON: "+e.message));
          }
        }},"Beautify"),
        el("button",{class:"btn btn-ghost",onclick:()=>{
          out.innerHTML="";
          try{
            const obj=JSON.parse(inp.value);
            const min=JSON.stringify(obj);
            out.appendChild(el("div",{class:"options"},
              el("h4",{},"Minified ("+min.length+" chars)"),
              el("textarea",{readonly:"readonly",style:"width:100%;height:120px;font-family:monospace;font-size:13px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"},min)
            ));
          }catch(e){out.appendChild(el("div",{class:"error-box show"},"Invalid JSON: "+e.message));}
        }},"Minify")
      ));
    }
  });

  // 2) BASE64 ENCODE/DECODE
  register("base64", {
    title: "Base64 Encode/Decode", icon: "\u{1F510}", category: "dev",
    desc: "Encode or decode Base64 strings.",
    longDesc: "Convert text to Base64 or decode Base64 back to text. Handles UTF-8 correctly.",
    render(ctx){
      const inp=ta("",'Enter text or Base64...');
      ctx.workspace.appendChild(inp);
      const out=el("div",{class:"mt"});ctx.workspace.appendChild(out);
      ctx.workspace.appendChild(el("div",{class:"row mt"},
        el("button",{class:"btn btn-primary",onclick:()=>{
          out.innerHTML="";
          try{
            const enc=btoa(unescape(encodeURIComponent(inp.value)));
            out.appendChild(el("div",{class:"options"},
              el("h4",{},"Encoded"),
              el("textarea",{readonly:"readonly",style:"width:100%;height:120px;font-family:monospace;font-size:13px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"},enc),
              el("button",{class:"btn btn-primary btn-sm mt",onclick:()=>{navigator.clipboard.writeText(enc);toast("Copied!","success");}},"Copy")
            ));
          }catch(e){out.appendChild(el("div",{class:"error-box show"},e.message));}
        }},"Encode"),
        el("button",{class:"btn btn-ghost",onclick:()=>{
          out.innerHTML="";
          try{
            const dec=decodeURIComponent(escape(atob(inp.value.trim())));
            out.appendChild(el("div",{class:"options"},
              el("h4",{},"Decoded"),
              el("textarea",{readonly:"readonly",style:"width:100%;height:120px;font-family:monospace;font-size:13px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px"},dec),
              el("button",{class:"btn btn-primary btn-sm mt",onclick:()=>{navigator.clipboard.writeText(dec);toast("Copied!","success");}},"Copy")
            ));
          }catch(e){out.appendChild(el("div",{class:"error-box show"},"Invalid Base64: "+e.message));}
        }},"Decode")
      ));
    }
  });

  // 3) URL ENCODE/DECODE
  register("url-encode", {
    title: "URL Encode/Decode", icon: "\u{1F310}", category: "dev",
    desc: "Encode or decode URL strings.",
    longDesc: "Percent-encode text for URLs or decode encoded URL strings.",
    render(ctx){
      const inp=ta("",'Enter text or URL...');
      ctx.workspace.appendChild(inp);
      const out=el("div",{class:"mt"});ctx.workspace.appendChild(out);
      ctx.workspace.appendChild(el("div",{class:"row mt"},
        el("button",{class:"btn btn-primary",onclick:()=>{
          out.innerHTML="";
          const enc=encodeURIComponent(inp.value);
          out.appendChild(el("div",{class:"options"},el("h4",{},"Encoded"),el("code",{style:"word-break:break-all;color:var(--accent)"},enc),el("div",{class:"mt"},el("button",{class:"btn btn-primary btn-sm",onclick:()=>{navigator.clipboard.writeText(enc);toast("Copied!","success");}},"Copy"))));
        }},"Encode"),
        el("button",{class:"btn btn-ghost",onclick:()=>{
          out.innerHTML="";
          try{const dec=decodeURIComponent(inp.value);out.appendChild(el("div",{class:"options"},el("h4",{},"Decoded"),el("code",{style:"word-break:break-all;color:var(--accent)"},dec),el("div",{class:"mt"},el("button",{class:"btn btn-primary btn-sm",onclick:()=>{navigator.clipboard.writeText(dec);toast("Copied!","success");}},"Copy"))));}
          catch(e){out.appendChild(el("div",{class:"error-box show"},"Invalid: "+e.message));}
        }},"Decode")
      ));
    }
  });

  // 4) JWT DECODER
  register("jwt-decoder", {
    title: "JWT Decoder", icon: "\u{1F511}", category: "dev",
    desc: "Decode JSON Web Token headers and payloads.",
    longDesc: "Paste a JWT to instantly decode and inspect its header and payload (no signature verification).",
    render(ctx){
      const inp=ta("",'Paste JWT here...');
      ctx.workspace.appendChild(inp);
      const out=el("div",{class:"mt"});ctx.workspace.appendChild(out);
      ctx.workspace.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",onclick:()=>{
        out.innerHTML="";
        const tok=inp.value.trim();
        const parts=tok.split(".");
        if(parts.length<2){out.appendChild(el("div",{class:"error-box show"},"Not a valid JWT - expected 3 dot-separated parts."));return;}
        try{
          function dec(s){return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,"+").replace(/_/g,"/")))));}
          const header=dec(parts[0]);
          const payload=dec(parts[1]);
          const box=el("div",{class:"options"});
          box.appendChild(el("h4",{},"Header"));
          box.appendChild(el("pre",{style:"color:var(--accent);font-size:13px;overflow:auto"},JSON.stringify(header,null,2)));
          box.appendChild(el("h4",{style:"margin-top:14px"},"Payload"));
          box.appendChild(el("pre",{style:"color:#a7f3d0;font-size:13px;overflow:auto"},JSON.stringify(payload,null,2)));
          if(payload.exp){
            const exp=new Date(payload.exp*1000);
            const expired=exp<new Date();
            box.appendChild(el("p",{class:"muted",style:"margin-top:10px"},(expired?"\u26A0\uFE0F Expired":"\u2705 Valid")+" - expires "+exp.toLocaleString()));
          }
          out.appendChild(box);
        }catch(e){out.appendChild(el("div",{class:"error-box show"},"Could not decode: "+e.message));}
      }},"Decode token")));
    }
  });

  // 5) HASH GENERATOR
  register("hash-generator", {
    title: "Hash Generator", icon: "\u{1F9EE}", category: "dev",
    desc: "Generate SHA-1, SHA-256 and SHA-512 hashes.",
    longDesc: "Generate cryptographic hashes (SHA-1, SHA-256, SHA-512) from any text using the browser's native crypto.",
    render(ctx){
      const inp=ta("",'Enter text to hash...');
      ctx.workspace.appendChild(inp);
      const out=el("div",{class:"mt"});ctx.workspace.appendChild(out);
      ctx.workspace.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",onclick:async()=>{
        out.innerHTML="";
        try{
          const data=new TextEncoder().encode(inp.value);
          const algos=[["SHA-1"],["SHA-256"],["SHA-512"]];
          const box=el("div",{class:"options"});box.appendChild(el("h4",{},"Hashes"));
          for(const [a] of algos){
            const buf=await crypto.subtle.digest(a,data);
            const hex=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
            box.appendChild(el("div",{style:"margin-bottom:12px"},
              el("div",{style:"font-weight:700;margin-bottom:4px"},a),
              el("code",{style:"word-break:break-all;font-size:12px;color:var(--accent)"},hex)
            ));
          }
          out.appendChild(box);
        }catch(e){out.appendChild(el("div",{class:"error-box show"},e.message));}
      }},"Generate hashes")));
    }
  });

  // 6) COLOR / HEX CONVERTER
  register("color-converter", {
    title: "Color Converter", icon: "\u{1F3A8}", category: "dev",
    desc: "Convert HEX, RGB and HSL colors.",
    longDesc: "Pick a color and instantly get HEX, RGB and HSL values for CSS and design.",
    render(ctx){
      const picker=el("input",{type:"color",value:"#4f46e5",style:"width:80px;height:50px;border:0;background:none;cursor:pointer"});
      ctx.workspace.appendChild(el("div",{class:"row",style:"align-items:center"},el("label",{style:"font-weight:700;margin-right:10px"},"Pick color"),picker));
      const out=el("div",{class:"options mt"});ctx.workspace.appendChild(out);
      function hexToRgb(h){h=h.replace("#","");return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};}
      function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];}
      function upd(){
        const hex=picker.value;const{r,g,b}=hexToRgb(hex);const[h,s,l]=rgbToHsl(r,g,b);
        out.innerHTML="";
        const rows=[["HEX",hex],["RGB","rgb("+r+", "+g+", "+b+")"],["HSL","hsl("+h+", "+s+"%, "+l+"%)"]];
        out.appendChild(el("h4",{},"Color values"));
        rows.forEach(([k,v])=>out.appendChild(el("div",{class:"opt-row"},
          el("label",{},k),el("code",{style:"color:var(--accent);font-size:14px"},v),
          el("button",{class:"btn btn-ghost btn-sm",onclick:()=>{navigator.clipboard.writeText(v);toast("Copied "+k,"success");}},"Copy")
        )));
        out.appendChild(el("div",{style:"height:50px;border-radius:8px;margin-top:10px;background:"+hex}));
      }
      picker.addEventListener("input",upd);upd();
    }
  });

  // 7) UUID GENERATOR
  register("uuid-generator", {
    title: "UUID Generator", icon: "\u{1F194}", category: "dev",
    desc: "Generate random UUIDs (v4).",
    longDesc: "Generate one or many random UUID version 4 identifiers for databases and apps.",
    render(ctx){
      const opts=el("div",{class:"options"},
        el("h4",{},"How many?"),
        el("div",{class:"opt-row"},
          el("input",{type:"number",id:"uc",value:"5",min:"1",max:"100",style:"width:100px"}),
          el("button",{class:"btn btn-primary",onclick:()=>{
            const n=Math.min(100,Math.max(1,parseInt(document.getElementById("uc").value,10)||1));
            const list=[];for(let i=0;i<n;i++)list.push(crypto.randomUUID());
            out.value=list.join("\n");
          }},"Generate")
        )
      );
      ctx.workspace.appendChild(opts);
      const out=el("textarea",{readonly:"readonly",placeholder:"UUIDs appear here...",style:"width:100%;min-height:180px;font-family:monospace;font-size:13px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:12px;margin-top:12px"});
      ctx.workspace.appendChild(out);
      ctx.workspace.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-ghost",onclick:()=>{navigator.clipboard.writeText(out.value);toast("Copied!","success");}},"Copy all")));
    }
  });

})();
