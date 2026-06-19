const SPREADSHEET_ID = '1mNmAtxQn9udMm0ljuX1nCJKif_VhvhFhkWxNZBJgBBs';
const MORNING_BRIEF_FOLDER_ID = '1C19niJbpUsUpxjLkw-IkX-csUUnXxh0c';

const DASHBOARD_TABS = {
  holdings: '01 Holdings Master',
  dailyHoldingIntelligence: '02 Daily Holding Intelligence',
  holdingResearch: '03 Holding Research',
  dailyNews: '06 Daily News Intelligence',
  watchlist: '07 Watchlist Intelligence',
  priorityAlerts: '08 Priority Alert Watch',
  decisionLog: '09 Decision Log',
  morningBrief: '10 Morning Brief',
  researchPack: '12 Research Pack',
  aiMarketTrend: '13 AI Market Trend',
  settings: '99 Settings',
  marketRadar: '05 Market Radar',
  stockAnalysis: '11 Stock Analysis',
  publicTopics: '14 Public Topics',
  publicReplies: '15 Public Replies',
};

const RESEARCH_PACK_HEADERS = [
  '研究包ID / Pack ID',
  '日期 / Date',
  '所属人 / Owner',
  '研究主题 / Research Topic',
  '相关代码 / Related Ticker',
  '来源类型 / Source Type',
  '来源标题 / Source Title',
  '来源链接 / Source Link',
  '中文摘要 / Chinese Summary',
  '原文摘要 / Original Summary',
  '重要性 / Importance',
  '风险等级 / Risk Level',
  '是否纳入NotebookLM / Include in NotebookLM',
  'Google Drive文件链接 / Drive File Link',
  'NotebookLM状态 / NotebookLM Status',
  'NotebookLM结论 / NotebookLM Conclusion',
  '投资步骤 / Investment Steps',
  '决策建议状态 / Decision Status',
  '关联观察ID / Related Watch ID',
  '关联决策ID / Related Decision ID',
  '创建时间 / Created At',
  '备注 / Notes',
];

const AI_MARKET_TREND_HEADERS = [
  'record_id',
  'report_date',
  'updated_at',
  'generated_by',
  'status',
  'language',
  'market_overview',
  'us_market',
  'canada_market',
  'macro_policy',
  'sector_rotation',
  'key_movers',
  'risk_signals',
  'conservative_notes',
  'watch_next',
  'sources_count',
  'sources',
  'raw_json',
  'public_visible',
  'notes',
];

const NOTEBOOKLM_PROMPT = [
  '请根据本研究包资料，分析该投资主题的主要机会与风险。',
  '请指出哪些信息已经确认，哪些仍需核实。',
  '请总结是否适合继续观察、进入 Review，或标记 High Attention。',
  '请生成一段可以写入 Decision Log 的中文复盘摘要。',
  '请不要生成直接买入或卖出建议。',
].join('\n');

// V1 search topics — single/simple terms, broad enough for NewsAPI free tier
const NEWS_TOPICS = [
  { q: '"Canada Strong Fund"',          keyword: 'Canada Strong Fund',        owner: 'Mabel',  category: 'New Product / Fund',      action: 'High Attention', ticker: '' },
  { q: 'Canada ETF',                    keyword: 'Canada ETF new fund',       owner: 'Mabel',  category: 'New Product / Fund',      action: 'Review',         ticker: '' },
  { q: 'GIC Canada',                    keyword: 'GIC Bank of Canada rate',   owner: 'Mabel',  category: 'Interest Rate / GIC',     action: 'Review',         ticker: '' },
  { q: 'Bank of Canada interest rate',  keyword: 'Bank of Canada rate',       owner: 'Mabel',  category: 'Interest Rate / GIC',     action: 'Review',         ticker: '' },
  { q: 'oil prices Canada energy',      keyword: 'oil energy Canada',         owner: 'Victor', category: 'Victor Energy / Oil',     action: 'Review',         ticker: '' },
  { q: 'lithium mining stocks',         keyword: 'lithium mining',            owner: 'Victor', category: 'Victor Mining / Lithium', action: 'Review',         ticker: '' },
  { q: 'Tesla stock',                   keyword: 'TSLA',                      owner: 'Victor', category: 'Victor Stock News',       action: 'Review',         ticker: 'TSLA' },
  { q: 'Cenovus Energy',                keyword: 'CVE.TO Cenovus',            owner: 'Victor', category: 'Victor Energy / Oil',     action: 'Review',         ticker: 'CVE.TO' },
  { q: 'Lithium Americas',              keyword: 'LAC.TO Lithium Americas',   owner: 'Victor', category: 'Victor Mining / Lithium', action: 'Review',         ticker: 'LAC.TO' },
  { q: 'Alibaba stock',                 keyword: 'BABA Alibaba',              owner: 'Victor', category: 'Victor Stock News',       action: 'Review',         ticker: 'BABA' },
  { q: 'Hesai',                         keyword: 'HSAI Hesai',                owner: 'Victor', category: 'Victor Stock News',       action: 'Review',         ticker: 'HSAI' },
];

const DAILY_HOLDING_REQUIRED_HEADERS = [
  '日期 / Date',
  '所属人 / Owner',
  '代码 / Ticker',
  '名称 / Name',
  '市场 / Market',
  '资产类型 / Asset Type',
  '价格变动% / Price Change %',
  '宏观影响 / Macro Impact',
  '新闻事件 / News Event',
  '财报事件 / Earnings Event',
  '中文新闻摘要 / Chinese News Summary',
  'AI中文点评 / AI Chinese Comment',
  '风险等级 / Risk Level',
  '需要行动 / Action Needed',
  '来源链接1 / Source Link 1',
  '来源链接2 / Source Link 2',
  '数据来源 / Data Source',
  '复核状态 / Review Status',
  '生成时间 / Generated At',
  '备注 / Notes',
];

const DAILY_ACTIONS = ['No action', 'Watch', 'Review', 'High Attention'];
const SOURCE_MISSING = 'Source missing / 来源缺失';

const US_MACRO_KEYWORDS = [
  'Federal Reserve', 'Fed', 'interest rate', 'inflation', 'CPI', 'PCE', 'GDP',
  'jobs report', 'Treasury yield', 'US fiscal policy', 'US budget', 'US dollar',
  'S&P 500', 'Nasdaq',
];

const CANADA_MACRO_KEYWORDS = [
  'Bank of Canada', 'Canadian interest rate', 'Canada budget', 'Canada fiscal policy',
  'CAD/USD', 'Canadian banks', 'TSX', 'energy price', 'commodity price',
];

const EARNINGS_KEYWORDS = [
  'earnings', 'quarterly results', 'financial results', 'revenue', 'EPS', 'guidance',
  'outlook', 'profit margin', 'delivery numbers', 'annual report', 'Q1', 'Q2', 'Q3', 'Q4',
];

const SECTOR_RULES = [
  { sector: 'US Equity / S&P 500', tickers: ['VFV.TO', 'XUS.TO'], keywords: ['S&P 500', 'SPY', 'US market', 'Federal Reserve', 'Nasdaq'] },
  { sector: 'Canadian Equity / TSX', tickers: ['XIC.TO', 'XIU.TO'], keywords: ['TSX', 'Canadian banks', 'Bank of Canada', 'Canada fiscal', 'energy'] },
  { sector: 'Technology / AI', tickers: ['TSLA', 'HSAI', 'BABA', 'VFV.TO', 'XUS.TO'], keywords: ['AI', 'technology', 'Nasdaq', 'cloud', 'autonomous', 'semiconductor'] },
  { sector: 'EV / Auto Tech', tickers: ['TSLA', 'HSAI', 'LAC.TO'], keywords: ['EV', 'electric vehicle', 'auto', 'delivery numbers', 'battery', 'LiDAR'] },
  { sector: 'Oil & Gas', tickers: ['CVE.TO', 'REI'], keywords: ['oil', 'WTI', 'crude', 'energy', 'gas', 'geopolitical'] },
  { sector: 'Lithium / Mining', tickers: ['LAC.TO', 'TSLA', 'HSAI'], keywords: ['lithium', 'mining', 'battery', 'commodity', 'EV demand'] },
  { sector: 'China Tech / E-commerce', tickers: ['BABA', 'HSAI'], keywords: ['China tech', 'Alibaba', 'e-commerce', 'regulation', 'consumer', 'cloud'] },
  { sector: 'Conservative Balanced ETF', tickers: ['VCNS.TO'], keywords: ['interest rate', 'bond yield', 'conservative', 'balanced ETF', 'Bank of Canada'] },
];

const HOLDING_FOCUS = {
  'VCNS.TO': ['interest rate', 'bond yield', 'conservative portfolio', 'Bank of Canada', 'Federal Reserve'],
  'VFV.TO': ['S&P 500', 'US tech', 'Federal Reserve', 'US dollar', 'US economy'],
  'XUS.TO': ['S&P 500', 'US market', 'US macro', 'technology'],
  'XIC.TO': ['TSX', 'Canadian banks', 'energy', 'CAD', 'Canada fiscal'],
  'XIU.TO': ['TSX 60', 'Canadian banks', 'energy', 'large cap Canada'],
  'BABA': ['China tech', 'consumption', 'e-commerce', 'regulation', 'earnings', 'cloud'],
  'HSAI': ['LiDAR', 'autonomous driving', 'EV', 'AI sensing', 'China tech'],
  'TSLA': ['EV', 'AI', 'delivery numbers', 'profit margin', 'energy', 'battery', 'earnings'],
  'REI': ['oil price', 'US oil and gas', 'small cap energy', 'geopolitical'],
  'CVE.TO': ['WTI oil', 'Canada energy', 'refining margin', 'energy policy'],
  'LAC.TO': ['lithium price', 'mining project', 'EV demand', 'North America battery supply chain'],
};

