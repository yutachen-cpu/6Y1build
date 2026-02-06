# 快速部署參考指南

## ⚡ 5 分鐘快速部署到 Render

### 步驟 1: 準備 Supabase（2 分鐘）

1. 前往 https://supabase.com → 註冊/登入
2. 建立新專案（選擇免費方案）
3. 等待專案建立完成
4. 前往 **SQL Editor** 執行以下 SQL：

```sql
CREATE TABLE inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  owner TEXT,
  "imageUrl" TEXT,
  stock INTEGER DEFAULT 0,
  unit TEXT,
  status TEXT,
  dimensions TEXT,
  weight TEXT,
  description TEXT,
  "extraProps" JSONB
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  status TEXT,
  "startDate" TEXT,
  "endDate" TEXT,
  "displayContent" TEXT,
  logistics JSONB,
  allocations JSONB,
  "adHocItems" JSONB,
  workflow JSONB,
  signatures JSONB,
  "createdAt" BIGINT
);
```

5. 前往 **Storage** → 建立 bucket 名為 `image`，設為 Public
6. 前往 **Settings** → **API** → 複製：
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_KEY)

### 步驟 2: 推送到 GitHub（1 分鐘）

```bash
# 如果還沒有 GitHub repo，先在 https://github.com/new 建立

git remote add origin https://github.com/你的帳號/你的repo名稱.git
git branch -M main
git push -u origin main
```

### 步驟 3: 部署到 Render（2 分鐘）

1. 前往 https://render.com → 用 GitHub 登入
2. 點擊 **New +** → **Blueprint**
3. 選擇剛才的 GitHub repository
4. Render 會自動偵測 `render.yaml` 並建立兩個服務
5. 在 **6y1-equipment-backend** 服務：
   - 點擊 **Environment**
   - 新增環境變數：
     - `SUPABASE_URL` = 你的 Supabase URL
     - `SUPABASE_KEY` = 你的 Supabase Anon Key
6. 等待部署完成（3-5 分鐘）

### 步驟 4: 完成！🎉

- Frontend URL: `https://6y1-equipment-frontend.onrender.com`
- Backend URL: `https://6y1-equipment-backend.onrender.com`

⚠️ **注意**: 免費方案會在閒置 15 分鐘後休眠，首次訪問需等待 30-90 秒喚醒。

---

## 🔄 更新部署

```bash
git add .
git commit -m "更新說明"
git push
```

Render 會自動重新部署！

---

## 🆘 常見問題

### Q: Backend 無法連線？
**A**: 等待 30-90 秒讓服務喚醒（免費方案限制）

### Q: 畫面空白？
**A**: 檢查瀏覽器 Console，確認 Backend 環境變數設定正確

### Q: 圖片上傳失敗？
**A**: 確認 Supabase Storage bucket `image` 已建立並設為 Public

### Q: 想要自訂服務名稱？
**A**: 編輯 `render.yaml` 中的 `name` 欄位，然後重新推送

---

## 📞 需要幫助？

詳細說明請參考 [DEPLOY.md](./DEPLOY.md)
