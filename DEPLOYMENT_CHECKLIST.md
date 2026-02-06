# ✅ Render 部署檢查清單

## 📋 部署前準備

### ✅ 已完成的項目

- [x] Git 已初始化
- [x] 建立 `render.yaml` 部署配置
- [x] 建立 `.env.example` 範例檔案
- [x] 建立 `.gitignore` 防止敏感資料外洩
- [x] 更新 Backend CORS 設定支援 Render
- [x] Frontend 改為 Light Mode
- [x] 建立部署文件（README.md, DEPLOY.md, QUICKSTART.md）
- [x] 建立部署腳本（prepare-deploy.ps1）

### 📝 您需要完成的項目

#### 1. Supabase 設定（必要）
- [ ] 在 https://supabase.com 註冊帳號
- [ ] 建立新專案
- [ ] 執行 SQL 建立資料表（參考 QUICKSTART.md）
- [ ] 建立 Storage bucket `image` 並設為 Public
- [ ] 複製 SUPABASE_URL 和 SUPABASE_KEY

#### 2. GitHub 設定（必要）
- [ ] 在 https://github.com/new 建立新 repository
- [ ] 執行以下指令推送程式碼：
  ```bash
  git remote add origin https://github.com/你的帳號/你的repo.git
  git branch -M main
  git push -u origin main
  ```

#### 3. Render 部署（必要）
- [ ] 在 https://render.com 註冊（用 GitHub 登入）
- [ ] 建立 Blueprint（選擇你的 GitHub repo）
- [ ] 在 Backend 服務設定環境變數：
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
- [ ] 等待部署完成（3-5 分鐘）

#### 4. 測試部署（建議）
- [ ] 訪問 Frontend URL
- [ ] 等待 Backend 喚醒（首次 30-90 秒）
- [ ] 測試建立設備
- [ ] 測試建立活動
- [ ] 測試圖片上傳
- [ ] 測試資料備份/還原

---

## 🔧 部署配置文件說明

### `render.yaml`
定義了兩個服務：
- **Backend** (Web Service): FastAPI API 伺服器
- **Frontend** (Static Site): React 靜態網站

### 環境變數
**Frontend**:
- `VITE_API_URL`: 自動從 Backend 服務取得

**Backend**:
- `SUPABASE_URL`: 需手動設定
- `SUPABASE_KEY`: 需手動設定

---

## 📊 部署架構

```
┌─────────────────┐
│   使用者瀏覽器   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Render Static Site     │
│  (Frontend - React)     │
│  免費方案               │
└────────┬────────────────┘
         │ API 請求
         ▼
┌─────────────────────────┐
│  Render Web Service     │
│  (Backend - FastAPI)    │
│  免費方案               │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Supabase               │
│  - PostgreSQL Database  │
│  - Storage (Images)     │
│  免費方案               │
└─────────────────────────┘
```

---

## ⚠️ 免費方案限制

### Render 免費方案
- ✅ 750 小時/月免費時數
- ✅ 100 GB 出站流量
- ⚠️ 閒置 15 分鐘後自動休眠
- ⚠️ 喚醒需要 30-90 秒
- ⚠️ 每月自動休眠並清除暫存檔案

### Supabase 免費方案
- ✅ 500 MB 資料庫空間
- ✅ 1 GB 檔案儲存
- ✅ 2 GB 出站流量/月
- ⚠️ 專案閒置 1 週後暫停

---

## 🚀 部署後優化建議

### 效能優化
1. 考慮使用 CDN（Cloudflare）加速靜態資源
2. 實作 API 快取減少資料庫查詢
3. 壓縮圖片上傳（前端處理）

### 安全性強化
1. 更新 Backend CORS 為特定網域（移除 `*`）
2. 實作 API Rate Limiting
3. 新增使用者認證（Supabase Auth）

### 監控與日誌
1. 設定 Render 的 Health Check
2. 使用 Sentry 追蹤錯誤
3. 設定 Uptime 監控（如 UptimeRobot）

---

## 📞 需要幫助？

### 文件資源
- [QUICKSTART.md](./QUICKSTART.md) - 5 分鐘快速部署
- [DEPLOY.md](./DEPLOY.md) - 詳細部署指南
- [README.md](./README.md) - 專案說明

### 外部資源
- [Render 文件](https://render.com/docs)
- [Supabase 文件](https://supabase.com/docs)
- [FastAPI 文件](https://fastapi.tiangolo.com)
- [React 文件](https://react.dev)

---

**準備好了嗎？開始部署吧！🚀**

執行 `./prepare-deploy.ps1` 開始第一步！
