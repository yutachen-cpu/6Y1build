# 🔧 CORS 問題修復指南

## ❌ 問題

部署到 Render 後出現以下錯誤：
```
Access to fetch at 'https://sixy1build.onrender.com/api/inventory' 
from origin 'https://sixy1build-1.onrender.com' 
has been blocked by CORS policy
```

## 🎯 原因

1. **前端和後端在不同域名**
   - 前端：`https://sixy1build-1.onrender.com`
   - 後端：`https://sixy1build.onrender.com`

2. **CORS 配置有誤**
   - 原本的配置有語法錯誤
   - `https://*.onrender.com` 通配符在 FastAPI 中不生效
   - 需要明確列出每個允許的域名

## ✅ 已修復

我已經更新了 `backend/main.py` 的 CORS 配置：

### 修改內容：
1. ✅ 修正了 origins 列表的語法錯誤
2. ✅ 明確添加前端域名 `https://sixy1build-1.onrender.com`
3. ✅ 支援從環境變數讀取 CORS_ORIGINS
4. ✅ 添加調試輸出顯示允許的域名

### 配置內容：
```python
origins = [
    "http://localhost:5173",      # 本地開發
    "http://localhost:8888",      # 你的 Vite 端口
    "http://localhost:3000",      # 備用端口
    "https://sixy1build.onrender.com",      # 後端域名
    "https://sixy1build-1.onrender.com",    # 前端域名 ✨
]
```

## 🚀 部署步驟

### 方法 1: Git 推送（推薦）

```bash
git add backend/main.py
git commit -m "fix: 修復 CORS 配置，添加前端域名"
git push origin main
```

Render 會自動重新部署後端服務。

### 方法 2: 在 Render Dashboard 設置環境變數

如果你的前端域名可能改變，可以設置環境變數：

1. 登入 [Render Dashboard](https://dashboard.render.com/)
2. 選擇後端服務 `6y1-equipment-backend`
3. 進入 **Environment** 標籤
4. 添加環境變數：
   - Key: `CORS_ORIGINS`
   - Value: `https://sixy1build-1.onrender.com,https://your-other-frontend.com`

5. 保存並重新部署

## 🧪 測試

部署完成後：

1. 打開前端網站 `https://sixy1build-1.onrender.com`
2. 打開瀏覽器開發者工具（F12）
3. 切換到 **Console** 標籤
4. 刷新頁面

### 預期結果：

✅ **修復前（錯誤）：**
```
Access to fetch blocked by CORS policy
TypeError: Failed to fetch
```

✅ **修復後（正常）：**
```
✅ CORS enabled for origins: [...]
成功載入資料
```

## 📊 驗證清單

- [ ] 後端已更新 CORS 配置
- [ ] 推送到 Git 並部署
- [ ] 等待 Render 重新部署（約 2-3 分鐘）
- [ ] 檢查後端日誌確認 CORS 配置
- [ ] 測試前端是否能成功載入資料
- [ ] 檢查瀏覽器 Console 無 CORS 錯誤

## 🔍 調試技巧

### 1. 檢查後端日誌
在 Render Dashboard → Backend Service → Logs

應該看到：
```
✅ CORS enabled for origins: ['http://localhost:5173', ..., 'https://sixy1build-1.onrender.com']
```

### 2. 檢查實際請求
在瀏覽器開發者工具 → Network 標籤：

- 查看 API 請求的 Headers
- 確認有以下 Response Headers：
  ```
  access-control-allow-origin: https://sixy1build-1.onrender.com
  access-control-allow-credentials: true
  ```

### 3. 測試 OPTIONS 預檢請求
CORS 會發送 OPTIONS 預檢請求，確保它返回正確的 headers。

## 💡 進階配置

### 生產環境建議

1. **使用環境變數**（更靈活）
   ```bash
   CORS_ORIGINS=https://production-frontend.com,https://staging-frontend.com
   ```

2. **限制 allow_credentials**
   ```python
   allow_credentials=True  # 只在需要 cookies 時使用
   ```

3. **限制 methods 和 headers**
   ```python
   allow_methods=["GET", "POST", "PUT", "DELETE"]
   allow_headers=["Content-Type", "Authorization"]
   ```

### 開發環境快速測試

如果只是臨時測試，可以暫時允許所有域名：
```python
origins = ["*"]  # ⚠️ 僅用於測試，生產環境不要用！
```

## 🆘 還是不行？

1. **清除瀏覽器快取** → Ctrl+Shift+Delete
2. **確認後端已重新部署** → 檢查 Render Logs
3. **確認前端 API URL 正確** → 檢查 `api.ts` 中的 `API_URL`
4. **檢查網路請求** → 開發者工具 Network 標籤

---

**準備好了就推送吧！** 🚀

```bash
git add backend/main.py
git commit -m "fix: CORS configuration for Render deployment"
git push origin main
```
