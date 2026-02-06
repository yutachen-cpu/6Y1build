# 6Y1 活動展期與設備管理系統

一個全功能的活動排程與設備資源管理系統，支援智慧衝突檢測、圖片上傳、資料備份還原等功能。

## 🌟 主要功能

### 📊 數據看板
- 即時監控進行中活動數量
- 智慧庫存衝突警報
- 活動類別統計（客戶/展會/內部）
- 未來 72 小時活動快照
- 資產分佈圖表

### 📅 活動排程管理
- 建立、編輯、刪除活動
- 多種活動類型支援（客戶活動、展會、內部活動）
- 狀態追蹤（規劃中、執行中、撤場中、已結束）
- 設備分配與檢視
- 智慧衝突檢測

### 📦 設備資產管理
- 設備清單管理（新增、編輯、刪除）
- 分類管理（影像、音響、IT、燈光等）
- 庫存追蹤
- 圖片上傳與預覽
- 批量匯入匯出

### ✅ 檢查表助手
- 自動產生活動前置檢查表
- 工作流程管理（報價、送審、裝箱等）
- 簽名審核機制
- 可列印檢查表

### 💾 資料管理
- 雲端資料庫同步（Supabase）
- 本地資料備份（ZIP 格式）
- 資料還原功能
- LocalStorage 到雲端的自動遷移

## 🚀 技術架構

### Frontend
- **框架**: React 19 + TypeScript
- **建置工具**: Vite 6
- **UI 框架**: Tailwind CSS
- **圖表**: Recharts
- **圖示**: Lucide React

### Backend
- **框架**: FastAPI (Python)
- **資料庫**: Supabase (PostgreSQL)
- **檔案儲存**: Supabase Storage
- **CORS**: 支援跨域請求

## 📦 本地開發

### 前置需求
- Node.js 18+
- Python 3.11+
- Git

### 安裝步驟

1. **Clone 專案**
   ```bash
   git clone https://github.com/你的帳號/你的repo.git
   cd 6y1設備管理
   ```

2. **安裝 Frontend 依賴**
   ```bash
   npm install
   ```

3. **安裝 Backend 依賴**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **設定環境變數**
   
   Frontend (.env.local):
   ```
   VITE_API_URL=http://localhost:5555/api
   ```
   
   Backend (backend/.env):
   ```
   SUPABASE_URL=你的_supabase_url
   SUPABASE_KEY=你的_supabase_key
   ```

5. **啟動服務**
   
   Terminal 1 - Frontend:
   ```bash
   npm run dev
   ```
   
   Terminal 2 - Backend:
   ```bash
   cd backend
   uvicorn main:app --port 5555
   ```

6. **開啟瀏覽器**
   ```
   http://localhost:5173
   ```

## 🌐 部署到 Render

### 快速部署

1. **執行部署準備腳本**
   ```powershell
   ./prepare-deploy.ps1
   ```

2. **推送到 GitHub**
   ```bash
   git remote add origin https://github.com/你的帳號/你的repo.git
   git branch -M main
   git push -u origin main
   ```

3. **在 Render 建立 Blueprint**
   - 前往 [Render.com](https://render.com)
   - 點擊 "New +" > "Blueprint"
   - 選擇你的 GitHub repository
   - Render 會自動偵測 `render.yaml`

4. **設定環境變數**
   - 在 Backend 服務設定 `SUPABASE_URL` 和 `SUPABASE_KEY`

詳細部署說明請參考 [DEPLOY.md](./DEPLOY.md)

## 📁 專案結構

```
6y1設備管理/
├── backend/              # FastAPI 後端
│   ├── main.py          # 主要 API 端點
│   ├── requirements.txt # Python 依賴
│   └── .env             # 環境變數（不提交）
├── components/          # React 元件
│   ├── Dashboard.tsx
│   ├── EventManager.tsx
│   ├── InventoryManager.tsx
│   ├── ChecklistAssistant.tsx
│   ├── Toast.tsx
│   └── ImagePreview.tsx
├── App.tsx              # 主應用程式
├── index.tsx            # React 入口點
├── api.ts               # API 客戶端
├── types.ts             # TypeScript 類型定義
├── utils.ts             # 工具函數
├── index.html           # HTML 模板
├── package.json         # Node.js 依賴
├── vite.config.ts       # Vite 配置
├── render.yaml          # Render 部署配置
└── DEPLOY.md            # 部署指南
```

## 🔐 環境變數說明

### Frontend
- `VITE_API_URL`: Backend API 的 URL

### Backend
- `SUPABASE_URL`: Supabase 專案 URL
- `SUPABASE_KEY`: Supabase Anon/Public Key

## 📝 資料庫結構

### inventory 表
- `id`: 設備唯一識別碼
- `name`: 設備名稱
- `category`: 分類
- `owner`: 所有者
- `stock`: 庫存數量
- `unit`: 單位
- `status`: 狀態
- `imageUrl`: 圖片 URL
- `dimensions`: 尺寸
- `weight`: 重量
- `description`: 描述

### events 表
- `id`: 活動唯一識別碼
- `title`: 活動標題
- `category`: 類別
- `status`: 狀態
- `startDate`: 開始日期
- `endDate`: 結束日期
- `logistics`: 物流資訊 (JSONB)
- `allocations`: 設備分配 (JSONB)
- `adHocItems`: 臨時項目 (JSONB)
- `workflow`: 工作流程 (JSONB)
- `signatures`: 簽名 (JSONB)

## 🐛 故障排除

### Backend 連線失敗
- 檢查 Backend 是否啟動：`http://localhost:5555`
- 確認環境變數設定正確

### 圖片上傳失敗
- 確認 Supabase Storage bucket `image` 已建立
- 檢查 bucket 權限設定為 Public

### 資料無法同步
- 檢查 Supabase 資料表是否正確建立
- 查看瀏覽器 Console 的錯誤訊息

## 📄 授權

MIT License

## 👥 貢獻

歡迎提交 Issues 和 Pull Requests！

## 📧 聯絡方式

如有問題或建議，請開 Issue 或聯絡專案維護者。
