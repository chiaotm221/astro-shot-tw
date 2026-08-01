# AstroShot Taiwan — V1.1 開發計畫

## 1. 版本目標

V1.1 的目標是加入「台灣觀測地點選擇器」，讓使用者可以從介面直接切換台灣不同觀測地點，並依選定地點的經緯度重新計算與顯示星空。

本版本必須具備可見的介面變化，但不可破壞既有星空渲染、相機操作、時間控制、Milky Way WebGL 顯示或 Cloudflare Pages 部署流程。

---

## 2. 專案現況

- Framework：Next.js 16
- React：React 19
- Language：TypeScript
- Router：Next.js App Router
- 其他建置支援：Vite / vinext、Cloudflare
- 主要頁面入口：`app/page.tsx`
- 主要星空元件：`app/SkySimulator.tsx`
- 天文投影輔助：`app/rendering-helpers.mjs`
- 既有觀測地資料：`app/simulation/observing-sites.ts`
- 既有設定：`app/simulation/settings.ts`
- 既有天文時間計算：`app/simulation/astronomy-time.ts`

主要渲染區域：

- Canvas setup：約 `app/SkySimulator.tsx` 第 1925 行
- 背景與銀河：約第 2183 行
- 恆星渲染：約第 2230 行
- Animation loop：約第 2630 行
- 天文投影 helpers：`app/rendering-helpers.mjs` 約第 85 行

---

## 3. 開發原則

1. 先完整分析現有程式，再修改。
2. 不要大幅重寫 `SkySimulator.tsx`。
3. 不要改變現有星空投影公式。
4. 不要改變 Canvas 2D 與 WebGL 的既有渲染流程。
5. 不要移除任何現有功能。
6. 新功能應模組化，避免把更多 UI 程式塞入 `SkySimulator.tsx`。
7. TypeScript 不得使用不必要的 `any`。
8. 保持靜態匯出與 Cloudflare Pages 相容。
9. 不要加入新的第三方套件，除非現有功能無法完成。
10. 修改前先提出執行計畫；完成後列出實際修改檔案與測試結果。

---

## 4. V1.1 功能需求

### 4.1 台灣觀測地點

至少提供以下地點：

| ID | 顯示名稱 | 縣市／區域 | 緯度 | 經度 |
|---|---|---|---:|---:|
| taipei | 台北 | 台北市 | 25.0330 | 121.5654 |
| taichung | 台中 | 台中市 | 24.1477 | 120.6736 |
| tainan | 台南 | 台南市 | 22.9999 | 120.2269 |
| kaohsiung | 高雄 | 高雄市 | 22.6273 | 120.3014 |
| alishan | 阿里山 | 嘉義縣 | 23.5100 | 120.8050 |
| hehuanshan | 合歡山 | 南投／花蓮交界 | 24.1420 | 121.2840 |
| kenting | 墾丁 | 屏東縣 | 21.9460 | 120.7960 |

座標可以保留合理的小數精度。請先檢查 `app/simulation/observing-sites.ts` 是否已存在部分資料，避免重複定義。

### 4.2 地點資料型別

在 `app/simulation/observing-sites.ts` 中建立或完善明確型別，例如：

```ts
export interface ObservingSite {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  elevation?: number;
}
```

並匯出：

```ts
export const OBSERVING_SITES: readonly ObservingSite[]
```

可另外提供預設地點常數與依 ID 取得地點的 helper。

### 4.3 地點選擇器 UI

新增獨立元件，建議路徑：

```text
app/components/ObservingSiteSelector.tsx
```

若專案已有固定 UI 元件資料夾，應遵循現有結構，不要重複建立相似資料夾。

選擇器需符合：

- 顯示目前選定地點。
- 可展開並切換其他台灣地點。
- 使用原生 `<select>` 或符合現有介面風格的簡單控制元件。
- 不加入大型 UI framework。
- 桌面與行動裝置皆可操作。
- 不遮住主要相機與星空控制介面。
- 文字以繁體中文顯示。
- 可顯示地點名稱，必要時附縣市／區域。
- 加入適當的 `aria-label`。

### 4.4 與 SkySimulator 整合

在 `SkySimulator.tsx`：

