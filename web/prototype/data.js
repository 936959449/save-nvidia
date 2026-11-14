/* ============================================================
   拯救英伟达 · 原型 v0.1 — 内容数据
   角色元数据来自 assets/manifest.js；这里只放决策卡、结局与底牌。
   ============================================================ */
(function () {
  'use strict';

  var ENDINGS = {
    'capital-low': { title: '被自己的股价解雇', line: '董事会只开了十一分钟。他们甚至没让你坐下。' },
    'capital-high': { title: '泡沫破裂', line: '你把未来提前卖了。未来提前来了。' },
    'engineering-low': { title: '最后一个工程师关灯', line: '他关灯前看了一眼你的办公室，然后带走了整个团队。' },
    'engineering-high': { title: '最好的芯片，卖不出去', line: '你们做出了人类最好的芯片，客户要的是能按时到货的芯片。' },
    'customers-low': { title: '他们有了备胎', line: '他们不是不爱你了，他们只是有了备胎。' },
    'customers-high': { title: '单点故障', line: '他们离不开你，所以他们决定拆了你。' },
    'politics-low': { title: '两个首都都不接电话', line: '华盛顿和北京同时把你的号码移出了白名单。' },
    'politics-high': { title: '国家冠军', line: '你不再是一家公司。你是一个部门。' },
    'he-returns': { title: '他回来了', line: '董事会宣布他回归任执行董事长。你保留了头衔，和一间更小的办公室。' }
  };

  var PASSIVES = {
    cash: { name: '现金储备', icon: 'cash', saves: 'capital', line: '资本归零时回 40' },
    cuda: { name: 'CUDA 生态', icon: 'chip', saves: 'engineering', line: '工程归零时回 40' },
    contract: { name: '长期合约', icon: 'doc', saves: 'customers', line: '客户归零时回 40' },
    gov: { name: '政府订单', icon: 'shield', saves: 'politics', line: '政界归零时回 40' }
  };

  /* 选择格式：
     { label, fx:{capital:-4,...}, react:'pressured'|'pleased', passive:'cash', flag:'x', ending:'he-returns' }
     at = 第几张卡固定出现；没有 at 的进随机池。requires 支持 flagsAll / flagsNone。 */
  var CARDS = [
    { id: 'c01', at: 1, char: 'jones', quote: '董事会找到你，给了你九十天。九十天后，他们会再投一次票。',
      left: { label: '我需要时间', fx: { capital: -4, engineering: 4 } },
      right: { label: '我准备好了', fx: { capital: 4, engineering: -4 } } },

    { id: 'c02', at: 3, char: 'admin', quote: '黄先生的皮衣还在您办公室。要收进储藏室吗？',
      left: { label: '收起来', fx: { capital: 6, engineering: -8 } },
      right: { label: '挂回去', fx: { engineering: 8, capital: -6 }, flag: 'jacketHang' } },

    { id: 'c03', at: 5, char: 'kress', quote: '账上还有 990 亿回购额度。回购，还是全砸研发？',
      left: { label: '回购', fx: { capital: 12, engineering: -10 }, passive: 'cash' },
      right: { label: '研发', fx: { engineering: 12, capital: -10 }, passive: 'cuda' } },

    { id: 'c04', at: 7, char: 'regulator', quote: '98 亿罚款。认了，还是退出中国？',
      left: { label: '认罚', fx: { politics: 10, capital: -12 }, passive: 'gov' },
      right: { label: '退出', fx: { capital: 8, politics: -14 } } },

    { id: 'c05', at: 8, char: 'buyer', quote: '五折，加定制芯片。给不给？',
      left: { label: '给', fx: { customers: 14, capital: -10 }, passive: 'contract' },
      right: { label: '不给', fx: { capital: 8, customers: -12 } } },

    { id: 'c06', at: 9, char: 'supplier', quote: 'CoWoS 扩到 15 万片，也不够分。先保谁？',
      left: { label: '保大客户', fx: { customers: 10, politics: -6 } },
      right: { label: '保主权 AI', fx: { politics: 8, customers: -8 } } },

    { id: 'c07', at: 11, char: 'official', quote: '想拿许可证，就在芯片里留个位置给我们。',
      left: { label: '照办', fx: { politics: 12, customers: -10 }, passive: 'gov' },
      right: { label: '拒绝', fx: { customers: 8, politics: -12 } } },

    { id: 'c08', at: 12, char: 'huang', mood: 'letter', quote: '别学我。他们爱的是我会讲故事，不是我会做芯片。',
      left: { label: '收进抽屉', fx: { capital: 4, engineering: -4 } },
      right: { label: '念给高管听', fx: { engineering: 8, capital: -6 } } },

    { id: 'c09', at: 13, char: 'jones', quote: '九十天到了。董事会投票：转正，还是延长试用？',
      left: { label: '接受延长', fx: { capital: -6, engineering: 6 } },
      right: { label: '我要转正', fx: { capital: 8, engineering: -6 }, flag: 'promoted' } },

    { id: 'c10', at: 15, char: 'regulator', quote: 'H200 批了 75 万块，海关不放行。等，还是转口？',
      left: { label: '等', fx: { capital: -8, politics: 6 } },
      right: { label: '转口', fx: { capital: 10, politics: -14 }, flag: 'transship' } },

    { id: 'c11', at: 17, char: 'buyer', quote: '千亿的协议缩到三百亿。还投不投？',
      left: { label: '再投', fx: { customers: 12, capital: -10 } },
      right: { label: '不投', fx: { capital: 6, customers: -10 } } },

    { id: 'c12', at: 19, char: 'official', quote: '对华收入 15% 上缴。这是继续卖的条件。',
      left: { label: '交', fx: { politics: 8, capital: -10 } },
      right: { label: '不交', fx: { capital: 6, politics: -10 } } },

    { id: 'c13', at: 21, char: 'supplier', quote: 'HBM4 良率不行。长约锁产能，价格翻五倍。',
      left: { label: '锁长约', fx: { engineering: 8, capital: -10 } },
      right: { label: '换供应商', fx: { capital: 6, engineering: -8 } } },

    { id: 'c14', at: 23, char: 'admin', quote: 'T5T 的全员邮件，还写吗？',
      left: { label: '继续写', fx: { engineering: 8, capital: -6 } },
      right: { label: '取消', fx: { capital: 6, engineering: -8 } } },

    { id: 'c15', at: 25, char: 'buyer', quote: '我们自研的芯片够用了。合同，明年再说。',
      left: { label: '降价挽留', fx: { customers: 8, capital: -12 } },
      right: { label: '放他走', fx: { capital: 6, customers: -14 } } },

    { id: 'c16', at: 27, char: 'huang', mood: 'stage', quote: 'GTC 那天，需要我上台吗？',
      left: { label: '请他上台', ending: 'he-returns' },
      right: { label: '自己上', fx: { engineering: 10, capital: -6 } } },

    { id: 'c17', at: 29, char: 'jones', quote: '他手里还有 3.6% 的股票。他会卖吗？',
      left: { label: '请他承诺不减持', fx: { capital: 8, engineering: -6 } },
      right: { label: '让他自由处置', fx: { capital: -10, engineering: 6 } } },

    { id: 'c18', at: 31, char: 'kress', quote: '财报电话会明早九点。下调指引，还是硬扛？',
      left: { label: '下调', fx: { capital: -10, engineering: 6 } },
      right: { label: '硬扛', fx: { capital: 10, engineering: -10 } } },

    { id: 'c19', at: 33, char: 'regulator', quote: '国产替代抢单。让利，还是放弃这个市场？',
      left: { label: '让利挽留', fx: { customers: 8, capital: -10 } },
      right: { label: '放弃', fx: { capital: 6, customers: -12 } } },

    { id: 'c20', at: 35, char: 'official', quote: '国会下周传唤。你去不去作证？',
      left: { label: '去', fx: { politics: 8, capital: -6 } },
      right: { label: '不去', fx: { politics: -10, capital: 6 } } },

    /* ---------- 随机池 ---------- */
    { id: 'r01', char: 'kress', quote: '毛利率 75%，华尔街还嫌不够。要把研发费用挪出来做利润吗？',
      left: { label: '挪', fx: { capital: 10, engineering: -10 } },
      right: { label: '不挪', fx: { engineering: 8, capital: -6 } } },

    { id: 'r02', char: 'kress', quote: '股东集体诉讼：你隐瞒了中国关系。和解，还是打？',
      left: { label: '和解', fx: { capital: -10, politics: 6 } },
      right: { label: '打官司', fx: { capital: 8, politics: -10 } } },

    { id: 'r03', char: 'buyer', quote: '签五年独家，我们包你一半产能。',
      left: { label: '签', fx: { customers: 12, politics: -8 }, passive: 'contract', flag: 'exclusive' },
      right: { label: '不签', fx: { customers: -8, capital: 6 } } },

    { id: 'r04', char: 'buyer', quote: '我们想用你们的 GPU 做抵押，再买你们的 GPU。',
      left: { label: '支持', fx: { customers: 8, capital: -8 }, flag: 'circular' },
      right: { label: '拒绝', fx: { customers: -6, capital: 6 } } },

    { id: 'r05', char: 'supplier', quote: '美国产的 Blackwell 成本高三成。做不做？',
      left: { label: '做', fx: { politics: 8, capital: -8 } },
      right: { label: '不做', fx: { capital: 6, politics: -8 } } },

    { id: 'r06', char: 'supplier', quote: '俄亥俄的数据中心，电不够。先锁电，还是先接单？',
      left: { label: '先锁电', fx: { capital: -10, politics: 8 } },
      right: { label: '先接单', fx: { capital: 8, politics: -8 } } },

    { id: 'r07', char: 'admin', quote: '工程师要期权，不给就走。',
      left: { label: '给', fx: { engineering: 10, capital: -8 } },
      right: { label: '不给', fx: { capital: 8, engineering: -10 } } },

    { id: 'r08', char: 'admin', quote: '媒体说，你只是黄仁勋的替身。',
      left: { label: '我不是任何人的替身', fx: { engineering: 8, capital: -6 } },
      right: { label: '至少我穿得下那件皮衣', fx: { capital: 8, engineering: -6 } } },

    { id: 'r09', char: 'official', quote: '盟友要求共享芯片出口数据。答应吗？',
      left: { label: '答应', fx: { politics: 8, customers: -8 } },
      right: { label: '拒绝', fx: { customers: 6, politics: -8 } } },

    { id: 'r10', char: 'regulator', quote: '关键矿物出口要收紧。你怎么接？',
      left: { label: '提前囤货', fx: { capital: -8, engineering: 6 } },
      right: { label: '找替代', fx: { engineering: 8, capital: -6 } } },

    { id: 'r11', char: 'jones', quote: '总统打电话，说只有库克能接替你。',
      left: { label: '附和', fx: { politics: 6, capital: -6 } },
      right: { label: '那您该打给库克', fx: { capital: 6, politics: -8 } } },

    { id: 'r12', char: 'jones', quote: '董事会有人提议把公司拆成四块。',
      left: { label: '反对', fx: { capital: 8, engineering: -6 } },
      right: { label: '研究一下', fx: { capital: -6, customers: 6 } } },

    { id: 'r13', char: 'huang', mood: 'jacket', requires: { flagsAll: ['jacketHang'] },
      quote: '皮衣还挂在椅背上。要穿一次吗？',
      left: { label: '穿上', fx: { engineering: 10, capital: -6 } },
      right: { label: '不穿', fx: { capital: 6, engineering: -6 } } },

    { id: 'r14', char: 'buyer', quote: '帮我们做定制芯片？你们出设计，我们出订单。',
      left: { label: '合作', fx: { customers: 10, engineering: -8 } },
      right: { label: '拒绝', fx: { engineering: 6, customers: -8 } } },

    /* ---------- 危机卡：第 14 张后进入抽卡池 ---------- */
    { id: 'x01', crisis: true, char: 'kress', quote: '财报夜：下调指引，还是硬扛？',
      left: { label: '下调', fx: { capital: -12, engineering: 6 } },
      right: { label: '硬扛', fx: { capital: 12, engineering: -12 } } },

    { id: 'x02', crisis: true, char: 'official', quote: '新规今晚生效。最好的芯片，不能卖了。',
      left: { label: '遵守', fx: { politics: 10, capital: -14, customers: -6 } },
      right: { label: '绕道', fx: { capital: 10, politics: -16 } } },

    { id: 'x03', crisis: true, char: 'regulator', quote: '反垄断调查升级。配合，还是抗争？',
      left: { label: '配合', fx: { politics: 8, capital: -10 } },
      right: { label: '抗争', fx: { capital: 8, politics: -14 } } }
  ];

  window.PROTO_DATA = {
    cards: CARDS,
    endings: ENDINGS,
    passives: PASSIVES,
    initialMeters: { capital: 42, engineering: 55, customers: 50, politics: 45 },
    meterOrder: ['capital', 'engineering', 'customers', 'politics'],
    meterMeta: {
      capital: { name: '资本', color: 'var(--gold)', icon: 'i-cap' },
      engineering: { name: '工程', color: 'var(--green)', icon: 'i-eng' },
      customers: { name: '客户', color: 'var(--blue)', icon: 'i-cus' },
      politics: { name: '政界', color: 'var(--red)', icon: 'i-pol' }
    },
    dayPerCard: 7,
    cardsPerQuarter: 13
  };
})();