const HOLDING_DIRECT_ALIASES = {
  'VCNS.TO': ['VCNS.TO', 'VCNS', 'Vanguard Conservative ETF Portfolio'],
  'VFV.TO': ['VFV.TO', 'VFV', 'Vanguard S&P 500 Index ETF'],
  'XUS.TO': ['XUS.TO', 'XUS', 'iShares Core S&P 500 Index ETF'],
  'XIC.TO': ['XIC.TO', 'XIC', 'iShares Core S&P/TSX Capped Composite Index ETF'],
  'XIU.TO': ['XIU.TO', 'XIU', 'iShares S&P/TSX 60 Index ETF'],
  'BABA': ['BABA', 'Alibaba'],
  'HSAI': ['HSAI', 'Hesai'],
  'TSLA': ['TSLA', 'Tesla'],
  'REI': ['REI', 'Ring Energy'],
  'CVE.TO': ['CVE.TO', 'CVE', 'Cenovus'],
  'LAC.TO': ['LAC.TO', 'LAC', 'Lithium Americas'],
};

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'dashboard';

    if (action === 'dashboard') {
      return jsonResponse_({
        ok: true,
        data: {
          holdings: readTab_(DASHBOARD_TABS.holdings),
          dailyNews: readTab_(DASHBOARD_TABS.dailyNews),
          watchlist: readTab_(DASHBOARD_TABS.watchlist),
          priorityAlerts: readTab_(DASHBOARD_TABS.priorityAlerts),
          settings: readTab_(DASHBOARD_TABS.settings),
          marketRadar: readTab_(DASHBOARD_TABS.marketRadar),
          morningBrief: (function() {
            // Prefer today's brief (from sheet row OR Drive doc with today's filename).
            // Fall back to the latest sheet entry if nothing exists for today yet.
            var todayRows = readMorningBrief_();
            if (todayRows && todayRows.length > 0) return todayRows;
            return getLatestMorningBrief_();
          }()),
        },
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'tab') {
      const tabName = params.name;
      if (!tabName) {
        throw new Error('Missing required parameter: name');
      }
      if (!isAllowedTab_(tabName)) {
        throw new Error('Unsupported tab name: ' + tabName);
      }

      const rows = readTab_(tabName);
      const data = tabName === DASHBOARD_TABS.morningBrief
        ? rows.map(sanitizePublicMorningBriefRecord_)
        : rows;

      return jsonResponse_({
        ok: true,
        data: data,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'latestAiMarketTrend') {
      return jsonResponse_({
        ok: true,
        data: getLatestAiMarketTrend_(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'refreshNews') {
      const result = dailyNewsFetchJob_();
      return jsonResponse_({
        ok: true,
        inserted: result.inserted,
        skipped: result.skipped,
        message: 'Daily news refresh completed',
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'syncNewsFromSheet') {
      const rows = readTab_(DASHBOARD_TABS.dailyNews);
      return jsonResponse_({
        ok: true,
        count: rows.length,
        data: rows,
        message: 'Daily news synced from sheet',
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'refreshMarketData') {
      const result = marketDataFetchJob_();
      return jsonResponse_({
        ok: true,
        updated: result.updated,
        inserted: result.inserted,
        errors: result.errors,
        message: 'Market data refresh completed',
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'syncMorningBrief') {
      const result = syncMorningBriefFromDrive();
      return jsonResponse_({
        ok: true,
        inserted: result.inserted,
        message: 'Morning brief sync completed',
        morningBrief: getLatestMorningBrief_(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'generateDailyHoldingIntelligence') {
      const result = generateDailyHoldingIntelligence_();
      return jsonResponse_({
        ok: true,
        date: result.date,
        inserted: result.inserted,
        updated: result.updated,
        holdingsProcessed: result.holdingsProcessed,
        message: 'Daily holding intelligence generated',
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'addWatchItem') {
      const result = addWatchItem_(params);
      return jsonResponse_({
        ok: true,
        inserted: 1,
        watchId: result.watchId,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'updateWatchItem') {
      const result = updateWatchItem_(params);
      return jsonResponse_({
        ok: true,
        updated: 1,
        watchId: result.watchId,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'archiveWatchItem') {
      const result = archiveWatchItem_(params);
      return jsonResponse_({
        ok: true,
        archived: 1,
        watchId: result.watchId,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'decisionLog') {
      return jsonResponse_({
        ok: true,
        data: readTab_(DASHBOARD_TABS.decisionLog),
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'updateDecisionLog') {
      const result = updateDecisionLog_(params);
      return jsonResponse_({
        ok: true,
        updated: 1,
        decisionId: result.decisionId,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'archiveDecisionLog') {
      const result = archiveDecisionLog_(params);
      return jsonResponse_({
        ok: true,
        archived: 1,
        decisionId: result.decisionId,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'addDecisionLog') {
      const result = addDecisionLog_(params);
      return jsonResponse_({
        ok: true,
        inserted: 1,
        decisionId: result.decisionId,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'generateResearchPack') {
      const result = generateResearchPack_(params);
      return jsonResponse_({
        ok: true,
        packId: result.packId,
        docUrl: result.docUrl,
        notebookLmPrompt: result.notebookLmPrompt,
        message: 'Research Pack created',
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'saveNotebookLmAnalysis') {
      const result = saveNotebookLmAnalysis_(params);
      return jsonResponse_({
        ok: true,
        packId: result.packId,
        updated: result.updated,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'analyze_stocks') {
  const result = analyzeStocks_(params);
  return jsonResponse_({
    ok: true,
    data: result.data || result,
    updatedRows: result.updatedRows || result.count || 0,
    updatedAt: new Date().toISOString(),
  });
}

if (action === 'update_stock_fundamentals') {
  const result = updateStockFundamentalsForStockAnalysis_(params);
  return jsonResponse_({
    ok: true,
    data: result,
    updatedRows: result.updated || result.updatedRows || 0,
    updatedAt: new Date().toISOString(),
  });
}

if (action === 'listPublicTopics') {
  return jsonResponse_({ ok: true, data: listPublicTopics_(false), updatedAt: new Date().toISOString() });
}

if (action === 'listAllPublicTopics') {
  return jsonResponse_({ ok: true, data: listPublicTopics_(true), updatedAt: new Date().toISOString() });
}

if (action === 'listPublicReplies') {
  return jsonResponse_({ ok: true, data: listPublicReplies_(params.topicId, false), updatedAt: new Date().toISOString() });
}

if (action === 'listAllPublicReplies') {
  return jsonResponse_({ ok: true, data: listPublicReplies_(params.topicId, true), updatedAt: new Date().toISOString() });
}

throw new Error('Unsupported action: ' + action);

    throw new Error('Unsupported action: ' + action);
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents || '{}');
    }

    var action = String(body.action || '').trim();
    if (action === 'appendAiMarketTrend') {
      var result = appendAiMarketTrend_(body.record || {});
      return jsonResponse_({
        ok: true,
        data: result,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'updateWatchlistEnrichment') {
      var enrichResult = updateWatchlistEnrichment_(body);
      return jsonResponse_({
        ok: true,
        data: enrichResult,
        updatedRows: enrichResult.updatedRows,
        updatedAt: new Date().toISOString(),
      });
    }

    if (action === 'addPublicTopic') {
      return jsonResponse_({ ok: true, data: addPublicTopic_(body), updatedAt: new Date().toISOString() });
    }

    if (action === 'addPublicReply') {
      return jsonResponse_({ ok: true, data: addPublicReply_(body), updatedAt: new Date().toISOString() });
    }

    if (action === 'updatePublicTopicStatus') {
      return jsonResponse_({ ok: true, data: updatePublicStatus_(DASHBOARD_TABS.publicTopics, body.id, body.status), updatedAt: new Date().toISOString() });
    }

    if (action === 'updatePublicReplyStatus') {
      return jsonResponse_({ ok: true, data: updatePublicStatus_(DASHBOARD_TABS.publicReplies, body.id, body.status), updatedAt: new Date().toISOString() });
    }

    throw new Error('Unsupported POST action: ' + action);
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}

// Writes enrichment results (Latest Chinese News Summary -> column L,
// Earnings/Filing Summary -> column M) back to 07 Watchlist Intelligence.
// Accepts either a single { watchId, newsSummary, earningsSummary } payload
// or { rows: [ {watchId, newsSummary, earningsSummary}, ... ] } for batch writes.
function updateWatchlistEnrichment_(body) {
  var rows = Array.isArray(body.rows) ? body.rows : [body];

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.watchlist);
  if (!sheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.watchlist);

  var headers = readHeaders_(sheet);
  var today = Utilities.formatDate(new Date(), 'America/Vancouver', 'yyyy-MM-dd');
  var updatedRows = 0;
  var updatedIds = [];

  rows.forEach(function(item) {
    var watchId = String((item && item.watchId) || '').trim();
    if (!watchId) return;

    var rowIndex;
    try {
      rowIndex = findRowById_(sheet, headers, ['Watch ID', '观察ID'], watchId);
    } catch (err) {
      return; // skip unknown ids instead of failing the whole batch
    }

    var newsSummary = String((item && item.newsSummary) || '').trim();
    var earningsSummary = String((item && item.earningsSummary) || '').trim();
    var mainRisks = String((item && item.mainRisks) || '').trim();
    var aiComment = String((item && item.aiComment) || '').trim();

    if (newsSummary) {
      setCellByHeader_(sheet, headers, rowIndex,
        ['最新中文新闻摘要', 'Latest Chinese News Summary'], newsSummary);
    }
    if (earningsSummary) {
      setCellByHeader_(sheet, headers, rowIndex,
        ['财报/公告摘要', 'Earnings or Filing Summary', 'Earnings / Filing Summary'], earningsSummary);
    }
    if (mainRisks) {
      setCellByHeader_(sheet, headers, rowIndex,
        ['主要风险', 'Main Risks'], mainRisks);
    }
    if (aiComment) {
      setCellByHeader_(sheet, headers, rowIndex,
        ['AI中文点评', 'AI Chinese Comment'], aiComment);
    }
    if (newsSummary || earningsSummary || mainRisks || aiComment) {
      setCellByHeader_(sheet, headers, rowIndex, ['最后更新', 'Last Updated'], today);
      updatedRows += 1;
      updatedIds.push(watchId);
    }
  });

  SpreadsheetApp.flush();
  return { updatedRows: updatedRows, updatedIds: updatedIds };
}

// ── Public Forum ("大家在关注") ──────────────────────────────────────────────
// Lightweight topics + replies stored in 14 Public Topics / 15 Public Replies.
// Public reads return only Status = Published; admin reads return everything.
// Records are never physically deleted — only their Status changes.

var PUBLIC_VISIBLE_STATUS = 'Published';

function listPublicTopics_(includeAll) {
  var rows = readTab_(DASHBOARD_TABS.publicTopics);
  var filtered = rows.filter(function(r) {
    return includeAll || String(r['Status'] || '').trim() === PUBLIC_VISIBLE_STATUS;
  });
  // Newest first by CreatedAt.
  filtered.sort(function(a, b) {
    return String(b['CreatedAt'] || '').localeCompare(String(a['CreatedAt'] || ''));
  });
  return filtered;
}

function listPublicReplies_(topicId, includeAll) {
  var wanted = String(topicId || '').trim();
  var rows = readTab_(DASHBOARD_TABS.publicReplies);
  var filtered = rows.filter(function(r) {
    if (wanted && String(r['TopicID'] || '').trim() !== wanted) return false;
    return includeAll || String(r['Status'] || '').trim() === PUBLIC_VISIBLE_STATUS;
  });
  // Oldest to newest by CreatedAt.
  filtered.sort(function(a, b) {
    return String(a['CreatedAt'] || '').localeCompare(String(b['CreatedAt'] || ''));
  });
  return filtered;
}

function addPublicTopic_(body) {
  var id = String(body.id || '').trim() || ('topic_' + Date.now() + '_' + Math.floor(Math.random() * 1e6));
  var values = {
    'ID': id,
    'CreatedAt': String(body.createdAt || '').trim() || new Date().toISOString(),
    'Nickname': String(body.nickname || '').trim(),
    'Ticker': String(body.ticker || '').trim(),
    'Title': String(body.title || '').trim(),
    'Content': String(body.content || '').trim(),
    'Status': String(body.status || '').trim() || PUBLIC_VISIBLE_STATUS,
    'IPHash': String(body.ipHash || '').trim(),
    'UserAgent': String(body.userAgent || '').trim(),
    'AdminNote': String(body.adminNote || '').trim(),
  };
  appendPublicRow_(DASHBOARD_TABS.publicTopics, values);
  return { id: id };
}

function addPublicReply_(body) {
  var id = String(body.id || '').trim() || ('reply_' + Date.now() + '_' + Math.floor(Math.random() * 1e6));
  var topicId = String(body.topicId || '').trim();
  if (!topicId) throw new Error('TopicID is required.');
  var values = {
    'ID': id,
    'TopicID': topicId,
    'CreatedAt': String(body.createdAt || '').trim() || new Date().toISOString(),
    'Nickname': String(body.nickname || '').trim(),
    'Content': String(body.content || '').trim(),
    'Status': String(body.status || '').trim() || PUBLIC_VISIBLE_STATUS,
    'IPHash': String(body.ipHash || '').trim(),
    'UserAgent': String(body.userAgent || '').trim(),
    'AdminNote': String(body.adminNote || '').trim(),
  };
  appendPublicRow_(DASHBOARD_TABS.publicReplies, values);
  return { id: id };
}

function appendPublicRow_(tabName, valueMap) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(tabName);
  if (!sheet) throw new Error('Sheet tab not found: ' + tabName);
  var headers = readHeaders_(sheet);
  var row = headers.map(function(h) {
    return Object.prototype.hasOwnProperty.call(valueMap, h) ? valueMap[h] : '';
  });
  sheet.appendRow(row);
  SpreadsheetApp.flush();
}

function updatePublicStatus_(tabName, id, status) {
  var wantedId = String(id || '').trim();
  if (!wantedId) throw new Error('Record ID is required.');
  var allowed = ['Published', 'Hidden', 'Deleted'];
  var nextStatus = String(status || '').trim();
  if (allowed.indexOf(nextStatus) === -1) throw new Error('Unsupported status: ' + nextStatus);

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(tabName);
  if (!sheet) throw new Error('Sheet tab not found: ' + tabName);
  var headers = readHeaders_(sheet);
  var rowIndex = findRowById_(sheet, headers, ['ID'], wantedId);
  setCellByHeader_(sheet, headers, rowIndex, ['Status'], nextStatus);
  SpreadsheetApp.flush();
  return { id: wantedId, status: nextStatus };
}

function readTab_(tabName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(tabName);
  if (!sheet) {
    throw new Error('Sheet tab not found: ' + tabName);
  }

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function(header) {
    return String(header || '').trim();
  });

  return values.slice(1).reduce(function(rows, row) {
    const isEmpty = row.every(function(cell) {
      return String(cell || '').trim() === '';
    });
    if (isEmpty) {
      return rows;
    }

    const record = {};
    headers.forEach(function(header, index) {
      if (header) {
        record[header] = row[index] === undefined ? '' : row[index];
      }
    });
    rows.push(record);
    return rows;
  }, []);
}

function isAllowedTab_(tabName) {
  return Object.keys(DASHBOARD_TABS).some(function(key) {
    return DASHBOARD_TABS[key] === tabName;
  });
}

function appendAiMarketTrend_(record) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.aiMarketTrend);
  if (!sheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.aiMarketTrend);

  ensureAiMarketTrendHeaders_(sheet);

  var now = new Date();
  var updatedAt = String(record.updated_at || record.updatedAt || now.toISOString()).trim();
  var reportDate = String(record.report_date || '').trim() || Utilities.formatDate(now, getScriptTimeZone_(), 'yyyy-MM-dd');
  var recordId = String(record.record_id || '').trim() || ('AIT-' + Utilities.formatDate(now, getScriptTimeZone_(), 'yyyyMMdd-HHmmss'));

  var row = [
    recordId,
    reportDate,
    updatedAt,
    String(record.generated_by || 'manual').trim(),
    String(record.status || 'PUBLISHED').trim(),
    String(record.language || 'zh').trim(),
    String(record.market_overview || '').trim(),
    String(record.us_market || '').trim(),
    String(record.canada_market || '').trim(),
    String(record.macro_policy || '').trim(),
    String(record.sector_rotation || '').trim(),
    String(record.key_movers || '').trim(),
    String(record.risk_signals || '').trim(),
    String(record.conservative_notes || '').trim(),
    String(record.watch_next || '').trim(),
    String(record.sources_count || '').trim(),
    String(record.sources || '').trim(),
    String(record.raw_json || '').trim(),
    String(record.public_visible || 'TRUE').trim(),
    String(record.notes || '').trim(),
  ];

  sheet.appendRow(row);
  SpreadsheetApp.flush();
  return { recordId: recordId };
}

function getLatestAiMarketTrend_() {
  var rows = readTab_(DASHBOARD_TABS.aiMarketTrend);
  var latest = null;

  rows.forEach(function(row) {
    if (String(row.status || '').trim().toUpperCase() !== 'PUBLISHED') return;
    if (String(row.public_visible || '').trim().toUpperCase() !== 'TRUE') return;

    var updatedAt = String(row.updated_at || '').trim();
    var time = Date.parse(updatedAt);
    if (isNaN(time)) time = 0;
    if (!latest || time > latest.time) {
      latest = { time: time, row: row };
    }
  });

  return latest ? latest.row : null;
}

function ensureAiMarketTrendHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < AI_MARKET_TREND_HEADERS.length) {
    sheet.getRange(1, 1, 1, AI_MARKET_TREND_HEADERS.length).setValues([AI_MARKET_TREND_HEADERS]);
    return;
  }

  var headers = sheet.getRange(1, 1, 1, AI_MARKET_TREND_HEADERS.length).getValues()[0].map(function(header) {
    return String(header || '').trim();
  });

  var needsHeader = AI_MARKET_TREND_HEADERS.some(function(header, index) {
    return headers[index] !== header;
  });

  if (needsHeader) {
    sheet.getRange(1, 1, 1, AI_MARKET_TREND_HEADERS.length).setValues([AI_MARKET_TREND_HEADERS]);
  }
}

function getLatestMorningBrief_() {
  var rows = readTab_(DASHBOARD_TABS.morningBrief);
  var latest = null;

  rows.forEach(function(row) {
    if (!isActiveMorningBriefRecord_(row)) {
      return;
    }

    var reportTime = parseMorningBriefDateTime_(row);
    if (!latest || reportTime > latest.reportTime) {
      latest = {
        reportTime: reportTime,
        row: row
      };
    }
  });

  if (!latest) {
    return null;
  }

  var record = latest.row;
  var docLink = getMorningBriefCell_(record, 'Google Doc Link');
  var docId = extractGoogleDocId_(docLink);
  var docContent = docId ? readGoogleDocText_(docId) : '';
  var summary = getMorningBriefCell_(record, '摘要 / Summary');

  return {
    reportDate: getMorningBriefCell_(record, '日期 / Date'),
    generatedAt: getMorningBriefCell_(record, '创建时间 / Created At'),
    title: getMorningBriefCell_(record, '标题 / Title'),
    summary3Lines: summary,
    fullContent: docContent || summary,
    status: getMorningBriefCell_(record, '状态 / Status'),
    '日期 / Date': getMorningBriefCell_(record, '日期 / Date'),
    '语言 / Language': getMorningBriefCell_(record, '语言 / Language'),
    '标题 / Title': getMorningBriefCell_(record, '标题 / Title'),
    '摘要 / Summary': summary,
    '类型 / Type': getMorningBriefCell_(record, '类型 / Type'),
    '状态 / Status': getMorningBriefCell_(record, '状态 / Status'),
    '创建时间 / Created At': getMorningBriefCell_(record, '创建时间 / Created At'),
    '_docContent': docContent
  };
}

function isActiveMorningBriefRecord_(row) {
  var status = getMorningBriefCell_(row, '状态 / Status').toLowerCase();
  var type = getMorningBriefCell_(row, '类型 / Type').toLowerCase();

  if (status !== 'active') {
    return false;
  }
  return !type || type === 'morning brief' || type === '早晨晨报' || type === '早晨简报';
}

function parseMorningBriefDateTime_(row) {
  var createdAt = getMorningBriefCell_(row, '创建时间 / Created At');
  var date = getMorningBriefCell_(row, '日期 / Date');
  return parseMorningBriefDateValue_(createdAt) || parseMorningBriefDateValue_(date);
}

function parseMorningBriefDateValue_(value) {
  var text = String(value || '').trim();
  if (!text) {
    return 0;
  }

  var match = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
  }

  var parsed = new Date(text);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function readMorningBrief_() {
  var rows = readTab_(DASHBOARD_TABS.morningBrief);
  var todayKey = getTodayDateKey_();
  var todayCompact = todayKey.replace(/-/g, '');
  var output = [];
  var seen = {};

  rows.forEach(function(row) {
    if (!isActiveMorningBriefRow_(row, todayKey)) {
      return;
    }

    var record = Object.assign({}, row);
    var docLink = getMorningBriefCell_(record, 'Google Doc Link');
    var docId = extractGoogleDocId_(docLink);
    if (docId) {
      record['_docContent'] = readGoogleDocText_(docId);
    }

    output.push(sanitizePublicMorningBriefRecord_(record));
    seen[getMorningBriefDedupeKey_(record)] = true;
  });

  findTodayMorningBriefDocs_(todayKey, todayCompact).forEach(function(record) {
    var key = getMorningBriefDedupeKey_(record);
    if (!seen[key]) {
      output.push(sanitizePublicMorningBriefRecord_(record));
      seen[key] = true;
    }
  });

  return output;
}

function findTodayMorningBriefDocs_(todayKey, todayCompact) {
  var folder;
  try {
    folder = DriveApp.getFolderById(MORNING_BRIEF_FOLDER_ID);
  } catch (error) {
    return [];
  }

  var candidates = [
    { language: 'zh', title: '早晨简报_' + todayCompact },
    { language: 'zh', title: '早晨晨报_' + todayCompact },
    { language: 'en', title: 'Morning Brief_' + todayCompact },
    { language: 'en', title: 'Morning_Brief_' + todayCompact },
    { language: 'en', title: 'MorningBrief_' + todayCompact }
  ];

  var records = [];
  candidates.forEach(function(candidate) {
    var files = folder.getFilesByName(candidate.title);
    if (!files.hasNext()) {
      return;
    }

    var file = files.next();
    var docId = file.getId();
    records.push({
      '日期 / Date': todayKey,
      '语言 / Language': candidate.language,
      '标题 / Title': candidate.title,
      '摘要 / Summary': '',
      '类型 / Type': 'Morning Brief',
      '状态 / Status': 'Active',
      '创建时间 / Created At': Utilities.formatDate(new Date(), getScriptTimeZone_(), 'yyyy-MM-dd HH:mm:ss'),
      '_docContent': readGoogleDocText_(docId),
      '_source': 'auto-doc'
    });
  });

  return records;
}

function sanitizePublicMorningBriefRecord_(record) {
  var publicRecord = Object.assign({}, record);
  delete publicRecord['Google Doc Link'];
  delete publicRecord['Google Drive文件链接 / Drive File Link'];
  delete publicRecord['Drive File Link'];
  delete publicRecord.sourceDocUrl;
  return publicRecord;
}

function isActiveMorningBriefRow_(row, todayKey) {
  var status = getMorningBriefCell_(row, '状态 / Status').toLowerCase();
  var type = getMorningBriefCell_(row, '类型 / Type').toLowerCase();
  var dateKey = normalizeMorningBriefDate_(getMorningBriefCell_(row, '日期 / Date'));

  if (status !== 'active') {
    return false;
  }
  if (type && type !== 'morning brief' && type !== '早晨晨报' && type !== '早晨简报') {
    return false;
  }
  return dateKey === todayKey;
}

function getMorningBriefCell_(row, key) {
  return String(row && row[key] !== undefined ? row[key] : '').trim();
}

function getMorningBriefDedupeKey_(row) {
  return [
    normalizeMorningBriefDate_(getMorningBriefCell_(row, '日期 / Date')),
    getMorningBriefCell_(row, '语言 / Language').toLowerCase(),
    getMorningBriefCell_(row, '标题 / Title').toLowerCase()
  ].join('|');
}

function getTodayDateKey_() {
  return Utilities.formatDate(new Date(), getScriptTimeZone_(), 'yyyy-MM-dd');
}

function getScriptTimeZone_() {
  return Session.getScriptTimeZone() || 'America/Vancouver';
}

function normalizeMorningBriefDate_(value) {
  var text = String(value || '').trim();
  var match = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (match) {
    return [
      match[1],
      ('0' + match[2]).slice(-2),
      ('0' + match[3]).slice(-2)
    ].join('-');
  }

  var date = new Date(text);
  if (!isNaN(date.getTime())) {
    return Utilities.formatDate(date, getScriptTimeZone_(), 'yyyy-MM-dd');
  }
  return '';
}

function extractGoogleDocId_(url) {
  var text = String(url || '').trim();
  var match = text.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

function readGoogleDocText_(docId) {
  if (!docId) {
    return '';
  }
  try {
    return DocumentApp.openById(docId).getBody().getText();
  } catch (error) {
    return '';
  }
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// Add one validated row to 07 Watchlist Intelligence only.
function addWatchItem_(params) {
  var owner = String(params.owner || '').trim();
  var ticker = String(params.ticker || '').trim().toUpperCase();
  var name = String(params.name || '').trim();
  var type = String(params.type || '').trim();
  var sector = String(params.sector || '').trim();
  var priority = String(params.priority || 'Medium').trim();
  var reason = String(params.reason || '').trim();

  if (!owner) throw new Error('Owner is required.');
  if (!type) throw new Error('Type is required.');
  if (!ticker && !name) throw new Error('Ticker or Name is required.');
  if (['Mabel', 'Victor', 'Both'].indexOf(owner) === -1) throw new Error('Unsupported owner: ' + owner);
  if (['Low', 'Medium', 'High'].indexOf(priority) === -1) priority = 'Medium';

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.watchlist);
  if (!sheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.watchlist);

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('07 Watchlist Intelligence sheet has no columns.');
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });

  var watchId = nextWatchId_(sheet, headers);
  var today = Utilities.formatDate(new Date(), 'America/Vancouver', 'yyyy-MM-dd');
  var row = headers.map(function(h) {
    if (!h) return '';
    if (h.indexOf('Watch ID') !== -1 || h.indexOf('观察ID') !== -1) return watchId;
    if (h.indexOf('Owner') !== -1 || h.indexOf('所属人') !== -1) return owner;
    if (h.indexOf('Ticker') !== -1 || h.indexOf('代码') !== -1) return ticker;
    if (h.indexOf('Name') !== -1 || h.indexOf('名称') !== -1) return name || ticker;
    if (h.indexOf('Type') !== -1 || h.indexOf('类型') !== -1) return type;
    if (h.indexOf('Sector') !== -1 || h.indexOf('板块') !== -1) return sector;
    if (h.indexOf('Watch Reason') !== -1 || h.indexOf('观察原因') !== -1) return reason;
    if (h.indexOf('Watch Priority') !== -1 || h.indexOf('关注级别') !== -1) return priority;
    if (h.indexOf('Key Question') !== -1 || h.indexOf('目标问题') !== -1) return '是否需要进入人工复核？';
    if (h.indexOf('Action Needed') !== -1 || h.indexOf('需要行动') !== -1) return 'Review';
    if (h.indexOf('Review Status') !== -1 || h.indexOf('复核状态') !== -1) return 'Pending';
    if (h.indexOf('Last Updated') !== -1 || h.indexOf('最后更新') !== -1) return today;
    if (h.indexOf('Status') !== -1 || h.indexOf('状态') !== -1) return 'Active Watch';
    if (h.indexOf('Notes') !== -1 || h.indexOf('备注') !== -1) return 'Added from WebUI V1.1';
    return '';
  });

  sheet.appendRow(row);
  SpreadsheetApp.flush();
  return { watchId: watchId };
}

function nextWatchId_(sheet, headers) {
  var idCol = headers.findIndex(function(h) {
    return h.indexOf('Watch ID') !== -1 || h.indexOf('观察ID') !== -1;
  }) + 1;
  if (idCol < 1) throw new Error('Watch ID column not found.');

  var lastRow = sheet.getLastRow();
  var maxId = 0;
  if (lastRow > 1) {
    var values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var match = String(row[0] || '').match(/^WAT-(\d+)$/i);
      if (match) maxId = Math.max(maxId, Number(match[1]));
    });
  }
  return 'WAT-' + String(maxId + 1).padStart(3, '0');
}

function updateWatchItem_(params) {
  var watchId = String(params.watchId || '').trim();
  if (!watchId) throw new Error('Watch ID is required.');

  var owner = String(params.owner || '').trim();
  var ticker = String(params.ticker || '').trim().toUpperCase();
  var name = String(params.name || '').trim();
  var type = String(params.type || '').trim();
  var sector = String(params.sector || '').trim();
  var priority = String(params.priority || 'Medium').trim();
  var reason = String(params.reason || '').trim();

  if (!owner) throw new Error('Owner is required.');
  if (!type) throw new Error('Type is required.');
  if (!ticker && !name) throw new Error('Ticker or Name is required.');
  if (['Mabel', 'Victor', 'Both'].indexOf(owner) === -1) throw new Error('Unsupported owner: ' + owner);
  if (['Low', 'Medium', 'High'].indexOf(priority) === -1) priority = 'Medium';

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.watchlist);
  if (!sheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.watchlist);

  var headers = readHeaders_(sheet);
  var rowIndex = findRowById_(sheet, headers, ['Watch ID', '观察ID'], watchId);
  var today = Utilities.formatDate(new Date(), 'America/Vancouver', 'yyyy-MM-dd');

  setCellByHeader_(sheet, headers, rowIndex, ['Owner', '所属人'], owner);
  setCellByHeader_(sheet, headers, rowIndex, ['Ticker', '代码'], ticker);
  setCellByHeader_(sheet, headers, rowIndex, ['Name', '名称'], name || ticker);
  setCellByHeader_(sheet, headers, rowIndex, ['Type', '类型'], type);
  setCellByHeader_(sheet, headers, rowIndex, ['Sector', '板块'], sector);
  setCellByHeader_(sheet, headers, rowIndex, ['Watch Reason', '观察原因'], reason);
  setCellByHeader_(sheet, headers, rowIndex, ['Watch Priority', '关注级别'], priority);
  setCellByHeader_(sheet, headers, rowIndex, ['Last Updated', '最后更新'], today);
  SpreadsheetApp.flush();
  return { watchId: watchId };
}

function archiveWatchItem_(params) {
  var watchId = String(params.watchId || '').trim();
  if (!watchId) throw new Error('Watch ID is required.');

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.watchlist);
  if (!sheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.watchlist);

  var headers = readHeaders_(sheet);
  var rowIndex = findRowById_(sheet, headers, ['Watch ID', '观察ID'], watchId);
  setCellByHeader_(sheet, headers, rowIndex, ['Status', '状态'], 'Archived');
  setCellByHeader_(sheet, headers, rowIndex, ['Last Updated', '最后更新'], Utilities.formatDate(new Date(), 'America/Vancouver', 'yyyy-MM-dd'));
  SpreadsheetApp.flush();
  return { watchId: watchId };
}

// ─── Daily News Fetch ─────────────────────────────────────────────────────────

// Public entry point — run manually from Apps Script editor to test
function dailyNewsFetchJob() {
  const result = dailyNewsFetchJob_();
  Logger.log('Inserted: ' + result.inserted + ', Skipped: ' + result.skipped);
  return result;
}

// Private implementation
function dailyNewsFetchJob_() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('NEWS_API_KEY');
  if (!apiKey) {
    throw new Error('News API key is not configured. Please set NEWS_API_KEY in Apps Script PropertiesService.');
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.dailyNews);
  if (!sheet) {
    throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.dailyNews);
  }

  // Read column headers (row 1)
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('06 Daily News Intelligence sheet has no columns.');
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });

  // Build existing Source Link set for deduplication
  const existingLinks = {};
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const linkColIdx = headers.findIndex(function(h) {
      return h.indexOf('Source Link') !== -1 || h.indexOf('来源链接') !== -1;
    });
    if (linkColIdx >= 0) {
      const linkValues = sheet.getRange(2, linkColIdx + 1, lastRow - 1, 1).getValues();
      linkValues.forEach(function(row) {
        if (row[0]) existingLinks[String(row[0]).trim()] = true;
      });
    }
  }

  const MAX_TOTAL = 20;
  const MAX_PER_TOPIC = 5;  // raised from 2 — gives newsAPI more room to return results
  const now = new Date();
  const createdAt = now.toISOString();
  const dateStr = Utilities.formatDate(now, 'America/Vancouver', 'yyyy-MM-dd');

  let inserted = 0;
  let skipped = 0;

  Logger.log('[NewsJob] Starting. Topics: ' + NEWS_TOPICS.length + ', existingLinks: ' + Object.keys(existingLinks).length);

  for (let t = 0; t < NEWS_TOPICS.length && inserted < MAX_TOTAL; t++) {
    const topic = NEWS_TOPICS[t];
    let articles;
    try {
      articles = fetchNewsApiArticles_(apiKey, topic.q, MAX_PER_TOPIC);
    } catch (fetchErr) {
      // Re-throw API key errors so the outer handler surfaces them clearly
      if (String(fetchErr.message).indexOf('not configured') !== -1) throw fetchErr;
      Logger.log('[NewsJob] FETCH ERROR topic="' + topic.q + '" error="' + fetchErr.message + '"');
      continue;
    }

    Logger.log('[NewsJob] topic="' + topic.q + '" articles=' + articles.length);

    for (let a = 0; a < articles.length && inserted < MAX_TOTAL; a++) {
      const article = articles[a];
      const url = String(article.url || '').trim();

      if (!url || existingLinks[url]) {
        Logger.log('[NewsJob]   skip url=' + (url || '(empty)'));
        skipped++;
        continue;
      }

      existingLinks[url] = true;
      const row = buildNewsRow_(headers, article, topic, dateStr, createdAt);
      sheet.appendRow(row);
      Logger.log('[NewsJob]   insert "' + article.title + '"');
      inserted++;
    }
  }

  Logger.log('[NewsJob] Done. inserted=' + inserted + ' skipped=' + skipped);
  return { inserted: inserted, skipped: skipped };
}

function fetchNewsApiArticles_(apiKey, query, maxResults) {
  const pageSize = Math.min(Math.max(maxResults, 1), 100);

  // Try /v2/everything first; fall back to /v2/top-headlines if plan-restricted
  const endpoints = [
    'https://newsapi.org/v2/everything'
      + '?q=' + encodeURIComponent(query)
      + '&sortBy=publishedAt'
      + '&pageSize=' + pageSize
      + '&apiKey=[KEY]',
    'https://newsapi.org/v2/top-headlines'
      + '?q=' + encodeURIComponent(query)
      + '&pageSize=' + pageSize
      + '&apiKey=[KEY]',
  ];

  for (let e = 0; e < endpoints.length; e++) {
    const urlForLog = endpoints[e];                              // key already hidden
    const urlReal   = endpoints[e].replace('[KEY]', apiKey);

    Logger.log('[NewsAPI] ' + (e === 0 ? 'everything' : 'top-headlines') + ' q="' + query + '" url=' + urlForLog);

    const response = UrlFetchApp.fetch(urlReal, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    const body = response.getContentText();

    let data;
    try { data = JSON.parse(body); } catch (ex) { data = {}; }

    Logger.log('[NewsAPI] HTTP=' + code + ' status=' + data.status + ' code=' + (data.code || '-') + ' totalResults=' + data.totalResults + ' articles=' + (data.articles ? data.articles.length : 0) + ' message=' + (data.message || '-'));

    // Hard API key error — stop immediately
    if (data.code === 'apiKeyInvalid' || data.code === 'apiKeyMissing' || code === 401) {
      throw new Error('News API key is not configured or invalid. Please verify NEWS_API_KEY in PropertiesService.');
    }

    // Plan restriction — try next endpoint
    if (data.code === 'planRestricted' || data.code === 'planUpgradeRequired') {
      Logger.log('[NewsAPI] Plan restricted on endpoint ' + e + ', trying next.');
      continue;
    }

    // Other non-200
    if (code !== 200) {
      throw new Error('NewsAPI HTTP ' + code + ' endpoint=' + e + ': ' + (data.message || body.slice(0, 120)));
    }

    if (data.status !== 'ok') {
      throw new Error('NewsAPI status=' + data.status + ' code=' + (data.code || '?') + ': ' + (data.message || ''));
    }

    return data.articles || [];
  }

  // Both endpoints failed plan check
  Logger.log('[NewsAPI] All endpoints plan-restricted for q="' + query + '"');
  return [];
}

// One-shot debug helper — run this directly in Apps Script editor to see raw API output for a single query
function debugNewsApi() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('NEWS_API_KEY');
  if (!apiKey) { Logger.log('NEWS_API_KEY not set'); return; }
  const articles = fetchNewsApiArticles_(apiKey, 'Tesla stock', 3);
  Logger.log('debugNewsApi result count: ' + articles.length);
  if (articles.length > 0) Logger.log('First title: ' + articles[0].title);
}

function buildNewsRow_(headers, article, topic, dateStr, createdAt) {
  const title       = String(article.title       || '').trim();
  const description = String(article.description || '').trim();
  const sourceName  = (article.source && article.source.name) ? article.source.name : '';
  const publishedAt = String(article.publishedAt || '');
  const url         = String(article.url         || '').trim();

  // Translate title using LanguageApp (Google Translate, no API key required)
  let chineseTitle = title;
  try {
    if (title) chineseTitle = LanguageApp.translate(title, 'en', 'zh-CN');
  } catch (e) {
    Logger.log('[Translate] title failed: ' + e.message + ' — keeping original');
  }

  // Translate description into Chinese Summary if available
  let chineseSummary = '';
  try {
    if (description) chineseSummary = LanguageApp.translate(description, 'en', 'zh-CN');
  } catch (e) {
    Logger.log('[Translate] description failed: ' + e.message);
  }

  // AI comment: translated summary, or generic fallback only here (not in headline)
  const aiComment = chineseSummary || '根据新闻标题和摘要，该信息可能与相关持仓或观察主题有关，需人工查看。';

  const riskLevel  = topic.action === 'High Attention' ? 'High' : 'Medium';
  const importance = topic.action === 'High Attention' ? 'High' : 'Medium';

  return headers.map(function(h) {
    if (!h) return '';
    if (h.indexOf('日期')    !== -1 || h.indexOf('Date')           !== -1) return dateStr;
    if (h.indexOf('所属人')  !== -1 || h.indexOf('Owner')          !== -1) return topic.owner;
    if (h.indexOf('类别')    !== -1 || h.indexOf('Category')       !== -1) return topic.category;
    if (h.indexOf('相关代码') !== -1 || h.indexOf('Related Ticker') !== -1) return topic.ticker;
    if (h.indexOf('新闻标题中文') !== -1 || h.indexOf('Chinese Title')   !== -1) return chineseTitle;
    if (h.indexOf('新闻摘要中文') !== -1 || h.indexOf('Chinese Summary') !== -1) return chineseSummary;
    if (h.indexOf('原始标题') !== -1 || h.indexOf('Original Title') !== -1) return title;
    // Match "来源" without "链接" to avoid hitting Source Link
    if ((h.indexOf('来源') !== -1 || h.indexOf('Source') !== -1)
        && h.indexOf('Link') === -1 && h.indexOf('链接') === -1)           return sourceName;
    if (h.indexOf('来源链接') !== -1 || h.indexOf('Source Link')   !== -1) return url;
    if (h.indexOf('重要性')  !== -1 || h.indexOf('Importance')     !== -1) return importance;
    if (h.indexOf('风险等级') !== -1 || h.indexOf('Risk Level')     !== -1) return riskLevel;
    if (h.indexOf('需要行动') !== -1 || h.indexOf('Action Needed')  !== -1) return topic.action;
    if (h.indexOf('AI中文点评') !== -1 || h.indexOf('AI Chinese Comment')  !== -1) return aiComment;
    if (h.indexOf('新闻时间') !== -1 || h.indexOf('News Time')      !== -1) return publishedAt;
    if (h.indexOf('抓取关键词') !== -1 || h.indexOf('Search Keyword') !== -1) return topic.keyword;
    if (h.indexOf('创建时间') !== -1 || h.indexOf('Created At')     !== -1) return createdAt;
    if (h.indexOf('备注')    !== -1 || h.indexOf('Notes')           !== -1) return 'Auto V1';
    return '';
  });
}

// ─── One-time backfill: translate existing English rows ────────────────────────
// Run manually from the Apps Script editor. No redeploy needed.
// Translates Chinese Title and Chinese Summary for rows that are still in English.
function translateExistingNewsRows() {
  const GENERIC_FALLBACK  = '根据新闻标题和摘要，该信息可能与相关持仓或观察主题有关，需人工查看。';
  const AI_COMMENT_PREFIX = '[原文摘要] ';
  const HAS_CHINESE       = /[一-鿿]/;   // true if string contains any Chinese character

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.dailyNews);
  if (!sheet) throw new Error('Sheet not found: ' + DASHBOARD_TABS.dailyNews);

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) { Logger.log('[Backfill] No data rows.'); return; }

  // Read headers once
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });

  // Helper: find 1-based column index by two keyword fragments
  function findCol(kw1, kw2) {
    var idx = headers.findIndex(function(h) {
      return h.indexOf(kw1) !== -1 || (kw2 && h.indexOf(kw2) !== -1);
    });
    return idx >= 0 ? idx + 1 : -1;
  }

  var colOrigTitle    = findCol('原始标题',    'Original Title');
  var colChTitle      = findCol('新闻标题中文', 'Chinese Title');
  var colChSummary    = findCol('新闻摘要中文', 'Chinese Summary');
  var colAiComment    = findCol('AI中文点评',  'AI Chinese Comment');

  if (colOrigTitle < 0 || colChTitle < 0) {
    throw new Error('[Backfill] Required columns not found. Check sheet headers.');
  }
  Logger.log('[Backfill] Cols: origTitle=' + colOrigTitle + ' chTitle=' + colChTitle + ' chSummary=' + colChSummary + ' aiComment=' + colAiComment);

  // Read all rows at once
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var scanned    = 0;
  var translated = 0;
  var skipped    = 0;
  var errors     = 0;

  for (var r = 0; r < data.length; r++) {
    var row = data[r];

    // Skip blank rows
    if (row.every(function(c) { return String(c || '').trim() === ''; })) continue;
    scanned++;

    var sheetRow     = r + 2;   // 1-based row in sheet (row 1 = headers)
    var origTitle    = String(row[colOrigTitle - 1]  || '').trim();
    var chTitle      = String(row[colChTitle  - 1]   || '').trim();
    var chSummary    = colChSummary > 0 ? String(row[colChSummary - 1]  || '').trim() : '';
    var aiComment    = colAiComment > 0 ? String(row[colAiComment - 1] || '').trim() : '';

    // Skip if Chinese Title already contains Chinese characters
    if (HAS_CHINESE.test(chTitle)) {
      Logger.log('[Backfill] Row ' + sheetRow + ': already Chinese — skip');
      skipped++;
      continue;
    }

    // Skip if no source title to translate
    if (!origTitle) {
      Logger.log('[Backfill] Row ' + sheetRow + ': no Original Title — skip');
      skipped++;
      continue;
    }

    // ── Translate Chinese Title ──────────────────────────────────────────────
    var translatedTitle = origTitle;
    try {
      translatedTitle = LanguageApp.translate(origTitle, 'en', 'zh-CN');
      sheet.getRange(sheetRow, colChTitle).setValue(translatedTitle);
      Logger.log('[Backfill] Row ' + sheetRow + ': title "' + origTitle.slice(0, 50) + '" → "' + translatedTitle.slice(0, 50) + '"');
      translated++;
    } catch (e) {
      errors++;
      Logger.log('[Backfill] Row ' + sheetRow + ': title ERROR — ' + e.message);
    }

    Utilities.sleep(200);   // avoid LanguageApp rate limit between rows

    // ── Translate Chinese Summary if blank or generic fallback ───────────────
    if (colChSummary > 0) {
      var needsSummary = !chSummary || chSummary === GENERIC_FALLBACK;
      if (needsSummary) {
        // Extract original English description stored under [原文摘要] prefix in AI Comment
        var englishDesc = '';
        if (aiComment.indexOf(AI_COMMENT_PREFIX) === 0) {
          englishDesc = aiComment.slice(AI_COMMENT_PREFIX.length).trim();
        }

        if (englishDesc) {
          try {
            var translatedSummary = LanguageApp.translate(englishDesc, 'en', 'zh-CN');
            sheet.getRange(sheetRow, colChSummary).setValue(translatedSummary);
            Utilities.sleep(200);
          } catch (e) {
            Logger.log('[Backfill] Row ' + sheetRow + ': summary ERROR — ' + e.message);
          }
        } else if (chSummary === GENERIC_FALLBACK) {
          // Clear the generic sentence — no English source to translate
          sheet.getRange(sheetRow, colChSummary).setValue('');
        }
      }
    }
  }

  SpreadsheetApp.flush();   // commit all pending writes

  var summary = 'Backfill completed: scanned=' + scanned + ', translated=' + translated + ', skipped=' + skipped + ', errors=' + errors;
  Logger.log('[Backfill] ' + summary);
  return summary;
}

// ─── Morning Brief: sync Drive docs → 10 Morning Brief sheet ─────────────────
//
// Scans the Drive folder for docs matching known naming patterns over the last
// SYNC_DAYS days.  Any doc that does not already have a row in the sheet is
// appended automatically.  Safe to run multiple times (title-based dedup).
//
// Run manually from the editor to backfill gaps, or let the daily trigger call it.

var SYNC_DAYS = 14;   // look back this many days for missing docs

function syncMorningBriefFromDrive() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.morningBrief);
  if (!sheet) throw new Error('Sheet not found: ' + DASHBOARD_TABS.morningBrief);

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('10 Morning Brief has no columns.');
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });

  // Build set of already-indexed titles (lowercase) for deduplication
  var existingTitles = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var titleColIdx = -1;
    for (var hi = 0; hi < headers.length; hi++) {
      if (headers[hi].indexOf('标题') !== -1 || headers[hi].toLowerCase() === 'title') {
        titleColIdx = hi + 1; break;
      }
    }
    if (titleColIdx > 0) {
      var titleVals = sheet.getRange(2, titleColIdx, lastRow - 1, 1).getValues();
      titleVals.forEach(function(r) {
        var t = String(r[0] || '').trim().toLowerCase();
        if (t) existingTitles[t] = true;
      });
    }
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(MORNING_BRIEF_FOLDER_ID);
  } catch (e) {
    throw new Error('Cannot access Morning Brief Drive folder: ' + e.message);
  }

  var tz = getScriptTimeZone_();
  var today = new Date();
  var inserted = 0;

  for (var i = 0; i < SYNC_DAYS; i++) {
    var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    var dateKey = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    var compact  = dateKey.replace(/-/g, '');

    var candidates = [
      { language: 'zh', title: '早晨简报_'   + compact },
      { language: 'zh', title: '早晨晨报_'   + compact },
      { language: 'en', title: 'Morning Brief_'  + compact },
      { language: 'en', title: 'Morning_Brief_'  + compact },
      { language: 'en', title: 'MorningBrief_'   + compact },
    ];

    candidates.forEach(function(c) {
      if (existingTitles[c.title.toLowerCase()]) return; // already in sheet

      var files = folder.getFilesByName(c.title);
      if (!files.hasNext()) return; // not in Drive either

      var file    = files.next();
      var docId   = file.getId();
      var docLink = 'https://docs.google.com/document/d/' + docId + '/edit';
      var createdAt = Utilities.formatDate(file.getDateCreated(), tz, 'yyyy-MM-dd HH:mm:ss');

      // Read first 500 chars of doc body as preview summary
      var summary = '';
      try {
        var fullText = readGoogleDocText_(docId);
        summary = fullText ? fullText.slice(0, 500) : '';
      } catch (readErr) {
        Logger.log('[SyncBrief] Could not read doc ' + docId + ': ' + readErr.message);
      }

      var row = headers.map(function(h) {
        if (!h) return '';
        if (h.indexOf('日期') !== -1 || h === 'Date')              return dateKey;
        if (h.indexOf('语言') !== -1 || h === 'Language')          return c.language;
        if (h.indexOf('标题') !== -1 || h === 'Title')             return c.title;
        if (h.indexOf('摘要') !== -1 || h === 'Summary')           return summary;
        if (h.indexOf('Google Doc Link') !== -1)                   return docLink;
        if (h.indexOf('类型') !== -1 || h === 'Type')              return 'Morning Brief';
        if (h.indexOf('状态') !== -1 || h === 'Status')            return 'Active';
        if (h.indexOf('创建时间') !== -1 || h === 'Created At')    return createdAt;
        return '';
      });

      sheet.appendRow(row);
      existingTitles[c.title.toLowerCase()] = true;
      inserted++;
      Logger.log('[SyncBrief] Inserted row: ' + c.title + ' → ' + dateKey);
    });
  }

  SpreadsheetApp.flush();
  Logger.log('[SyncBrief] Done. inserted=' + inserted);
  return { inserted: inserted };
}

// --- Trigger setup: run once from Apps Script editor -------------------------
// Prerequisites:
//   Project Settings > Time zone must be set to "America/Vancouver" FIRST.
// After running, verify in the Triggers panel (left sidebar clock icon).
function createDailyTriggers() {
  // Remove any existing triggers for dailyNewsFetchJob to avoid duplicates
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'dailyNewsFetchJob') {
      ScriptApp.deleteTrigger(existing[i]);
      Logger.log('Deleted existing trigger id=' + existing[i].getUniqueId());
    }
  }

  // Trigger 1: 6am-7am Vancouver time  (hour=6, window is hour 6 to 7)
  ScriptApp.newTrigger('dailyNewsFetchJob')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();
  Logger.log('Created trigger 1: dailyNewsFetchJob 06:00-07:00 Vancouver');

  // Trigger 2: 2pm-3pm Vancouver time  (hour=14, window is hour 14 to 15)
  ScriptApp.newTrigger('dailyNewsFetchJob')
    .timeBased()
    .atHour(14)
    .everyDays(1)
    .create();
  Logger.log('Created trigger 2: dailyNewsFetchJob 14:00-15:00 Vancouver');

  // Trigger 3: syncMorningBriefFromDrive at 7am-8am (after briefing docs are created)
  for (var j = 0; j < existing.length; j++) {
    if (existing[j].getHandlerFunction() === 'syncMorningBriefFromDrive') {
      ScriptApp.deleteTrigger(existing[j]);
      Logger.log('Deleted existing trigger: syncMorningBriefFromDrive id=' + existing[j].getUniqueId());
    }
  }
  ScriptApp.newTrigger('syncMorningBriefFromDrive')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .create();
  Logger.log('Created trigger 3: syncMorningBriefFromDrive 07:00-08:00 Vancouver');

  Logger.log('Done. Check Triggers panel (clock icon, left sidebar) to confirm.');
}

// Verification helper: lists all project triggers to execution log
function listTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('Total project triggers: ' + triggers.length);
  for (var i = 0; i < triggers.length; i++) {
    var t = triggers[i];
    Logger.log(
      'Function=' + t.getHandlerFunction() +
      ' Type='    + t.getTriggerSource() +
      ' EventType=' + t.getEventType() +
      ' Id='      + t.getUniqueId()
    );
  }
}

// --- Market Data ---------------------------------------------------------------

var MARKET_SYMBOLS = [
  { symbol: 'SPY',    market: 'US Market',     label: 'S&P 500 ETF Proxy',   indicator: 'S&P 500' },
  { symbol: 'QQQ',    market: 'US Market',     label: 'Nasdaq ETF Proxy',    indicator: 'Nasdaq' },
  { symbol: 'XIC.TO', market: 'Canada Market', label: 'TSX Composite Proxy', indicator: 'TSX' },
];

// Public entry point — run manually or called via doGet action=refreshMarketData
function marketDataFetchJob() {
  var result = marketDataFetchJob_();
  Logger.log('Market: updated=' + result.updated + ' inserted=' + result.inserted + ' errors=' + result.errors);
  return result;
}

function retryMarketSourceRowIfPriceMissing_(sourceSheet, rowNumber, readColCount, srcRow) {
  var maxRetries = 3;
  var retryDelayMs = 2500;
  for (var attempt = 0; attempt < maxRetries; attempt++) {
    var rawPrice = srcRow[2];
    var price = parseFloat(rawPrice);
    if (!(rawPrice === '' || rawPrice === null || rawPrice === undefined || isNaN(price))) {
      return srcRow;
    }
    if (attempt < maxRetries - 1) {
      Logger.log('[Market] Price blank for row ' + rowNumber + ', retry ' + (attempt + 1) + '/' + (maxRetries - 1));
      SpreadsheetApp.flush();
      Utilities.sleep(retryDelayMs);
      srcRow = sourceSheet.getRange(rowNumber, 1, 1, readColCount).getValues()[0];
    }
  }
  return srcRow;
}

function marketDataFetchJob_() {
  // Source: 09 Market Index Source (GOOGLEFINANCE formulas)
  // Columns: A=GF Symbol, B=Display Name, C=Price, D=Change, E=Change%, F=LastUpdated, G=Apps Script Symbol
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sourceSheet = spreadsheet.getSheetByName('09 Market Index Source');
  if (!sourceSheet) throw new Error('Sheet not found: 09 Market Index Source');

  var sourceLastRow = sourceSheet.getLastRow();
  if (sourceLastRow < 2) throw new Error('09 Market Index Source has no data rows.');

  // Detect Notes/备注 column dynamically so NVDA / GOOGL overrides are picked up
  var sourceLastCol = sourceSheet.getLastColumn();
  var sourceHeaders = sourceSheet.getRange(1, 1, 1, sourceLastCol).getValues()[0];
  var notesColIdx = -1;
  for (var hi = 0; hi < sourceHeaders.length; hi++) {
    var hv = String(sourceHeaders[hi] || '').trim();
    if (hv.indexOf('Notes') !== -1 || hv.indexOf('备注') !== -1) { notesColIdx = hi; break; }
  }
  var readColCount = Math.max(7, notesColIdx >= 0 ? notesColIdx + 1 : 7);
  var sourceData = sourceSheet.getRange(2, 1, sourceLastRow - 1, readColCount).getValues();

  // Self-contained symbol info for real market indexes.
  // This does not rely on MARKET_SYMBOLS and does not use ETF proxy symbols.
  var symInfoMap = {
    '^DJI': {
      symbol: '^DJI',
      market: 'US Market',
      label: 'Dow Jones Industrial Average',
      indicator: 'Dow Jones'
    },
    '^IXIC': {
      symbol: '^IXIC',
      market: 'US Market',
      label: 'Nasdaq Composite Index',
      indicator: 'Nasdaq Composite'
    },
    '^GSPC': {
      symbol: '^GSPC',
      market: 'US Market',
      label: 'S&P 500 Index',
      indicator: 'S&P 500'
    },
    '^GSPTSE': {
      symbol: '^GSPTSE',
      market: 'Canada Market',
      label: 'S&P/TSX Composite Index',
      indicator: 'S&P/TSX Composite'
    },
    // ── Added: US individual stocks ───────────────────────────────────────────
    'NVDA': {
      symbol: 'NVDA',
      market: 'US Market',
      label: 'NVIDIA Corporation',
      indicator: 'NVDA'
    },
    'GOOGL': {
      symbol: 'GOOGL',
      market: 'US Market',
      label: 'Alphabet Inc.',
      indicator: 'GOOGL'
    },
    // ── Added: Canada Market expanded symbols ─────────────────────────────────
    // Source: GOOGLEFINANCE("CURRENCY:CADUSD") — how many USD per 1 CAD
    'CADUSD=X': {
      symbol: 'CADUSD=X',
      market: 'Canada Market',
      label: 'Canadian Dollar / US Dollar',
      indicator: 'CAD/USD'
    },
    // Source: GOOGLEFINANCE("CURRENCY:XAUUSD") — Gold price in USD per troy oz
    'GC=F': {
      symbol: 'GC=F',
      market: 'Canada Market',
      label: 'Gold (XAU/USD, per troy oz)',
      indicator: 'Gold'
    },
    // Proxy: USO (United States Oil Fund ETF) — tracks WTI crude oil price
    'USO': {
      symbol: 'USO',
      market: 'Canada Market',
      label: 'Oil ETF Proxy (USO)',
      indicator: 'Oil ETF'
    },
    // Proxy: XBB.TO (iShares Core Canadian Universe Bond Index ETF)
    'XBB.TO': {
      symbol: 'XBB.TO',
      market: 'Canada Market',
      label: 'Canada Bond ETF Proxy (XBB.TO)',
      indicator: 'Canada Bond'
    }
  };

  // Destination: 05 Market Radar
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.marketRadar);
  if (!sheet) throw new Error('Sheet not found: ' + DASHBOARD_TABS.marketRadar);

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('05 Market Radar has no columns.');

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });

  // Build symbol -> sheet row index map for upsert.
  var symCol = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].indexOf('Symbol') !== -1 || headers[i].indexOf('代码') !== -1) {
      symCol = i + 1;
      break;
    }
  }

  var symbolRowMap = {};
  var radarLastRow = sheet.getLastRow();
  if (radarLastRow > 1 && symCol > 0) {
    var symVals = sheet.getRange(2, symCol, radarLastRow - 1, 1).getValues();
    for (var r = 0; r < symVals.length; r++) {
      if (symVals[r][0]) {
        symbolRowMap[String(symVals[r][0]).trim()] = r + 2;
      }
    }
  }

  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'America/Vancouver', 'yyyy-MM-dd');
  var createdAt = now.toISOString();
  var updated = 0;
  var inserted = 0;
  var errors = 0;

  for (var t = 0; t < sourceData.length; t++) {
    var sourceRowNumber = t + 2;
    var srcRow = retryMarketSourceRowIfPriceMissing_(sourceSheet, sourceRowNumber, readColCount, sourceData[t]);
    // Notes/备注 column (if found) takes priority as the frontend symbol key
    var appsSymbol;
    if (notesColIdx >= 0 && notesColIdx < srcRow.length && String(srcRow[notesColIdx] || '').trim()) {
      appsSymbol = String(srcRow[notesColIdx]).trim();
    } else {
      appsSymbol = String(srcRow[6] || '').trim(); // Fall back to Column G
    }
    var rawPrice = srcRow[2];                        // Column C: price
    var rawChangePct = srcRow[4];                    // Column E: changepct
    var rawDate = srcRow[5];                         // Column F: =NOW()

    if (!appsSymbol) continue;

    var symInfo = symInfoMap[appsSymbol];
    if (!symInfo) {
      Logger.log('[Market] Skipping unknown symbol in column G: ' + appsSymbol);
      errors++;
      continue;
    }

    var price = parseFloat(rawPrice);
    if (rawPrice === '' || rawPrice === null || rawPrice === undefined || isNaN(price)) {
      Logger.log('[Market] No price for ' + appsSymbol + ' — GOOGLEFINANCE may still be loading.');
      errors++;
      continue;
    }

    var tradingDay = rawDate instanceof Date
      ? Utilities.formatDate(rawDate, 'America/Vancouver', 'yyyy-MM-dd')
      : dateStr;

    var quote = {
      price: price,
      changePercent: parseFloat(rawChangePct) || 0,
      tradingDay: tradingDay
    };

    var row = buildMarketRow_(headers, symInfo, quote, dateStr, createdAt);

    if (symbolRowMap[appsSymbol]) {
      sheet.getRange(symbolRowMap[appsSymbol], 1, 1, row.length).setValues([row]);
      Logger.log('[Market] Updated ' + appsSymbol + ' price=' + quote.price + ' change=' + quote.changePercent + '%');
    } else {
      sheet.appendRow(row);
      symbolRowMap[appsSymbol] = sheet.getLastRow();
      inserted++;
      Logger.log('[Market] Inserted ' + appsSymbol);
    }

    updated++;
  }

  SpreadsheetApp.flush();
  return {
    updated: updated,
    inserted: inserted,
    errors: errors
  };
}