1. 建立目前觀測地點的 state。
2. 預設地點使用現有預設座標；若現有預設不明確，使用台北。
3. 將原先固定的 latitude / longitude 改為目前選定地點的資料。
4. 切換地點後，所有依緯度與經度計算的星空位置必須更新。
5. 不重新載入整個頁面。
6. 不建立第二套天文計算邏輯。
7. 優先重用既有 state、settings 或 calculation flow。
8. 避免每一幀建立不必要的新物件。

### 4.5 儲存使用者選擇

建議使用 `localStorage` 儲存最後選定的觀測地點 ID。

要求：

- 僅在 client side 存取 `localStorage`。
- 若讀取到不存在的 ID，回到預設地點。
- 不可造成 Next.js hydration error。
- localStorage 功能若有風險，可獨立封裝為小型 helper。
- 儲存功能不應阻止主要功能運作。

建議 key：

```text
astro-shot-observing-site
```

### 4.6 畫面顯示

切換地點後，介面上至少要能清楚看見目前地點，例如：

```text
觀測地點：合歡山
```

若現有介面已有地點或座標欄位，應直接整合，不要重複顯示兩套資訊。

---

## 5. 建議修改檔案

預期修改：

```text
app/SkySimulator.tsx
app/simulation/observing-sites.ts
```

預期新增：

```text
app/components/ObservingSiteSelector.tsx
```

可能修改：

```text
app/i18n/translations.ts
app/i18n/types.ts
```

只有在專案目前已使用翻譯系統管理同類文字時，才修改 i18n 檔案。

不要因本功能修改：

```text
app/rendering-helpers.mjs
next.config.ts
package.json
worker/
```

除非分析後能明確說明必要原因。

---

## 6. 實作順序

### Phase 1：分析

1. 讀取 `app/SkySimulator.tsx`。
2. 找出目前 latitude 與 longitude 的來源。
3. 找出所有依賴觀測座標的 hooks、memo、effects、render loop 與 helper。
4. 讀取 `app/simulation/observing-sites.ts`。
5. 確認 UI 元件的既有放置位置與樣式。
6. 提出修改計畫，先不要寫檔。

### Phase 2：資料層

1. 建立或完善 `ObservingSite` 型別。
2. 加入七個台灣觀測地點。
3. 加入預設地點與查詢 helper。
4. 確認沒有重複資料。

### Phase 3：UI 元件

1. 建立 `ObservingSiteSelector`。
2. 使用受控元件。
3. 加入繁體中文標籤與 accessibility。
4. 延續現有介面樣式。

### Phase 4：SkySimulator 整合

1. 加入 selected site state。
2. 將座標接入現有天文計算。
3. 加入 localStorage 邏輯。
4. 放置選擇器。
5. 確認切換地點即時更新星空。

### Phase 5：驗證

1. 執行 TypeScript 檢查。
2. 執行 lint。
3. 執行正式 build。
4. 檢查是否產生 hydration error。
5. 檢查 Canvas 與 WebGL console error。
6. 檢查所有七個地點可切換。
7. 檢查重新整理後是否保留選擇。
8. 檢查行動版選擇器不遮擋主要功能。

---

## 7. 驗收標準

V1.1 完成需同時符合：

- [ ] 畫面上出現「觀測地點」選擇器。
- [ ] 至少有台北、台中、台南、高雄、阿里山、合歡山、墾丁。
- [ ] 切換地點後不需重新整理頁面。
- [ ] 切換後星空投影會依新的經緯度更新。
- [ ] 畫面會顯示目前選定地點。
- [ ] 重新整理後可保留最後選擇。
- [ ] 無 TypeScript 錯誤。
- [ ] 無新增 lint 錯誤。
- [ ] Production build 成功。
- [ ] 無 hydration 錯誤。
- [ ] 無 Canvas 或 WebGL runtime error。
- [ ] 原有相機、時間、星空與銀河功能正常。
- [ ] Cloudflare Pages 靜態部署仍相容。
- [ ] 不新增不必要的 dependency。

---

## 8. Codex 執行指令

請將以下內容連同本計畫交給 Codex：

