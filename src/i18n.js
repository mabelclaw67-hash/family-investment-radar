// ─────────────────────────────────────────────────────────────────────────────
// i18n.js  –  Unified language resource for Family Investment Radar
// Default language: English ("en")
// Supported: "en" | "zh"
// ─────────────────────────────────────────────────────────────────────────────

const STRINGS = {
  en: {
    // ── Sidebar ──────────────────────────────────────────────────────────────
    brand_name:            "Family Investment Radar",
    sidebar_tagline:       "Information & Monitoring Tool",
    sidebar_no_advice:     "No Buy/Sell Advice",
    sidebar_data_source:   "Data Source",
    btn_lock:              "Lock",
    btn_lang:              "中文",          // label showing NEXT language to switch to

    // ── Nav items ─────────────────────────────────────────────────────────────
    nav_dashboard:         "Dashboard",
    nav_holdings:          "Holdings",
    nav_watchlist:         "Watchlist",
    nav_alerts:            "Priority Alerts",
    nav_news:              "Daily News",
    nav_market:            "Market Radar",
    nav_decisions:         "Decision Log",
    nav_settings:          "Settings",

    // ── Mobile bottom tabs ────────────────────────────────────────────────────
    mtab_dashboard:        "Home",
    mtab_holdings:         "Holdings",
    mtab_watchlist:        "Watchlist",
    mtab_decisions:        "Log",

    // ── Header ────────────────────────────────────────────────────────────────
    header_title:          "Family Investment Radar",
    header_live:           "Live Updates",
    header_today:          "Today",
    header_search_ph:      "Search stocks, news, topics...",

    // ── KPI cards ─────────────────────────────────────────────────────────────
    kpi_risk_level:        "Today Risk Level",
    kpi_review_count:      "Holdings Needing Review",
    kpi_alerts:            "Priority Alerts",
    kpi_updates:           "Latest Updates",
    kpi_holdings_unit:     "Holdings",
    kpi_alerts_unit:       "Alerts",
    kpi_news_unit:         "News",

    // ── Market section ────────────────────────────────────────────────────────
    market_us_title:       "US Market",
    btn_refresh_market:    "Refresh Market",
    market_canada_title:   "Canada & Commodities",
    market_proxy_note_us:  "Index + key stocks. Shows 'Data unavailable' if no data returned.",
    market_proxy_note_ca:  "CAD/USD, Gold, Oil, 10Y Bond require GOOGLEFINANCE rows in sheet 09 Market Index Source.",
    market_empty:          "Market data pending",
    market_empty_sub:      "Only real index rows are shown here.",

    // ── News panel ────────────────────────────────────────────────────────────
    news_panel_title:      "Live Updates",
    btn_refresh_news:      "Sync News",
    news_no_data_main:     "No daily news rows available yet",
    news_no_data_sub:      "Add rows to 06 Daily News Intelligence",
    news_view_all:         "View All News ›",
    news_uncategorized:    "Uncategorized",
    news_no_title:         "(No Title)",

    // ── Alerts panel ──────────────────────────────────────────────────────────
    alerts_panel_title:    "High Attention Alerts",
    alerts_holdings_status:"Holdings Status",
    alerts_informational:  "Informational only",
    alerts_status_high:    "High Attention",
    alerts_status_review:  "Review",
    alerts_status_normal:  "Normal",
    alerts_no_summary:     "No latest summary",
    alerts_news_count_suffix: " news",
    alerts_view_all:       "View All Alerts ›",
    alerts_empty_main:     "No high attention alerts",
    alerts_empty_sub:      "No high-priority alert rows",
    morning_brief_title:   "Morning Brief",
    btn_sync_morning_brief:"Sync Brief",
    morning_brief_open_doc:"Open Doc",
    morning_brief_empty:   "No morning brief yet",
    morning_brief_no_title:"(No Title)",

    // ── Summary cards ─────────────────────────────────────────────────────────
    summary_family:        "Family Summary",
    summary_mabel:         "Mabel Portfolio Summary",
    summary_victor:        "Victor Portfolio Summary",
    summary_watchlist:     "Watchlist Snapshot",
    summary_reminders:     "Decision Reminder",
    summary_empty:         "No rows",

    // ── Loading / Error ───────────────────────────────────────────────────────
    loading_text:          "Loading Google Sheets...",
    loading_subtitle:      "Loading live Google Sheets data from",
    error_title:           "Unable to Load Google Sheets Data",
    error_hint:            "Please verify the Apps Script Web App exec URL is configured and returns ok:true.",

    // ── Footer ────────────────────────────────────────────────────────────────
    footer_disclaimer:     "This platform provides information and monitoring services only. Not investment advice or buy/sell recommendations. Invest wisely based on your own circumstances.",

    // ── Holdings page ─────────────────────────────────────────────────────────
    holdings_page_title:   "Holdings",
    holdings_page_subtitle:"Currently held ETF, funds, stocks and cash assets",
    live_pill_real:        "Real Data",
    holdings_total:        "Total Holdings",
    holdings_mabel:        "Mabel Holdings",
    holdings_victor:       "Victor Holdings",
    holdings_need_review:  "Need Review",

    // Holdings table columns
    col_owner:             "Owner",
    col_ticker:            "Ticker",
    col_name:              "Name",
    col_type:              "Type",
    col_market:            "Market",
    col_account:           "Account",
    col_price:             "Price",
    col_value:             "Value",
    col_risk:              "Risk",
    col_status:            "Status",
    col_action:            "Action",

    // Holdings empty / prompts
    holdings_empty:        "No holdings rows yet. Add records in 01 Holdings Master.",
    holdings_filter_empty: "No holdings match this filter.",
    holdings_select_prompt:"Select a holding",

    // Holdings filter labels
    filter_all:            "All",
    filter_mabel:          "Mabel",
    filter_victor:         "Victor",
    filter_etf:            "ETF",
    filter_stock:          "Stock",
    filter_high_risk:      "High Risk",
    filter_review:         "Review",

    // Holding detail
    holding_detail_title:      "Holding Detail",
    holding_owner_mabel_title: "Conservative View",
    holding_owner_mabel_desc:  "Focus on ETF, funds, GIC, retirement planning, risk comparison.",
    holding_owner_victor_title:"Active Radar",
    holding_owner_victor_desc: "Focus on stocks, energy, oil & gas, minerals, high-volatility review.",
    holding_owner_family_title:"Family View",
    holding_owner_family_desc: "Information monitoring only. No buy/sell advice.",
    holding_research_title:    "Holding Research",
    holding_no_research:       "No research record yet",
    holding_no_research_sub:   "No matching ticker in 03 Holding Research",
    holding_related_news_title:"Related News",
    holding_no_related_news:   "No related news yet",
    holding_no_related_news_sub:"No matching rows in 06 Daily News Intelligence",

    // ── Watchlist page ────────────────────────────────────────────────────────
    watchlist_page_title:      "Watchlist",
    watchlist_page_subtitle:   "Stocks, ETFs, funds and sectors under observation",
    watchlist_total:           "Total Watchlist",
    watchlist_mabel:           "Mabel Watching",
    watchlist_victor:          "Victor Watching",
    watchlist_high_priority:   "High Priority",
    watchlist_add_title:       "Add to Watchlist",
    watchlist_table_title:     "Watchlist Items",
    watchlist_click_hint:      "Click any row to open Quick Research",
    watchlist_empty:           "No watchlist rows yet in 07 Watchlist Intelligence",
    btn_add_watchlist:         "Add to Watchlist",

    // Watchlist table columns
    col_sector:                "Sector",
    col_priority:              "Priority",

    // Watchlist form
    form_ticker_ph:            "e.g. AAPL",
    form_name_ph:              "e.g. Apple Inc.",
    form_sector_ph:            "e.g. Technology",
    form_reason:               "Watch Reason",
    form_reason_ph:            "Brief reason for watching",
    form_watch_priority:       "Watch Priority",

    // ── Watchlist popup ───────────────────────────────────────────────────────
    popup_quick_research:      "Quick Research",
    popup_market_snapshot:     "Market Snapshot",
    popup_related_news:        "Related News",
    popup_research_summary:    "Research Summary",
    popup_current_status:      "Current Action Status",
    popup_no_market_main:      "No market data yet",
    popup_no_market_hint:      "Please run marketDataFetchJob or click Refresh Market on dashboard.",
    popup_no_news_main:        "No related news yet",
    popup_no_news_sub:         "No matching rows in 06 Daily News Intelligence for this ticker",
    popup_no_research_main:    "No research record yet",
    popup_no_research_sub:     "No matching ticker in 03 Holding Research",
    popup_research_empty_main: "Research fields are empty",
    popup_research_empty_sub:  "Matching row found but all target fields are blank",
    popup_disclaimer:          "No trading recommendation",
    popup_trend:               "Trend",
    popup_risk_signal:         "Risk Signal",
    popup_date:                "Date",
    popup_source:              "Source",
    popup_priority_suffix:     "Priority",
    btn_add_decision:          "Add Decision",
    popup_decision_hint:       "Navigates to Decision Log with prefilled fields",

    // ── Decision Log page ─────────────────────────────────────────────────────
    decisions_page_title:      "Decision Log",
    decisions_page_subtitle:   "Record buy, sell, watch, hold and review decisions",
    decisions_total:           "Total Decisions",
    decisions_mabel:           "Mabel Decisions",
    decisions_victor:          "Victor Decisions",
    decisions_needs_review:    "Needs Review",
    decisions_add_title:       "Add Decision Log",
    decisions_list_title:      "Decision Records",
    decisions_empty_main:      "No decision records yet",
    decisions_empty_hint:      "Add first record, or adjust filters",
    btn_add_decision_log:      "Add Decision Log",

    // Decision Log filter labels
    dl_filter_all:             "All",
    dl_filter_planned:         "Planned",
    dl_filter_completed:       "Completed",

    // Decision Log table columns
    dl_col_reason:             "Reason",

    // Decision Log form labels
    dl_form_date:              "Date",
    dl_form_owner:             "Owner",
    dl_form_account_type:      "Account Type",
    dl_form_ticker:            "Ticker",
    dl_form_name:              "Name",
    dl_form_asset_type:        "Asset Type",
    dl_form_action_type:       "Action Type",
    dl_form_decision_status:   "Decision Status",
    dl_form_risk_level:        "Risk Level",
    dl_form_amount:            "Amount",
    dl_form_quantity:          "Quantity",
    dl_form_price:             "Price",
    dl_form_cost:              "Cost (Auto-calc if blank)",
    dl_form_related_watch_id:  "Related Watch ID",
    dl_form_related_holding_id:"Related Holding ID",
    dl_form_decision_reason:   "Decision Reason",
    dl_form_reason_ph:         "Brief reason for this decision",
    dl_form_reference:         "Reference Info",
    dl_form_review_notes:      "Review Notes",
    dl_form_review_ph:         "Fill in after review",

    // ── Password gate ─────────────────────────────────────────────────────────
    pw_title:                  "Family Investment Radar",
    pw_subtitle:               "Family Investment Radar",
    pw_hint:                   "Enter access password",
    pw_error:                  "Incorrect password",
    pw_submit:                 "Enter",

    // ── Status messages ───────────────────────────────────────────────────────
    status_refreshing_news:    "Syncing news...",
    status_news_api_missing:   "NEWS_API_KEY not configured.",
    status_refresh_failed:     "Refresh failed: ",
    status_refreshing_market:  "Refreshing market data...",
    status_syncing_morning_brief:"Syncing morning brief...",
    status_alpha_missing:      "ALPHA_VANTAGE_API_KEY not configured.",
    status_watchlist_writing:  "Adding to watchlist...",
    status_watchlist_pending:  "Write action pending",
    status_watchlist_validation:"Please fill in Owner, Type, and Ticker or Name.",
    status_decision_writing:   "Adding decision record...",
    status_decision_failed:    "Write failed: ",
    status_decision_validation:"Please fill in date, owner, action type, and ticker or name.",
    status_unknown_error:      "Unknown error",

    // ── Common ────────────────────────────────────────────────────────────────
    value_missing:             "—",
    value_pending:             "—",
    form_select_ph:            "-- Select --",
    form_required_mark:        "*",
  },

  zh: {
    // ── Sidebar ──────────────────────────────────────────────────────────────
    brand_name:            "家庭投资雷达",
    sidebar_tagline:       "信息与监控工具",
    sidebar_no_advice:     "不提供买卖建议",
    sidebar_data_source:   "数据源",
    btn_lock:              "退出",
    btn_lang:              "English",

    // ── Nav items ─────────────────────────────────────────────────────────────
    nav_dashboard:         "首页",
    nav_holdings:          "已持仓",
    nav_watchlist:         "观察清单",
    nav_alerts:            "重点提醒",
    nav_news:              "每日新闻",
    nav_market:            "市场雷达",
    nav_decisions:         "决策记录",
    nav_settings:          "设置",

    // ── Mobile bottom tabs ────────────────────────────────────────────────────
    mtab_dashboard:        "首页",
    mtab_holdings:         "持仓",
    mtab_watchlist:        "观察",
    mtab_decisions:        "记录",

    // ── Header ────────────────────────────────────────────────────────────────
    header_title:          "家庭投资雷达",
    header_live:           "实时更新",
    header_today:          "今日日期",
    header_search_ph:      "搜索股票、新闻、主题...",

    // ── KPI cards ─────────────────────────────────────────────────────────────
    kpi_risk_level:        "今日风险等级",
    kpi_review_count:      "需复核持仓",
    kpi_alerts:            "重点提醒",
    kpi_updates:           "今日更新数",
    kpi_holdings_unit:     "个持仓",
    kpi_alerts_unit:       "项提醒",
    kpi_news_unit:         "条新闻",

    // ── Market section ────────────────────────────────────────────────────────
    market_us_title:       "美股走势",
    btn_refresh_market:    "刷新行情",
    market_canada_title:   "加拿大市场",
    market_proxy_note_us:  "指数 + 重点个股。若数据未返回则显示暂无数据。",
    market_proxy_note_ca:  "CAD/USD、Gold、Oil、10Y Bond 需在 09 Market Index Source 表格中配置对应 GOOGLEFINANCE 行后方可显示。",
    market_empty:          "行情数据待更新",
    market_empty_sub:      "仅显示真实指数行。",

    // ── News panel ────────────────────────────────────────────────────────────
    news_panel_title:      "即时更新",
    btn_refresh_news:      "同步新闻",
    news_no_data_main:     "06 Daily News Intelligence 目前没有新闻数据",
    news_no_data_sub:      "请在 06 Daily News Intelligence 中添加记录",
    news_view_all:         "查看全部新闻 ›",
    news_uncategorized:    "未分类",
    news_no_title:         "(无标题)",

    // ── Alerts panel ──────────────────────────────────────────────────────────
    alerts_panel_title:    "重点提醒",
    alerts_holdings_status:"持仓状态",
    alerts_informational:  "仅供参考",
    alerts_status_high:    "需关注",
    alerts_status_review:  "建议复核",
    alerts_status_normal:  "正常",
    alerts_no_summary:          "暂无最新摘要",
    alerts_news_count_suffix:   " 条相关",
    alerts_view_all:            "查看全部提醒 ›",
    alerts_empty_main:     "暂无高优先级提醒",
    alerts_empty_sub:      "暂无数据",
    morning_brief_title:   "早晨晨报",
    btn_sync_morning_brief:"同步晨报",
    morning_brief_open_doc:"打开文档",
    morning_brief_empty:   "暂无晨报",
    morning_brief_no_title:"(无标题)",

    // ── Summary cards ─────────────────────────────────────────────────────────
    summary_family:        "家庭总览",
    summary_mabel:         "Mabel 稳健投资（组合摘要）",
    summary_victor:        "Victor 主动投资雷达（组合摘要）",
    summary_watchlist:     "观察清单速览",
    summary_reminders:     "决策提醒",
    summary_empty:         "暂无数据",

    // ── Loading / Error ───────────────────────────────────────────────────────
    loading_text:          "正在读取 Google Sheets...",
    loading_subtitle:      "正在从以下数据源加载数据",
    error_title:           "无法读取真实 Google Sheets 数据",
    error_hint:            "请确认 Apps Script Web App exec URL 已配置，且 endpoint 可返回 ok:true 的 JSON。",

    // ── Footer ────────────────────────────────────────────────────────────────
    footer_disclaimer:     "本平台提供信息与监控服务，不构成投资建议或任何买卖推荐。投资有风险，请根据自身情况谨慎决策。",

    // ── Holdings page ─────────────────────────────────────────────────────────
    holdings_page_title:   "已持仓",
    holdings_page_subtitle:"家庭当前已持有的 ETF、基金、股票与现金类资产",
    live_pill_real:        "真实数据",
    holdings_total:        "总持仓数量",
    holdings_mabel:        "Mabel 持仓",
    holdings_victor:       "Victor 持仓",
    holdings_need_review:  "需复核",

    // Holdings table columns
    col_owner:             "所属人",
    col_ticker:            "代码",
    col_name:              "名称",
    col_type:              "类型",
    col_market:            "市场",
    col_account:           "账户",
    col_price:             "当前价格",
    col_value:             "当前市值",
    col_risk:              "风险",
    col_status:            "状态",
    col_action:            "行动",

    // Holdings empty / prompts
    holdings_empty:        "暂无持仓数据，请先在 01 Holdings Master 中添加记录。",
    holdings_filter_empty: "当前筛选条件下暂无持仓。",
    holdings_select_prompt:"请选择一个持仓。",

    // Holdings filter labels
    filter_all:            "全部",
    filter_mabel:          "Mabel",
    filter_victor:         "Victor",
    filter_etf:            "ETF",
    filter_stock:          "股票",
    filter_high_risk:      "高风险",
    filter_review:         "需复核",

    // Holding detail
    holding_detail_title:      "持仓详情",
    holding_owner_mabel_title: "Mabel 稳健投资视角",
    holding_owner_mabel_desc:  "重点看 ETF、基金、GIC、退休规划、风险比较。",
    holding_owner_victor_title:"Victor 主动投资雷达",
    holding_owner_victor_desc: "重点看股票、能源、油气、矿产、高波动复核。",
    holding_owner_family_title:"家庭共同视角",
    holding_owner_family_desc: "仅做信息监控，不提供买卖建议。",
    holding_research_title:    "研究资料",
    holding_no_research:       "暂无研究资料",
    holding_no_research_sub:   "03 Holding Research 中无匹配记录",
    holding_related_news_title:"相关新闻",
    holding_no_related_news:   "暂无相关新闻",
    holding_no_related_news_sub:"06 Daily News Intelligence 中无匹配行",

    // ── Watchlist page ────────────────────────────────────────────────────────
    watchlist_page_title:      "观察清单",
    watchlist_page_subtitle:   "未买入但正在观察的股票、ETF、基金和行业主题",
    watchlist_total:           "观察项目总数",
    watchlist_mabel:           "Mabel 观察",
    watchlist_victor:          "Victor 观察",
    watchlist_high_priority:   "高优先级",
    watchlist_add_title:       "加入观察清单",
    watchlist_table_title:     "观察列表",
    watchlist_click_hint:      "点击任意行查看快速研究",
    watchlist_empty:           "暂无观察清单数据，请在 07 Watchlist Intelligence 中添加记录。",
    btn_add_watchlist:         "加入观察清单",

    // Watchlist table columns
    col_sector:                "板块",
    col_priority:              "优先级",

    // Watchlist form
    form_ticker_ph:            "例如 AAPL",
    form_name_ph:              "例如 苹果公司",
    form_sector_ph:            "例如 科技",
    form_reason:               "观察原因",
    form_reason_ph:            "简要说明关注原因",
    form_watch_priority:       "关注级别",

    // ── Watchlist popup ───────────────────────────────────────────────────────
    popup_quick_research:      "快速研究",
    popup_market_snapshot:     "行情快照",
    popup_related_news:        "相关新闻",
    popup_research_summary:    "研究摘要",
    popup_current_status:      "当前状态",
    popup_no_market_main:      "暂无行情数据",
    popup_no_market_hint:      "请先运行 marketDataFetchJob 或在首页点击刷新行情。",
    popup_no_news_main:        "暂无相关新闻",
    popup_no_news_sub:         "06 Daily News Intelligence 中无该代码相关记录",
    popup_no_research_main:    "暂无研究资料",
    popup_no_research_sub:     "03 Holding Research 中无匹配代码",
    popup_research_empty_main: "研究字段为空",
    popup_research_empty_sub:  "已找到匹配行，但所有目标字段为空",
    popup_disclaimer:          "本平台仅做信息监控，不提供买卖建议",
    popup_trend:               "趋势",
    popup_risk_signal:         "风险信号",
    popup_date:                "最新日期",
    popup_source:              "数据来源",
    popup_priority_suffix:     "优先",
    btn_add_decision:          "记录决策",
    popup_decision_hint:       "将跳转至决策记录页并预填信息",

    // ── Decision Log page ─────────────────────────────────────────────────────
    decisions_page_title:      "决策记录",
    decisions_page_subtitle:   "记录买入、卖出、观察、持有和复盘理由",
    decisions_total:           "总记录",
    decisions_mabel:           "Mabel 记录",
    decisions_victor:          "Victor 记录",
    decisions_needs_review:    "待复核",
    decisions_add_title:       "新增决策记录",
    decisions_list_title:      "决策记录列表",
    decisions_empty_main:      "暂无决策记录",
    decisions_empty_hint:      "添加第一条记录，或调整筛选条件",
    btn_add_decision_log:      "新增决策记录",

    // Decision Log filter labels
    dl_filter_all:             "全部",
    dl_filter_planned:         "计划中",
    dl_filter_completed:       "已完成",

    // Decision Log table columns
    dl_col_reason:             "决策原因",

    // Decision Log form labels
    dl_form_date:              "日期",
    dl_form_owner:             "所属人",
    dl_form_account_type:      "账户类型",
    dl_form_ticker:            "代码",
    dl_form_name:              "名称",
    dl_form_asset_type:        "资产类型",
    dl_form_action_type:       "操作类型",
    dl_form_decision_status:   "决策状态",
    dl_form_risk_level:        "风险等级",
    dl_form_amount:            "金额",
    dl_form_quantity:          "数量",
    dl_form_price:             "单价",
    dl_form_cost:              "成本（留空则自动计算）",
    dl_form_related_watch_id:  "关联观察ID",
    dl_form_related_holding_id:"关联持仓ID",
    dl_form_decision_reason:   "决策原因",
    dl_form_reason_ph:         "简要说明决策原因",
    dl_form_reference:         "参考信息",
    dl_form_review_notes:      "复盘备注",
    dl_form_review_ph:         "事后复盘填写",

    // ── Password gate ─────────────────────────────────────────────────────────
    pw_title:                  "家庭投资雷达",
    pw_subtitle:               "Family Investment Radar",
    pw_hint:                   "请输入访问密码",
    pw_error:                  "密码不正确",
    pw_submit:                 "进入",

    // ── Status messages ───────────────────────────────────────────────────────
    status_refreshing_news:    "正在同步新闻...",
    status_news_api_missing:   "NEWS_API_KEY 未配置。",
    status_refresh_failed:     "刷新失败：",
    status_refreshing_market:  "正在刷新行情...",
    status_syncing_morning_brief:"正在同步晨报...",
    status_alpha_missing:      "ALPHA_VANTAGE_API_KEY 未配置。",
    status_watchlist_writing:  "正在写入观察清单...",
    status_watchlist_pending:  "写入功能待接入",
    status_watchlist_validation:"请填写 Owner、Type，并填写 Ticker 或 Name。",
    status_decision_writing:   "正在写入决策记录...",
    status_decision_failed:    "写入失败：",
    status_decision_validation:"请填写日期、所属人、操作类型，以及代码或名称。",
    status_unknown_error:      "未知错误",

    // ── Common ────────────────────────────────────────────────────────────────
    value_missing:             "—",
    value_pending:             "—",
    form_select_ph:            "-- 请选择 --",
    form_required_mark:        "*",
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

export function getLang() {
  return localStorage.getItem("fir_lang") || "en";
}

export function setLang(lang) {
  localStorage.setItem("fir_lang", lang);
}

/**
 * Translate a key.  Falls back to EN, then to the key itself.
 */
export function t(key) {
  const lang = getLang();
  return STRINGS[lang]?.[key] ?? STRINGS["en"]?.[key] ?? key;
}

/**
 * Format a date string using locale matching the current language.
 * Used for the header date display.
 */
export function formatHeaderDate() {
  const locale = getLang() === "zh" ? "zh-CN" : "en-CA";
  return new Intl.DateTimeFormat(locale, {
    timeZone:  "America/Vancouver",
    year:      "numeric",
    month:     "long",
    day:       "numeric",
    weekday:   "long",
  }).format(new Date());
}