function fetchAlphaVantageQuote_(apiKey, symbol) {
  var url = 'https://www.alphavantage.co/query'
    + '?function=GLOBAL_QUOTE'
    + '&symbol=' + encodeURIComponent(symbol)
    + '&apikey=' + apiKey;
  var urlLog = url.replace(apiKey, '[KEY]');
  Logger.log('[AV] ' + urlLog);

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = response.getResponseCode();
  var body = response.getContentText();
  var data;
  try { data = JSON.parse(body); } catch(e) { data = {}; }

  Logger.log('[AV] HTTP=' + code + ' keys=' + Object.keys(data).join(','));

  if (data['Note'])        throw new Error('Rate limited: ' + data['Note'].slice(0, 80));
  if (data['Information']) throw new Error('API key issue: ' + data['Information'].slice(0, 80));
  if (code !== 200)        throw new Error('HTTP ' + code);

  var q = data['Global Quote'];
  if (!q || !q['05. price']) throw new Error('No quote returned for ' + symbol + '. Market may be closed.');

  var price          = parseFloat(q['05. price'])  || 0;
  var changePercent  = parseFloat(String(q['10. change percent'] || '0').replace('%', '')) || 0;
  var tradingDay     = q['07. latest trading day'] || dateStr;

  return { price: price, changePercent: changePercent, tradingDay: tradingDay };
}

function buildMarketRow_(headers, sym, quote, dateStr, createdAt) {
  var chg = quote.changePercent;
  var trend, riskSignal, action;

  if (chg >= 0.5) {
    trend = '上涨 / Up';
    riskSignal = 'Low';
    action = 'No Action';
  } else if (chg <= -2.0) {
    trend = '下跌 / Down';
    riskSignal = 'High';
    action = 'High Attention';
  } else if (chg < -0.5) {
    trend = '下跌 / Down';
    riskSignal = 'Medium';
    action = 'Review';
  } else {
    trend = '横盘 / Flat';
    riskSignal = 'Low';
    action = 'No Action';
  }

  var sign = chg >= 0 ? '+' : '';
  var changeStr = sign + chg.toFixed(2) + '%';
  var priceStr = quote.price.toFixed(2);
  var aiSum = sym.indicator + ' (' + sym.label + ') '
    + (chg >= 0.5 ? '今日上涨 ' + changeStr + '，市场表现偏强。' :
       chg <= -2.0 ? '今日大幅下跌 ' + changeStr + '，需要关注市场风险。' :
       chg < -0.5 ? '今日小幅下跌 ' + changeStr + '，需继续观察。' :
       '今日相对平稳，变动 ' + changeStr + '。')
    + ' 数据来源：Google Sheets GOOGLEFINANCE。';

  return headers.map(function(h) {
    if (!h) return '';
    if (h.indexOf('日期') !== -1 || h.indexOf('Date') !== -1) return quote.tradingDay || dateStr;
    if (h.indexOf('市场') !== -1 || h.indexOf('Market') !== -1 || h.indexOf('Indicator') !== -1) return sym.market;
    if (h.indexOf('代码') !== -1 || h.indexOf('Symbol') !== -1) return sym.symbol;
    if (h.indexOf('当前水平') !== -1 || h.indexOf('Current Level') !== -1) return priceStr;
    if (h.indexOf('日变动') !== -1 || h.indexOf('Daily Change') !== -1) return changeStr;
    if (h.indexOf('趋势') !== -1 || h.indexOf('Trend') !== -1) return trend;
    if (h.indexOf('风险信号') !== -1 || h.indexOf('Risk Signal') !== -1) return riskSignal;
    if (h.indexOf('AI中文摘要') !== -1 || h.indexOf('AI Chinese Summary') !== -1) return aiSum;
    if (h.indexOf('需要行动') !== -1 || h.indexOf('Action Needed') !== -1) return action;
    if (h.indexOf('数据来源') !== -1 || h.indexOf('Data Source') !== -1) return 'Google Sheets GOOGLEFINANCE';
    if (h.indexOf('创建时间') !== -1 || h.indexOf('Created At') !== -1) return createdAt;
    if (h.indexOf('备注') !== -1 || h.indexOf('Notes') !== -1) return sym.label + ' — real market index from 09 Market Index Source';
    return '';
  });
}


// --- Daily Portfolio Intelligence --------------------------------------------

// Public entry point — run manually or called via doGet action=generateDailyHoldingIntelligence
function generateDailyHoldingIntelligence() {
  var result = generateDailyHoldingIntelligence_();
  Logger.log('Daily Holding Intelligence: inserted=' + result.inserted + ' updated=' + result.updated + ' holdings=' + result.holdingsProcessed);
  return result;
}

