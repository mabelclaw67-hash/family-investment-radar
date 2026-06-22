/**
 * Radar Upgrade Add-on  —  作为“新文件”加入同一个 Apps Script 项目
 * 与主脚本配合：把 11 Stock Analysis 升级为带 产业链层/驱动/可投性/PEG/派息/52周位置/数据新鲜度/币种 的版本，
 * 补 10 只票，归档 04，新增 17 数据源说明。
 *
 * 依赖主脚本里已有的全局常量 SPREADSHEET_ID。
 *
 * 一次性执行：在编辑器里选 runRadarUpgradeOnce 运行一次。
 * 持久化（关键）：见文末两处“需手工加到主脚本”的小改动，确保重建时不被冲掉。
 */

// 70 只票 → [产业链层, 驱动因素, 可投性]
var RADAR_LAYER_MAP = {
 'NVDA':['GPU/算力','超大厂AI capex','可投'],'TSLA':['EV/自动驾驶','消费需求/AI故事','可投'],
 'GOOGL':['需求方/超大厂','自有现金流(广告+云)','可投'],'MSFT':['需求方/超大厂','自有现金流(云+软件)','可投'],
 'AMZN':['需求方/超大厂','自有现金流(电商+云)','可投'],'HSAI':['EV/自动驾驶','自动驾驶传感需求','可投'],
 'BABA':['中国科技/电商云','中国消费+云','可投'],'CVE.TO':['能源','油价','可投'],'SU.TO':['能源','油价','可投'],
 'XOM':['能源','油价','可投'],'CVX':['能源','油价','可投'],'REI':['能源(小盘高波动)','油价','可投'],
 'RY.TO':['银行/金融','利率/宏观','可投'],'TD.TO':['银行/金融','利率/宏观','可投'],
 'SHOP.TO':['加拿大科技/电商','电商需求','可投'],'ENB.TO':['能源管道/股息','油气流量+利率','可投'],
 'XIC.TO':['ETF','大盘β(加拿大)','可投'],'XIU.TO':['ETF','大盘β(加拿大蓝筹)','可投'],
 'AAPL':['消费AI','消费需求','可投'],'V':['支付','消费/交易量','可投'],'MA':['支付','消费/交易量','可投'],
 'LLY':['医药','医药需求','可投'],'JPM':['银行/金融','利率/宏观','可投'],
 'AMD':['GPU/算力','超大厂AI capex','可投'],'AVGO':['ASIC/网络芯片','超大厂AI capex','可投'],
 'TSM':['晶圆代工','超大厂AI capex','可投'],'META':['需求方/超大厂','自有现金流(广告)','可投'],
 'ORCL':['企业软件/Agent','企业AI支出','可投'],'CRM':['企业软件/Agent','企业AI支出','可投'],
 'PLTR':['企业软件/Agent','企业/政府AI支出','可投'],'ARM':['CPU/IP','超大厂capex+授权','可投'],
 'ASML':['半导体设备','晶圆厂扩产','可投'],'SMCI':['服务器整机','超大厂AI capex','复核(治理风波)'],
 'MU':['存储/HBM','超大厂AI capex','可投'],'ANET':['数据中心网络','超大厂AI capex','可投'],
 'VRT':['数据中心电力/散热','超大厂AI capex','可投'],'DELL':['服务器整机','超大厂AI capex','可投'],
 'CNQ.TO':['能源','油价','可投'],'TRP.TO':['能源管道/股息','油气流量+利率','可投'],
 'PPL.TO':['能源管道/股息','油气流量+利率','可投'],'CEG':['电力/核能','AI电力需求+电价','可投'],
 'NEE':['电力/公用事业','利率+电力需求','可投'],'CCJ.TO':['矿产/核能原料(铀)','核能需求+铀价','可投'],
 'TECK.B.TO':['矿产/原材料','铜价/原材料','可投'],'FCX':['矿产/铜','铜价','可投'],'NEM':['矿产/黄金','金价','可投'],
 'BNS.TO':['银行/金融','利率/宏观','可投'],'BMO.TO':['银行/金融','利率/宏观','可投'],'CM.TO':['银行/金融','利率/宏观','可投'],
 'JNJ':['医药/防御','医药需求','可投'],'UNH':['医药/防御','医疗支出','可投'],'MRK':['医药/制药','医药需求','可投'],
 'VFV.TO':['ETF','大盘β(美股500)','可投'],'XQQ.TO':['ETF','大盘β(科技成长)','可投'],
 'SMH':['ETF','半导体β','可投'],'QQQ':['ETF','大盘β(科技成长)','可投'],
 'SPCX':['未上市观察(航天/AI基建)','私募/融资轮次','不可投-未上市'],
 'OPENAI':['未上市观察','私募/融资轮次','不可投-未上市'],
 'ANTHROPIC':['未上市观察','私募/融资轮次','不可投-未上市'],
 'CURSOR':['未上市观察','私募/融资轮次','不可投-未上市'],
 // 新增10只
 'MRVL':['光互连','超大厂AI capex','可投'],'COHR':['光互连','超大厂AI capex','可投'],
 'EQIX':['数据中心REIT','数据中心租金(派息)','可投'],'DLR':['数据中心REIT','数据中心租金(派息)','可投'],
 'NOW':['企业软件/Agent','企业AI支出','可投'],'SNOW':['企业软件/Agent','企业数据/AI支出','可投'],
 'DDOG':['企业软件/Agent','企业云/AI支出','可投'],'AMAT':['半导体设备','晶圆厂扩产','可投'],
 'VST':['电力/核能','AI电力需求+电价','可投'],'GEV':['电力/核能','电力基建+电网投资','可投']
};