```text
Implement AstroShot Taiwan V1.1 according to the attached plan.

Important workflow:

1. First inspect the relevant project files and summarize the current latitude/longitude data flow.
2. Before modifying files, provide a concise implementation plan and list the files you intend to change.
3. Then implement the feature.
4. Preserve all existing rendering, camera, time control, Canvas 2D, WebGL, static export, and Cloudflare Pages behavior.
5. Do not perform unrelated refactoring.
6. Do not add new dependencies unless absolutely necessary.
7. After implementation, run the available type-check, lint, test, and production build commands.
8. Report:
   - files changed,
   - important implementation decisions,
   - commands executed,
   - test/build results,
   - any remaining risks.
```

---

## 9. Git 建議

完成並檢查變更後，Git commit summary 建議使用：

```text
V1.1 Add Taiwan observing site selector
```

在 GitHub Desktop 中：

1. 檢查 Changed files。
2. 確認沒有不相關檔案。
3. Commit to main。
4. Push origin。
5. 等待 Cloudflare Pages 自動部署。
6. 開啟正式網站實際測試七個地點。

---

# 10. 後續開發方向與版本大綱

本章是 AstroShot Taiwan 在 V1.1 之後的建議發展藍圖。各版本應維持「每一版都有可見成果、功能可獨立驗收、避免一次大改過多核心程式」的原則。

## 10.1 整體產品方向

AstroShot Taiwan 的長期方向可分為六個主軸：

1. **在地化**
   - 台灣觀測地點
   - 繁體中文介面
   - 台灣時區與日期格式
   - 台灣常用地名與山岳觀星點

2. **今晚可看什麼**
   - 依日期、時間與地點推薦可見天體
   - 提供最佳觀測時間與方位
   - 將複雜天文資訊轉成一般使用者看得懂的內容

3. **互動式星空探索**
   - 搜尋星體
   - 點選星體查看資訊
   - 星座線、星座名稱與深空天體
   - 視角、倍率與時間播放控制

4. **攝影與觀測輔助**
   - 銀河方位與升落時間
   - 月相、月出月落
   - 相機構圖模擬
   - 適合拍攝的時間建議

5. **台灣觀星資訊**
   - 光害程度
   - 天氣與雲量
   - 海拔與地形資訊
   - 熱門觀星點介紹

6. **效能、可維護性與跨平台**
   - 降低 `SkySimulator.tsx` 複雜度
   - 模組化渲染與控制功能
   - 桌面與手機操作
   - Cloudflare Pages 穩定部署
   - Progressive Web App 或離線功能

## 10.2 建議版本路線圖

### V1.1 — 台灣觀測地點選擇器

狀態：本計畫實作版本。

核心成果：

- 新增台灣觀測地點選擇器
- 切換地點即時更新星空
- 儲存最後選擇
- 顯示目前觀測地點

### V1.2 — 繁體中文介面與基本在地化

目標：讓主要操作介面完整支援繁體中文。

建議內容：

- 將主要按鈕、設定項目、提示文字改為繁體中文
- 保留英文語系的擴充可能
- 建立統一翻譯 key
- 台灣日期格式，例如 `2026年7月31日`
- 台灣時間格式與 UTC+8 顯示
- 星體名稱可先採中文／英文並列
- 檢查手機版文字是否溢出

預期修改：

```text
app/i18n/translations.ts
app/i18n/types.ts
app/SkySimulator.tsx
相關 UI components
```

驗收重點：

- 主要操作無殘留不必要英文
- 不因翻譯造成版面破裂
- 不把翻譯文字散落硬編碼在各元件

### V1.3 — 地點管理與自訂座標

目標：除了預設台灣地點，也允許使用者自訂觀測位置。

建議內容：

- 經緯度手動輸入
- 使用瀏覽器定位功能取得目前位置
- 將目前位置另存為自訂地點
- 最近使用地點
- 經緯度輸入驗證
- 定位失敗與權限拒絕提示

注意事項：

- 瀏覽器定位必須由使用者主動授權
- 不應自動持續追蹤位置
- 不儲存高精度位置到遠端服務
- 自訂地點先以 localStorage 儲存

### V2.0 — 「今晚的星空」推薦

目標：把星空模擬器提升為一般使用者也能理解的觀星助手。

建議內容：

