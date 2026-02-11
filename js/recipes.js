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

    img.onerror = () => {
      draftImage = "";
      previewBox.innerHTML = "";
      previewBox.appendChild(makeNoImage());
    };

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

  imgEl.addEventListener("change", () => {
    const file = imgEl.files && imgEl.files[0];
    if (!file){
      draftImage = editingId ? (originalImage || "") : "";
      setPreview(draftImage);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      draftImage = String(reader.result || "");
      setPreview(draftImage);
    };
    reader.readAsDataURL(file);
  });

  function render(recipes){
    const list = recipes || [];
    listEl.innerHTML = "";

    if (list.length === 0){
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";

    list.forEach(r => {
      const wrap = document.createElement("div");
      wrap.className = "item";

      const photo = document.createElement("div");
      photo.className = "item__photo";
      if (r.image){
        const img = document.createElement("img");
        img.alt = r.name;
        img.src = r.image;
        img.onerror = () => {
          photo.innerHTML = "";
          photo.appendChild(makeNoImage());
        };
        photo.appendChild(img);
      } else {
        photo.appendChild(makeNoImage());
      }

      const body = document.createElement("div");
      body.className = "item__body";
      body.innerHTML = `
        <div class="item__name">${escapeHtml(r.name)}</div>
        <div class="item__meta">カテゴリ：${escapeHtml(r.category || "")}</div>
        <div class="item__meta">価格：${Number(r.price)||0}円</div>
        <div class="item__meta">メニュー表示：${r.published ? "ON" : "OFF"}</div>
        <div class="item__meta">カテゴリ画像：${r.catCover ? "ON" : "OFF"}</div>

        <div class="item__actions">
          <button class="btn-mini btn-mini--neutral js-edit" data-id="${escapeHtml(r.id)}" type="button">編集</button>
          <button class="btn-mini btn-mini--neutral js-toggle-pub" data-id="${escapeHtml(r.id)}" type="button">メニュー表示を切替</button>
          <button class="btn-mini btn-mini--neutral js-toggle-cover" data-id="${escapeHtml(r.id)}" type="button">カテゴリ画像を切替</button>
          <button class="btn-mini btn-mini--danger js-del" data-id="${escapeHtml(r.id)}" type="button">削除</button>
        </div>
      `;

      wrap.appendChild(photo);
      wrap.appendChild(body);
      listEl.appendChild(wrap);
    });

    const oldCancel = document.getElementById("cancelEditBtn");
    if (oldCancel) oldCancel.remove();

    if (editingId){
      const cancel = document.createElement("button");
      cancel.id = "cancelEditBtn";
      cancel.type = "button";
      cancel.className = "btn-mini btn-mini--neutral";
      cancel.style.marginTop = "10px";
      cancel.textContent = "編集をキャンセル";
      cancel.addEventListener("click", () => resetForm());
      saveBtn.insertAdjacentElement("afterend", cancel);
    }
  }

  // actions
  listEl.addEventListener("click", async (e) => {
    const t = e.target;
    const id = t?.dataset?.id;
    if (!id) return;

    const r = latestRecipes.find(x => x.id === id);
    if (!r) return;

    if (t.classList.contains("js-edit")){
      startEdit(r);
      render(latestRecipes);
      return;
    }

    if (t.classList.contains("js-del")){
      if (!confirm("このレシピを削除しますか？")) return;
      await window.SharedDB.deleteRecipe(id);
      if (editingId === id) resetForm();
      return;
    }

    if (t.classList.contains("js-toggle-pub")){
      await window.SharedDB.upsertRecipe({ ...r, published: !r.published });
      return;
    }

    if (t.classList.contains("js-toggle-cover")){
      const cat = r.category;
      // 同カテゴリの他coverをOFF
      for (const x of latestRecipes){
        if (x.category === cat && x.catCover){
          await window.SharedDB.upsertRecipe({ ...x, catCover: false });
        }
      }
      await window.SharedDB.upsertRecipe({ ...r, catCover: true });
      return;
    }
  });

  saveBtn.addEventListener("click", async () => {
    const name = (nameEl.value || "").trim();
    if (!name){
      alert("料理名を入力してね");
      return;
    }

    const imageToSave = draftImage || (editingId ? (originalImage || "") : "");

    // coverをONなら同カテゴリの他coverをOFF（1カテゴリ1枚）
    if (coverEl.checked){
      const cat = catEl.value;
      for (const x of latestRecipes){
        if (x.category === cat && x.catCover){
          await window.SharedDB.upsertRecipe({ ...x, catCover: false });
        }
      }
    }

    await window.SharedDB.upsertRecipe({
      id: editingId || undefined,
      name,
      category: catEl.value,
      price: Number(priceEl.value) || 0,
      image: imageToSave,
      steps: (stepsEl.value || "").trim(),
      published: pubEl.checked,
      catCover: coverEl.checked,
    });

    resetForm();
  });

  async function boot(){
    window.SharedDB.ensureRoomId();
    await window.SharedDB.subscribeRecipes((recipes) => {
      latestRecipes = recipes || [];
      render(latestRecipes);
    });

    setPreview("");
    render([]);
  }

  boot();
})();