// 10 只新票的 infoMap 条目（也要粘进主脚本 getStockAnalysisInfoMap_，见文末说明②）
var RADAR_NEW_STOCKS = {
 'MRVL': { zh:'迈威尔', en:'Marvell', type:'光互连/定制芯片', industry:'科技/AI', desc:'AI服务器互连与定制芯片(ASIC)，数据传输瓶颈受益方。', focus:'800G/1.6T光互连放量、定制芯片订单。', theme:'AI / 光互连 / 定制芯片' },
 'COHR': { zh:'相干', en:'Coherent', type:'光模块/光器件', industry:'科技/AI', desc:'数据中心光模块与激光器件供应商，弹性大波动大。', focus:'光模块需求、800G渗透、毛利率。', theme:'AI / 光互连 / 光模块' },
 'EQIX': { zh:'Equinix', en:'Equinix', type:'数据中心REIT', industry:'REIT', desc:'全球数据中心REIT，收租派息，驱动逻辑不同于硬件。', focus:'机柜出租率、派息、互连收入。', theme:'AI / 数据中心 / REIT / 派息' },
 'DLR': { zh:'Digital Realty', en:'Digital Realty', type:'数据中心REIT', industry:'REIT', desc:'数据中心REIT，长期租约现金流，贴合保守现金流风格。', focus:'签约容量、派息、利率敏感度。', theme:'AI / 数据中心 / REIT / 派息' },
 'NOW': { zh:'ServiceNow', en:'ServiceNow', type:'企业软件/Agent', industry:'科技/AI', desc:'企业工作流软件，把AI做成生产力变现，与硬件周期错开。', focus:'订阅增长、AI模块渗透、净留存率。', theme:'AI / 企业软件 / Agent' },
 'SNOW': { zh:'Snowflake', en:'Snowflake', type:'数据云/Agent', industry:'科技/AI', desc:'数据云平台，AI/Agent依赖的数据底座。', focus:'消费量增长、净留存、AI工作负载。', theme:'AI / 数据 / Agent' },
 'DDOG': { zh:'Datadog', en:'Datadog', type:'可观测性/Agent', industry:'科技/AI', desc:'云监控可观测性，AI工作负载越多用量越大。', focus:'用量增长、AI客户占比、利润率。', theme:'AI / 可观测性 / Agent' },
 'AMAT': { zh:'应用材料', en:'Applied Materials', type:'半导体设备', industry:'科技/AI', desc:'沉积/刻蚀设备，跟晶圆厂整体扩产，有股息。', focus:'晶圆厂资本开支、订单、股息。', theme:'AI / 半导体设备' },
 'VST': { zh:'Vistra', en:'Vistra', type:'独立发电', industry:'电力', desc:'独立发电+核电，给数据中心供电的战略标的，随电价波动。', focus:'供电协议、电价、核电资产。', theme:'AI / 电力 / 独立发电' },
 'GEV': { zh:'GE Vernova', en:'GE Vernova', type:'发电设备/电网', industry:'电力', desc:'发电设备与电网龙头，AI扩张的电力基建瓶颈受益方。', focus:'订单积压、电网投资、估值。', theme:'AI / 电力 / 电网设备' }
};