function generateDailyHoldingIntelligence_() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var outputSheet = spreadsheet.getSheetByName(DASHBOARD_TABS.dailyHoldingIntelligence);
  if (!outputSheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.dailyHoldingIntelligence);

  var headers = readHeaders_(outputSheet);
  validateDailyHoldingHeaders_(headers);

  var holdings = readTabSafe_(spreadsheet, DASHBOARD_TABS.holdings).filter(isDailyHoldingActive_);
  var marketRows = readTabSafe_(spreadsheet, DASHBOARD_TABS.marketRadar);
  var settingsRows = readTabSafe_(spreadsheet, DASHBOARD_TABS.settings);
  var newsExclusions = readNewsExclusionRules_(settingsRows);
  var newsMatchRules = readNewsMatchStrengthRules_(settingsRows);
  var newsRows = readTabSafe_(spreadsheet, DASHBOARD_TABS.dailyNews).filter(function(row) {
    return isProductionNewsRow_(row, newsExclusions);
  });

  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'America/Vancouver', 'yyyy-MM-dd');
  var createdAt = now.toISOString();
  var macroLayer = buildMacroLayer_(holdings, marketRows, newsRows);
  var sectorLayer = buildSectorLayer_(holdings, marketRows, newsRows);
  var existingRows = findDailyHoldingRowsByTicker_(outputSheet, headers, dateStr);
  var inserted = 0;
  var updated = 0;

  holdings.forEach(function(holding) {
    var record = buildDailyHoldingRecord_(holding, {
      dateStr: dateStr,
      createdAt: createdAt,
      marketRows: marketRows,
      newsRows: newsRows,
      newsMatchRules: newsMatchRules,
      macroLayer: macroLayer,
      sectorLayer: sectorLayer,
    });
    var rowValues = headers.map(function(header) {
      return dailyHoldingValueForHeader_(header, record);
    });
    var tickerKey = normalizeTicker_(record.ticker);
    if (existingRows[tickerKey]) {
      outputSheet.getRange(existingRows[tickerKey], 1, 1, rowValues.length).setValues([rowValues]);
      updated++;
    } else {
      outputSheet.appendRow(rowValues);
      inserted++;
    }
  });

  SpreadsheetApp.flush();
  return {
    date: dateStr,
    inserted: inserted,
    updated: updated,
    holdingsProcessed: holdings.length,
  };
}

function validateDailyHoldingHeaders_(headers) {
  DAILY_HOLDING_REQUIRED_HEADERS.forEach(function(required) {
    var fragments = required.split('/').map(function(part) { return part.trim(); }).filter(Boolean);
    var found = headers.some(function(header) {
      return fragments.some(function(fragment) { return header.indexOf(fragment) !== -1; });
    });
    if (!found) throw new Error('Missing required column in 02 Daily Holding Intelligence: ' + required);
  });
}

function isDailyHoldingActive_(row) {
  var ticker = getField_(row, ['代码 / Ticker', 'Ticker']);
  if (!ticker) return false;
  var status = getField_(row, ['状态 / Status', 'Status']);
  return status === 'Active' || /watch|holding to confirm/i.test(status);
}

function isProductionNewsRow_(row, exclusionRules) {
  var text = rowText_(row).toLowerCase();
  return !/测试数据|用于检查|test data|mock data|mock/i.test(text)
    && isRelevantFinancialNewsRow_(row, exclusionRules);
}

function isRelevantFinancialNewsRow_(row, exclusionRules) {
  var sourceLink = getField_(row, ['来源链接 / Source Link', 'Source Link']);
  var sourceName = getField_(row, ['来源 / Source', 'Source']);
  var titleSummarySource = [
    getField_(row, ['新闻标题中文 / Chinese Title', 'Chinese Title']),
    getField_(row, ['新闻摘要中文 / Chinese Summary', 'Chinese Summary']),
    getField_(row, ['原始标题 / Original Title', 'Original Title']),
    getField_(row, ['AI中文点评 / AI Chinese Comment', 'AI中文摘要 / AI Chinese Summary']),
    sourceName,
  ].join(' ').toLowerCase();
  var urlText = String(sourceLink || '').toLowerCase();
  var allText = [
    titleSummarySource,
    sourceLink,
  ].join(' ').toLowerCase();

  return !(exclusionRules || []).some(function(rule) {
    var keyword = String(rule.keyword || '').toLowerCase();
    if (!keyword) return false;
    var scope = String(rule.scope || 'all').toLowerCase();
    if (scope === 'url') return urlText.indexOf(keyword) !== -1;
    if (scope === 'text') return titleSummarySource.indexOf(keyword) !== -1;
    return allText.indexOf(keyword) !== -1;
  });
}

function readNewsExclusionRules_(settingsRows) {
  var defaults = [
    { keyword: 'bringatrailer.com', scope: 'url' },
    { keyword: 'auction', scope: 'text' },
    { keyword: 'listing', scope: 'text' },
    { keyword: 'classified', scope: 'text' },
    { keyword: 'marketplace', scope: 'text' },
    { keyword: 'ebay', scope: 'all' },
    { keyword: 'craigslist', scope: 'all' },
    { keyword: 'neon sign', scope: 'text' },
    { keyword: 'no reserve', scope: 'text' },
    { keyword: 'for sale', scope: 'text' },
    { keyword: 'collectible', scope: 'text' },
    { keyword: 'memorabilia', scope: 'text' },
    { keyword: 'used car', scope: 'text' },
    { keyword: 'truck', scope: 'text' },
    { keyword: 'vintage sign', scope: 'text' },
    { keyword: 'parts', scope: 'text' },
    { keyword: '拍卖', scope: 'text' },
    { keyword: '无底价', scope: 'text' },
    { keyword: '霓虹灯', scope: 'text' },
    { keyword: '招牌', scope: 'text' },
    { keyword: '收藏品', scope: 'text' },
    { keyword: '出售', scope: 'text' },
    { keyword: '二手车', scope: 'text' },
    { keyword: '汽车零件', scope: 'text' },
  ];

  var configured = (settingsRows || []).filter(function(row) {
    var type = getField_(row, ['Config Type', 'Type', '配置类型']);
    var active = getField_(row, ['Active', '是否启用', '启用']);
    return /^news exclusion keyword$/i.test(type)
      && /^(yes|y|true|active|1|是|启用)$/i.test(active || 'Yes');
  }).map(function(row) {
    return {
      keyword: getField_(row, ['Keyword', '关键词']),
      scope: getField_(row, ['Match Scope', 'Scope', '匹配范围']) || 'all',
    };
  }).filter(function(rule) {
    return Boolean(rule.keyword);
  });

  return dedupeNewsExclusionRules_(defaults.concat(configured));
}

function dedupeNewsExclusionRules_(rules) {
  var seen = {};
  return rules.filter(function(rule) {
    var keyword = String(rule.keyword || '').trim();
    var scope = String(rule.scope || 'all').trim().toLowerCase();
    if (!keyword) return false;
    if (['url', 'text', 'all'].indexOf(scope) === -1) scope = 'all';
    var key = keyword.toLowerCase() + '|' + scope;
    if (seen[key]) return false;
    seen[key] = true;
    rule.keyword = keyword;
    rule.scope = scope;
    return true;
  });
}

function readNewsMatchStrengthRules_(settingsRows) {
  var defaults = [
    { value: 'ticker exact match', description: 'direct' },
    { value: 'company name exact match', description: 'direct' },
    { value: 'earnings / EPS / revenue / guidance', description: 'direct' },
    { value: 'sector keyword only', description: 'sector_background_only' },
    { value: 'macro keyword only', description: 'macro_background_only' },
    { value: 'Palantir', description: 'sector_background_only' },
    { value: 'Apple', description: 'sector_background_only' },
    { value: 'Spirit Airlines', description: 'exclude_from_holding' },
    { value: 'Remittance Market', description: 'exclude_from_holding' },
  ];

  var configured = (settingsRows || []).filter(function(row) {
    var group = getField_(row, ['Setting Group', 'Config Type', 'Type', '配置类型']);
    var active = getField_(row, ['Active', '是否启用', '启用']);
    return /^news match strength rule$/i.test(group)
      && /^(yes|y|true|active|1|是|启用)$/i.test(active || 'Yes');
  }).map(function(row) {
    return {
      value: getField_(row, ['Value', 'Keyword', '关键词']),
      description: getField_(row, ['Description', 'Notes', '说明', '备注']) || 'sector_background_only',
    };
  }).filter(function(rule) {
    return Boolean(rule.value);
  });

  return dedupeNewsMatchRules_(defaults.concat(configured));
}

function dedupeNewsMatchRules_(rules) {
  var seen = {};
  return rules.filter(function(rule) {
    var value = String(rule.value || '').trim();
    var description = String(rule.description || '').trim();
    if (!value) return false;
    var key = value.toLowerCase() + '|' + description.toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    rule.value = value;
    rule.description = description;
    return true;
  });
}

function buildMacroLayer_(holdings, marketRows, newsRows) {
  var usTickers = activeTickerIntersection_(holdings, ['VFV.TO', 'XUS.TO', 'TSLA', 'HSAI', 'BABA']);
  var canadaTickers = activeTickerIntersection_(holdings, ['XIC.TO', 'XIU.TO', 'VCNS.TO', 'CVE.TO', 'REI', 'LAC.TO']);
  var usNews = findRowsByKeywords_(newsRows, US_MACRO_KEYWORDS).slice(0, 3);
  var canadaNews = findRowsByKeywords_(newsRows, CANADA_MACRO_KEYWORDS).slice(0, 3);
  var spy = findMarketRow_(marketRows, 'SPY');
  var qqq = findMarketRow_(marketRows, 'QQQ');
  var xic = findMarketRow_(marketRows, 'XIC.TO');

  var usScore = marketScore_(spy) + marketScore_(qqq) + sentimentScore_(rowsText_(usNews));
  var canadaScore = marketScore_(xic) + sentimentScore_(rowsText_(canadaNews));
  var usTrend = trendFromScore_(usScore);
  var canadaTrend = trendFromScore_(canadaScore);

  return {
    us: {
      market: 'US Market',
      trend: usTrend,
      reasons: buildMacroReasons_('US', [spy, qqq], usNews),
      impactedTickers: usTickers,
    },
    canada: {
      market: 'Canada Market',
      trend: canadaTrend,
      reasons: buildMacroReasons_('Canada', [xic], canadaNews),
      impactedTickers: canadaTickers,
    },
  };
}

function buildMacroReasons_(region, marketRows, newsRows) {
  var reasons = [];
  marketRows.forEach(function(row) {
    if (!row) return;
    var symbol = getField_(row, ['代码 / Symbol', 'Symbol']);
    var change = getField_(row, ['日变动% / Daily Change %', 'Daily Change']);
    var trend = getField_(row, ['趋势 / Trend', 'Trend']);
    if (symbol || change || trend) reasons.push(symbol + ' 代理指标：' + (change || '变动待更新') + '，' + (trend || '趋势待更新'));
  });
  newsRows.forEach(function(row) {
    var title = getField_(row, ['新闻标题中文 / Chinese Title', 'Chinese Title', '原始标题 / Original Title', 'Original Title']);
    if (title) reasons.push(region + ' 宏观新闻：' + title);
  });
  if (!reasons.length) reasons.push(region + ' 宏观资料不足，仅根据当前持仓相关市场代理指标观察。');
  return reasons.slice(0, 3);
}

function buildSectorLayer_(holdings, marketRows, newsRows) {
  var activeTickers = holdings.map(function(row) {
    return normalizeTicker_(getField_(row, ['代码 / Ticker', 'Ticker']));
  });
  return SECTOR_RULES.reduce(function(sectors, rule) {
    var related = rule.tickers.filter(function(ticker) { return activeTickers.indexOf(ticker) !== -1; });
    if (!related.length) return sectors;
    var rows = findRowsByKeywords_(newsRows, rule.keywords.concat(rule.tickers)).slice(0, 3);
    var score = sentimentScore_(rowsText_(rows)) + sectorMarketScore_(rule.sector, marketRows);
    var trend = sectorTrendFromScore_(score);
    var reason = rows.length
      ? getField_(rows[0], ['新闻标题中文 / Chinese Title', 'Chinese Title', '原始标题 / Original Title', 'Original Title'])
      : '当前新闻池未找到直接行业新闻，主要参考宏观和市场代理指标。';
    sectors.push({
      sector: rule.sector,
      trend: trend,
      reason: reason,
      relatedTickers: related,
      keywords: rule.keywords,
    });
    return sectors;
  }, []);
}

function buildDailyHoldingRecord_(holding, context) {
  var ticker = normalizeTicker_(getField_(holding, ['代码 / Ticker', 'Ticker']));
  var owner = getField_(holding, ['所属人 / Owner', 'Owner']);
  var name = getField_(holding, ['名称 / Name', 'Name']);
  var market = getField_(holding, ['市场 / Market', 'Market']);
  var assetType = getField_(holding, ['资产类型 / Asset Type', '类型 / Type', 'Type']);
  var focusKeywords = (HOLDING_FOCUS[ticker] || []).concat([ticker, name]);
  var candidateNews = findRowsByKeywords_(context.newsRows, focusKeywords).slice(0, 10);
  var classifiedNews = classifyHoldingNewsRows_(candidateNews, ticker, name, context.newsMatchRules);
  var directNews = classifiedNews.direct.slice(0, 3);
  var backgroundNews = classifiedNews.background.slice(0, 3);
  var sectors = context.sectorLayer.filter(function(sector) {
    return sector.relatedTickers.indexOf(ticker) !== -1;
  });
  var macroImpact = buildHoldingMacroImpact_(ticker, context.macroLayer);
  var priceChange = getHoldingPriceChange_(ticker, context.marketRows);
  var earningsEvent = buildEarningsEvent_(directNews);
  var newsEvent = buildNewsEvent_(directNews);
  var chineseSummary = buildChineseNewsSummary_(directNews);
  var assessment = assessHoldingRisk_(ticker, priceChange, macroImpact, sectors, directNews, earningsEvent);
  var sectorText = sectors.length
    ? sectors.map(function(sector) {
        return sector.sector + ' ' + sector.trend + '，相关持仓：' + sector.relatedTickers.join(', ') + '；原因：' + sector.reason;
      }).join(' | ')
    : '未匹配到明确行业层信号。';
  var backgroundText = buildBackgroundNewsText_(backgroundNews);
  var aiComment = buildAiChineseComment_(ticker, macroImpact, sectorText, newsEvent, assessment.action, directNews.length, backgroundText);
  var links = sourceLinksFromRows_(directNews.length ? directNews : backgroundNews);

  return {
    date: context.dateStr,
    owner: owner,
    ticker: ticker,
    name: name,
    market: market,
    assetType: assetType,
    priceChange: priceChange,
    macroImpact: macroImpact,
    newsEvent: newsEvent,
    earningsEvent: earningsEvent,
    chineseSummary: chineseSummary,
    aiComment: aiComment,
    riskLevel: assessment.risk,
    actionNeeded: assessment.action,
    sourceLink1: links[0],
    sourceLink2: links[1],
    dataSource: '01 Holdings Master + 05 Market Radar + 06 Daily News Intelligence',
    reviewStatus: assessment.action === 'Review' || assessment.action === 'High Attention' ? 'Pending Review' : 'No action',
    generatedAt: context.createdAt,
    notes: '行业趋势: ' + sectorText + ' | 弱匹配背景: ' + backgroundText + ' | 明日关注: ' + buildTomorrowFocus_(ticker, macroImpact, sectors, earningsEvent, assessment.action),
  };
}

function dailyHoldingValueForHeader_(header, record) {
  if (!header) return '';
  if (header.indexOf('日期') !== -1 || header.indexOf('Date') !== -1) return record.date;
  if (header.indexOf('所属人') !== -1 || header.indexOf('Owner') !== -1) return record.owner;
  if (header.indexOf('代码') !== -1 || header.indexOf('Ticker') !== -1) return record.ticker;
  if (header.indexOf('名称') !== -1 || header.indexOf('Name') !== -1) return record.name;
  if (header.indexOf('市场') !== -1 || header.indexOf('Market') !== -1) return record.market;
  if (header.indexOf('资产类型') !== -1 || header.indexOf('Asset Type') !== -1) return record.assetType;
  if (header.indexOf('价格变动') !== -1 || header.indexOf('Price Change') !== -1) return record.priceChange;
  if (header.indexOf('宏观影响') !== -1 || header.indexOf('Macro Impact') !== -1) return record.macroImpact;
  if (header.indexOf('新闻事件') !== -1 || header.indexOf('News Event') !== -1) return record.newsEvent;
  if (header.indexOf('财报事件') !== -1 || header.indexOf('Earnings Event') !== -1) return record.earningsEvent;
  if (header.indexOf('中文新闻摘要') !== -1 || header.indexOf('Chinese News Summary') !== -1) return record.chineseSummary;
  if (header.indexOf('AI中文点评') !== -1 || header.indexOf('AI Chinese Comment') !== -1) return record.aiComment;
  if (header.indexOf('风险等级') !== -1 || header.indexOf('Risk Level') !== -1) return record.riskLevel;
  if (header.indexOf('需要行动') !== -1 || header.indexOf('Action Needed') !== -1) return record.actionNeeded;
  if (header.indexOf('来源链接1') !== -1 || header.indexOf('Source Link 1') !== -1) return record.sourceLink1;
  if (header.indexOf('来源链接2') !== -1 || header.indexOf('Source Link 2') !== -1) return record.sourceLink2;
  if (header.indexOf('数据来源') !== -1 || header.indexOf('Data Source') !== -1) return record.dataSource;
  if (header.indexOf('复核状态') !== -1 || header.indexOf('Review Status') !== -1) return record.reviewStatus;
  if (header.indexOf('生成时间') !== -1 || header.indexOf('Generated At') !== -1) return record.generatedAt;
  if (header.indexOf('备注') !== -1 || header.indexOf('Notes') !== -1) return record.notes;
  return '';
}

function findDailyHoldingRowsByTicker_(sheet, headers, dateStr) {
  var dateCol = findHeaderIndex_(headers, ['Date', '日期']) + 1;
  var tickerCol = findHeaderIndex_(headers, ['Ticker', '代码']) + 1;
  if (dateCol < 1 || tickerCol < 1) throw new Error('02 Daily Holding Intelligence requires Date and Ticker columns.');
  var map = {};
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return map;
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues();
  values.forEach(function(row, index) {
    var rowDate = normalizeDateString_(row[dateCol - 1]);
    var ticker = normalizeTicker_(row[tickerCol - 1]);
    if (rowDate === dateStr && ticker) map[ticker] = index + 2;
  });
  return map;
}

function findRowsByKeywords_(rows, keywords) {
  var terms = keywords.map(function(keyword) { return String(keyword || '').trim().toLowerCase(); }).filter(Boolean);
  if (!terms.length) return [];
  return rows.filter(function(row) {
    var text = rowText_(row).toLowerCase();
    return terms.some(function(term) { return text.indexOf(term) !== -1; });
  });
}

function classifyHoldingNewsRows_(rows, ticker, name, matchRules) {
  var result = { direct: [], background: [], excluded: [] };
  rows.forEach(function(row) {
    if (isExcludedFromHoldingByRule_(row, matchRules)) {
      result.excluded.push(row);
      return;
    }
    if (isBackgroundOnlyByRule_(row, matchRules)) {
      result.background.push(row);
      return;
    }
    if (isDirectHoldingNews_(row, ticker, name)) {
      result.direct.push(row);
      return;
    }
    result.background.push(row);
  });
  return result;
}

function isBackgroundOnlyByRule_(row, matchRules) {
  return (matchRules || []).some(function(rule) {
    var description = String(rule.description || '').toLowerCase();
    if (description.indexOf('sector_background_only') === -1 && description.indexOf('macro_background_only') === -1) return false;
    return newsRuleKeywordMatches_(row, rule.value);
  });
}

function isExcludedFromHoldingByRule_(row, matchRules) {
  return (matchRules || []).some(function(rule) {
    var description = String(rule.description || '').toLowerCase();
    if (description.indexOf('exclude_from_holding') === -1) return false;
    return newsRuleKeywordMatches_(row, rule.value);
  });
}

function isDirectHoldingNews_(row, ticker, name) {
  var directTerms = (HOLDING_DIRECT_ALIASES[ticker] || []).concat([ticker, name])
    .map(function(term) { return String(term || '').trim(); })
    .filter(function(term) { return term.length >= 2; });
  var directText = directNewsText_(row);
  return directTerms.some(function(term) {
    return exactNewsTermMatches_(directText, term);
  });
}

function exactNewsTermMatches_(text, term) {
  var haystack = String(text || '').toLowerCase();
  var needle = String(term || '').toLowerCase();
  if (!needle) return false;
  if (/^[a-z0-9.-]+$/i.test(needle)) {
    var escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)', 'i')).test(haystack);
  }
  return haystack.indexOf(needle) !== -1;
}

function newsRuleKeywordMatches_(row, keyword) {
  var text = [
    directNewsText_(row),
    getField_(row, ['新闻摘要中文 / Chinese Summary', 'Chinese Summary']),
    getField_(row, ['AI中文点评 / AI Chinese Comment', 'AI中文摘要 / AI Chinese Summary']),
    getField_(row, ['来源 / Source', 'Source']),
  ].join(' ').toLowerCase();
  return text.indexOf(String(keyword || '').toLowerCase()) !== -1;
}

function directNewsText_(row) {
  return [
    getField_(row, ['新闻标题中文 / Chinese Title', 'Chinese Title']),
    getField_(row, ['原始标题 / Original Title', 'Original Title']),
    getField_(row, ['来源链接 / Source Link', 'Source Link']),
  ].join(' ');
}

function rowText_(row) {
  return [
    getField_(row, ['代码 / Ticker', '相关代码 / Related Ticker', '代码 / Symbol']),
    getField_(row, ['名称 / Name']),
    getField_(row, ['新闻标题中文 / Chinese Title', 'Chinese Title']),
    getField_(row, ['新闻摘要中文 / Chinese Summary', 'Chinese Summary']),
    getField_(row, ['原始标题 / Original Title', 'Original Title']),
    getField_(row, ['AI中文点评 / AI Chinese Comment', 'AI中文摘要 / AI Chinese Summary']),
    getField_(row, ['抓取关键词 / Search Keyword', 'Search Keyword']),
    getField_(row, ['类别 / Category', 'Category']),
    getField_(row, ['备注 / Notes', 'Notes']),
  ].join(' ');
}

function rowsText_(rows) {
  return rows.map(rowText_).join(' ');
}

function marketScore_(row) {
  if (!row) return 0;
  var change = parsePercent_(getField_(row, ['日变动% / Daily Change %', 'Daily Change']));
  if (change >= 0.5) return 1;
  if (change <= -1.5) return -2;
  if (change < -0.3) return -1;
  return 0;
}

function sectorMarketScore_(sector, marketRows) {
  if (sector.indexOf('US Equity') !== -1 || sector.indexOf('Technology') !== -1 || sector.indexOf('EV') !== -1) {
    return marketScore_(findMarketRow_(marketRows, 'SPY')) + marketScore_(findMarketRow_(marketRows, 'QQQ'));
  }
  if (sector.indexOf('Canadian') !== -1 || sector.indexOf('Oil') !== -1 || sector.indexOf('Conservative') !== -1) {
    return marketScore_(findMarketRow_(marketRows, 'XIC.TO'));
  }
  return 0;
}

function sentimentScore_(text) {
  var value = String(text || '').toLowerCase();
  var positive = ['rally', 'gain', 'rise', 'strong', 'beat', 'cooling inflation', 'rate cut', 'up', 'positive', '上涨', '走强', '利好', '回升', '增长'];
  var negative = ['fall', 'drop', 'decline', 'weak', 'miss', 'risk', 'pressure', 'recession', 'rate hike', 'yield rise', 'war', 'loss', 'negative', '下跌', '压力', '利空', '衰退', '风险', '战争', '亏损'];
  var score = 0;
  positive.forEach(function(word) { if (value.indexOf(word) !== -1) score++; });
  negative.forEach(function(word) { if (value.indexOf(word) !== -1) score--; });
  return Math.max(-2, Math.min(2, score));
}

function trendFromScore_(score) {
  if (score >= 2) return 'Bullish';
  if (score <= -2) return 'Bearish';
  return 'Neutral';
}

function sectorTrendFromScore_(score) {
  if (score >= 1) return 'Positive';
  if (score <= -1) return 'Negative';
  return 'Neutral';
}

function buildHoldingMacroImpact_(ticker, macroLayer) {
  var sections = [];
  if (macroLayer.us.impactedTickers.indexOf(ticker) !== -1) {
    sections.push('US Market: ' + macroLayer.us.trend + '。原因：' + macroLayer.us.reasons.join('；') + '。影响持仓：' + macroLayer.us.impactedTickers.join(', '));
  }
  if (macroLayer.canada.impactedTickers.indexOf(ticker) !== -1) {
    sections.push('Canada Market: ' + macroLayer.canada.trend + '。原因：' + macroLayer.canada.reasons.join('；') + '。影响持仓：' + macroLayer.canada.impactedTickers.join(', '));
  }
  return sections.length ? sections.join(' | ') : '未匹配到直接宏观影响。';
}

function getHoldingPriceChange_(ticker, marketRows) {
  var proxy = ticker;
  if (ticker === 'VFV.TO' || ticker === 'XUS.TO') proxy = 'SPY';
  if (ticker === 'XIU.TO') proxy = 'XIC.TO';
  if (ticker === 'VCNS.TO') proxy = 'XIC.TO';
  var row = findMarketRow_(marketRows, proxy);
  var change = row ? getField_(row, ['日变动% / Daily Change %', 'Daily Change']) : '';
  return change ? change + (proxy !== ticker ? '（市场代理：' + proxy + '）' : '') : 'Not available from current Market Radar';
}

