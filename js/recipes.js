// ./js/recipes.js
(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);

  const nameEl = $("#rName");
  const catEl  = $("#rCat");
  const priceEl= $("#rPrice");
  const imgEl  = $("#rImg");
  const pubEl  = $("#rPub");
  const coverEl= $("#rCover");
  const saveBtn= $("#saveBtn");

  const stepsEl = $("#rSteps");
  const previewBox = $("#previewBox");
  const listEl = $("#list");
  const emptyEl = $("#empty");

  let editingId = null;
  let draftImage = "";
  let originalImage = "";
  let latestRecipes = [];

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function makeNoImage(){
    const div = document.createElement("div");
    div.className = "no-image";
    div.textContent = "NO IMAGE";
    return div;
  }

  function setPreview(src){
    previewBox.innerHTML = "";
    if (!src){
      previewBox.appendChild(makeNoImage());
      return;
    }

    const img = document.createElement("img");
    img.className = "preview__img";
    img.alt = "プレビュー";
    img.src = src;
    previewBox.appendChild(img);
  }

  function resetForm(){
    editingId = null;
    draftImage = "";
    originalImage = "";

    nameEl.value = "";
    catEl.value = "ご飯";
    priceEl.value = "0";
    stepsEl.value = "";
    imgEl.value = "";
    pubEl.checked = true;
    coverEl.checked = false;

    saveBtn.textContent = "保存";
    setPreview("");
  }

  function startEdit(r){
    editingId = r.id;
    originalImage = r.image || "";
    draftImage = r.image || "";

    nameEl.value = r.name || "";
    catEl.value = r.category || "ご飯";
    priceEl.value = String(Number(r.price) || 0);
    stepsEl.value = r.steps || "";
    pubEl.checked = !!r.published;
    coverEl.checked = !!r.catCover;

    imgEl.value = "";
    saveBtn.textContent = "更新する";
    setPreview(draftImage);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ==========================
     画像アップロード（HEIC対策 + 圧縮）
  ========================== */
  imgEl.addEventListener("change", async () => {
    const file = imgEl.files && imgEl.files[0];

    if (!file){
      draftImage = editingId ? (originalImage || "") : "";
      setPreview(draftImage);
      return;
    }

    // DataURL化
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }).catch(() => "");

    if (!dataUrl){
      alert("画像の読み込みに失敗しました");
      return;
    }

    const img = new Image();
    const canLoad = await new Promise((resolve)=>{
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });

    if (!canLoad){
      alert("この画像形式はブラウザで扱えません（HEICなど）。JPEGで保存してね。");
      draftImage = editingId ? (originalImage || "") : "";
      setPreview(draftImage);
      return;
    }

    // リサイズ＆圧縮
    const MAX = 900;
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (w > h && w > MAX){ h = Math.round(h * (MAX/w)); w = MAX; }
    if (h >= w && h > MAX){ w = Math.round(w * (MAX/h)); h = MAX; }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    draftImage = canvas.toDataURL("image/jpeg", 0.75);
    setPreview(draftImage);
  });

  function render(recipes){
    listEl.innerHTML = "";

    if (!recipes || recipes.length === 0){
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";

    recipes.forEach(r=>{
      const wrap = document.createElement("div");
      wrap.className = "item";

      const photo = document.createElement("div");
      photo.className = "item__photo";

      if (r.image){
        const img = document.createElement("img");
        img.src = r.image;
        img.alt = r.name;
        photo.appendChild(img);
      }else{
        photo.appendChild(makeNoImage());
      }

      const body = document.createElement("div");
      body.className = "item__body";
      body.innerHTML = `
        <div class="item__name">${escapeHtml(r.name)}</div>
        <div class="item__meta">カテゴリ：${escapeHtml(r.category)}</div>
        <div class="item__meta">価格：${Number(r.price)||0}円</div>
        <div class="item__meta">メニュー表示：${r.published?"ON":"OFF"}</div>
        <div class="item__meta">カテゴリ画像：${r.catCover?"ON":"OFF"}</div>
        <div class="item__actions">
          <button class="btn-mini js-edit" data-id="${r.id}">編集</button>
          <button class="btn-mini js-del" data-id="${r.id}">削除</button>
        </div>
      `;

      wrap.appendChild(photo);
      wrap.appendChild(body);
      listEl.appendChild(wrap);
    });
  }

  saveBtn.addEventListener("click", async ()=>{
    const name = nameEl.value.trim();
    if (!name){
      alert("料理名を入力してね");
      return;
    }

    const imageToSave =
      draftImage ||
      (editingId ? (originalImage || "") : "");

    await window.SharedDB.upsertRecipe({
      id: editingId || undefined,
      name,
      category: catEl.value,
      price: Number(priceEl.value)||0,
      image: imageToSave,
      steps: stepsEl.value.trim(),
      published: pubEl.checked,
      catCover: coverEl.checked,
    });

    resetForm();
  });

  async function boot(){
    window.SharedDB.ensureRoomId();
    await window.SharedDB.subscribeRecipes((recipes)=>{
      latestRecipes = recipes||[];
      render(latestRecipes);
    });
  }

  boot();
})();