- 根據觀測地點與目前日期，列出今晚值得看的目標
- 顯示天體名稱、最佳觀測時間、方位、仰角、亮度與可見程度
- 推薦分類：
  - 肉眼可見
  - 雙筒望遠鏡
  - 小型望遠鏡
  - 適合攝影
- 點擊推薦目標後，自動將畫面轉向該天體
- 加入「現在可見」「稍後升起」「已落下」狀態

第一階段可先支援：

- 月球
- 金星
- 木星
- 土星
- 火星
- 天狼星
- 織女星
- 牛郎星
- 心宿二
- 參宿四
- 北極星
- 昴宿星團
- 獵戶座大星雲

資料原則：

- 優先使用專案已有星表與天文計算
- 不要先引入大型外部天文框架
- 清楚標示近似值與計算限制

### V2.1 — 星體搜尋與自動導向

目標：讓使用者能快速找到想看的星體。

建議內容：

- 星體搜尋欄
- 中文、英文名稱搜尋
- 搜尋結果分類：
  - 恆星
  - 行星
  - 星座
  - 深空天體
- 選擇結果後自動平滑移動視角
- 在畫面中短暫高亮目標
- 顯示基本資訊卡

效能要求：

- 不在 animation loop 中執行搜尋
- 避免每次輸入都完整掃描大型資料
- 搜尋索引或正規化結果應可重用

### V2.2 — 星體資訊卡

目標：點選畫面中的星體即可查看資訊。

建議欄位：

- 中文名稱
- 英文名稱
- 星座
- 赤經／赤緯
- 方位角／仰角
- 視星等
- 距離
- 升起、過中天、落下時間
- 肉眼是否可見
- 簡短介紹

互動來源：

- 點擊星點
- 點擊搜尋結果
- 點擊今晚推薦

應使用同一套資訊卡元件，避免建立多套重複 UI。

### V2.3 — 星座線與星座名稱

目標：增加辨識與教育用途。

建議內容：

- 星座連線開關
- 星座名稱開關
- 主要星座與全部星座切換
- 中英文星座名稱
- 夜間不干擾視線的顯示樣式

效能注意：

- 星座線資料應預先整理
- 不應每幀重新尋找星體配對
- 只繪製目前視野可能出現的線段

### V3.0 — 月相、月出月落與月光影響

目標：補足實際觀星與攝影最重要的月亮資訊。

建議內容：

- 目前月相
- 月齡
- 月出時間
- 月落時間
- 月球方位與高度
- 月光對觀星的影響
- 接近滿月時提醒銀河觀測條件較差
- 顯示未來數日月相

### V3.1 — 銀河觀測與攝影助手

目標：成為台灣銀河攝影的實用工具。

建議內容：

- 銀河核心升起／落下時間
- 銀河核心方位
- 最佳拍攝時段
- 月光干擾
- 黃昏、天文暮光與夜間時段
- 選定日期後顯示整晚變化
- 依台灣觀測地點提供建議

後續可加入：

- 相機橫幅／直幅構圖預覽
- 常用焦段視野框：14mm、20mm、24mm、35mm、50mm
- 全片幅與 APS-C 切換

### V3.2 — 時間軸與整晚播放

目標：更直觀地查看天體一整晚的移動。

建議內容：

- 時間滑桿
- 播放、暫停
- 倍速：1×、10×、60×、600×
- 快速跳到日落、天文暮光結束、午夜與日出
- 顯示目前模擬時間
- 防止切換時間時造成過多重繪或 React state 壓力

### V4.0 — 台灣觀星地圖

目標：從單純地點清單，擴充為台灣觀星地圖。

建議內容：

- 地圖顯示觀星點
- 顯示海拔、光害程度、視野方向、停車資訊與注意事項
- 地點分類：
  - 都市近郊
  - 高山
  - 海邊
  - 東部
  - 離島
- 點擊地圖觀星點後直接載入模擬位置

第一階段建議以靜態地點資料開始，不急著串接複雜地圖服務。

### V4.1 — 天氣、雲量與觀測條件

目標：提供實際可否出發觀星的判斷。

建議內容：