function findMarketRow_(marketRows, symbol) {
  var target = normalizeTicker_(symbol);
  for (var i = 0; i < marketRows.length; i++) {
    if (normalizeTicker_(getField_(marketRows[i], ['代码 / Symbol', 'Symbol', '代码 / Ticker'])) === target) return marketRows[i];
  }
  return null;
}

function buildNewsEvent_(rows) {
  if (!rows.length) return '今日无直接持仓新闻';
  return rows.slice(0, 2).map(function(row) {
    return getField_(row, ['新闻标题中文 / Chinese Title', 'Chinese Title', '原始标题 / Original Title', 'Original Title']) || '未命名新闻';
  }).join(' | ');
}

function buildChineseNewsSummary_(rows) {
  if (!rows.length) return '今日无直接持仓新闻；本行主要基于宏观背景、行业趋势和市场代理指标整理。';
  return rows.slice(0, 2).map(function(row) {
    return getField_(row, ['新闻摘要中文 / Chinese Summary', 'Chinese Summary', 'AI中文点评 / AI Chinese Comment']) ||
      getField_(row, ['新闻标题中文 / Chinese Title', 'Chinese Title', '原始标题 / Original Title', 'Original Title']);
  }).filter(Boolean).join(' | ');
}

function buildEarningsEvent_(rows) {
  var matched = rows.filter(function(row) {
    var text = rowText_(row).toLowerCase();
    return EARNINGS_KEYWORDS.some(function(keyword) { return text.indexOf(keyword.toLowerCase()) !== -1; });
  });
  if (!matched.length) return 'N/A';
  var first = matched[0];
  var text = rowText_(first);
  var score = sentimentScore_(text);
  var tone = score > 0 ? '偏利好' : score < 0 ? '偏利空' : '中性';
  var title = getField_(first, ['新闻标题中文 / Chinese Title', 'Chinese Title', '原始标题 / Original Title', 'Original Title']) || '相关财报或公告';
  var review = score < 0 ? '需要 Review' : '建议 Review';
  return '财报事件：' + tone + '。关键原因：' + title + '。' + review + '。';
}

function assessHoldingRisk_(ticker, priceChange, macroImpact, sectors, newsRows, earningsEvent) {
  var risk = 'Low';
  var action = 'No action';
  var change = parsePercent_(priceChange);
  var combined = [macroImpact, rowsText_(newsRows), earningsEvent, sectors.map(function(s) { return s.trend + ' ' + s.reason; }).join(' ')].join(' ').toLowerCase();

  if (Math.abs(change) >= 5 || /high attention|重大|偏利空|war|geopolitical|亏损|大幅下跌|margin pressure|利润率压力|regulatory/i.test(combined)) {
    risk = 'High';
    action = 'High Attention';
  } else if (Math.abs(change) >= 2 || /bearish|negative|review|earnings|财报事件|压力|利空|risk|风险/i.test(combined)) {
    risk = 'Medium';
    action = 'Review';
  } else if (/watch|neutral|观察|待更新/i.test(combined) || !newsRows.length) {
    risk = 'Low';
    action = 'Watch';
  }

  if (DAILY_ACTIONS.indexOf(action) === -1) action = 'No action';
  return { risk: risk, action: action };
}

function buildAiChineseComment_(ticker, macroImpact, sectorText, newsEvent, action, directNewsCount, backgroundText) {
  var macroBrief = macroImpact === '未匹配到直接宏观影响。' ? '宏观信号有限' : macroImpact.split('。')[0];
  var sectorBrief = sectorText === '未匹配到明确行业层信号。' ? '行业信号有限' : sectorText.split('；')[0];
  var eventBrief = directNewsCount > 0 ? '直接新闻：' + newsEvent.split('|')[0].trim() : '直接新闻：今日无直接持仓新闻';
  var bgBrief = backgroundText && backgroundText !== '无弱匹配背景新闻'
    ? '行业/宏观背景：' + backgroundText
    : '行业/宏观背景：未发现可用弱匹配背景新闻';
  return eventBrief + '；' + bgBrief + '；宏观背景：' + macroBrief + '；行业背景：' + sectorBrief + '。以上背景不代表对 ' + ticker + ' 的直接公司新闻影响；今日 ' + action + '。';
}

function buildBackgroundNewsText_(rows) {
  if (!rows.length) return '无弱匹配背景新闻';
  return rows.slice(0, 2).map(function(row) {
    return getField_(row, ['新闻标题中文 / Chinese Title', 'Chinese Title', '原始标题 / Original Title', 'Original Title']) || '未命名背景新闻';
  }).join(' | ');
}

function buildTomorrowFocus_(ticker, macroImpact, sectors, earningsEvent, action) {
  if (action === 'High Attention') return ticker + ' 需要优先复核来源、价格波动和是否存在重大公告。';
  if (earningsEvent !== 'N/A') return ticker + ' 继续跟踪财报/公告后续市场反应。';
  if (sectors.length) return ticker + ' 继续观察 ' + sectors.map(function(s) { return s.sector; }).join(', ') + ' 的趋势是否延续。';
  return ticker + ' 继续观察宏观变量和新闻池是否出现新证据。';
}

function sourceLinksFromRows_(rows) {
  var links = rows.map(function(row) {
    return getField_(row, ['来源链接 / Source Link', 'Source Link']);
  }).filter(Boolean).slice(0, 2);
  while (links.length < 2) links.push(SOURCE_MISSING);
  return links;
}

function activeTickerIntersection_(holdings, tickers) {
  var active = holdings.map(function(row) { return normalizeTicker_(getField_(row, ['代码 / Ticker', 'Ticker'])); });
  return tickers.filter(function(ticker) { return active.indexOf(ticker) !== -1; });
}

function parsePercent_(value) {
  var match = String(value || '').match(/[-+]?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function normalizeTicker_(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeDateString_(value) {
  var raw = String(value || '').trim();
  var match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) return match[1] + '-' + String(match[2]).padStart(2, '0') + '-' + String(match[3]).padStart(2, '0');
  return raw;
}

// ─── Decision Log ─────────────────────────────────────────────────────────────

// Write one validated row to 09 Decision Log only.
function addDecisionLog_(params) {
  var date       = String(params.date        || '').trim();
  var owner      = String(params.owner       || '').trim();
  var actionType = String(params.actionType  || '').trim();
  var ticker     = String(params.ticker      || '').trim().toUpperCase();
  var name       = String(params.name        || '').trim();

  if (!date)       throw new Error('Date is required.');
  if (!owner)      throw new Error('Owner is required.');
  if (['Mabel','Victor','Both'].indexOf(owner) === -1) throw new Error('Owner must be Mabel, Victor, or Both.');
  if (!actionType) throw new Error('Action Type is required.');
  if (!ticker && !name) throw new Error('Ticker or Name is required.');

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.decisionLog);
  if (!sheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.decisionLog);

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('09 Decision Log sheet has no columns.');
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });

  var decisionId = nextDecisionId_(sheet, headers);
  var now = new Date();
  var createdAt = now.toISOString();

  // Optional numeric fields
  var amount   = String(params.amount   || '').trim();
  var quantity = String(params.quantity || '').trim();
  var price    = String(params.price    || '').trim();
  var cost     = String(params.cost     || '').trim();

  // Auto-calculate cost if blank
  if (!cost && quantity && price) {
    var q = parseFloat(quantity);
    var p = parseFloat(price);
    if (!isNaN(q) && !isNaN(p)) cost = String((q * p).toFixed(2));
  }
  if (!cost && amount) cost = amount;

  var decisionStatus = String(params.decisionStatus || 'Completed').trim() || 'Completed';
  var status         = String(params.status         || 'Active').trim()    || 'Active';

  var row = headers.map(function(h) {
    if (!h) return '';
    if (h.indexOf('Decision ID') !== -1 || h.indexOf('决策ID') !== -1)           return decisionId;
    if (h.indexOf('Date') !== -1 && h.indexOf('Created') === -1 && h.indexOf('Updated') === -1
      && h.indexOf('日期') !== -1 || (h === '日期 / Date'))               return date;
    if (h.indexOf('Owner') !== -1 || h.indexOf('所属人') !== -1)              return owner;
    if (h.indexOf('Account Type') !== -1 || h.indexOf('账户类型') !== -1) return String(params.accountType  || '').trim();
    if (h.indexOf('Ticker') !== -1 || h.indexOf('代码') !== -1)                   return ticker;
    if ((h.indexOf('Name') !== -1 || h.indexOf('名称') !== -1) && h.indexOf('File') === -1 && h.indexOf('Asset') === -1) return name || ticker;
    if (h.indexOf('Asset Type') !== -1 || h.indexOf('资产类型') !== -1)  return String(params.assetType    || '').trim();
    if (h.indexOf('Action Type') !== -1 || h.indexOf('操作类型') !== -1) return actionType;
    if (h.indexOf('Decision Status') !== -1 || h.indexOf('决策状态') !== -1) return decisionStatus;
    if (h.indexOf('Amount') !== -1 || h.indexOf('金额') !== -1)                  return amount;
    if (h.indexOf('Quantity') !== -1 || h.indexOf('数量') !== -1)                 return quantity;
    if ((h.indexOf('Price') !== -1 || h.indexOf('单价') !== -1) && h.indexOf('Current') === -1) return price;
    if (h.indexOf('Cost') !== -1 || h.indexOf('成本') !== -1)                    return cost;
    if (h.indexOf('Exit Amount') !== -1 || h.indexOf('卖出') !== -1)              return '';
    if (h.indexOf('Realized Gain') !== -1 || h.indexOf('实现盈亏') !== -1) return '';
    if (h.indexOf('Return') !== -1 || h.indexOf('收益率') !== -1)             return '';
    if (h.indexOf('Decision Reason') !== -1 || h.indexOf('决策原因') !== -1) return String(params.decisionReason || '').trim();
    if (h.indexOf('Reference Info') !== -1 || h.indexOf('参考信息') !== -1) return String(params.referenceInfo  || '').trim();
    if (h.indexOf('Risk Level') !== -1 || h.indexOf('风险等级') !== -1)  return String(params.riskLevel     || '').trim();
    if (h.indexOf('Related News') !== -1 || h.indexOf('关联新闻') !== -1) return '';
    if (h.indexOf('Related Watch ID') !== -1 || h.indexOf('关联观察') !== -1) return String(params.relatedWatchId   || '').trim();
    if (h.indexOf('Related Holding ID') !== -1 || h.indexOf('关联持仓') !== -1) return String(params.relatedHoldingId || '').trim();
    if (h.indexOf('AI Chinese Summary') !== -1 || h.indexOf('AI中文摘要') !== -1) return '';
    if (h.indexOf('Review Notes') !== -1 || h.indexOf('复盘备注') !== -1) return String(params.reviewNotes   || '').trim();
    if (h.indexOf('Created At') !== -1 || h.indexOf('创建时间') !== -1)  return createdAt;
    if (h.indexOf('Updated At') !== -1 || h.indexOf('更新时间') !== -1)  return createdAt;
    if (h.indexOf('Status') !== -1 || h.indexOf('状态') !== -1)                  return status;
    return '';
  });

  sheet.appendRow(row);
  SpreadsheetApp.flush();
  Logger.log('[DecisionLog] Inserted ' + decisionId + ' owner=' + owner + ' ticker=' + ticker + ' action=' + actionType);
  return { decisionId: decisionId };
}

function nextDecisionId_(sheet, headers) {
  var idCol = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].indexOf('Decision ID') !== -1 || headers[i].indexOf('决策ID') !== -1) {
      idCol = i + 1; break;
    }
  }
  if (idCol < 1) throw new Error('Decision ID column not found in 09 Decision Log.');

  var lastRow = sheet.getLastRow();
  var maxId = 0;
  if (lastRow > 1) {
    var values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var match = String(row[0] || '').match(/^DEC-(\d+)$/i);
      if (match) maxId = Math.max(maxId, Number(match[1]));
    });
  }
  return 'DEC-' + String(maxId + 1).padStart(3, '0');
}

function updateDecisionLog_(params) {
  var decisionId = String(params.decisionId || '').trim();
  if (!decisionId) throw new Error('Decision ID is required.');

  var date       = String(params.date        || '').trim();
  var owner      = String(params.owner       || '').trim();
  var actionType = String(params.actionType  || '').trim();
  var ticker     = String(params.ticker      || '').trim().toUpperCase();
  var name       = String(params.name        || '').trim();

  if (!date)       throw new Error('Date is required.');
  if (!owner)      throw new Error('Owner is required.');
  if (['Mabel','Victor','Both'].indexOf(owner) === -1) throw new Error('Owner must be Mabel, Victor, or Both.');
  if (!actionType) throw new Error('Action Type is required.');
  if (!ticker && !name) throw new Error('Ticker or Name is required.');

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.decisionLog);
  if (!sheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.decisionLog);

  var headers = readHeaders_(sheet);
  var rowIndex = findRowById_(sheet, headers, ['Decision ID', '决策ID'], decisionId);
  var amount   = String(params.amount   || '').trim();
  var quantity = String(params.quantity || '').trim();
  var price    = String(params.price    || '').trim();
  var cost     = String(params.cost     || '').trim();

  if (!cost && quantity && price) {
    var q = parseFloat(quantity);
    var p = parseFloat(price);
    if (!isNaN(q) && !isNaN(p)) cost = String((q * p).toFixed(2));
  }
  if (!cost && amount) cost = amount;

  setCellByHeader_(sheet, headers, rowIndex, ['Date', '日期'], date);
  setCellByHeader_(sheet, headers, rowIndex, ['Owner', '所属人'], owner);
  setCellByHeader_(sheet, headers, rowIndex, ['Account Type', '账户类型'], String(params.accountType || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Ticker', '代码'], ticker);
  setCellByHeader_(sheet, headers, rowIndex, ['Name', '名称'], name || ticker);
  setCellByHeader_(sheet, headers, rowIndex, ['Asset Type', '资产类型'], String(params.assetType || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Action Type', '操作类型'], actionType);
  setCellByHeader_(sheet, headers, rowIndex, ['Decision Status', '决策状态'], String(params.decisionStatus || 'Completed').trim() || 'Completed');
  setCellByHeader_(sheet, headers, rowIndex, ['Amount', '金额'], amount);
  setCellByHeader_(sheet, headers, rowIndex, ['Quantity', '数量'], quantity);
  setCellByHeader_(sheet, headers, rowIndex, ['Price', '单价'], price);
  setCellByHeader_(sheet, headers, rowIndex, ['Cost', '成本'], cost);
  setCellByHeader_(sheet, headers, rowIndex, ['Decision Reason', '决策原因'], String(params.decisionReason || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Reference Info', '参考信息'], String(params.referenceInfo || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Risk Level', '风险等级'], String(params.riskLevel || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Related Watch ID', '关联观察'], String(params.relatedWatchId || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Related Holding ID', '关联持仓'], String(params.relatedHoldingId || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Review Notes', '复盘备注'], String(params.reviewNotes || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Updated At', '更新时间'], new Date().toISOString());
  SpreadsheetApp.flush();
  return { decisionId: decisionId };
}

function archiveDecisionLog_(params) {
  var decisionId = String(params.decisionId || '').trim();
  if (!decisionId) throw new Error('Decision ID is required.');

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.decisionLog);
  if (!sheet) throw new Error('Sheet tab not found: ' + DASHBOARD_TABS.decisionLog);

  var headers = readHeaders_(sheet);
  var rowIndex = findRowById_(sheet, headers, ['Decision ID', '决策ID'], decisionId);
  setCellByHeader_(sheet, headers, rowIndex, ['Status', '状态'], 'Archived');
  setCellByHeader_(sheet, headers, rowIndex, ['Updated At', '更新时间'], new Date().toISOString());
  SpreadsheetApp.flush();
  return { decisionId: decisionId };
}

// ─── Research Pack / NotebookLM-ready workflow ───────────────────────────────

function generateResearchPack_(params) {
  var topic = String(params.topic || '').trim();
  if (!topic) throw new Error('Missing required parameter: topic');

  var owner = String(params.owner || '').trim();
  var relatedTicker = String(params.relatedTicker || '').trim().toUpperCase();
  var relatedWatchId = String(params.relatedWatchId || '').trim();
  var sourceContext = String(params.sourceContext || '').trim();

  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var researchSheet = ensureResearchPackSheet_(spreadsheet);
  var researchHeaders = readHeaders_(researchSheet);
  var packId = nextResearchPackId_(researchSheet, researchHeaders);

  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'America/Vancouver', 'yyyy-MM-dd');
  var createdAt = now.toISOString();

  var matches = collectResearchPackMatches_(spreadsheet, {
    topic: topic,
    relatedTicker: relatedTicker,
    relatedWatchId: relatedWatchId,
  });

  var folder = findOrCreateFolderPath_(['Family Investment Board', '04 Research Packs']);
  var docTitle = 'Research Pack - ' + topic + ' - ' + dateStr;
  var doc = DocumentApp.create(docTitle);
  var file = DriveApp.getFileById(doc.getId());
  try {
    file.moveTo(folder);
  } catch (e) {
    Logger.log('[ResearchPack] Could not move file to research folder: ' + e.message);
  }

  writeResearchPackDoc_(doc, {
    title: docTitle,
    topic: topic,
    owner: owner,
    relatedTicker: relatedTicker,
    relatedWatchId: relatedWatchId,
    sourceContext: sourceContext,
    dateStr: dateStr,
    matches: matches,
  });

  var docUrl = doc.getUrl();
  var totalMatches = countResearchMatches_(matches);
  var shortSummary = totalMatches
    ? '已汇总 ' + totalMatches + ' 条相关资料，供 NotebookLM 手动导入和复核。'
    : '未找到匹配资料，已创建空白研究包供后续补充。';
  var importance = /priority|alert|high attention|高|重点/i.test(sourceContext) ? 'High' : 'Medium';

  var row = researchHeaders.map(function(h) {
    if (!h) return '';
    if (h.indexOf('Pack ID') !== -1 || h.indexOf('研究包ID') !== -1) return packId;
    if (h.indexOf('Date') !== -1 || h.indexOf('日期') !== -1) return dateStr;
    if (h.indexOf('Owner') !== -1 || h.indexOf('所属人') !== -1) return owner;
    if (h.indexOf('Research Topic') !== -1 || h.indexOf('研究主题') !== -1) return topic;
    if (h.indexOf('Related Ticker') !== -1 || h.indexOf('相关代码') !== -1) return relatedTicker;
    if (h.indexOf('Source Type') !== -1 || h.indexOf('来源类型') !== -1) return 'Mixed Research Pack';
    if (h.indexOf('Source Title') !== -1 || h.indexOf('来源标题') !== -1) return docTitle;
    if (h.indexOf('Source Link') !== -1 || h.indexOf('来源链接') !== -1) return docUrl;
    if (h.indexOf('Chinese Summary') !== -1 || h.indexOf('中文摘要') !== -1) return shortSummary;
    if (h.indexOf('Original Summary') !== -1 || h.indexOf('原文摘要') !== -1) return '';
    if (h.indexOf('Importance') !== -1 || h.indexOf('重要性') !== -1) return importance;
    if (h.indexOf('Risk Level') !== -1 || h.indexOf('风险等级') !== -1) return 'Review';
    if (h.indexOf('Include in NotebookLM') !== -1 || h.indexOf('是否纳入NotebookLM') !== -1) return 'Yes';
    if (h.indexOf('Drive File Link') !== -1 || h.indexOf('Google Drive文件链接') !== -1) return docUrl;
    if (h.indexOf('NotebookLM Status') !== -1 || h.indexOf('NotebookLM状态') !== -1) return 'Ready for Manual Import';
    if (h.indexOf('NotebookLM Conclusion') !== -1 || h.indexOf('NotebookLM结论') !== -1) return '';
    if (h.indexOf('Investment Steps') !== -1 || h.indexOf('投资步骤') !== -1) return '';
    if (h.indexOf('Decision Status') !== -1 || h.indexOf('决策建议状态') !== -1) return 'Review';
    if (h.indexOf('Related Watch ID') !== -1 || h.indexOf('关联观察ID') !== -1) return relatedWatchId;
    if (h.indexOf('Related Decision ID') !== -1 || h.indexOf('关联决策ID') !== -1) return '';
    if (h.indexOf('Created At') !== -1 || h.indexOf('创建时间') !== -1) return createdAt;
    if (h.indexOf('Notes') !== -1 || h.indexOf('备注') !== -1) return 'NotebookLM manual import required';
    return '';
  });

  researchSheet.appendRow(row);
  SpreadsheetApp.flush();

  return {
    packId: packId,
    docUrl: docUrl,
    notebookLmPrompt: NOTEBOOKLM_PROMPT,
  };
}

function saveNotebookLmAnalysis_(params) {
  var packId = String(params.packId || '').trim();
  if (!packId) throw new Error('Missing required parameter: packId');

  var decisionStatus = normalizeResearchDecisionStatus_(params.decisionStatus || 'Review');
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ensureResearchPackSheet_(spreadsheet);
  var headers = readHeaders_(sheet);
  var rowIndex = findResearchPackRow_(sheet, headers, packId);
  if (rowIndex < 2) throw new Error('Research Pack not found: ' + packId);

  setCellByHeader_(sheet, headers, rowIndex, ['NotebookLM Conclusion', 'NotebookLM结论'], String(params.notebookLmConclusion || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Investment Steps', '投资步骤'], String(params.investmentSteps || '').trim());
  setCellByHeader_(sheet, headers, rowIndex, ['Decision Status', '决策建议状态'], decisionStatus);
  setCellByHeader_(sheet, headers, rowIndex, ['NotebookLM Status', 'NotebookLM状态'], 'Analysis Saved');
  if (params.notes !== undefined) {
    setCellByHeader_(sheet, headers, rowIndex, ['Notes', '备注'], String(params.notes || '').trim());
  }

  SpreadsheetApp.flush();
  return { packId: packId, updated: 1 };
}

function ensureResearchPackSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.researchPack);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(DASHBOARD_TABS.researchPack);
    sheet.getRange(1, 1, 1, RESEARCH_PACK_HEADERS.length).setValues([RESEARCH_PACK_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    sheet.getRange(1, 1, 1, RESEARCH_PACK_HEADERS.length).setValues([RESEARCH_PACK_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  var headers = readHeaders_(sheet);
  if (!headers.some(function(h) { return h.indexOf('Pack ID') !== -1 || h.indexOf('研究包ID') !== -1; })) {
    sheet.getRange(1, 1, 1, RESEARCH_PACK_HEADERS.length).setValues([RESEARCH_PACK_HEADERS]);
    sheet.setFrozenRows(1);
  } else {
    RESEARCH_PACK_HEADERS.forEach(function(requiredHeader) {
      var exists = headers.some(function(existingHeader) {
        return existingHeader === requiredHeader;
      });
      if (!exists) {
        headers.push(requiredHeader);
        sheet.getRange(1, headers.length).setValue(requiredHeader);
      }
    });
  }
  return sheet;
}

function collectResearchPackMatches_(spreadsheet, query) {
  return {
    news: findMatchingRows_(readTabSafe_(spreadsheet, DASHBOARD_TABS.dailyNews), query).slice(0, 10),
    watchlist: findMatchingRows_(readTabSafe_(spreadsheet, DASHBOARD_TABS.watchlist), query).slice(0, 5),
    priorityAlerts: findMatchingRows_(readTabSafe_(spreadsheet, DASHBOARD_TABS.priorityAlerts), query).slice(0, 5),
    market: findMatchingRows_(readTabSafe_(spreadsheet, DASHBOARD_TABS.marketRadar), query).slice(0, 5),
    decisionLog: findMatchingRows_(readTabSafe_(spreadsheet, DASHBOARD_TABS.decisionLog), query).slice(0, 5),
    holdings: findMatchingRows_(readTabSafe_(spreadsheet, DASHBOARD_TABS.holdings), query).slice(0, 5),
  };
}

function readTabSafe_(spreadsheet, tabName) {
  var sheet = spreadsheet.getSheetByName(tabName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(header) { return String(header || '').trim(); });
  return values.slice(1).reduce(function(rows, row) {
    var isEmpty = row.every(function(cell) { return String(cell || '').trim() === ''; });
    if (isEmpty) return rows;
    var record = {};
    headers.forEach(function(header, index) {
      if (header) record[header] = row[index] === undefined ? '' : row[index];
    });
    rows.push(record);
    return rows;
  }, []).sort(sortResearchRowsDesc_);
}

function findMatchingRows_(rows, query) {
  var terms = [query.topic, query.relatedTicker, query.relatedWatchId]
    .map(function(v) { return String(v || '').trim().toLowerCase(); })
    .filter(function(v) { return v.length >= 2; });
  if (!terms.length) return [];

  return rows.filter(function(row) {
    var haystack = [
      getField_(row, ['Ticker', 'Related Ticker', '代码', '相关代码']),
      getField_(row, ['Name', '名称']),
      getField_(row, ['Chinese Title', '新闻标题中文', '中文标题']),
      getField_(row, ['Chinese Summary', '新闻摘要中文', 'AI中文摘要', '最新中文摘要', '中文摘要']),
      getField_(row, ['Original Title', '原始标题']),
      getField_(row, ['Search Keyword', '抓取关键词']),
      getField_(row, ['Watch Reason', '观察原因']),
      getField_(row, ['Watch Topic', '关注主题', 'Priority Alert title', '提醒标题']),
      getField_(row, ['Decision Reason', '决策原因']),
      getField_(row, ['Notes', '备注']),
      getField_(row, ['Watch ID', '观察ID']),
    ].join(' ').toLowerCase();
    return terms.some(function(term) { return haystack.indexOf(term) !== -1; });
  });
}

function writeResearchPackDoc_(doc, data) {
  var body = doc.getBody();
  body.clear();

  body.appendParagraph(data.title).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('研究包用于整理资料和辅助分析，不构成投资建议。最终决策由用户自行判断。');
  body.appendParagraph('Research packs organize information for review only and are not investment advice.');

  appendDocSection_(body, '1. 标题 / Title', [data.title]);
  appendDocSection_(body, '2. 研究主题 / Research Topic', [
    '主题 / Topic: ' + data.topic,
    '所属人 / Owner: ' + (data.owner || '未指定'),
    '相关代码 / Related Ticker: ' + (data.relatedTicker || '无'),
    '关联观察ID / Related Watch ID: ' + (data.relatedWatchId || '无'),
  ]);

  var totalMatches = countResearchMatches_(data.matches);
  appendDocSection_(body, '3. 今日核心摘要 / Executive Summary', [
    totalMatches
      ? '本研究包汇总了 ' + totalMatches + ' 条来自家庭投资雷达的相关资料，供 NotebookLM 手动导入后继续分析。'
      : '未在现有 Google Sheets 数据中找到匹配资料。本文件仍可作为 NotebookLM 的手动研究入口。',
    '资料来源仅限现有表格中的真实行，不包含模拟数据。',
  ]);

  appendRowsSection_(body, '4. 最新新闻 / Latest News', data.matches.news, ['新闻标题中文 / Chinese Title', '原始标题 / Original Title'], ['新闻摘要中文 / Chinese Summary', 'AI中文点评 / AI Chinese Comment'], ['来源链接 / Source Link']);
  appendRowsSection_(body, '5. 市场背景 / Market Context', data.matches.market, ['市场 / Market', '代码 / Symbol'], ['AI中文摘要 / AI Chinese Summary', '趋势 / Trend', '风险信号 / Risk Signal'], []);
  appendRowsSection_(body, '6. 观察清单背景 / Watchlist Context', data.matches.watchlist, ['名称 / Name', '代码 / Ticker'], ['观察原因 / Watch Reason', '目标问题 / Key Question', '需要行动 / Action Needed'], []);
  appendRowsSection_(body, '7. 已有决策记录 / Existing Decision Log', data.matches.decisionLog, ['名称 / Name', '代码 / Ticker', '操作类型 / Action Type'], ['决策原因 / Decision Reason', '参考信息 / Reference Info', '复盘备注 / Review Notes'], []);
  appendRowsSection_(body, '8. 相关持仓 / Related Holdings', data.matches.holdings, ['名称 / Name', '代码 / Ticker'], ['投资策略 / Strategy', '风险等级 / Risk Level', '状态 / Status', '备注 / Notes'], []);
  appendRowsSection_(body, '9. 主要风险 / Key Risks', data.matches.priorityAlerts, ['关注主题 / Watch Topic', '提醒标题 / Alert Title'], ['最新中文摘要 / Latest Chinese Summary', 'AI中文点评 / AI Chinese Comment', '需要行动 / Action Needed', '人工处理状态 / Human Review Status'], ['来源链接 / Source Link']);

  appendDocSection_(body, '10. 待核实问题 / Open Questions', [
    '哪些来源信息已经被多处资料确认？',
    '哪些风险只来自单一来源，仍需人工核实？',
    '该主题是否需要继续观察、进入 Review，或标记 High Attention？',
  ]);
  appendDocSection_(body, '11. 给 NotebookLM 的研究问题 / NotebookLM Prompt', NOTEBOOKLM_PROMPT.split('\n'));
  appendSourceLinks_(body, '12. 来源链接 / Source Links', data.matches);

  doc.saveAndClose();
}

function appendDocSection_(body, heading, lines) {
  body.appendParagraph(heading).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  lines.forEach(function(line) {
    body.appendParagraph(String(line || ''));
  });
}

function appendRowsSection_(body, heading, rows, titleKeys, summaryKeys, linkKeys) {
  body.appendParagraph(heading).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  if (!rows.length) {
    body.appendParagraph('未找到匹配资料 / No matching rows found.');
    return;
  }
  rows.forEach(function(row, index) {
    var title = getField_(row, titleKeys) || '未命名资料 / Untitled source';
    var summary = getField_(row, summaryKeys);
    var date = getField_(row, ['日期 / Date', '新闻时间 / News Time', 'Created At', '创建时间']);
    var link = getField_(row, linkKeys || ['来源链接 / Source Link']);
    body.appendParagraph(String(index + 1) + '. ' + title).setHeading(DocumentApp.ParagraphHeading.HEADING3);
    if (date) body.appendParagraph('日期 / Date: ' + date);
    if (summary) body.appendParagraph(summary);
    if (link) appendLinkedParagraph_(body, '来源链接 / Source Link: ' + link, link);
  });
}

function appendSourceLinks_(body, heading, matches) {
  body.appendParagraph(heading).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  var links = [];
  Object.keys(matches).forEach(function(group) {
    matches[group].forEach(function(row) {
      var link = getField_(row, ['来源链接 / Source Link', 'Source Link', 'Google Drive文件链接 / Drive File Link']);
      var title = getField_(row, ['新闻标题中文 / Chinese Title', '原始标题 / Original Title', '名称 / Name', '关注主题 / Watch Topic', '代码 / Ticker', '代码 / Symbol']);
      if (link) links.push({ title: title || group, link: link });
    });
  });
  if (!links.length) {
    body.appendParagraph('无可用来源链接 / No source links available.');
    return;
  }
  links.forEach(function(item, index) {
    appendLinkedParagraph_(body, String(index + 1) + '. ' + item.title + ' - ' + item.link, item.link);
  });
}

function appendLinkedParagraph_(body, text, url) {
  var paragraph = body.appendParagraph('');
  var textElement = paragraph.appendText(text);
  if (/^https?:\/\//i.test(String(url || ''))) {
    textElement.setLinkUrl(url);
  }
}

function countResearchMatches_(matches) {
  return Object.keys(matches).reduce(function(total, key) {
    return total + matches[key].length;
  }, 0);
}

function readHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });
}

function nextResearchPackId_(sheet, headers) {
  var idCol = findHeaderIndex_(headers, ['Pack ID', '研究包ID']) + 1;
  if (idCol < 1) throw new Error('Pack ID column not found in 12 Research Pack.');
  var lastRow = sheet.getLastRow();
  var maxId = 0;
  if (lastRow > 1) {
    var values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    values.forEach(function(row) {
      var match = String(row[0] || '').match(/^RPK-(\d+)$/i);
      if (match) maxId = Math.max(maxId, Number(match[1]));
    });
  }
  return 'RPK-' + String(maxId + 1).padStart(3, '0');
}

function findResearchPackRow_(sheet, headers, packId) {
  var idCol = findHeaderIndex_(headers, ['Pack ID', '研究包ID']) + 1;
  if (idCol < 1) throw new Error('Pack ID column not found in 12 Research Pack.');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === packId) return i + 2;
  }
  return -1;
}

