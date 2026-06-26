/* PDF.tools - IMAGE category tools */
(function () {
  "use strict";
  const { register, ui } = window.PDFT;
  const { el, showLoading, hideLoading, handleError, toast } = ui;

  function fmtSize(b){return b<1024?b+" B":b<1048576?(b/1024).toFixed(1)+" KB":(b/1048576).toFixed(2)+" MB";}
  function isImage(f){return /^image\//.test(f.type)||/\.(png|jpe?g|webp|bmp|gif)$/i.test(f.name);}
  function makeDropzone(opts){
    const input=el("input",{type:"file",accept:opts.accept,multiple:opts.multiple!==false});
    const dz=el("div",{class:"dropzone",onclick:()=>input.click()},
      el("div",{class:"ico-big"},opts.icon||"\u{1F4C4}"),
      el("h3",{},opts.title||"Drop files here or click to browse"),
      el("p",{},opts.hint||"Your files are processed locally and never uploaded.")
    );
    input.addEventListener("change",()=>{if(input.files.length)opts.onFiles(Array.from(input.files));});
    ["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag");}));
    ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag");}));
    dz.addEventListener("drop",e=>{const fs=Array.from(e.dataTransfer.files).filter(f=>opts.filter?opts.filter(f):true);if(fs.length)opts.onFiles(fs);});
    dz.appendChild(input);
    return dz;
  }
  function readFileAsImg(file){return new Promise((res,rej)=>{const img=new Image();const fr=new FileReader();fr.onload=()=>{img.onload=()=>res(img);img.onerror=rej;img.src=fr.result;};fr.onerror=rej;fr.readAsDataURL(file);});}
  function fileToBlob(file,cb){const fr=new FileReader();fr.onload=()=>cb(fr.result);fr.readAsDataURL(file);}

  // 1) IMAGE COMPRESSOR
  register("image-compress", {
    title: "Image Compressor", icon: "\u{1F4CF}\uFE0F", category: "image",
    desc: "Compress JPG and PNG images without losing quality.",
    longDesc: "Reduce the file size of JPG and PNG images. Choose a quality level and shrink files for the web or email.",
    render(ctx) {
      let file=null;
      const dz=makeDropzone({accept:"image/*",icon:"\u{1F4CF}\uFE0F",multiple:false,filter:isImage,title:"Drop an image here",hint:"JPG, PNG or WebP. We'll shrink it.",onFiles(fs){file=fs[0];draw();}});
      const panel=el("div");ctx.workspace.appendChild(dz);ctx.workspace.appendChild(panel);
      function draw(){
        panel.innerHTML="";if(!file)return;
        panel.appendChild(el("div",{class:"file-row"},
          el("div",{class:"thumb"},"IMG"),
          el("div",{class:"meta"},el("div",{class:"name"},file.name),el("div",{class:"info"},"Original: "+fmtSize(file.size))),
          el("div",{class:"actions"},el("button",{class:"btn btn-ghost btn-sm",onclick:()=>{file=null;draw();}},"Change"))
        ));
        const opts=el("div",{class:"options"},
          el("h4",{},"Quality"),
          el("div",{class:"opt-row"},
            el("label",{},"Level"),
            el("input",{type:"range",id:"iq",min:"10",max:"100",value:"70"}),
            el("span",{class:"val",id:"iqv"},"70%")
          ),
          el("p",{class:"muted",style:"font-size:12.5px;margin:6px 0 0"},"Lower = smaller file. 70% is a good default for photos.")
        );
        panel.appendChild(opts);
        const q=opts.querySelector("#iq");
        q.addEventListener("input",()=>opts.querySelector("#iqv").textContent=q.value+"%");
        panel.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",onclick:run},"Compress image")));
      }
      async function run(){
        ctx.reset();const quality=parseInt(document.getElementById("iq").value,10)/100;
        try{
          showLoading("Compressing image...");
          const img=await readFileAsImg(file);
          const c=document.createElement("canvas");
          c.width=img.naturalWidth;c.height=img.naturalHeight;
          c.getContext("2d").drawImage(img,0,0);
          const type=/png$/i.test(file.name)?"image/png":"image/jpeg";
          const blob=await new Promise(r=>c.toBlob(r,type,quality));
          const saved=file.size-blob.size;
          const note=saved>0?"Reduced from "+fmtSize(file.size)+" to "+fmtSize(blob.size)+" ("+Math.round(saved/file.size*100)+"% smaller).":"Output is "+fmtSize(blob.size)+".";
          ctx.success("compressed-"+file.name,blob,"Image compressed!",note);
        }catch(err){handleError(err,ctx.errorBox);}finally{hideLoading();}
      }
      draw();
    }
  });

  // 2) IMAGE CONVERTER
  register("image-convert", {
    title: "Image Converter", icon: "\u{1F504}", category: "image",
    desc: "Convert between JPG, PNG and WebP.",
    longDesc: "Convert images between JPG, PNG and WebP formats instantly in your browser.",
    render(ctx) {
      let file=null,fmt="jpeg";
      const dz=makeDropzone({accept:"image/*",icon:"\u{1F504}",multiple:false,filter:isImage,title:"Drop an image here",hint:"Convert to JPG, PNG or WebP.",onFiles(fs){file=fs[0];draw();}});
      const panel=el("div");ctx.workspace.appendChild(dz);ctx.workspace.appendChild(panel);
      function draw(){
        panel.innerHTML="";if(!file)return;
        panel.appendChild(el("div",{class:"file-row"},
          el("div",{class:"thumb"},"IMG"),
          el("div",{class:"meta"},el("div",{class:"name"},file.name),el("div",{class:"info"},fmtSize(file.size))),
          el("div",{class:"actions"},el("button",{class:"btn btn-ghost btn-sm",onclick:()=>{file=null;draw();}},"Change"))
        ));
        const opts=el("div",{class:"options"},
          el("h4",{},"Convert to"),
          el("div",{class:"opt-row"},
            el("select",{id:"cfmt",onchange:()=>{fmt=document.getElementById("cfmt").value;}},
              el("option",{value:"jpeg"},"JPG"),el("option",{value:"png"},"PNG"),el("option",{value:"webp"},"WebP")
            )
          )
        );
        panel.appendChild(opts);
        panel.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",onclick:run},"Convert image")));
      }
      async function run(){
        ctx.reset();
        try{
          showLoading("Converting...");
          const img=await readFileAsImg(file);
          const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;
          c.getContext("2d").drawImage(img,0,0);
          const mime="image/"+fmt;
          const blob=await new Promise(r=>c.toBlob(r,mime,0.92));
          const ext=fmt==="jpeg"?"jpg":fmt;
          ctx.success("converted."+ext,blob,"Image converted!","Now in "+ext.toUpperCase()+" format.");
        }catch(err){handleError(err,ctx.errorBox);}finally{hideLoading();}
      }
      draw();
    }
  });

  // 3) IMAGE RESIZER
  register("image-resize", {
    title: "Image Resizer", icon: "\u{1F4D0}", category: "image",
    desc: "Resize images to exact dimensions.",
    longDesc: "Resize an image to exact pixel dimensions or a percentage. Great for avatars, banners and thumbnails.",
    render(ctx) {
      let file=null;
      const dz=makeDropzone({accept:"image/*",icon:"\u{1F4D0}",multiple:false,filter:isImage,title:"Drop an image here",hint:"Resize to exact dimensions.",onFiles(fs){file=fs[0];loadDims();}});
      const panel=el("div");ctx.workspace.appendChild(dz);ctx.workspace.appendChild(panel);
      async function loadDims(){
        const img=await readFileAsImg(file);
        draw(img.naturalWidth,img.naturalHeight);
      }
      function draw(w,h){
        panel.innerHTML="";
        panel.appendChild(el("div",{class:"file-row"},
          el("div",{class:"thumb"},"IMG"),
          el("div",{class:"meta"},el("div",{class:"name"},file.name),el("div",{class:"info"},w+" x "+h+" px")),
          el("div",{class:"actions"},el("button",{class:"btn btn-ghost btn-sm",onclick:()=>{file=null;panel.innerHTML="";}},"Change"))
        ));
        panel.appendChild(el("div",{class:"options"},
          el("h4",{},"New size"),
          el("div",{class:"opt-row"},
            el("label",{for:"nw"},"Width"),el("input",{type:"number",id:"nw",value:w,style:"width:110px"}),
            el("label",{for:"nh",style:"margin-left:10px"},"Height"),el("input",{type:"number",id:"nh",value:h,style:"width:110px"})
          ),
          el("div",{class:"opt-row"},
            el("input",{type:"checkbox",id:"lock",checked:"checked"}),
            el("label",{for:"lock",style:"min-width:auto"},"Keep aspect ratio")
          )
        ));
        panel.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",onclick:()=>run(w,h)},"Resize image")));
      }
      async function run(ow,oh){
        ctx.reset();
        const nw=parseInt(document.getElementById("nw").value,10);
        const nh=parseInt(document.getElementById("nh").value,10);
        try{
          showLoading("Resizing...");
          const img=await readFileAsImg(file);
          const c=document.createElement("canvas");c.width=nw;c.height=nh;
          c.getContext("2d").drawImage(img,0,0,nw,nh);
          const blob=await new Promise(r=>c.toBlob(r,/png$/i.test(file.name)?"image/png":"image/jpeg",0.92));
          ctx.success("resized-"+file.name,blob,"Image resized!",nw+" x "+nh+" px.");
        }catch(err){handleError(err,ctx.errorBox);}finally{hideLoading();}
      }
    }
  });

  // 4) QR CODE GENERATOR
  register("qr-generator", {
    title: "QR Code Generator", icon: "\u{1F4F1}", category: "image",
    desc: "Create QR codes for URLs, text and more.",
    longDesc: "Generate a downloadable QR code for any URL, text, Wi-Fi or contact info. Download as PNG.",
    render(ctx) {
      const wrap=el("div");
      const opts=el("div",{class:"options"},
        el("h4",{},"QR content"),
        el("div",{class:"opt-row"},
          el("input",{type:"text",id:"qrText",placeholder:"Enter a URL or text",value:"https://",style:"flex:1"}),
        ),
        el("div",{class:"opt-row"},
          el("label",{},"Size"),el("input",{type:"range",id:"qrSize",min:"128",max:"512",value:"256"}),
          el("span",{class:"val",id:"qrSizeV"},"256px")
        )
      );
      ctx.workspace.appendChild(opts);
      ctx.workspace.appendChild(el("div",{id:"qrPreview",class:"center mt",style:"padding:20px;background:#fff;border-radius:12px;display:inline-block;margin:0 auto"}));
      ctx.workspace.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",id:"qrDownload"},"Download PNG")));
      const lib=window.QRCode;
      function draw(){const txt=document.getElementById("qrText").value;const sz=parseInt(document.getElementById("qrSize").value,10);const prev=document.getElementById("qrPreview");prev.innerHTML="";const cnv=document.createElement("canvas");prev.appendChild(cnv);if(lib&&txt){lib.toCanvas(cnv,txt,{width:sz},function(){});}}
      document.getElementById("qrSize").addEventListener("input",()=>{document.getElementById("qrSizeV").textContent=document.getElementById("qrSize").value+"px";draw();});
      document.getElementById("qrText").addEventListener("input",draw);
      document.getElementById("qrDownload").addEventListener("click",()=>{
        const cnv=document.querySelector("#qrPreview canvas");if(!cnv){toast("Enter text first","error");return;}
        cnv.toBlob(b=>ctx.success("qr-code.png",b,"QR code ready!","Download your PNG."));
      });
      draw();
    }
  });

  // 5) IMAGE TO BASE64
  register("image-base64", {
    title: "Image to Base64", icon: "\u{1F9EE}", category: "image",
    desc: "Convert an image to a Base64 data URL.",
    longDesc: "Encode any image as a Base64 data URI - useful for embedding in HTML, CSS or JSON.",
    render(ctx) {
      let file=null;
      const dz=makeDropzone({accept:"image/*",icon:"\u{1F9EE}",multiple:false,filter:isImage,title:"Drop an image here",hint:"Get a Base64 data URL.",onFiles(fs){file=fs[0];draw();}});
      const panel=el("div");ctx.workspace.appendChild(dz);ctx.workspace.appendChild(panel);
      function draw(){
        panel.innerHTML="";if(!file)return;
        panel.appendChild(el("div",{class:"file-row"},
          el("div",{class:"thumb"},"IMG"),
          el("div",{class:"meta"},el("div",{class:"name"},file.name),el("div",{class:"info"},fmtSize(file.size))),
          el("div",{class:"actions"},el("button",{class:"btn btn-ghost btn-sm",onclick:()=>{file=null;draw();}},"Change"))
        ));
        panel.appendChild(el("div",{class:"row mt"},el("button",{class:"btn btn-primary btn-lg",onclick:run},"Convert to Base64")));
      }
      async function run(){
        ctx.reset();
        try{
          const fr=new FileReader();
          fr.onload=()=>{
            const dataUrl=fr.result;
            const box=el("div",{class:"options mt"},
              el("h4",{},"Base64 data URL"),
              el("textarea",{readonly:"readonly",style:"width:100%;height:120px;font-family:monospace;font-size:11px"},dataUrl),
              el("div",{class:"row mt"},el("button",{class:"btn btn-primary",onclick:()=>{navigator.clipboard.writeText(dataUrl);toast("Copied!","success");}},"Copy to clipboard"))
            );
            panel.appendChild(box);
            toast("Converted!","success");
          };
          fr.readAsDataURL(file);
        }catch(err){handleError(err,ctx.errorBox);}
      }
      draw();
    }
  });

})();