- 雲量
- 降雨機率
- 濕度
- 能見度
- 風速
- 氣溫
- 觀星條件分數
- 天氣資料更新時間
- 資料來源標示

架構原則：

- 天氣資料與天文計算分離
- API 失敗時，星空模擬功能仍可正常使用
- 不把 API key 暴露在前端
- Cloudflare 部署環境變數需明確管理

### V4.2 — 光害與夜空品質

目標：協助使用者比較觀測地點。

建議內容：

- Bortle 等級
- 推估夜空亮度
- 都市光害方向
- 月光與光害綜合評估
- 不同觀測地點比較
- 「肉眼可見星數」的近似說明

所有光害資料都應標示資料年份與來源，不應將歷史資料描述為即時狀態。

### V5.0 — 相機與攝影構圖模擬

目標：讓使用者規劃星空攝影構圖。

建議內容：

- 相機感光元件選擇
- 鏡頭焦段
- 畫面比例
- 視野框
- 直幅／橫幅
- 相機仰角
- 銀河與地景構圖預覽
- 儲存拍攝方案

可選機身格式：

- 全片幅
- APS-C
- Micro Four Thirds
- 手機廣角

不需先模擬精確鏡頭畸變，優先完成實用視角範圍。

### V5.1 — 觀測／拍攝計畫匯出

目標：讓使用者把模擬結果帶到現場。

建議內容：

- 匯出觀測計畫
- 內容包含地點、日期、最佳時間、目標方位、月相、天氣摘要與推薦器材
- 匯出格式：
  - 圖片
  - PDF
  - 可分享連結
- 手機版方便查看

### V6.0 — PWA 與離線模式

Status: Phase 1 implemented. The installable manifest, base-path-aware service
worker, core asset and star-catalog caching, offline status, and cached-weather
labels are complete. Installed-app and real offline-browser verification remain
pending. See `docs/PLAN/V6.0.md`.

目標：在山區網路不穩時仍可使用基本功能。

建議內容：

- 安裝為 PWA
- 快取核心程式與星表
- 離線查看已下載地點
- 離線天文計算
- 顯示最後更新的天氣資料
- 區分即時資料與離線快取資料

不建議在早期版本加入複雜 service worker，應等核心功能穩定後再進行。

### V6.1 — Offline Data and Update Management

Status: Phase 1 implemented. Cache readiness, refresh and removal actions,
service-worker update prompts, and optional storage reporting are complete.
Installed-app and real offline-browser tests remain pending. See
`docs/PLAN/V6.1.md`.

### V6.2 — Field Plan Export and Sharing

Status: Phase 1 implemented. Localized print/PDF output, Moon and cached-weather
summaries, Web Share with clipboard fallback, privacy-reduced URL-fragment
links, and a shared-plan receiver are complete. Mobile share-sheet and print
dialog verification remain pending. See `docs/PLAN/V6.2.md`.

### V7.0 — Validated Solar-System Ephemerides

Phase 1 implemented. JPL Horizons remains the acceptance oracle for the
2020–2040 contract; the shared offline API, dynamic Moon/planet search and
recommendations, information-card events, and first six-body fixture are now
complete. The full fixture matrix and renderer integration remain. See
`docs/PLAN/V7.0.md`.

## 10.3 技術重構路線

功能開發同時，應逐步降低 `SkySimulator.tsx` 的負擔，但不要一次進行大規模重寫。

### A. UI 控制層

可逐步抽離：

```text
app/components/
  ObservingSiteSelector.tsx
  TimeControls.tsx
  DisplaySettings.tsx
  SearchPanel.tsx
  ObjectInfoCard.tsx
```

### B. 狀態管理

可評估建立：

```text
app/hooks/
  useObservingSite.ts
  useSimulationTime.ts
  useSkySettings.ts
  useSelectedObject.ts
```

原則：

- 先使用 React state 與 custom hooks
- 不急著引入 Redux、Zustand 等外部狀態管理套件
- 僅在狀態確實跨越大量元件且難以維護時再評估

### C. 天文計算層

建議集中於：

```text
app/simulation/
  astronomy-time.ts
  observing-sites.ts
  visibility.ts
  rise-set.ts
  moon.ts
  milky-way.ts
```

原則：