function setCellByHeader_(sheet, headers, rowIndex, needles, value) {
  var colIndex = findHeaderIndex_(headers, needles) + 1;
  if (colIndex > 0) sheet.getRange(rowIndex, colIndex).setValue(value);
}

function findRowById_(sheet, headers, idNeedles, idValue) {
  var idCol = findHeaderIndex_(headers, idNeedles) + 1;
  if (idCol < 1) throw new Error('ID column not found: ' + idNeedles.join(' / '));

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('No data rows found.');

  var values = sheet.getRange(2, idCol, lastRow - 1, 1).getDisplayValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === idValue) {
      return i + 2;
    }
  }
  throw new Error('Record not found: ' + idValue);
}

function findHeaderIndex_(headers, needles) {
  for (var i = 0; i < headers.length; i++) {
    for (var n = 0; n < needles.length; n++) {
      if (headers[i].indexOf(needles[n]) !== -1) return i;
    }
  }
  return -1;
}

function getField_(row, keys) {
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (row[key] !== undefined && String(row[key]).trim()) return String(row[key]).trim();
    var fragments = String(key).split('/').map(function(part) { return part.trim(); }).filter(Boolean);
    for (var actual in row) {
      var value = String(row[actual] || '').trim();
      if (!value) continue;
      var matched = fragments.some(function(fragment) {
        return actual.indexOf(fragment) !== -1;
      });
      if (matched) return value;
    }
  }
  return '';
}

function sortResearchRowsDesc_(a, b) {
  var av = [
    getField_(a, ['日期 / Date']),
    getField_(a, ['新闻时间 / News Time']),
    getField_(a, ['Created At', '创建时间']),
    getField_(a, ['Updated At', '更新时间']),
  ].join(' ');
  var bv = [
    getField_(b, ['日期 / Date']),
    getField_(b, ['新闻时间 / News Time']),
    getField_(b, ['Created At', '创建时间']),
    getField_(b, ['Updated At', '更新时间']),
  ].join(' ');
  return bv.localeCompare(av);
}

function findOrCreateFolderPath_(names) {
  var folder = null;
  for (var i = 0; i < names.length; i++) {
    if (i === 0) {
      var rootMatches = DriveApp.getFoldersByName(names[i]);
      folder = rootMatches.hasNext() ? rootMatches.next() : DriveApp.createFolder(names[i]);
    } else {
      var children = folder.getFoldersByName(names[i]);
      folder = children.hasNext() ? children.next() : folder.createFolder(names[i]);
    }
  }
  return folder;
}

function normalizeResearchDecisionStatus_(value) {
  var status = String(value || '').trim();
  if (['No Action', 'Review', 'High Attention'].indexOf(status) !== -1) return status;
  return 'Review';
}


function marketDataFetchJob_() {
  // ── Source: 09 Market Index Source (GOOGLEFINANCE formulas) ──────────────────
  // Columns: A=GF Symbol, B=Display Name, C=Price, D=Change, E=Change%, F=LastUpdated, G=Apps Script Symbol
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sourceSheet = spreadsheet.getSheetByName('09 Market Index Source');
  if (!sourceSheet) throw new Error('Sheet not found: 09 Market Index Source');

  var sourceLastRow = sourceSheet.getLastRow();
  if (sourceLastRow < 2) throw new Error('09 Market Index Source has no data rows.');

  // Detect Notes/备注 column dynamically so NVDA / GOOGL overrides are picked up
  var sourceLastCol2 = sourceSheet.getLastColumn();
  var sourceHeaders2 = sourceSheet.getRange(1, 1, 1, sourceLastCol2).getValues()[0];
  var notesColIdx2 = -1;
  for (var hi2 = 0; hi2 < sourceHeaders2.length; hi2++) {
    var hv2 = String(sourceHeaders2[hi2] || '').trim();
    if (hv2.indexOf('Notes') !== -1 || hv2.indexOf('备注') !== -1) { notesColIdx2 = hi2; break; }
  }
  var readColCount2 = Math.max(7, notesColIdx2 >= 0 ? notesColIdx2 + 1 : 7);
  var sourceData = sourceSheet.getRange(2, 1, sourceLastRow - 1, readColCount2).getValues();

  // Pre-check: some GOOGLEFINANCE formulas (stocks, ETFs, currencies) load slower than
  // index formulas. If any price cells are blank, wait 6 s then re-read the whole sheet.
  // This resolves the issue where NVDA/GOOGL/CADUSD=X/GC=F/USO/XBB.TO stay stale
  // while the four indexes update normally.
  var hasBlankPrices = sourceData.some(function(row) {
    var p = row[2];
    return p === '' || p === null || p === undefined || isNaN(parseFloat(p));
  });
  if (hasBlankPrices) {
    Logger.log('[Market] Some GOOGLEFINANCE prices still loading — flushing and waiting 6 s...');
    SpreadsheetApp.flush();
    Utilities.sleep(6000);
    sourceData = sourceSheet.getRange(2, 1, sourceLastRow - 1, readColCount2).getValues();
  }

  // Self-contained symbol info — does NOT rely on MARKET_SYMBOLS
  var symInfoMap = {
    '^DJI':    { symbol: '^DJI',    market: 'US Market',     label: 'Dow Jones Industrial Average', indicator: 'Dow Jones' },
    '^IXIC':   { symbol: '^IXIC',   market: 'US Market',     label: 'Nasdaq Composite Index',       indicator: 'Nasdaq Composite' },
    '^GSPC':   { symbol: '^GSPC',   market: 'US Market',     label: 'S&P 500 Index',                indicator: 'S&P 500' },
    '^GSPTSE': { symbol: '^GSPTSE', market: 'Canada Market', label: 'S&P/TSX Composite Index',      indicator: 'S&P/TSX Composite' },
    // ── Added: US individual stocks ────────────────────────────────────────────
    'NVDA':   { symbol: 'NVDA',   market: 'US Market',     label: 'NVIDIA Corporation',              indicator: 'NVDA'         },
    'GOOGL':  { symbol: 'GOOGL',  market: 'US Market',     label: 'Alphabet Inc.',                   indicator: 'GOOGL'        },
    // ── Added: Canada Market expanded symbols ──────────────────────────────────
    'CADUSD=X': { symbol: 'CADUSD=X', market: 'Canada Market', label: 'Canadian Dollar / US Dollar',       indicator: 'CAD/USD'      },
    'GC=F':     { symbol: 'GC=F',     market: 'Canada Market', label: 'Gold (XAU/USD, per troy oz)',       indicator: 'Gold'         },
    'USO':      { symbol: 'USO',      market: 'Canada Market', label: 'Oil ETF Proxy (USO)',               indicator: 'Oil ETF'      },
    'XBB.TO':   { symbol: 'XBB.TO',   market: 'Canada Market', label: 'Canada Bond ETF Proxy (XBB.TO)',   indicator: 'Canada Bond'  },
  };

  // ── Destination: 05 Market Radar ─────────────────────────────────────────────
  var sheet = spreadsheet.getSheetByName(DASHBOARD_TABS.marketRadar);
  if (!sheet) throw new Error('Sheet not found: ' + DASHBOARD_TABS.marketRadar);

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('05 Market Radar has no columns.');
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });

  var symCol = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].indexOf('Symbol') !== -1 || headers[i].indexOf('代码') !== -1) { symCol = i + 1; break; }
  }
  var symbolRowMap = {};
  var radarLastRow = sheet.getLastRow();
  if (radarLastRow > 1 && symCol > 0) {
    var symVals = sheet.getRange(2, symCol, radarLastRow - 1, 1).getValues();
    for (var r = 0; r < symVals.length; r++) {
      if (symVals[r][0]) symbolRowMap[String(symVals[r][0]).trim()] = r + 2;
    }
  }

  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'America/Vancouver', 'yyyy-MM-dd');
  var createdAt = now.toISOString();
  var updated = 0, inserted = 0, errors = 0;

  for (var t = 0; t < sourceData.length; t++) {
    var sourceRowNumber = t + 2;
    var srcRow       = retryMarketSourceRowIfPriceMissing_(sourceSheet, sourceRowNumber, readColCount2, sourceData[t]);
    // Notes/备注 column (if found) takes priority as the frontend symbol key
    var appsSymbol;
    if (notesColIdx2 >= 0 && notesColIdx2 < srcRow.length && String(srcRow[notesColIdx2] || '').trim()) {
      appsSymbol = String(srcRow[notesColIdx2]).trim();
    } else {
      appsSymbol = String(srcRow[6] || '').trim(); // Fall back to Column G
    }
    var rawPrice     = srcRow[2];                        // Column C: price
    var rawChangePct = srcRow[4];                        // Column E: changepct
    var rawDate      = srcRow[5];                        // Column F: =NOW()

    if (!appsSymbol) continue;

    var symInfo = symInfoMap[appsSymbol];
    if (!symInfo) {
      Logger.log('[Market] Skipping unknown symbol in column G: ' + appsSymbol);
      errors++;
      continue;
    }

    var price = parseFloat(rawPrice);
    if (!rawPrice || isNaN(price)) {
      Logger.log('[Market] No price for ' + appsSymbol + ' — GOOGLEFINANCE may still be loading.');
      errors++;
      continue;
    }

    var tradingDay = (rawDate instanceof Date)
      ? Utilities.formatDate(rawDate, 'America/Vancouver', 'yyyy-MM-dd')
      : dateStr;

    var quote = {
      price:         price,
      changePercent: parseFloat(rawChangePct) || 0,
      tradingDay:    tradingDay,
    };

    var row = buildMarketRow_(headers, symInfo, quote, dateStr, createdAt);
    if (symbolRowMap[appsSymbol]) {
      sheet.getRange(symbolRowMap[appsSymbol], 1, 1, row.length).setValues([row]);
      Logger.log('[Market] Updated ' + appsSymbol + ' price=' + quote.price + ' change=' + quote.changePercent + '%');
    } else {
      sheet.appendRow(row);
      symbolRowMap[appsSymbol] = sheet.getLastRow();
      inserted++;
      Logger.log('[Market] Inserted ' + appsSymbol);
    }
    updated++;
  }

  SpreadsheetApp.flush();
  return { updated: updated, inserted: inserted, errors: errors };
}

// ================== 股市分析 - 适配你的 Family Investment Radar ==================
function analyzeStocks_(params) {
  const industry = String(params.industry || 'all').toLowerCase().trim();
  const apiKey = PropertiesService.getScriptProperties().getProperty('ALPHA_VANTAGE_API_KEY');
  
  // 结合你当前持仓 + 热门美加龙头（可继续扩展）
  let tickers = [];
  if (industry === 'tech' || industry === 'all') {
    tickers = tickers.concat(['NVDA', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'HSAI', 'BABA']);
  }
  if (industry === 'energy' || industry === 'all') {
    tickers = tickers.concat(['CVE.TO', 'SU.TO', 'XOM', 'CVX', 'REI']);
  }
  if (industry === 'canada' || industry === 'all') {
    tickers = tickers.concat(['RY.TO', 'TD.TO', 'SHOP.TO', 'ENB.TO', 'XIC.TO', 'XIU.TO']);
  }
  if (industry === 'all') {
    tickers = tickers.concat(['AAPL', 'V', 'MA', 'LLY', 'JPM']); // 更多行业龙头
  }
  
  // 去重
  tickers = [...new Set(tickers.map(t => t.toUpperCase()))];
  
  let results = [];
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  tickers.forEach(ticker => {
    try {
      const analysis = getStockValueRiskAnalysis_(ticker, apiKey);
      if (analysis) results.push(analysis);
    } catch (e) {
      Logger.log('分析 ' + ticker + ' 失败: ' + e.message);
    }
  });
  
  // 保存到 11 Stock Analysis
  const updatedRows = saveStockAnalysisToSheet_(spreadsheet, results);
  
  return {
    ok: true,
    data: results,
    count: results.length,
    updatedRows,
    industry: industry || 'all',
    updatedAt: new Date().toISOString()
  };
}

function getStockValueRiskAnalysis_(ticker, apiKey) {
  let price = null;
  let changePct = null;
  let name = ticker;
  
  // 优先使用你已有的 GOOGLEFINANCE（最稳定）
  try {
    const formulaPrice = '=GOOGLEFINANCE("' + ticker + '", "price")';
    const formulaChange = '=GOOGLEFINANCE("' + ticker + '", "changepct")';
    const formulaName = '=GOOGLEFINANCE("' + ticker + '", "name")';
    
    price = SpreadsheetApp.getActive().getRange(formulaPrice).getValue();
    changePct = SpreadsheetApp.getActive().getRange(formulaChange).getValue();
    const fetchedName = SpreadsheetApp.getActive().getRange(formulaName).getValue();
    if (fetchedName) name = fetchedName;
  } catch (e) {
    Logger.log('[Stock] GOOGLEFINANCE failed for ' + ticker + ': ' + e.message);
  }

  // Alpha Vantage 补充 PE / Beta
  let pe = null;
  let beta = null;
  if (apiKey) {
    try {
      const av = fetchAlphaVantageOverview_(apiKey, ticker);
      if (av) {
        pe = av['ForwardPE'] || av['TrailingPE'];
        beta = av['Beta'];
      }
    } catch (e) {}
  }

  const volatility = changePct ? Math.abs(Number(changePct)) * 8 : 25;
  
  const valueScore = pe ? Math.max(4, Math.min(10, 40 / Number(pe) * 6)) : 6;
  const riskScore = beta ? Math.max(3, Math.min(10, 18 - Number(beta) * 4)) : 6;

  return {
    Ticker: ticker,
    名称: name,
    当前价格: price ? Number(price).toFixed(2) : '待更新',
    日变动: changePct ? Number(changePct).toFixed(2) + '%' : '待更新',
    ForwardPE: pe ? Number(pe).toFixed(2) : 'N/A',
    Beta: beta ? Number(beta).toFixed(2) : 'N/A',
    年化波动率: volatility.toFixed(1) + '%',
    价值评分: valueScore.toFixed(1),
    风险评分: riskScore.toFixed(1),
    综合评分: ((valueScore + riskScore) / 2).toFixed(1),
    行业: getIndustryForTicker_(ticker),
    更新时间: new Date().toISOString(),
    备注: '供参考，仅家庭内部使用'
  };
}

function getIndustryForTicker_(ticker) {
  const map = {
    'NVDA': '科技/AI', 'TSLA': 'EV/科技', 'HSAI': 'Auto Tech', 
    'BABA': '中国科技', 'CVE.TO': '能源', 'RY.TO': '加拿大银行'
  };
  return map[ticker] || '其他';
}