// 一次性执行入口
function runRadarUpgradeOnce() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var added = addRadarNewStockRows_(ss);
  enrichStockAnalysis_(ss);
  archiveOldDecisionLogAndAddGuide_(ss);
  SpreadsheetApp.getActiveSpreadsheet().toast('Radar 升级完成：补票 ' + added + ' 只、字段已加、04已归档、17已建。', 'Radar', 8);
}

// 把 RADAR_NEW_STOCKS 里还没出现的票，按主表列结构补成新行（幂等）
function addRadarNewStockRows_(ss) {
  var sh = ss.getSheetByName('11 Stock Analysis');
  if (!sh) throw new Error('找不到 11 Stock Analysis');
  var lastRow = sh.getLastRow();
  var existing = {};
  if (lastRow > 1) {
    var col = sh.getRange(2,1,lastRow-1,1).getValues();
    col.forEach(function(r){ if (r[0]) existing[String(r[0]).trim()] = true; });
  }
  var added = 0;
  Object.keys(RADAR_NEW_STOCKS).forEach(function(tk){
    if (existing[tk]) return;
    var info = RADAR_NEW_STOCKS[tk];
    var rr = sh.getLastRow() + 1;
    sh.getRange(rr,1).setValue(tk);                 // A Ticker
    sh.getRange(rr,2).setValue(tk);                 // B 名称
    sh.getRange(rr,3).setFormula('=IFERROR(GOOGLEFINANCE("'+tk+'","price"),"N/A")');     // C 价格
    sh.getRange(rr,4).setFormula('=IFERROR(GOOGLEFINANCE("'+tk+'","changepct"),"N/A")'); // D 日变动
    sh.getRange(rr,7).setFormula('=IFERROR(ABS(D'+rr+')*8/100,"待更新")');                // G 波动参考
    sh.getRange(rr,8).setValue('6'); sh.getRange(rr,9).setValue('6'); sh.getRange(rr,10).setValue('6'); // 评分占位
    sh.getRange(rr,11).setValue(info.industry);     // K 行业
    sh.getRange(rr,12).setValue(new Date().toISOString()); // L 更新时间
    sh.getRange(rr,13).setValue('供参考，仅家庭内部使用');  // M 备注text
    sh.getRange(rr,14).setValue(info.zh);           // N 中文名称
    sh.getRange(rr,15).setValue(info.en);           // O 英文名称
    sh.getRange(rr,16).setValue(info.type);         // P 类型
    sh.getRange(rr,17).setValue(info.desc);         // Q 一句话说明
    sh.getRange(rr,18).setValue(info.focus);        // R 适合关注点
    sh.getRange(rr,19).setValue(info.theme);        // S 主题分类
    added++;
  });
  if (added) SpreadsheetApp.flush();
  return added;
}