- 計算函式盡量保持純函式
- UI 不直接實作天文公式
- 同一公式不要在多處重複
- 每個模組都應有明確輸入與輸出型別

### D. 渲染層

未來可逐步拆成：

```text
app/rendering/
  sky-background.ts
  stars.ts
  milky-way.ts
  constellation-lines.ts
  labels.ts
  horizon.ts
```

拆分前需先建立測試與效能基準，避免因重構破壞畫面或降低 FPS。

## 10.4 測試策略

目前每次開發至少應執行：

```text
TypeScript check
Lint
Production build
Manual browser test
Cloudflare deployment test
```

後續建議逐步加入：

### 單元測試

優先測試：

- 地點查詢
- 日期與 Julian date
- 恆星時
- 方位與仰角轉換
- 升起與落下計算
- 月相
- 可見性判斷

### UI 測試

優先測試：

- 地點切換
- 搜尋
- 時間控制
- localStorage 恢復
- 行動版操作

### 視覺回歸測試

針對固定地點、日期、時間保存參考截圖，檢查：

- 星空方向是否突變
- 銀河位置是否異常
- UI 是否遮擋
- 不同螢幕尺寸是否破版

## 10.5 效能目標

建議逐步建立以下指標：

- 桌面版操作維持流暢
- 手機版不因星表或標籤過多卡頓
- 切換地點後快速更新
- 不在 animation loop 中建立大量暫時物件
- 不因 React state 每幀更新造成整頁重繪
- 星體搜尋與資訊卡不影響 Canvas FPS
- WebGL 初始化失敗時提供可接受的降級行為

未來重構前應記錄：

- 初次載入時間
- 主 bundle 大小
- 星表載入時間
- 平均 FPS
- 記憶體使用
- 行動裝置表現

## 10.6 資料與版權原則

未來新增天文、地圖、天氣與光害資料時，必須記錄：

- 資料來源
- 授權方式
- 資料日期
- 是否允許再散布
- 是否需要標示 attribution
- 是否為即時、預報或歷史資料

不得直接複製未明確授權的商業資料庫內容。

## 10.7 每個版本的標準工作流程

每一版建議遵循：

1. 建立版本計畫 Markdown。
2. Codex 先分析，不修改檔案。
3. Codex 提出預計修改檔案。
4. 確認範圍後開始實作。
5. 執行 type-check、lint、test、build。
6. 在本機瀏覽器測試。
7. 使用 GitHub Desktop 檢查差異。
8. 確認沒有生成檔或無關檔案。
9. Commit。
10. Push origin。
11. 等待 Cloudflare 部署。
12. 在正式網址驗收。
13. 記錄版本完成內容與已知問題。

## 10.8 版本優先順序建議

近期優先順序：

```text
V1.1 台灣觀測地點
↓
V1.2 繁體中文介面
↓
V1.3 自訂位置
↓
V2.0 今晚的星空
↓
V2.1 星體搜尋
↓
V2.2 星體資訊卡
↓
V2.3 星座線與名稱
↓
V3.0 月相與月光
↓
V3.1 銀河攝影助手
↓
V3.2 時間軸
```

中期再進行：

```text
V4.x 台灣觀星地圖、天氣與光害
V5.x 攝影構圖與計畫匯出
V6.x PWA 與離線模式
```

## 10.9 不建議過早加入的功能

在核心功能穩定前，暫不建議：

- 使用者帳號系統
- 社群貼文
- 即時聊天室
- 大型後端資料庫
- 複雜付費功能
- 一次導入多個 UI framework
- 大規模重寫渲染引擎
- 同時支援過多語言
- 未驗證授權的天文資料
- 過早加入 AI 推薦功能

應先確保星空方向、時間、地點、搜尋與觀測資訊準確可靠。

## 10.10 長期完成形態

AstroShot Taiwan 最終可發展為：

> 一個以台灣地點、繁體中文與實際觀測需求為核心的互動式星空模擬與觀星攝影規劃工具。

使用者可以：

- 選擇台灣觀測地
- 查看任何日期與時間的星空
- 搜尋星體
- 了解今晚值得看的目標
- 查看月相、銀河與觀測條件
- 規劃拍攝方向與時間
- 在手機上帶到現場使用