function saveStockAnalysisToSheet_(spreadsheet, results) {
  let sheet = spreadsheet.getSheetByName('11 Stock Analysis');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('11 Stock Analysis');
  }

  const headers = [
    'Ticker',
    '名称',
    '当前价格',
    '日变动%',
    'Forward P/E',
    'Beta',
    '简化波动参考%',
    '价值评分',
    '风险评分',
    '综合评分',
    '行业',
    '更新时间',
    '备注text',
    '中文名称',
    '英文名称',
    '类型',
    '一句话说明',
    '适合关注点',
    '主题分类'
  ];

  // 写入表头，确保 A-S 都存在
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 清空旧数据，只清内容，不清格式
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  const infoMap = {
    'NVDA': {
      zh: '英伟达',
      en: 'NVIDIA',
      type: 'AI芯片/半导体',
      desc: 'AI GPU 和数据中心芯片龙头，是人工智能基础设施的重要公司。',
      focus: 'AI 算力需求、数据中心增长、估值是否过热、芯片周期。',
      theme: 'AI / 算力'
    },
    'TSLA': {
      zh: '特斯拉',
      en: 'Tesla',
      type: '电动车/科技',
      desc: '电动车、储能和自动驾驶概念公司，股价波动通常较大。',
      focus: '交付量、毛利率、自动驾驶进展、市场情绪。',
      theme: 'AI / 电动车'
    },
    'GOOGL': {
      zh: '谷歌母公司',
      en: 'Alphabet',
      type: '互联网/AI/广告',
      desc: 'Google 搜索、YouTube、广告、云服务和 AI 业务的母公司。',
      focus: '广告收入、AI竞争、云业务增长、监管风险。',
      theme: 'AI / 云 / 平台'
    },
    'MSFT': {
      zh: '微软',
      en: 'Microsoft',
      type: '软件/云/AI',
      desc: 'Windows、Office、Azure 云和 AI 生态的全球科技巨头。',
      focus: 'Azure增长、AI商业化、企业软件需求、估值水平。',
      theme: 'AI / 云 / 软件'
    },
    'AMZN': {
      zh: '亚马逊',
      en: 'Amazon',
      type: '电商/云计算',
      desc: '电商、物流、AWS 云计算和数字服务平台公司。',
      focus: 'AWS利润、电商利润率、消费需求、AI云竞争。',
      theme: '云计算 / 电商'
    },
    'HSAI': {
      zh: '禾赛科技',
      en: 'Hesai Group',
      type: '自动驾驶传感器',
      desc: '激光雷达 LiDAR 公司，服务自动驾驶和智能汽车市场。',
      focus: '车企订单、自动驾驶发展、亏损风险、中概股波动。',
      theme: 'AI / 自动驾驶'
    },
    'BABA': {
      zh: '阿里巴巴',
      en: 'Alibaba',
      type: '中国科技/电商/云',
      desc: '中国大型电商、云计算和数字平台公司。',
      focus: '中国消费、云业务、监管环境、地缘政治风险。',
      theme: '中国科技'
    },
    'CVE.TO': {
      zh: '森科能源',
      en: 'Cenovus Energy',
      type: '加拿大能源',
      desc: '加拿大油砂、炼油和综合能源公司。',
      focus: '油价、现金流、分红回购、能源周期。',
      theme: '能源'
    },
    'SU.TO': {
      zh: '森科尔能源',
      en: 'Suncor Energy',
      type: '加拿大能源',
      desc: '加拿大大型油砂和综合能源公司。',
      focus: '油价、运营成本、分红、能源政策。',
      theme: '能源'
    },
    'XOM': {
      zh: '埃克森美孚',
      en: 'Exxon Mobil',
      type: '能源/石油天然气',
      desc: '全球大型石油天然气和综合能源公司。',
      focus: '油价周期、现金流、资本开支、能源转型风险。',
      theme: '能源'
    },
    'CVX': {
      zh: '雪佛龙',
      en: 'Chevron',
      type: '能源/石油天然气',
      desc: '美国大型综合能源公司，业务覆盖上游和下游。',
      focus: '油价、分红稳定性、项目执行、能源政策。',
      theme: '能源'
    },
    'REI': {
      zh: 'Ring Energy',
      en: 'Ring Energy',
      type: '小型能源股',
      desc: '美国小型油气勘探与生产公司，波动和风险通常较高。',
      focus: '油价敏感度、债务、产量、流动性风险。',
      theme: '能源 / 高波动'
    },
    'RY.TO': {
      zh: '加拿大皇家银行',
      en: 'Royal Bank of Canada',
      type: '加拿大银行',
      desc: '加拿大大型银行，业务包括个人银行、财富管理和资本市场。',
      focus: '利率环境、贷款质量、分红、加拿大经济。',
      theme: '银行 / 金融'
    },
    'TD.TO': {
      zh: '道明银行',
      en: 'Toronto-Dominion Bank',
      type: '加拿大银行',
      desc: '加拿大大型银行，北美零售银行业务占比较高。',
      focus: '利率、美国业务、信用风险、监管问题。',
      theme: '银行 / 金融'
    },
    'SHOP.TO': {
      zh: 'Shopify',
      en: 'Shopify',
      type: '加拿大科技/电商软件',
      desc: '加拿大电商建站、支付和商家服务软件平台。',
      focus: '商家增长、支付业务、盈利能力、科技股估值。',
      theme: '加拿大科技'
    },
    'ENB.TO': {
      zh: '恩桥',
      en: 'Enbridge',
      type: '能源管道/股息',
      desc: '加拿大能源管道和基础设施公司，常被关注为股息型资产。',
      focus: '现金流、债务、利率、分红可持续性。',
      theme: '能源 / 管道 / 股息'
    },
    'XIC.TO': {
      zh: '加拿大综合市场ETF',
      en: 'iShares Core S&P/TSX Capped Composite ETF',
      type: 'ETF/加拿大大盘',
      desc: '跟踪加拿大整体股市的一篮子 ETF。',
      focus: '加拿大大盘配置、行业集中度、长期分散投资。',
      theme: 'ETF / 加拿大大盘'
    },
    'XIU.TO': {
      zh: '加拿大TSX 60 ETF',
      en: 'iShares S&P/TSX 60 ETF',
      type: 'ETF/加拿大蓝筹',
      desc: '跟踪加拿大 60 家大型蓝筹公司的 ETF。',
      focus: '加拿大蓝筹暴露、银行能源权重、分红稳定性。',
      theme: 'ETF / 加拿大蓝筹'
    },
    'AAPL': {
      zh: '苹果',
      en: 'Apple',
      type: '消费电子/服务',
      desc: 'iPhone、Mac、可穿戴设备和服务生态的全球科技公司。',
      focus: 'iPhone周期、服务收入、AI设备生态、估值。',
      theme: '消费科技'
    },
    'V': {
      zh: 'Visa',
      en: 'Visa',
      type: '支付网络',
      desc: '全球银行卡支付网络公司，不直接发放贷款，主要赚交易网络费用。',
      focus: '消费支付量、跨境交易、监管费率、金融科技竞争。',
      theme: '支付网络 / 金融科技'
    },
    'MA': {
      zh: '万事达',
      en: 'Mastercard',
      type: '支付网络',
      desc: '全球支付网络公司，连接银行、商户和消费者。',
      focus: '消费趋势、跨境支付、费率监管、数字支付增长。',
      theme: '支付网络 / 金融科技'
    },
    'LLY': {
      zh: '礼来',
      en: 'Eli Lilly',
      type: '医药/制药',
      desc: '美国大型制药公司，糖尿病、减重药和创新药是重要增长点。',
      focus: '药品销售、研发管线、医保定价、估值是否过高。',
      theme: '医药 / 制药'
    },
    'JPM': {
      zh: '摩根大通',
      en: 'JPMorgan Chase',
      type: '美国银行/金融',
      desc: '美国大型综合银行，业务包括商业银行、投资银行、信用卡和资产管理。',
      focus: '利率、信贷周期、资本市场收入、监管要求。',
      theme: '银行 / 金融'
    }
  };

  const rows = [];
  results.forEach((r) => {
    const originalTicker = r.Ticker;
    const info = infoMap[originalTicker] || {
      zh: r.名称 || originalTicker,
      en: r.名称 || originalTicker,
      type: r.行业 || '其他',
      desc: '待补充公司说明。',
      focus: '待补充关注点。',
      theme: r.行业 || '其他'
    };

    rows.push([
      originalTicker,
      r.名称 || originalTicker,
      '',
      '',
      r.ForwardPE || 'N/A',
      r.Beta || 'N/A',
      '',
      r.价值评分 || '6.0',
      r.风险评分 || '6.0',
      r.综合评分 || '6.0',
      r.行业 || info.type || '其他',
      r.更新时间 || new Date().toISOString(),
      r.备注 || '供参考，仅家庭内部使用',
      info.zh,
      info.en,
      info.type,
      info.desc,
      info.focus,
      info.theme
    ]);
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // 写入 GOOGLEFINANCE 公式：C列价格，D列日变动%，G列简化波动参考%
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const originalTicker = rows[i][0];
      let gfTicker = originalTicker;

      // 加拿大 .TO 转换成 GoogleFinance 支持的 TSE: 格式
      if (originalTicker.endsWith('.TO')) {
        gfTicker = 'TSE:' + originalTicker.replace('.TO', '');
      }

      sheet.getRange(rowNum, 3).setFormula('=GOOGLEFINANCE("' + gfTicker + '","price")');
      sheet.getRange(rowNum, 4).setFormula('=GOOGLEFINANCE("' + gfTicker + '","changepct")');
      sheet.getRange(rowNum, 7).setFormula('=IFERROR(ABS(D' + rowNum + ')*8/100,"待更新")');
    }

    // G列显示为百分比
    sheet.getRange(2, 7, rows.length, 1).setNumberFormat('0.00%');

    // Q-R 长文本自动换行
    sheet.getRange(2, 17, rows.length, 2).setWrap(true);
  }

  // 表头格式
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  SpreadsheetApp.flush();
  return rows.length;
}

function updateStockFundamentalsForStockAnalysis_(params) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName('11 Stock Analysis');

  if (!sheet) {
    throw new Error('11 Stock Analysis sheet not found.');
  }

  const apiKey = getAlphaVantageApiKey_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      updated: 0,
      skipped: 0,
      errors: [],
      message: 'No stock rows found.',
    };
  }

  const maxParam = params && params.max ? Number(params.max) : 5;
  const maxToUpdate = Math.max(1, Math.min(maxParam, 10));

  const values = sheet.getRange(2, 1, lastRow - 1, 36).getValues();
  const errors = [];
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < values.length; i++) {
    if (updated >= maxToUpdate) break;

    const row = values[i];
    const rowNum = i + 2;
    const ticker = String(row[0] || '').trim();

    if (!ticker) {
      skipped++;
      continue;
    }

    // 跳过未上市或无法从 Alpha Vantage 抓基本面的观察项
    if (isPrivateOrPlaceholderTicker_(ticker)) {
      sheet.getRange(rowNum, 20, 1, 17).setValues([[
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        new Date().toISOString(),
        '未上市或非标准公开股票，暂不抓取基本面数据。',
        '作为主题观察项保留，不能按普通上市公司财务指标直接比较。',
        'Manual / Watch only'
      ]]);
      updated++;
      continue;
    }

    // 如果已经有“基本面数据来源”，默认先跳过，避免浪费 API 次数
    const existingSource = String(row[35] || '').trim();
    const force = params && String(params.force || '').toLowerCase() === 'true';

    if (existingSource && !force) {
      skipped++;
      continue;
    }

    try {
      const avSymbol = normalizeTickerForAlphaVantage_(ticker);
      const overview = fetchAlphaVantageOverview_(avSymbol, apiKey);

      if (!overview || !overview.Symbol) {
        errors.push({
          row: rowNum,
          ticker,
          error: 'No overview data returned from Alpha Vantage.',
        });
        skipped++;
        continue;
      }

      const financialRow = buildFundamentalRow_(overview);
      sheet.getRange(rowNum, 20, 1, 17).setValues([financialRow]);

      updated++;

      // 避免触发 Alpha Vantage 频率限制。免费 API 通常不适合一次抓太多。
      Utilities.sleep(13000);

    } catch (err) {
      errors.push({
        row: rowNum,
        ticker,
        error: String(err && err.message ? err.message : err),
      });
      skipped++;
    }
  }

  // 设置百分比格式：X 股息率、Y 净利率、Z 营业利润率、AA ROE、AC 营收增长
  if (lastRow > 1) {
    sheet.getRange(2, 24, lastRow - 1, 1).setNumberFormat('0.00%'); // X
    sheet.getRange(2, 25, lastRow - 1, 1).setNumberFormat('0.00%'); // Y
    sheet.getRange(2, 26, lastRow - 1, 1).setNumberFormat('0.00%'); // Z
    sheet.getRange(2, 27, lastRow - 1, 1).setNumberFormat('0.00%'); // AA
    sheet.getRange(2, 29, lastRow - 1, 1).setNumberFormat('0.00%'); // AC

    // AH-AJ 长文本换行
    sheet.getRange(2, 34, lastRow - 1, 3).setWrap(true);
  }

  SpreadsheetApp.flush();

  return {
    updated,
    skipped,
    errors,
    message: 'Fundamentals update completed. Use max parameter to control API usage.',
  };
}


function getAlphaVantageApiKey_() {
  const props = PropertiesService.getScriptProperties();

  const possibleNames = [
    'ALPHA_VANTAGE_API_KEY',
    'ALPHAVANTAGE_API_KEY',
    'ALPHA_VANTAGE_KEY',
    'ALPHAVANTAGE_KEY'
  ];

  for (let i = 0; i < possibleNames.length; i++) {
    const value = props.getProperty(possibleNames[i]);
    if (value) return value;
  }

  throw new Error('Alpha Vantage API key not found in Script Properties.');
}


function normalizeTickerForAlphaVantage_(ticker) {
  const t = String(ticker || '').trim();

  // Alpha Vantage 对加拿大 ticker 支持不如美股稳定。
  // 这里先尝试去掉 .TO，让脚本不报错；如果无数据，会在结果里记录 skipped/error。
  if (t.endsWith('.TO')) {
    return t.replace('.TO', '');
  }

  // BRK.B 在不同数据源可能是 BRK.B 或 BRK-B，这里先保留原样。
  return t;
}


function isPrivateOrPlaceholderTicker_(ticker) {
  const t = String(ticker || '').toUpperCase().trim();

  return [
    'OPENAI',
    'ANTHROPIC',
    'CURSOR',
    'ANYSphere'.toUpperCase()
  ].includes(t);
}


function fetchAlphaVantageOverview_(symbol, apiKey) {
  const url =
    'https://www.alphavantage.co/query'
    + '?function=OVERVIEW'
    + '&symbol=' + encodeURIComponent(symbol)
    + '&apikey=' + encodeURIComponent(apiKey);

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  const text = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error('Alpha Vantage HTTP error ' + status + ': ' + text.slice(0, 200));
  }

  const data = JSON.parse(text);

  if (data.Note) {
    throw new Error('Alpha Vantage rate limit / note: ' + data.Note);
  }

  if (data.Information) {
    throw new Error('Alpha Vantage information: ' + data.Information);
  }

  if (data['Error Message']) {
    throw new Error('Alpha Vantage error: ' + data['Error Message']);
  }

  return data;
}


function buildFundamentalRow_(overview) {
  const marketCap = cleanNumberText_(overview.MarketCapitalization);
  const pe = cleanNumberText_(overview.PERatio);
  const forwardPe = cleanNumberText_(overview.ForwardPE);
  const ps = cleanNumberText_(overview.PriceToSalesRatioTTM);
  const dividendYield = cleanPercentDecimal_(overview.DividendYield);
  const profitMargin = cleanPercentDecimal_(overview.ProfitMargin);
  const operatingMargin = cleanPercentDecimal_(overview.OperatingMarginTTM);
  const roe = cleanPercentDecimal_(overview.ReturnOnEquityTTM);
  const revenueTtm = cleanNumberText_(overview.RevenueTTM);
  const revenueGrowth = cleanPercentDecimal_(overview.QuarterlyRevenueGrowthYOY);
  const eps = cleanNumberText_(overview.EPS);
  const weekHigh = cleanNumberText_(overview['52WeekHigh']);
  const weekLow = cleanNumberText_(overview['52WeekLow']);

  const summary = buildEarningsSummary_(overview);
  const aiComment = buildSimpleFinancialComment_(overview);

  return [
    marketCap,
    pe,
    forwardPe,
    ps,
    dividendYield,
    profitMargin,
    operatingMargin,
    roe,
    revenueTtm,
    revenueGrowth,
    eps,
    weekHigh,
    weekLow,
    new Date().toISOString(),
    summary,
    aiComment,
    'Alpha Vantage OVERVIEW'
  ];
}


function cleanNumberText_(value) {
  if (value === null || value === undefined) return 'N/A';

  const text = String(value).trim();

  if (!text || text === 'None' || text === 'null' || text === '-' || text === 'NaN') {
    return 'N/A';
  }

  return text;
}


function cleanPercentDecimal_(value) {
  if (value === null || value === undefined) return 'N/A';

  const text = String(value).trim();

  if (!text || text === 'None' || text === 'null' || text === '-' || text === 'NaN') {
    return 'N/A';
  }

  const num = Number(text);

  if (isNaN(num)) return text;

  // Alpha Vantage 的 DividendYield / ProfitMargin 通常已经是小数形式，比如 0.025。
  return num;
}


function buildEarningsSummary_(overview) {
  const name = overview.Name || overview.Symbol || '该公司';
  const sector = overview.Sector || '未知行业';
  const industry = overview.Industry || '未知细分行业';
  const marketCap = cleanNumberText_(overview.MarketCapitalization);
  const revenue = cleanNumberText_(overview.RevenueTTM);
  const profitMargin = cleanNumberText_(overview.ProfitMargin);
  const pe = cleanNumberText_(overview.PERatio);

  return name
    + ' 所属行业：' + sector
    + ' / ' + industry
    + '。市值：' + marketCap
    + '，过去12月营收：' + revenue
    + '，净利率：' + profitMargin
    + '，P/E：' + pe
    + '。';
}


function saveStockAnalysisToSheet_(spreadsheet, results) {
  let sheet = spreadsheet.getSheetByName('11 Stock Analysis');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('11 Stock Analysis');
  }

  const headers = [
    'Ticker',
    '名称',
    '当前价格',
    '日变动%',
    'Forward P/E',
    'Beta',
    '简化波动参考%',
    '价值评分',
    '风险评分',
    '综合评分',
    '行业',
    '更新时间',
    '备注text',
    '中文名称',
    '英文名称',
    '类型',
    '一句话说明',
    '适合关注点',
    '主题分类',
    '市值 Market Cap',
    'P/E 市盈率',
    'Forward P/E 预期市盈率',
    'P/S 市销率',
    '股息率 Dividend Yield',
    'Profit Margin 净利率',
    'Operating Margin 营业利润率',
    'ROE 净资产收益率',
    'Revenue TTM 过去12月营收',
    'Revenue Growth 营收增长',
    'EPS 每股收益',
    '52周高点',
    '52周低点',
    '财务数据更新时间',
    '财报摘要',
    'AI财务简评',
    '基本面数据来源'
  ];

  const infoMap = getStockAnalysisInfoMap_();
  const fixedTickers = Object.keys(infoMap);

  // Preserve existing fundamentals T:AJ by ticker before rewriting A:S.
  const lastRowBefore = sheet.getLastRow();
  const existingFundamentalsByTicker = {};
  if (lastRowBefore > 1) {
    const existingValues = sheet.getRange(2, 1, lastRowBefore - 1, 36).getValues();
    existingValues.forEach((row) => {
      const ticker = String(row[0] || '').trim();
      if (ticker) {
        existingFundamentalsByTicker[ticker] = row.slice(19, 36);
      }
    });
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Clear visible stock rows A:AJ, then rebuild from the single source stock pool below.
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  const resultMap = {};
  (results || []).forEach((r) => {
    const ticker = String(r.Ticker || r.ticker || '').trim();
    if (ticker) resultMap[ticker] = r;
  });

  const rows = fixedTickers.map((ticker) => {
    const r = resultMap[ticker] || {};
    const info = infoMap[ticker];

    const baseRow = [
      ticker,
      r.名称 || r.Name || ticker,
      '',
      '',
      r.ForwardPE || r.ForwardPe || 'N/A',
      r.Beta || 'N/A',
      '',
      r.价值评分 || '6',
      r.风险评分 || '6',
      r.综合评分 || '6',
      r.行业 || info.industry || info.type || '其他',
      r.更新时间 || new Date().toISOString(),
      r.备注 || '供参考，仅家庭内部使用',
      info.zh,
      info.en,
      info.type,
      info.desc,
      info.focus,
      info.theme
    ];

    const preservedFundamentals = existingFundamentalsByTicker[ticker] || new Array(17).fill('');
    return baseRow.concat(preservedFundamentals);
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // GOOGLEFINANCE formulas: C price, D daily change %, G simplified volatility reference.
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const originalTicker = rows[i][0];

      if (isPrivateOrPlaceholderTicker_(originalTicker)) {
        sheet.getRange(rowNum, 3).setValue('N/A');
        sheet.getRange(rowNum, 4).setValue('N/A');
        sheet.getRange(rowNum, 7).setValue('N/A');
        continue;
      }

      let gfTicker = originalTicker;

      if (originalTicker.endsWith('.TO')) {
        gfTicker = 'TSE:' + originalTicker.replace('.TO', '');
      }

      sheet.getRange(rowNum, 3).setFormula('=IFERROR(GOOGLEFINANCE("' + gfTicker + '","price"),"N/A")');
      sheet.getRange(rowNum, 4).setFormula('=IFERROR(GOOGLEFINANCE("' + gfTicker + '","changepct"),"N/A")');
      sheet.getRange(rowNum, 7).setFormula('=IFERROR(ABS(D' + rowNum + ')*8/100,"待更新")');
    }

    sheet.getRange(2, 7, rows.length, 1).setNumberFormat('0.00%');
    sheet.getRange(2, 17, rows.length, 2).setWrap(true);
    sheet.getRange(2, 34, rows.length, 3).setWrap(true);
  }

  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  SpreadsheetApp.flush();
}