// 加 8 个字段 + 公式（幂等、按当前每行的代码读取，重建后也能对齐）
function enrichStockAnalysis_(ss) {
  var sh = ss.getSheetByName('11 Stock Analysis');
  if (!sh) throw new Error('找不到 11 Stock Analysis');
  var lastCol = sh.getLastColumn();
  var hdr = sh.getRange(1,1,1,lastCol).getValues()[0];
  function colByName(sub, exact){
    for (var c=0;c<hdr.length;c++){ var v=hdr[c]; if(v===''||v===null) continue;
      if (exact?(String(v)===sub):(String(v).indexOf(sub)!==-1)) return c+1; } return 0;
  }
  function A1(c){ return c?sh.getRange(1,c).getA1Notation().replace(/[0-9]/g,''):''; }
  var C_TICK=colByName('Ticker')||1, C_PRICE=colByName('当前价格'),
      C_FPE=colByName('预期市盈率'), C_GROW=colByName('营收增长'),
      C_HI=colByName('52周高点'), C_LO=colByName('52周低点'),
      C_DIV=colByName('股息率'), C_FUPD=colByName('财务数据更新时间');

  var NEWCOLS=['产业链层 / Layer','驱动因素 / Demand Driver','可投性 / Investable','PEG',
               '是否派息 / Pays Dividend','52周位置% / 52W Position','数据新鲜度(天) / Data Age','币种 / Currency',
               'Official Website','Investor Relations','Financial Reports'];
  var rightMost=0; for (var i=0;i<hdr.length;i++) if(hdr[i]!==''&&hdr[i]!==null) rightMost=i+1;
  var pos={}, nextC=rightMost+1;
  NEWCOLS.forEach(function(name){
    var ex=colByName(name,true);
    if (ex){ pos[name]=ex; } else {
      pos[name]=nextC;
      sh.getRange(1,nextC).setValue(name).setFontColor('#FFFFFF').setBackground('#1155CC')
        .setFontWeight('bold').setHorizontalAlignment('center').setWrap(true);
      nextC++;
    }
  });
  var P_LAY=pos[NEWCOLS[0]],P_DRV=pos[NEWCOLS[1]],P_INV=pos[NEWCOLS[2]],P_PEG=pos[NEWCOLS[3]],
      P_DIVY=pos[NEWCOLS[4]],P_52=pos[NEWCOLS[5]],P_AGE=pos[NEWCOLS[6]],P_CCY=pos[NEWCOLS[7]];
  var P_WEB=pos[NEWCOLS[8]],P_IR=pos[NEWCOLS[9]],P_FIN=pos[NEWCOLS[10]];

  var lastRow=sh.getLastRow(); if (lastRow<2) return;
  var numRows=lastRow-1;
  var tks=sh.getRange(2,C_TICK,numRows,1).getValues();
  var fpe=A1(C_FPE),grow=A1(C_GROW),price=A1(C_PRICE),hi=A1(C_HI),lo=A1(C_LO),div=A1(C_DIV),fupd=A1(C_FUPD),tk=A1(C_TICK);
  var links=(typeof getOfficialStockLinks_==='function')?getOfficialStockLinks_():{};
  var existingLay=sh.getRange(2,P_LAY,numRows,1).getValues();
  var existingDrv=sh.getRange(2,P_DRV,numRows,1).getValues();
  var existingInv=sh.getRange(2,P_INV,numRows,1).getValues();
  var existingPeg=sh.getRange(2,P_PEG,numRows,1).getValues();
  var existingDivy=sh.getRange(2,P_DIVY,numRows,1).getValues();
  var existing52=sh.getRange(2,P_52,numRows,1).getValues();
  var existingAge=sh.getRange(2,P_AGE,numRows,1).getValues();
  var existingCcy=sh.getRange(2,P_CCY,numRows,1).getValues();
  var existingWeb=sh.getRange(2,P_WEB,numRows,1).getValues();
  var existingIr=sh.getRange(2,P_IR,numRows,1).getValues();
  var existingFin=sh.getRange(2,P_FIN,numRows,1).getValues();
  var lay=[],drv=[],inv=[],peg=[],dvy=[],p52=[],age=[],ccy=[],web=[],ir=[],fin=[];
  for (var r=0;r<numRows;r++){
    var R=r+2; var t=String(tks[r][0]||'').trim(); var m=RADAR_LAYER_MAP[t];
    var link=links[t]||{};
    var divRaw = div ? sh.getRange(R,C_DIV).getValue() : '';
    var divNum = Number(String(divRaw).replace('%','').trim());
    if (String(divRaw).indexOf('%') !== -1) divNum = divNum / 100;
    lay.push([existingLay[r][0] || (m?m[0]:'')]);
    drv.push([existingDrv[r][0] || (m?m[1]:'')]);
    inv.push([existingInv[r][0] || (m?m[2]:'')]);
    peg.push([existingPeg[r][0] || (fpe&&grow?'=IFERROR(IF(OR('+fpe+R+'="",'+fpe+R+'="N/A",'+grow+R+'="",'+grow+R+'="N/A",'+grow+R+'<=0),"",'+fpe+R+'/('+grow+R+'*100)),"")':'')]);
    dvy.push([isFinite(divNum) && divNum > 0 ? 'Yes' : 'No']);
    p52.push([existing52[r][0] || ((price&&hi&&lo)?'=IFERROR(IF(OR('+price+R+'="",'+hi+R+'="",'+lo+R+'="",'+hi+R+'='+lo+R+'),"",('+price+R+'-'+lo+R+')/('+hi+R+'-'+lo+R+')),"")':'')]);
    var ageRaw = fupd ? sh.getRange(R,C_FUPD).getValue() : '';
    var existingAgeValue = String(existingAge[r][0] || '').trim();
    age.push([existingAgeValue && existingAgeValue.charAt(0) !== '#' ? existingAge[r][0] : radarAgeDays_(ageRaw)]);
    ccy.push([String(t).toUpperCase().endsWith('.TO') ? 'CAD' : 'USD']);
    web.push([existingWeb[r][0] || link.officialWebsite || '']);
    ir.push([existingIr[r][0] || link.investorRelations || '']);
    fin.push([existingFin[r][0] || link.financialReports || '']);
  }
  sh.getRange(2,P_LAY,numRows,1).setValues(lay);
  sh.getRange(2,P_DRV,numRows,1).setValues(drv);
  sh.getRange(2,P_INV,numRows,1).setValues(inv);
  if (fpe&&grow) sh.getRange(2,P_PEG,numRows,1).setFormulas(peg);
  if (div)       sh.getRange(2,P_DIVY,numRows,1).setValues(dvy);
  if (price&&hi&&lo) sh.getRange(2,P_52,numRows,1).setFormulas(p52);
  if (fupd)      sh.getRange(2,P_AGE,numRows,1).setValues(age);
  sh.getRange(2,P_CCY,numRows,1).setValues(ccy);
  sh.getRange(2,P_WEB,numRows,1).setValues(web);
  sh.getRange(2,P_IR,numRows,1).setValues(ir);
  sh.getRange(2,P_FIN,numRows,1).setValues(fin);
  sh.getRange(2,P_PEG,numRows,1).setNumberFormat('0.00');
  sh.getRange(2,P_52,numRows,1).setNumberFormat('0.0%');
  sh.getRange(2,P_AGE,numRows,1).setNumberFormat('0');
  SpreadsheetApp.flush();
}

