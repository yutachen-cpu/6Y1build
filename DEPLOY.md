# 部署到 Render 免費方案指南

## 前置準備

### 1. 註冊 Render 帳號
- 前往 [Render.com](https://render.com)
- 使用 GitHub 帳號註冊（推薦）

### 2. 設定 Supabase 資料庫（如果還沒有）
- 前往 [Supabase.com](https://supabase.com)
- 建立新專案
- 在專案 Settings > API 中取得：
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`（公開金鑰）

### 3. 在 Supabase 建立資料表
執行以下 SQL 建立必要的資料表：

```sql
-- 建立 inventory 資料表
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

-- 建立 events 資料表
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

### 4. 建立 Supabase Storage Bucket
- 在 Supabase 專案中前往 Storage
- 建立名為 `image` 的 bucket
- 設定為 Public（允許公開讀取）

## 部署步驟

### 方法一：使用 Render Blueprint（推薦）

1. **將程式碼推送到 GitHub**
   ```bash
   cd "c:\Users\yutachen\Downloads\6y1設備管理"
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   git branch -M main
   git remote add origin https://github.com/你的帳號/你的倉庫名稱.git
   git push -u origin main
   ```

2. **在 Render 建立 Blueprint**
   - 登入 Render Dashboard
   - 點擊 "New" > "Blueprint"
   - 連接你的 GitHub 倉庫
   - Render 會自動偵測 `render.yaml` 並建立兩個服務：
     - `6y1-equipment-backend` (Backend API)
     - `6y1-equipment-frontend` (Frontend)

3. **設定環境變數**
   
   在 Backend 服務中設定：
   - `SUPABASE_URL`: 你的 Supabase URL
   - `SUPABASE_KEY`: 你的 Supabase Anon Key

   Frontend 的 `VITE_API_URL` 會自動從 Backend 服務取得

4. **等待部署完成**
   - Backend 部署需要約 3-5 分鐘
   - Frontend 部署需要約 2-3 分鐘

### 方法二：手動建立服務

#### Backend 部署

1. 在 Render Dashboard 點擊 "New" > "Web Service"
2. 連接 GitHub 倉庫
3. 設定如下：
   - **Name**: `6y1-equipment-backend`
   - **Region**: Singapore
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

4. 新增環境變數：
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

5. 點擊 "Create Web Service"

#### Frontend 部署

1. 在 Render Dashboard 點擊 "New" > "Static Site"
2. 連接同一個 GitHub 倉庫
3. 設定如下：
   - **Name**: `6y1-equipment-frontend`
   - **Region**: Singapore
   - **Branch**: main
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. 新增環境變數：
   - `VITE_API_URL`: `https://你的backend服務名稱.onrender.com/api`
   
5. 點擊 "Create Static Site"

## 重要注意事項

### Render 免費方案限制
- ⚠️ **服務會在閒置 15 分鐘後自動休眠**
- ⚠️ **首次喚醒需要 30-90 秒**
- ✅ 每月有 750 小時免費時數（足夠一個服務全天候運行）
- ✅ 100 GB 出站流量

### CORS 設定
Backend 的 CORS 已設定為允許所有來源（`*`）。部署後建議更新為：

```python
origins = [
    "https://你的frontend網址.onrender.com",
    "http://localhost:5173",  # 開發環境
]
```

### 資料庫遷移
首次部署後，本地的資料會自動同步到 Supabase（已在 App.tsx 中實作遷移邏輯）。

## 測試部署

1. 開啟 Frontend URL（例如：`https://6y1-equipment-frontend.onrender.com`）
2. 等待 30-90 秒讓 Backend 喚醒（首次載入）
3. 檢查瀏覽器開發者工具的 Network 標籤，確認 API 請求成功

## 故障排除

### Backend 無法連接
- 檢查 Supabase 環境變數是否正確設定
- 查看 Render Backend 服務的 Logs

### Frontend 畫面空白
- 檢查 `VITE_API_URL` 是否正確指向 Backend
- 確認 Backend 服務已成功啟動

### 圖片上傳失敗
- 確認 Supabase Storage bucket `image` 已建立並設為 Public

## 更新部署

每次推送到 GitHub 的 main 分支，Render 會自動重新部署：

```bash
git add .
git commit -m "Update: 你的更新說明"
git push
```

## 支援

如有問題，請查看：
- [Render 文件](https://render.com/docs)
- [Supabase 文件](https://supabase.com/docs)
