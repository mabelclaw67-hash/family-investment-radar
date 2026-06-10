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
  settings: '99 Settings',
  marketRadar: '05 Market Radar',
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

      return jsonResponse_({
        ok: true,
        data: readTab_(tabName),
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

    if (action === 'decisionLog') {
      return jsonResponse_({
        ok: true,
        data: readTab_(DASHBOARD_TABS.decisionLog),
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

    throw new Error('Unsupported action: ' + action);
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  }
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