function radarAgeDays_(value) {
  if (value === null || value === undefined || value === '') return '';
  var date = value instanceof Date ? value : new Date(String(value).slice(0, 10));
  if (isNaN(date.getTime())) return '';
  var today = new Date();
  var start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var then = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.floor((start.getTime() - then.getTime()) / 86400000));
}

function archiveOldDecisionLogAndAddGuide_(ss) {
  var s04=ss.getSheetByName('04 Decision Log');
  if (s04){ s04.setName('04 Decision Log (归档)');
    s04.getRange(2,1).setValue('【已归档】旧版决策日志，已停用，请使用 09 Decision Log。')
       .setFontColor('#CC0000').setFontWeight('bold'); }
  if (!ss.getSheetByName('17 数据源接入说明')) {
    var g=ss.insertSheet('17 数据源接入说明');
    var rows=[
     ['字段 / Field','说明 / What','建议数据源 / Source','备注 / Notes'],
     ['问题根因','60只票基本面只填了8只','—','Alpha Vantage 免费层每天仅25次调用，updateStockFundamentals 每次最多5只且每只 sleep 13秒，撞额度后中断'],
     ['基本面','市值/PE/营收增长/利润率/ROE/EPS/52周/股息','A: Alpha Vantage 付费(去每日上限,接口不改); B: Finnhub 免费层(60次/分钟,需改 fetchAlphaVantageOverview_)','美股任一即可'],
     ['加拿大 .TO 票','CVE/SU/RY/TD等','Finnhub 或 yfinance','Alpha Vantage 去掉 .TO 后命中率低'],
     ['Forward P/E / Beta','col5/col6 现全空','所选源的 quote/overview','overview 已返回 ForwardPE，可回填 col5'],
     ['综合/价值/风险评分','现占位6.0','本地公式','基本面补齐后用 PE/PEG/股息/Beta 重算'],
     ['未上市4只','无行情源','06 News + 12 Research Pack','已标 不可投-未上市'],
     ['宏观/利率','CPI/利率/GDP','Alpha Vantage 经济指标 或 加拿大央行','周/月更新'],
     ['更新频率','—','价格:GOOGLEFINANCE实时 / 基本面:每周 / 宏观:每月','分层刷新省调用']
    ];
    g.getRange(1,1,rows.length,4).setValues(rows);
    g.getRange(1,1,1,4).setFontColor('#FFFFFF').setBackground('#1155CC').setFontWeight('bold').setWrap(true);
    g.setColumnWidth(1,200); g.setColumnWidth(2,220); g.setColumnWidth(3,320); g.setColumnWidth(4,360);
  }
  SpreadsheetApp.flush();
}