function getStockAnalysisInfoMap_() {
  return {
    // Existing core watchlist
    'NVDA': {
      zh: '英伟达',
      en: 'NVIDIA',
      type: 'AI芯片/半导体',
      industry: '科技/AI',
      desc: 'AI GPU 和数据中心芯片龙头，是人工智能基础设施的重要公司。',
      focus: 'AI 算力需求、数据中心增长、估值是否过热、芯片周期。',
      theme: 'AI / 算力 / 半导体'
    },
    'TSLA': {
      zh: '特斯拉',
      en: 'Tesla',
      type: '电动车/科技',
      industry: 'EV/科技',
      desc: '电动车、储能和自动驾驶概念公司，股价波动通常较大。',
      focus: '交付量、毛利率、自动驾驶进展、市场情绪。',
      theme: 'AI / 电动车'
    },
    'GOOGL': {
      zh: '谷歌母公司',
      en: 'Alphabet',
      type: '互联网/AI/广告',
      industry: '科技/AI',
      desc: 'Google 搜索、YouTube、广告、云服务和 AI 业务的母公司。',
      focus: '广告收入、AI竞争、云业务增长、监管风险。',
      theme: 'AI / 云 / 平台'
    },
    'MSFT': {
      zh: '微软',
      en: 'Microsoft',
      type: '软件/云/AI',
      industry: '科技/AI',
      desc: 'Windows、Office、Azure 云和 AI 生态的全球科技巨头。',
      focus: 'Azure增长、AI商业化、企业软件需求、估值水平。',
      theme: 'AI / 云 / 软件'
    },
    'AMZN': {
      zh: '亚马逊',
      en: 'Amazon',
      type: '电商/云计算',
      industry: '云计算/电商',
      desc: '电商、物流、AWS 云计算和数字服务平台公司。',
      focus: 'AWS利润、电商利润率、消费需求、AI云竞争。',
      theme: 'AI / 云计算 / 电商'
    },
    'HSAI': {
      zh: '禾赛科技',
      en: 'Hesai Group',
      type: '自动驾驶传感器',
      industry: 'Auto Tech',
      desc: '激光雷达 LiDAR 公司，服务自动驾驶和智能汽车市场。',
      focus: '车企订单、自动驾驶发展、亏损风险、中概股波动。',
      theme: 'AI / 自动驾驶'
    },
    'BABA': {
      zh: '阿里巴巴',
      en: 'Alibaba',
      type: '中国科技/电商/云',
      industry: '中国科技',
      desc: '中国大型电商、云计算和数字平台公司。',
      focus: '中国消费、云业务、监管环境、地缘政治风险。',
      theme: '中国科技 / 云 / 电商'
    },
    'CVE.TO': {
      zh: '森科能源',
      en: 'Cenovus Energy',
      type: '加拿大能源',
      industry: '能源',
      desc: '加拿大油砂、炼油和综合能源公司。',
      focus: '油价、现金流、分红回购、能源周期。',
      theme: '能源'
    },
    'SU.TO': {
      zh: '森科尔能源',
      en: 'Suncor Energy',
      type: '加拿大能源',
      industry: '能源',
      desc: '加拿大大型油砂和综合能源公司。',
      focus: '油价、运营成本、分红、能源政策。',
      theme: '能源'
    },
    'XOM': {
      zh: '埃克森美孚',
      en: 'Exxon Mobil',
      type: '能源/石油天然气',
      industry: '能源',
      desc: '全球大型石油天然气和综合能源公司。',
      focus: '油价周期、现金流、资本开支、能源转型风险。',
      theme: '能源'
    },
    'CVX': {
      zh: '雪佛龙',
      en: 'Chevron',
      type: '能源/石油天然气',
      industry: '能源',
      desc: '美国大型综合能源公司，业务覆盖上游和下游。',
      focus: '油价、分红稳定性、项目执行、能源政策。',
      theme: '能源'
    },
    'REI': {
      zh: 'Ring Energy',
      en: 'Ring Energy',
      type: '小型能源股',
      industry: '能源',
      desc: '美国小型油气勘探与生产公司，波动和风险通常较高。',
      focus: '油价敏感度、债务、产量、流动性风险。',
      theme: '能源 / 高波动'
    },
    'RY.TO': {
      zh: '加拿大皇家银行',
      en: 'Royal Bank of Canada',
      type: '加拿大银行',
      industry: '加拿大银行',
      desc: '加拿大大型银行，业务包括个人银行、财富管理和资本市场。',
      focus: '利率环境、贷款质量、分红、加拿大经济。',
      theme: '银行 / 金融'
    },
    'TD.TO': {
      zh: '道明银行',
      en: 'Toronto-Dominion Bank',
      type: '加拿大银行',
      industry: '加拿大银行',
      desc: '加拿大大型银行，北美零售银行业务占比较高。',
      focus: '利率、美国业务、信用风险、监管问题。',
      theme: '银行 / 金融'
    },
    'SHOP.TO': {
      zh: 'Shopify',
      en: 'Shopify',
      type: '加拿大科技/电商软件',
      industry: '加拿大科技',
      desc: '加拿大电商建站、支付和商家服务软件平台。',
      focus: '商家增长、支付业务、盈利能力、科技股估值。',
      theme: '加拿大科技 / 电商软件'
    },
    'ENB.TO': {
      zh: '恩桥',
      en: 'Enbridge',
      type: '能源管道/股息',
      industry: '能源',
      desc: '加拿大能源管道和基础设施公司，常被关注为股息型资产。',
      focus: '现金流、债务、利率、分红可持续性。',
      theme: '能源 / 管道 / 股息'
    },
    'XIC.TO': {
      zh: '加拿大综合市场ETF',
      en: 'iShares Core S&P/TSX Capped Composite ETF',
      type: 'ETF/加拿大大盘',
      industry: 'ETF',
      desc: '跟踪加拿大整体股市的一篮子 ETF。',
      focus: '加拿大大盘配置、行业集中度、长期分散投资。',
      theme: 'ETF / 加拿大大盘'
    },
    'XIU.TO': {
      zh: '加拿大TSX 60 ETF',
      en: 'iShares S&P/TSX 60 ETF',
      type: 'ETF/加拿大蓝筹',
      industry: 'ETF',
      desc: '跟踪加拿大 60 家大型蓝筹公司的 ETF。',
      focus: '加拿大蓝筹暴露、银行能源权重、分红稳定性。',
      theme: 'ETF / 加拿大蓝筹'
    },
    'AAPL': {
      zh: '苹果',
      en: 'Apple',
      type: '消费电子/服务',
      industry: '消费科技',
      desc: 'iPhone、Mac、可穿戴设备和服务生态的全球科技公司。',
      focus: 'iPhone周期、服务收入、AI设备生态、估值。',
      theme: '消费科技 / AI设备'
    },
    'V': {
      zh: 'Visa',
      en: 'Visa',
      type: '支付网络',
      industry: '金融科技',
      desc: '全球银行卡支付网络公司，不直接发放贷款，主要赚交易网络费用。',
      focus: '消费支付量、跨境交易、监管费率、金融科技竞争。',
      theme: '支付网络 / 金融科技'
    },
    'MA': {
      zh: '万事达',
      en: 'Mastercard',
      type: '支付网络',
      industry: '金融科技',
      desc: '全球支付网络公司，连接银行、商户和消费者。',
      focus: '消费趋势、跨境支付、费率监管、数字支付增长。',
      theme: '支付网络 / 金融科技'
    },
    'LLY': {
      zh: '礼来',
      en: 'Eli Lilly',
      type: '医药/制药',
      industry: '医药',
      desc: '美国大型制药公司，糖尿病、减重药和创新药是重要增长点。',
      focus: '药品销售、研发管线、医保定价、估值是否过高。',
      theme: '医药 / 制药'
    },
    'JPM': {
      zh: '摩根大通',
      en: 'JPMorgan Chase',
      type: '美国银行/金融',
      industry: '银行/金融',
      desc: '美国大型综合银行，业务包括商业银行、投资银行、信用卡和资产管理。',
      focus: '利率、信贷周期、资本市场收入、监管要求。',
      theme: '银行 / 金融'
    },

    // AI / compute / semiconductor expansion
    'AMD': {
      zh: '超威半导体',
      en: 'AMD',
      type: 'AI芯片/半导体',
      industry: '科技/AI',
      desc: 'CPU、GPU 和 AI 加速芯片公司，是英伟达之外的重要 AI 算力竞争者。',
      focus: 'AI GPU 份额、数据中心收入、毛利率、与 NVIDIA 的竞争。',
      theme: 'AI / 算力 / 半导体'
    },
    'AVGO': {
      zh: '博通',
      en: 'Broadcom',
      type: 'AI网络芯片/半导体',
      industry: '科技/AI',
      desc: '半导体和基础设施软件公司，受益于 AI 数据中心网络和定制芯片需求。',
      focus: 'AI网络芯片、定制ASIC、VMware整合、现金流和估值。',
      theme: 'AI / 算力 / 半导体'
    },
    'TSM': {
      zh: '台积电',
      en: 'Taiwan Semiconductor',
      type: '晶圆代工/半导体',
      industry: '科技/AI',
      desc: '全球领先晶圆代工厂，是 AI 芯片产业链的核心制造环节。',
      focus: '先进制程、AI芯片订单、地缘政治、资本开支。',
      theme: 'AI / 算力 / 半导体'
    },
    'META': {
      zh: 'Meta',
      en: 'Meta Platforms',
      type: '社交平台/AI',
      industry: '科技/AI',
      desc: 'Facebook、Instagram 和 WhatsApp 母公司，同时大规模投入 AI 模型和基础设施。',
      focus: '广告收入、AI推荐效率、Reality Labs亏损、资本开支。',
      theme: 'AI / 平台 / 广告'
    },
    'ORCL': {
      zh: '甲骨文',
      en: 'Oracle',
      type: '企业软件/云/AI',
      industry: '科技/AI',
      desc: '企业数据库和云基础设施公司，AI云算力需求推动市场关注。',
      focus: '云基础设施增长、AI训练客户、债务、利润率。',
      theme: 'AI / 云 / 软件'
    },
    'CRM': {
      zh: '赛富时',
      en: 'Salesforce',
      type: '企业软件/AI',
      industry: '科技/AI',
      desc: '企业客户关系管理软件龙头，正在把 AI 嵌入企业软件流程。',
      focus: '企业软件需求、AI商业化、利润率、订阅增长。',
      theme: 'AI / 云 / 软件'
    },
    'PLTR': {
      zh: 'Palantir',
      en: 'Palantir',
      type: '数据分析/AI软件',
      industry: '科技/AI',
      desc: '数据分析和 AI 软件公司，政府及企业客户需求是核心观察点。',
      focus: 'AIP平台增长、政府合同、商业客户扩张、估值波动。',
      theme: 'AI / 数据 / 软件'
    },
    'ARM': {
      zh: '安谋',
      en: 'Arm Holdings',
      type: '芯片架构/IP',
      industry: '科技/AI',
      desc: '芯片架构授权公司，移动、服务器和 AI 边缘计算都与其生态相关。',
      focus: '授权收入、AI边缘设备、服务器渗透率、估值。',
      theme: 'AI / 算力 / 半导体'
    },
    'ASML': {
      zh: '阿斯麦',
      en: 'ASML',
      type: '半导体设备',
      industry: '科技/AI',
      desc: '先进光刻机龙头，是全球先进芯片制造供应链的关键公司。',
      focus: 'EUV订单、先进制程扩产、出口限制、半导体周期。',
      theme: 'AI / 半导体设备'
    },
    'SMCI': {
      zh: '超微电脑',
      en: 'Super Micro Computer',
      type: 'AI服务器',
      industry: '科技/AI',
      desc: 'AI服务器和数据中心硬件公司，受 AI 基础设施建设周期影响很大。',
      focus: 'AI服务器订单、毛利率、供应链、财务透明度。',
      theme: 'AI / 服务器 / 数据中心'
    },
    'MU': {
      zh: '美光科技',
      en: 'Micron Technology',
      type: '存储芯片',
      industry: '科技/AI',
      desc: '存储芯片公司，HBM 和数据中心存储需求与 AI 算力周期相关。',
      focus: 'HBM需求、DRAM价格、周期复苏、资本开支。',
      theme: 'AI / 存储 / 半导体'
    },
    'ANET': {
      zh: 'Arista Networks',
      en: 'Arista Networks',
      type: '数据中心网络设备',
      industry: '科技/AI',
      desc: '数据中心网络设备公司，AI集群网络建设是重要需求来源。',
      focus: '云厂商资本开支、AI网络升级、竞争格局、利润率。',
      theme: 'AI / 网络 / 数据中心'
    },
    'VRT': {
      zh: 'Vertiv',
      en: 'Vertiv',
      type: '数据中心电力与散热',
      industry: 'AI数据中心',
      desc: '数据中心电力、散热和基础设施公司，受益于 AI 数据中心建设。',
      focus: '数据中心建设、电力与冷却需求、订单增长、估值。',
      theme: 'AI / 数据中心 / 电力'
    },
    'DELL': {
      zh: '戴尔',
      en: 'Dell Technologies',
      type: 'AI服务器/企业硬件',
      industry: '科技/AI',
      desc: '企业硬件和服务器公司，AI服务器需求提升其市场关注度。',
      focus: 'AI服务器订单、利润率、PC周期、企业需求。',
      theme: 'AI / 服务器 / 硬件'
    },

    // Energy / electricity / AI data center power
    'CNQ.TO': {
      zh: '加拿大自然资源',
      en: 'Canadian Natural Resources',
      type: '加拿大能源',
      industry: '能源',
      desc: '加拿大大型油气生产商，油价和现金流是核心变量。',
      focus: '油价、产量、自由现金流、分红回购。',
      theme: '能源'
    },
    'TRP.TO': {
      zh: 'TC Energy',
      en: 'TC Energy',
      type: '能源管道',
      industry: '能源',
      desc: '北美能源基础设施和管道公司，偏防御和现金流型观察。',
      focus: '管道资产、债务、利率、分红可持续性。',
      theme: '能源 / 管道 / 股息'
    },
    'PPL.TO': {
      zh: 'Pembina Pipeline',
      en: 'Pembina Pipeline',
      type: '能源管道',
      industry: '能源',
      desc: '加拿大能源管道和中游基础设施公司。',
      focus: '现金流、分红、能源运输需求、利率。',
      theme: '能源 / 管道 / 股息'
    },
    'CEG': {
      zh: 'Constellation Energy',
      en: 'Constellation Energy',
      type: '核电/电力',
      industry: '电力',
      desc: '美国核电和清洁电力公司，AI数据中心用电需求提升市场关注。',
      focus: '电价、核电资产、数据中心供电合同、政策。',
      theme: 'AI / 电力 / 核能'
    },
    'NEE': {
      zh: '新纪元能源',
      en: 'NextEra Energy',
      type: '公用事业/清洁能源',
      industry: '电力',
      desc: '美国大型公用事业和清洁能源公司。',
      focus: '利率、可再生能源项目、用电增长、分红。',
      theme: '电力 / 公用事业'
    },

    // Minerals / raw materials
    'CCJ.TO': {
      zh: 'Cameco',
      en: 'Cameco',
      type: '铀矿/核能原料',
      industry: '矿产',
      desc: '加拿大铀矿公司，与核能和电力需求主题相关。',
      focus: '铀价、核电需求、矿山供应、GoogleFinance代码稳定性。',
      theme: '矿产 / 核能'
    },
    'TECK.B.TO': {
      zh: '泰克资源',
      en: 'Teck Resources',
      type: '矿业/铜/原材料',
      industry: '矿产',
      desc: '加拿大大型矿业公司，铜和基础金属业务受全球周期影响。',
      focus: '铜价、煤炭业务变化、资本开支、中国需求。',
      theme: '矿产 / 原材料'
    },
    'FCX': {
      zh: '自由港麦克莫兰',
      en: 'Freeport-McMoRan',
      type: '铜矿/黄金',
      industry: '矿产',
      desc: '大型铜矿公司，受电气化、AI电力建设和全球工业周期影响。',
      focus: '铜价、矿山产量、成本、全球需求。',
      theme: '矿产 / 铜'
    },
    'NEM': {
      zh: '纽蒙特',
      en: 'Newmont',
      type: '黄金矿业',
      industry: '矿产',
      desc: '全球大型黄金矿业公司，常被用于观察黄金和避险资产周期。',
      focus: '金价、矿山成本、现金流、并购整合。',
      theme: '矿产 / 黄金'
    },

    // Canadian banks / finance
    'BNS.TO': {
      zh: '丰业银行',
      en: 'Bank of Nova Scotia',
      type: '加拿大银行',
      industry: '加拿大银行',
      desc: '加拿大大型银行，国际业务占比较高。',
      focus: '加拿大贷款质量、国际业务风险、利率、分红。',
      theme: '银行 / 金融'
    },
    'BMO.TO': {
      zh: '蒙特利尔银行',
      en: 'Bank of Montreal',
      type: '加拿大银行',
      industry: '加拿大银行',
      desc: '加拿大大型银行，北美银行和财富管理业务是重要组成。',
      focus: '贷款质量、美国业务、资本充足率、分红。',
      theme: '银行 / 金融'
    },
    'CM.TO': {
      zh: '加拿大帝国商业银行',
      en: 'CIBC',
      type: '加拿大银行',
      industry: '加拿大银行',
      desc: '加拿大大型银行，对加拿大房贷和消费信贷周期较敏感。',
      focus: '房贷风险、加拿大经济、利率、分红稳定性。',
      theme: '银行 / 金融'
    },

    // Healthcare / defensive / ETFs
    'JNJ': {
      zh: '强生',
      en: 'Johnson & Johnson',
      type: '医药/防御',
      industry: '医药',
      desc: '大型医疗健康公司，业务覆盖制药和医疗科技，防御属性较强。',
      focus: '药品管线、诉讼风险、分红、稳定现金流。',
      theme: '医药 / 防御'
    },
    'UNH': {
      zh: '联合健康',
      en: 'UnitedHealth Group',
      type: '医疗保险/健康服务',
      industry: '医药',
      desc: '美国大型医疗保险和健康服务公司。',
      focus: '医保政策、成本率、监管风险、盈利稳定性。',
      theme: '医药 / 防御'
    },
    'MRK': {
      zh: '默沙东',
      en: 'Merck',
      type: '医药/制药',
      industry: '医药',
      desc: '美国大型制药公司，肿瘤药和疫苗业务是重要观察点。',
      focus: '核心药品专利、研发管线、销售增长、估值。',
      theme: '医药 / 制药'
    },
    'VFV.TO': {
      zh: 'Vanguard 标普500 ETF',
      en: 'Vanguard S&P 500 Index ETF',
      type: 'ETF/美股大盘',
      industry: 'ETF',
      desc: '加拿大上市的标普500 ETF，用于观察美国大盘长期配置。',
      focus: '美股大盘估值、汇率、长期分散配置。',
      theme: 'ETF / 美股大盘'
    },
    'XQQ.TO': {
      zh: 'iShares 纳斯达克100 ETF',
      en: 'iShares NASDAQ 100 ETF',
      type: 'ETF/科技成长',
      industry: 'ETF',
      desc: '加拿大上市的纳斯达克100 ETF，科技成长股权重较高。',
      focus: '大型科技股估值、AI主题集中度、汇率。',
      theme: 'ETF / 科技成长'
    },
    'SMH': {
      zh: 'VanEck 半导体ETF',
      en: 'VanEck Semiconductor ETF',
      type: 'ETF/半导体',
      industry: 'ETF',
      desc: '半导体主题 ETF，用于观察 AI 芯片产业链整体表现。',
      focus: '半导体周期、AI芯片估值、行业集中度。',
      theme: 'ETF / 半导体'
    },
    'QQQ': {
      zh: '纳斯达克100 ETF',
      en: 'Invesco QQQ Trust',
      type: 'ETF/科技成长',
      industry: 'ETF',
      desc: '跟踪纳斯达克100指数的美国上市 ETF，科技股权重较高。',
      focus: '大型科技股估值、利率、AI主题集中度。',
      theme: 'ETF / 科技成长'
    },

    // Public / listed Space + AI infrastructure
    'SPCX': {
      zh: 'SpaceX',
      en: 'SpaceX',
      type: '航天/卫星互联网/AI基础设施',
      industry: '航天/AI/通信',
      desc: '航天、卫星互联网和发射服务公司，Starlink 是其重要增长业务。',
      focus: 'Starlink增长、发射业务、现金流、估值、AI数据通信基础设施。',
      theme: 'AI / 航天 / 卫星互联网'
    },
    'OPENAI': {
      zh: 'OpenAI',
      en: 'OpenAI',
      type: '未上市/AI模型公司',
      industry: '未上市观察',
      desc: 'AI大模型和应用公司，暂未公开上市。',
      focus: '模型能力、商业化、算力成本、合作伙伴。',
      theme: '未上市 / IPO观察'
    },
    'ANTHROPIC': {
      zh: 'Anthropic',
      en: 'Anthropic',
      type: '未上市/AI模型公司',
      industry: '未上市观察',
      desc: 'Claude 背后的 AI 大模型公司，暂未公开上市。',
      focus: '模型能力、企业客户、融资估值、算力合作。',
      theme: '未上市 / IPO观察'
    },
    'CURSOR': {
      zh: 'Cursor / Anysphere',
      en: 'Cursor / Anysphere',
      type: '未上市/AI编程工具',
      industry: '未上市观察',
      desc: 'AI 编程工具公司，暂未公开上市。',
      focus: '开发者采用率、订阅增长、AI编程竞争、未来融资或IPO。',
      theme: '未上市 / IPO观察'
    }
  };
}

function updateStockFundamentalsForStockAnalysis_(params) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName('11 Stock Analysis');

  if (!sheet) {
    throw new Error('11 Stock Analysis sheet not found.');
  }

  const apiKey = getAlphaVantageApiKey_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      updated: 0,
      skipped: 0,
      errors: [],
      message: 'No stock rows found.',
    };
  }

  const maxParam = params && params.max ? Number(params.max) : 5;
  const maxToUpdate = Math.max(1, Math.min(maxParam, 10));

  const values = sheet.getRange(2, 1, lastRow - 1, 36).getValues();
  const errors = [];
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < values.length; i++) {
    if (updated >= maxToUpdate) break;

    const row = values[i];
    const rowNum = i + 2;
    const ticker = String(row[0] || '').trim();

    if (!ticker) {
      skipped++;
      continue;
    }

    // 跳过未上市或无法从 Alpha Vantage 抓基本面的观察项
    if (isPrivateOrPlaceholderTicker_(ticker)) {
      sheet.getRange(rowNum, 20, 1, 17).setValues([[
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        new Date().toISOString(),
        '未上市或非标准公开股票，暂不抓取基本面数据。',
        '作为主题观察项保留，不能按普通上市公司财务指标直接比较。',
        'Manual / Watch only'
      ]]);
      updated++;
      continue;
    }

    // 如果已经有“基本面数据来源”，默认先跳过，避免浪费 API 次数
    const existingSource = String(row[35] || '').trim();
    const force = params && String(params.force || '').toLowerCase() === 'true';

    if (existingSource && !force) {
      skipped++;
      continue;
    }

    try {
      const avSymbol = normalizeTickerForAlphaVantage_(ticker);
      const overview = fetchAlphaVantageOverview_(avSymbol, apiKey);

      if (!overview || !overview.Symbol) {
        errors.push({
          row: rowNum,
          ticker,
          error: 'No overview data returned from Alpha Vantage.',
        });
        skipped++;
        continue;
      }

      const financialRow = buildFundamentalRow_(overview);
      sheet.getRange(rowNum, 20, 1, 17).setValues([financialRow]);

      updated++;

      // 避免触发 Alpha Vantage 频率限制。免费 API 通常不适合一次抓太多。
      Utilities.sleep(13000);

    } catch (err) {
      errors.push({
        row: rowNum,
        ticker,
        error: String(err && err.message ? err.message : err),
      });
      skipped++;
    }
  }

  // 设置百分比格式：X 股息率、Y 净利率、Z 营业利润率、AA ROE、AC 营收增长
  if (lastRow > 1) {
    sheet.getRange(2, 24, lastRow - 1, 1).setNumberFormat('0.00%'); // X
    sheet.getRange(2, 25, lastRow - 1, 1).setNumberFormat('0.00%'); // Y
    sheet.getRange(2, 26, lastRow - 1, 1).setNumberFormat('0.00%'); // Z
    sheet.getRange(2, 27, lastRow - 1, 1).setNumberFormat('0.00%'); // AA
    sheet.getRange(2, 29, lastRow - 1, 1).setNumberFormat('0.00%'); // AC

    // AH-AJ 长文本换行
    sheet.getRange(2, 34, lastRow - 1, 3).setWrap(true);
  }

  SpreadsheetApp.flush();

  return {
    updated,
    skipped,
    errors,
    message: 'Fundamentals update completed. Use max parameter to control API usage.',
  };
}


function getAlphaVantageApiKey_() {
  const props = PropertiesService.getScriptProperties();

  const possibleNames = [
    'ALPHA_VANTAGE_API_KEY',
    'ALPHAVANTAGE_API_KEY',
    'ALPHA_VANTAGE_KEY',
    'ALPHAVANTAGE_KEY'
  ];

  for (let i = 0; i < possibleNames.length; i++) {
    const value = props.getProperty(possibleNames[i]);
    if (value) return value;
  }

  throw new Error('Alpha Vantage API key not found in Script Properties.');
}


function normalizeTickerForAlphaVantage_(ticker) {
  const t = String(ticker || '').trim();

  // Alpha Vantage 对加拿大 ticker 支持不如美股稳定。
  // 这里先尝试去掉 .TO，让脚本不报错；如果无数据，会在结果里记录 skipped/error。
  if (t.endsWith('.TO')) {
    return t.replace('.TO', '');
  }

  // BRK.B 在不同数据源可能是 BRK.B 或 BRK-B，这里先保留原样。
  return t;
}


function isPrivateOrPlaceholderTicker_(ticker) {
  const t = String(ticker || '').toUpperCase().trim();

  return [
    'OPENAI',
    'ANTHROPIC',
    'CURSOR',
    'ANYSphere'.toUpperCase()
  ].includes(t);
}


function fetchAlphaVantageOverview_(symbol, apiKey) {
  const url =
    'https://www.alphavantage.co/query'
    + '?function=OVERVIEW'
    + '&symbol=' + encodeURIComponent(symbol)
    + '&apikey=' + encodeURIComponent(apiKey);

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  const text = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error('Alpha Vantage HTTP error ' + status + ': ' + text.slice(0, 200));
  }

  const data = JSON.parse(text);

  if (data.Note) {
    throw new Error('Alpha Vantage rate limit / note: ' + data.Note);
  }

  if (data.Information) {
    throw new Error('Alpha Vantage information: ' + data.Information);
  }

  if (data['Error Message']) {
    throw new Error('Alpha Vantage error: ' + data['Error Message']);
  }

  return data;
}


function buildFundamentalRow_(overview) {
  const marketCap = cleanNumberText_(overview.MarketCapitalization);
  const pe = cleanNumberText_(overview.PERatio);
  const forwardPe = cleanNumberText_(overview.ForwardPE);
  const ps = cleanNumberText_(overview.PriceToSalesRatioTTM);
  const dividendYield = cleanPercentDecimal_(overview.DividendYield);
  const profitMargin = cleanPercentDecimal_(overview.ProfitMargin);
  const operatingMargin = cleanPercentDecimal_(overview.OperatingMarginTTM);
  const roe = cleanPercentDecimal_(overview.ReturnOnEquityTTM);
  const revenueTtm = cleanNumberText_(overview.RevenueTTM);
  const revenueGrowth = cleanPercentDecimal_(overview.QuarterlyRevenueGrowthYOY);
  const eps = cleanNumberText_(overview.EPS);
  const weekHigh = cleanNumberText_(overview['52WeekHigh']);
  const weekLow = cleanNumberText_(overview['52WeekLow']);

  const summary = buildEarningsSummary_(overview);
  const aiComment = buildSimpleFinancialComment_(overview);

  return [
    marketCap,
    pe,
    forwardPe,
    ps,
    dividendYield,
    profitMargin,
    operatingMargin,
    roe,
    revenueTtm,
    revenueGrowth,
    eps,
    weekHigh,
    weekLow,
    new Date().toISOString(),
    summary,
    aiComment,
    'Alpha Vantage OVERVIEW'
  ];
}


function cleanNumberText_(value) {
  if (value === null || value === undefined) return 'N/A';

  const text = String(value).trim();

  if (!text || text === 'None' || text === 'null' || text === '-' || text === 'NaN') {
    return 'N/A';
  }

  return text;
}


function cleanPercentDecimal_(value) {
  if (value === null || value === undefined) return 'N/A';

  const text = String(value).trim();

  if (!text || text === 'None' || text === 'null' || text === '-' || text === 'NaN') {
    return 'N/A';
  }

  const num = Number(text);

  if (isNaN(num)) return text;

  // Alpha Vantage 的 DividendYield / ProfitMargin 通常已经是小数形式，比如 0.025。
  return num;
}


function buildEarningsSummary_(overview) {
  const name = overview.Name || overview.Symbol || '该公司';
  const sector = overview.Sector || '未知行业';
  const industry = overview.Industry || '未知细分行业';
  const marketCap = cleanNumberText_(overview.MarketCapitalization);
  const revenue = cleanNumberText_(overview.RevenueTTM);
  const profitMargin = cleanNumberText_(overview.ProfitMargin);
  const pe = cleanNumberText_(overview.PERatio);

  return name
    + ' 所属行业：' + sector
    + ' / ' + industry
    + '。市值：' + marketCap
    + '，过去12月营收：' + revenue
    + '，净利率：' + profitMargin
    + '，P/E：' + pe
    + '。';
}


function buildSimpleFinancialComment_(overview) {
  const pe = Number(overview.PERatio);
  const profitMargin = Number(overview.ProfitMargin);
  const revenueGrowth = Number(overview.QuarterlyRevenueGrowthYOY);
  const beta = Number(overview.Beta);

  const comments = [];

  if (!isNaN(pe)) {
    if (pe > 60) {
      comments.push('估值较高，需要确认增长是否能持续支撑。');
    } else if (pe > 30) {
      comments.push('估值偏成长型，适合结合增长率观察。');
    } else if (pe > 0) {
      comments.push('估值相对没有极端偏高，但仍需结合行业比较。');
    }
  }

  if (!isNaN(profitMargin)) {
    if (profitMargin > 0.25) {
      comments.push('净利率较强，盈利质量值得关注。');
    } else if (profitMargin > 0.1) {
      comments.push('净利率中等偏稳。');
    } else if (profitMargin >= 0) {
      comments.push('净利率偏低，需要观察成本和规模效应。');
    } else {
      comments.push('目前可能亏损或利润压力较大。');
    }
  }

  if (!isNaN(revenueGrowth)) {
    if (revenueGrowth > 0.2) {
      comments.push('营收增长较快，属于成长型观察。');
    } else if (revenueGrowth > 0.05) {
      comments.push('营收仍在增长，但速度不算特别激进。');
    } else if (revenueGrowth < 0) {
      comments.push('营收下滑，需要关注周期或竞争压力。');
    }
  }

  if (!isNaN(beta)) {
    if (beta > 1.5) {
      comments.push('Beta 较高，股价波动风险较大。');
    } else if (beta < 0.8) {
      comments.push('Beta 较低，波动相对温和。');
    }
  }

  if (comments.length === 0) {
    return '基本面数据有限，建议结合财报、新闻和行业趋势继续观察。';
  }

  return comments.join(' ');
}
