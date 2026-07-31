export type SiteCategory = "urban" | "highland" | "coast";

export type ObservingSiteDetails = {
  category: SiteCategory;
  lightPollution: { "zh-TW": string; en: string };
  horizon: { "zh-TW": string; en: string };
  access: { "zh-TW": string; en: string };
  caution: { "zh-TW": string; en: string };
};

export const OBSERVING_SITE_DETAILS: Readonly<Record<string, ObservingSiteDetails>> = {
  taipei: { category: "urban", lightPollution: { "zh-TW": "都市光害高", en: "High urban light pollution" }, horizon: { "zh-TW": "建物可能遮擋低空", en: "Buildings may obstruct the low horizon" }, access: { "zh-TW": "大眾運輸便利；停車依現場規定", en: "Good transit; parking depends on local rules" }, caution: { "zh-TW": "適合月亮、行星與明亮星體", en: "Best for the Moon, planets, and bright objects" } },
  taichung: { category: "urban", lightPollution: { "zh-TW": "都市光害高", en: "High urban light pollution" }, horizon: { "zh-TW": "市區視野受建物影響", en: "Urban buildings affect the horizon" }, access: { "zh-TW": "停車依選定觀測點規定", en: "Parking depends on the chosen observing spot" }, caution: { "zh-TW": "往山區移動可改善天空對比", en: "Moving toward the mountains improves contrast" } },
  tainan: { category: "urban", lightPollution: { "zh-TW": "都市光害高", en: "High urban light pollution" }, horizon: { "zh-TW": "平地視野依周邊建物而異", en: "Lowland horizon varies with nearby buildings" }, access: { "zh-TW": "停車依現場標誌與開放時間", en: "Follow posted parking and opening hours" }, caution: { "zh-TW": "注意夏季高溫與蚊蟲", en: "Prepare for summer heat and insects" } },
  kaohsiung: { category: "urban", lightPollution: { "zh-TW": "都市光害高", en: "High urban light pollution" }, horizon: { "zh-TW": "西南方沿海較開闊", en: "The southwest coastal direction is more open" }, access: { "zh-TW": "停車依選定觀測點規定", en: "Parking depends on the chosen observing spot" }, caution: { "zh-TW": "海岸需注意強風與鹽霧", en: "Coastal sites may have wind and salt spray" } },
  hehuanshan: { category: "highland", lightPollution: { "zh-TW": "高山暗空，仍受遠方光害影響", en: "Dark highland sky with distant light domes" }, horizon: { "zh-TW": "稜線視野開闊，局部受山體遮擋", en: "Open ridgelines with some mountain obstruction" }, access: { "zh-TW": "停車空間有限，依道路與園區規定", en: "Limited parking; follow road and park rules" }, caution: { "zh-TW": "高海拔、低溫、濃霧與道路管制風險", en: "High altitude, cold, fog, and road restrictions" } },
  alishan: { category: "highland", lightPollution: { "zh-TW": "山區光害較低", en: "Lower mountain light pollution" }, horizon: { "zh-TW": "視野依林木與山稜位置而異", en: "Horizon varies with forest and ridgelines" }, access: { "zh-TW": "使用合法停車區並確認開放時間", en: "Use legal parking and confirm opening hours" }, caution: { "zh-TW": "夜間低溫、霧氣及野生動物出沒", en: "Cold nights, fog, and wildlife are possible" } },
  kenting: { category: "coast", lightPollution: { "zh-TW": "離聚落後天空較暗", en: "Darker away from settlements" }, horizon: { "zh-TW": "南方海面視野開闊", en: "Open southern sea horizon" }, access: { "zh-TW": "使用合法停車區，勿進入管制區", en: "Use legal parking and avoid restricted areas" }, caution: { "zh-TW": "注意季風、浪況與國家公園規定", en: "Check monsoon winds, waves, and park rules" } },
};
