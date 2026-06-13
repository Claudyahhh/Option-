import type { Phase6, FitnessLevel, Diet, ReportContent, PillarContent, ActionGroup, DailySnapshot } from './types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

function ironNote(diet: Diet): string {
  if (diet === 'vegetarian') return '非血红素铁（豆类/菠菜）需配维 C 同食提升吸收';
  if (diet === 'vegan')      return '纯素铁源：强化植物奶、豆腐、南瓜子 + 维 C';
  return '血红素铁优先：红肉 / 鸭血 / 鸡肝 ≥ 18mg';
}

function trainByFit(map: Record<FitnessLevel, string>, fitness: FitnessLevel): string {
  return map[fitness] ?? map.sometimes;
}

// ── Hormone state per phase ───────────────────────────────────────────────────
export function getHormonesCN(phase6: Phase6, progress: number) {
  switch (phase6) {
    case 'RESET early':
      return { e: '< 50 pg/mL（清零）', p: '< 1 ng/mL', t: '基线 ~0.3 ng/mL' };
    case 'RESET mid':
      return { e: '50–120 pg/mL↗（FSH 驱动）', p: '< 1 ng/mL', t: '基线 ~0.3 ng/mL' };
    case 'RISE':
      return {
        e: `~${lerp(100, 350, progress)} pg/mL↗`,
        p: '< 1 ng/mL',
        t: `~${(0.30 + progress * 0.15).toFixed(2)} ng/mL↗`,
      };
    case 'PEAK':
      return {
        e: `${lerp(300, 200, progress)} pg/mL 峰值`,
        p: '< 1 ng/mL',
        t: '~0.50 ng/mL 峰值',
      };
    case 'FOCUS early':
      return {
        e: `~${lerp(150, 100, progress)} pg/mL↘`,
        p: `${lerp(2, 18, progress)} ng/mL↗`,
        t: '~0.35 ng/mL',
      };
    case 'FOCUS late':
      return {
        e: `~${lerp(100, 50, progress)} pg/mL↘`,
        p: `${lerp(18, 2, progress)} ng/mL↘`,
        t: '基线 ~0.30 ng/mL',
      };
  }
}

// ── Edge (today's top ability) ────────────────────────────────────────────────
export function getEdgeCN(phase6: Phase6, progress: number): { name: string; pct: number } {
  const ranges: Record<Phase6, [number, number]> = {
    'RESET early': [55, 62], 'RESET mid':   [65, 72],
    'RISE':        [78, 88], 'PEAK':        [88, 95],
    'FOCUS early': [78, 82], 'FOCUS late':  [68, 75],
  };
  const names: Record<Phase6, string> = {
    'RESET early': '战略清醒度', 'RESET mid':   '系统重建力',
    'RISE':        progress < 0.5 ? '学习速度' : '语言流利度',
    'PEAK':        progress < 0.5 ? '说服力' : '自信峰值',
    'FOCUS early': '持续专注力',  'FOCUS late':  '精准度',
  };
  const [lo, hi] = ranges[phase6];
  const descends = phase6 === 'RESET early' || phase6 === 'FOCUS late';
  const pct = Math.round(descends ? hi - (hi - lo) * progress : lo + (hi - lo) * progress);
  return { name: names[phase6], pct };
}

// ── Status block ──────────────────────────────────────────────────────────────
export function getStatusCN(
  phase6: Phase6, progress: number, dayInPhase: number, totalDaysInPhase: number, sleepHours: number
): { statusLine: string; continuityNote: string } {
  const sleepWarn = sleepHours < 6 ? ' ⚠ 睡眠赤字已纳入调整。' : '';
  const assertions: Record<Phase6, string> = {
    'RESET early': '战略储备开启。雌激素归零，前额叶宏观视野重启。',
    'RESET mid':   '雌激素抬头。认知带宽逐步恢复，拐点信号。',
    'RISE':        `雌激素 ↗ ${Math.round(1 + progress * 7)}x。神经可塑性窗口${progress < 0.5 ? '开启' : progress < 0.85 ? '全速' : '关闭倒计时'}。`,
    'PEAK':        `三激素共振峰值。全月唯一势能窗口（${totalDaysInPhase - dayInPhase + 1} 天）。`,
    'FOCUS early': '孕酮上升。专注力深化，匠人模式激活。胰岛素敏感性下降 30–40%。',
    'FOCUS late':  '激素双降。血清素低谷。今日策略：减负与边界。',
  };
  const directives: Record<Phase6, string> = {
    'RESET early': `今日窗口：1 项 ≤90min 战略复盘。铁 ≥18mg + Omega-3 1500mg。${sleepWarn}`,
    'RESET mid':   `今日窗口：2–3 个设计型深度块。蛋白质 1.6–2.0g/kg。${sleepWarn}`,
    'RISE':        `今日窗口：${Math.round(3 + progress)} 个深度块。力量训练 RPE ${Math.round(7 + progress * 1.5)}。${sleepWarn}`,
    'PEAK':        `全月最高杠杆 ${dayInPhase === 2 ? '24' : '48'}h。演讲 / 谈判 / 销售优先。重大决策 +48h 冷静期。`,
    'FOCUS early': `碳水降至 ${(3.0 + (1 - progress) * 0.5).toFixed(1)}g/kg，镁 ${Math.round(350 + progress * 50)}mg。匠人型深度块优先。${sleepWarn}`,
    'FOCUS late':  `Omega-3 2000mg。所有不可逆决策延至 RISE。${sleepWarn}`,
  };
  return { statusLine: assertions[phase6], continuityNote: directives[phase6] };
}

// ── Pillar builders ───────────────────────────────────────────────────────────

function buildCognitive(phase6: Phase6, d: number, total: number, p: number): PillarContent {
  const phaseDayLabel = `第 ${d} 天 / 共 ${total} 天`;
  let directive = '';
  let headline = '';
  let bioDesc = '';
  let actions: ActionGroup[] = [];
  let avoid = '';
  let mechanism = '';
  let papers: string[] = [];

  switch (phase6) {
    case 'RESET early':
      directive = '1 项战略复盘 ≤90min，其余轻量任务';
      headline = d === 1 ? '战略清醒 D1。安排 1 项 ≤90min 宏观复盘。'
               : d === 2 ? '战略清醒 D2。季度 KPI 审视窗口——今天做。'
               : '战略清醒 D3。大局视野关闭倒计时，完成战略文档。';
      bioDesc = '前额叶背外侧皮层多巴胺能传递减弱约 25%，但海马右前部灰质相对增大，宏观模式识别与长时记忆调取达局部峰值。';
      actions = [{ title: '最优任务', items: ['季度 / 年度战略复盘（≤90min）', '长篇结构化写作骨架', '财务模型审视 / KPI 评估', '1v1 关键反馈对话（接收方）'] }];
      avoid = '高强度公开演讲、即兴谈判、多线程协调会议';
      mechanism = '雌激素低位时，COMT 酶活性相对升高，多巴胺降解加快，工作记忆下降，但抑制功能（response inhibition）维持，利于战略评估而非快速反应。右前海马灰质增大支持宏观模式识别（Pletzer et al., 2018）。';
      papers = ['Pletzer B et al. Neuropsychopharmacology 2018; 43:1530. PMID: 29464102', 'Sundström-Poromaa I, Gingnell M. Front Neurosci 2014. PMID: 25505380'];
      break;

    case 'RESET mid':
      directive = '安排 2–3 个设计型深度块';
      headline = d === 1 ? '重启信号。今日可安排 2–3 个设计型深度块。' : '拐点确认。新项目前期调研窗口最优。';
      bioDesc = '雌激素从 ~50 攀升至 80–120 pg/mL，FSH 主导卵泡招募。从"宏观扫描"过渡到"具体执行"的最佳衔接窗口。';
      actions = [{ title: '最优任务', items: ['项目 kickoff / OKR 重新校准', '长文档写作初稿', '1v1 关系修复对话', '编码架构设计阶段'] }];
      avoid = '公开演讲、商务谈判（语言流利度尚未达峰）';
      mechanism = '雌激素爬升期激活前额叶神经发生（Hampson, 2018），是宏观洞察转向具体执行的过渡窗口。';
      papers = ['Hampson E. Cogn Neurodynamics 2018. PMID: 30483371'];
      break;

    case 'RISE': {
      directive = p < 0.5 ? `安排 ${Math.round(3 + p)} 个深度块，新技能摄取优先` : `安排 ${Math.round(3 + p)} 个深度块，谈判/演讲窗口推进`;
      const estVal = lerp(100, 350, p);
      headline = p < 0.25 ? `雌激素 ~${estVal} pg/mL 起跑。${phaseDayLabel} · 摄取模式热启动。`
               : p < 0.5  ? `雌激素 ~${estVal} pg/mL。${phaseDayLabel} · 学习与谈判效率高速上升。`
               : p < 0.75 ? `雌激素 ~${estVal} pg/mL。${phaseDayLabel} · 语言流利度接近顶点。`
               : `雌激素 ~${estVal} pg/mL。${phaseDayLabel} · PEAK 前 ${total - d + 1} 天，完成最后布局。`;
      bioDesc = '雌激素直接调节多巴胺与 5-HT 受体表达。工作记忆（Digit span backwards）与注意切换（Trail Making Test B）显著优于月经期，海马 BDNF 表达增强（Vyas et al., 2025）。';
      actions = [{
        title: '最优任务',
        items: [
          `${Math.round(3 + p)} 个深度块，总时长 ${Math.round(4 + p * 2)}h`,
          '复杂新技能学习（编程 / 新工具）',
          p > 0.5 ? '重要谈判 / 商务推进会' : '创意 brainstorm 与提案输出',
          '高难度技术 review',
        ],
      }];
      avoid = p < 0.3 ? '演讲 / 大型谈判（待 RISE 中后期再排入）' : '';
      mechanism = '雌激素通过 ERα/ERβ 调控前额叶皮层突触可塑性，卵泡期记忆编码效率在整个周期最高。多巴胺受体敏感性提升驱动动力和学习速度。';
      papers = ['Vyas et al. Biology 2025. PMID: 40906423', 'Maki PM et al. Behav Neurosci 2002. PMID: 11898812'];
      break;
    }
    case 'PEAK':
      directive = '演讲/谈判/presentation，重大决策设 48h 冷静期';
      headline = d === 1 ? '权力窗口开启。高风险排程从现在开始。'
               : d === 2 ? '三激素共振峰值。本周期杠杆最高的 24 小时。'
               : '最后一个 PEAK 天。剩余高风险对话今天完成。';
      bioDesc = '雌激素峰值 200–400 pg/mL，LH surge（48h 内排卵），睾酮高于基线约 30%。语言流利度、自信、爆发力同时达峰。';
      actions = [{
        title: `${d === 2 ? '全月最优' : '优先'}任务`,
        items: ['公开演讲 / 路演 / 重要 presentation', '重大商务谈判（薪酬复议 / 融资）', '1vN 销售会议 / 媒体采访', '关键人际出击（目标客户 / 求职面试）'],
      }];
      avoid = '重大不可逆决策（签合同/投资）——风险厌恶最低点，设置 48h 冷静期';
      mechanism = '雌二醇与睾酮同步峰值提升 verbal fluency（Maki et al., 2002）、情绪识别准确率（Pearson & Lewis, 2005），声音基频微升使语音感知更具吸引力（Bryant & Haselton, 2009）。';
      papers = ['Maki PM et al. Behav Neurosci 2002. PMID: 11898812', 'Pearson R, Lewis MB. Psychoneuroendocrinology 2005. PMID: 15878437'];
      break;

    case 'FOCUS early':
      directive = `${d <= 3 ? '4–5' : '3–4'} 个 60–75min 收敛深度块，精修优先`;
      headline = ['匠人模式 D1。切换收敛型认知，安排代码精修 / 数据清洗。', '匠人模式 D2。错误检测力上升，今日处理需要精度的任务。', '匠人模式 D3。持续专注窗口稳定，安排 60–75min 深度块。', '匠人模式 D4。分析深度达本期高点，处理复杂数据或合同。', '匠人模式 D5。专注力依然强劲，推进长期项目精修。', '匠人模式 D6。FOCUS early 收尾，完成精修任务最后交付。'][Math.min(d - 1, 5)];
      bioDesc = `孕酮 ~${lerp(2, 18, p)} ng/mL（黄体早期），allopregnanolone 升高激活 GABA 受体，认知风格从发散（divergent）转向收敛（convergent），细节精度提升。`;
      actions = [{ title: '最优任务', items: ['代码精修 / 重构 / 单元测试', '论文精修 / 文献综述 / 财务对账', '流程优化 / SOP 撰写', `${d <= 3 ? '4–5' : '3–4'} 个 60–75min 深度块`] }];
      avoid = '头脑风暴 / 多团队协调会议 / 长时间公开演讲';
      mechanism = '孕酮通过 GABA-A 受体降低神经系统兴奋性，将认知资源从社交广播模式导向内部精加工（Pletzer et al., 2017）。';
      papers = ['Pletzer B et al. Horm Behav 2017. PMID: 28476349'];
      break;

    case 'FOCUS late':
      directive = '收尾模式，不启动新项目/长期承诺';
      headline = p < 0.4 ? `激素双降第 ${d} 天。收尾模式：项目关账、清单清理。`
               : p < 0.75 ? `血清素低谷期 ${phaseDayLabel}。减负与边界——保护认知资源。`
               : `RESET 前 ${total - d + 1} 天。记录洞察，不作重大决策。`;
      bioDesc = '雌激素与孕酮均下降，allopregnanolone 撤退，5-HT 合成下降，前额叶 top-down 调节减弱，杏仁核反应性升高（Toffoletto et al., 2014）。';
      actions = [{ title: '最优任务', items: ['项目收尾 / 季度复盘', '邮件批量处理 / 待办清单清理', '反思性写作 / OKR 复盘', `${Math.round(2 + (1 - p))} 个 60min 深度块`] }];
      avoid = '启动新项目、做长期承诺类决策（容易低估自己）、高刺激社交场合';
      mechanism = '5-HT 合成下降 + GABA 系统撤退，前额叶对杏仁核的抑制减弱（Toffoletto et al., 2014）。此阶段的强烈感知是"更诚实的信号"，不是失调。';
      papers = ['Toffoletto S et al. Front Neurosci 2014. PMID: 25505380', 'Schiller CE et al. CNS Spectr 2014. PMID: 25008269'];
      break;
  }

  return { directive, headline, bioDesc, actions, avoid, mechanism, papers, body: bioDesc, why: mechanism };
}

function buildMetabolic(phase6: Phase6, d: number, total: number, p: number, fitness: FitnessLevel, diet: Diet): PillarContent {
  const fe = ironNote(diet);
  let directive = '';
  let headline = '', bioDesc = '', avoid = '', mechanism = '';
  let actions: ActionGroup[] = [];
  let papers: string[] = [];

  const trainMap: Record<Phase6, Record<FitnessLevel, string>> = {
    'RESET early': { never: '散步 20–30min RPE ≤ 4', sometimes: '轻瑜伽或散步', regularly: '瑜伽 / 散步 / 游泳，RPE ≤ 5', athlete: '主动恢复：游泳或轻瑜伽' },
    'RESET mid':   { never: '快走或轻松骑车', sometimes: '抗阻 3×8–10 RPE 6–7', regularly: '下肢复合 3×8–10 RPE 6–7，45–60min', athlete: '抗阻回归 4×8 RPE 7，可加 4×3min zone 4' },
    'RISE':        { never: `中等有氧 ${lerp(25, 45, p)}min`, sometimes: `有氧 + 基础力量，RPE ${lerp(6, 8, p)}`, regularly: `复合力量 4×6–8 RPE ${lerp(7, 9, p)}（1RM ${lerp(72, 85, p)}%）`, athlete: `大重量 4×6 RPE ${lerp(7, 9, p)}，HIIT 6×30sec / 90sec` },
    'PEAK':        { never: '中等有氧，今天体能最好', sometimes: '高强度训练，挑战 RPE 8–9', regularly: '力量 PR 日，1–3RM 测试', athlete: '比赛级别输出；注意跳跃落地主动控制减速（ACL 风险）' },
    'FOCUS early': { never: `轻瑜伽 + 散步 ${lerp(25, 35, p)}min`, sometimes: `有氧 zone 2，${lerp(30, 40, p)}min`, regularly: `3–4×8–10 RPE 7–8，zone 2 主导，≤ ${lerp(55, 65, p)}min`, athlete: '中等强度耐力 + 稳态力量；HIIT 减至每周 1 次' },
    'FOCUS late':  { never: '散步 15–30min，今天够了', sometimes: 'Zone 2 ≤ 40min', regularly: '2–3×10–15 RPE 6–7（轻重量高次数），或瑜伽', athlete: 'Zone 2 ≤ 45min；避免力竭组 / 1RM 测试' },
  };
  const train = trainByFit(trainMap[phase6], fitness);

  switch (phase6) {
    case 'RESET early':
      directive = `${train}，铁 ≥18mg，赤字 ≤300kcal`;
      headline = `代谢重启。胰岛素敏感性全月峰值。D${d} → ${train}`;
      bioDesc = `体温 36.1–36.3°C（全月最低，孕酮清零）。雌激素 < 50 pg/mL，前列腺素 F2α 释放引发不适。胰岛素敏感性全月最高——碳水代谢效率最佳，此时复合碳水最不易转化为脂肪。`;
      actions = [
        { title: '训练', items: [train, d <= 1 ? '避免 HIIT / 最大力量' : 'D2–3：zone 2 有氧 30–40min，脂肪供能比高于高强度'] },
        { title: '减脂策略', items: [
          '赤字上限 300 kcal（过度限制加剧前列腺素不适，适得其反）',
          '碳水集中在训练前后——胰岛素敏感性峰值，碳水进入肌糖原效率全月最高',
          '轻有氧 > 高强度：低强度状态下脂肪供能占比更高，今日燃脂更有效',
        ]},
        { title: '营养', items: [`铁 ≥ 18mg：${fe}`, 'Omega-3 1500mg EPA+DHA（降低不适 ~30%）', 'D1–2 咖啡因 < 200mg'] },
      ];
      avoid = 'D1–2：HIIT、最大力量；赤字 > 300 kcal；咖啡因 > 200mg';
      mechanism = '前列腺素 F2α 是经期不适核心机制，Omega-3 竞争性抑制其合成（Rahbar et al., 2012）。体温处全月低点（36.1–36.3°C）是孕酮清零的直接体现。胰岛素敏感性峰值期碳水代谢效率最高。';
      papers = ['Rahbar N et al. Hum Reprod 2012. PMID: 22322266'];
      break;

    case 'RESET mid':
      directive = `${train}，赤字 300–400kcal，蛋白 1.6–2.0g/kg`;
      headline = `重建基础。${train}。赤字可恢复至 300–400 kcal。`;
      bioDesc = `体温 36.2–36.4°C（低温区，雌激素开始启动）。雌激素 50–120 pg/mL，胰岛素敏感性仍处高位，出血量减少。抗阻训练全面回归，蛋白合成开始活化。`;
      actions = [
        { title: '训练', items: [train, '心率区间 60–75% MHR，总时长 45–60min'] },
        { title: '减脂策略', items: [
          '赤字 300–400 kcal 可安全维持',
          '碳水集中在训练前 1.5h（30–50g 中升糖）——低温期胰岛素敏感性仍高',
          '蛋白 1.6–2.0 g/kg/日——修复肌肉 + 维持静息代谢率',
        ]},
        { title: '营养', items: [`持续补铁至 D7：${fe}`, '镁 300mg/日（南瓜子 28g=168mg）'] },
      ];
      avoid = '赤字 > 400 kcal（出血期后过度限制影响恢复）';
      mechanism = '雌激素回升激活肌肉蛋白合成，训练前碳水在高胰岛素敏感性期效率最高。体温从低点（36.2°C）缓慢上升是雌激素启动的外显信号。';
      papers = ['Sung E et al. Springerplus 2014. PMID: 25674428'];
      break;

    case 'RISE': {
      directive = `${train}，赤字 ${lerp(300, 500, p)}kcal，脂肪氧化全月最高`;
      const bbt = (36.2 + p * 0.3).toFixed(1);
      headline = `减脂 × 增肌双峰。脂肪氧化全月最强。第 ${d}/${total} 天 · ${train}`;
      bioDesc = `体温 ${bbt}°C（卵泡期低温稳定区，接近排卵时将短暂下探后急升）。雌激素 ~${lerp(100, 350, p)} pg/mL，脂肪氧化酶活性随雌激素同步升高——全周期减脂效率最高阶段。卫星细胞活化 + 肌原纤维合成加强，塑形黄金窗口。`;
      actions = [
        { title: '训练', items: [train, `总时长 ${lerp(50, 75, p)}min`, '复合力量优先（提升长期静息代谢率）'] },
        { title: '减脂策略', items: [
          `赤字 ${lerp(300, 500, p)} kcal/日——雌激素保护肌肉同时促脂肪氧化，全月最佳赤字窗口`,
          '有氧后延长 15min zone 1：此期脂肪供能占比全月最高，低强度尾段额外燃脂',
          `可尝试 14:10 间歇性断食——卵泡期雌激素缓冲低血糖不适（${p < 0.5 ? '从 RISE mid 起较稳定' : '现在已是最适合的时机'}）`,
          '力量 > 有氧：增肌 1kg = 静息每日多燃烧 ~50 kcal，复利效应显著',
        ]},
        { title: '营养', items: [
          `蛋白 ${(1.8 + p * 0.4).toFixed(1)}–${(2.0 + p * 0.2).toFixed(1)} g/kg，训练后 30min 内 0.4g/kg`,
          `碳水 ${(3.5 - p * 0.5).toFixed(1)} g/kg/日（训练日）`,
        ]},
      ];
      avoid = '赤字 > 600 kcal（影响雌激素分泌 + 肌肉合成，破坏减脂基础）';
      mechanism = '雌激素上调 HSL、ATGL 脂肪分解酶活性，提升线粒体脂肪酸氧化效率（McNulty et al., 2020）。体温处低温稳定区（36.2–36.5°C）。适度赤字 + 力量训练在此期效果叠加：既减脂又建肌，提升长期静息代谢率。';
      papers = ['McNulty KL et al. Sports Med 2020. PMID: 32661839', 'Sung E et al. Springerplus 2014. PMID: 25674428'];
      break;
    }
    case 'PEAK':
      directive = 'PR 日，维持热量，训练后蛋白 0.4–0.5g/kg';
      headline = `爆发力峰值。今日目标：增肌 > 赤字。${train}`;
      bioDesc = `体温：排卵前短暂下探至 36.0–36.1°C，排卵后 24h 内急升 0.3–0.5°C 至 36.6–37.0°C——体温急升是排卵确认信号。雌激素 + 睾酮双峰（睾酮 +30%）。力量、爆发力最高。ACL 韧带松弛度 ↑15–25%，跳跃落地需主动控制减速。`;
      actions = [
        { title: '训练', items: [train, 'HIIT 可上调至 95% MHR', '跳跃落地主动减速（ACL 风险窗口）'] },
        { title: '减脂策略', items: [
          '今日维持热量——PR 日赤字直接损害爆发力，得不偿失',
          '今日增肌效果全月峰值：增加 1kg 肌肉 = 静息每天多燃烧 ~50 kcal，这是最优长期代谢投资',
          '训练后 30min 蛋白 0.4–0.5g/kg：把握合成窗口，优先于任何赤字考量',
          '体温急升后 24–48h 内是合成代谢最旺盛时段——此窗口的训练质量直接影响本月增肌成果',
        ]},
        { title: '营养', items: ['碳水训练日 5 g/kg', '补水上调 300–500ml', '限酒（峰值期酒精代谢效率降低）'] },
      ];
      avoid = '赤字 > 200 kcal（牺牲峰值增肌机会 = 牺牲长期代谢率基础）';
      mechanism = '体温排卵后急升 0.3–0.5°C 是孕酮启动、合成代谢窗口打开的信号。雌激素 + 睾酮双峰驱动最高肌纤维募集。PR 日削减热量不仅影响表现，还会减少可实现的肌肉增量——肌肉是基础代谢率的核心底层资产。';
      papers = ['Wojtys EM et al. Am J Sports Med 2002. PMID: 12435635', 'McNulty KL et al. Sports Med 2020. PMID: 32661839'];
      break;

    case 'FOCUS early': {
      directive = `低碳 ${(3.0 + (1 - p) * 0.5).toFixed(1)}g/kg，${train}`;
      const prog = lerp(2, 18, p);
      const bbt2 = (36.6 + p * 0.3).toFixed(1);
      headline = `低碳窗口。孕酮 ~${prog} ng/mL↑，体温 ${bbt2}°C，BMR ↑${lerp(100, 300, p)} kcal。${train}`;
      bioDesc = `体温 ${bbt2}°C（黄体期高温区，孕酮驱动体温升高 0.3–0.5°C）。孕酮 ~${prog} ng/mL 上升，BMR 较卵泡期高 ${lerp(100, 300, p)} kcal/日。胰岛素敏感性下降 30–40%——同等碳水更易储存为脂肪。切换低碳策略，脂肪供能比上升，减脂效率不降反升。`;
      actions = [
        { title: '训练', items: [train, `时长 ≤ ${lerp(55, 65, p)}min（体温 ${bbt2}°C 偏高，过长训练散热压力大）`, 'Zone 2 有氧脂肪供能比最高；HIIT 降至每周 1 次'] },
        { title: '减脂策略', items: [
          `BMR ↑${lerp(100, 300, p)} kcal = 天然热量缺口——高温期代谢自然加速，无需额外激进节食`,
          `低碳策略：碳水降至 3–3.5 g/kg，低 GI（< 55）优先；脂肪占比升至 30–35%`,
          '胰岛素敏感性低 → 碳水集中在训练前后 1h，其余时段以脂肪 + 蛋白为主',
          '对甜食的渴望是孕酮-血清素机制（非意志力问题）——备替代品：黑巧 70%+、香蕉+杏仁酱',
        ]},
        { title: '营养', items: [
          `镁 ${lerp(350, 400, p)}mg/日（孕酮加速消耗镁）`,
          `B6 ${lerp(50, 75, p)}mg/日`,
          '钙 800–1000mg/日',
          '蛋白 1.8–2.0 g/kg',
        ]},
      ];
      avoid = '精制糖 / 高 GI 碳水（胰岛素敏感性低期更易转化为脂肪储存）';
      mechanism = `孕酮将 BMR 提高 100–300 kcal/日，同时驱动体温升高至 ${bbt2}°C（Bisdee et al., 1989）。胰岛素敏感性下降 30–40% 使碳水代谢效率降低——低碳 + 高脂饮食顺应孕酮促进的脂肪供能状态，是周期内第二个重要减脂窗口。`;
      papers = ['Bisdee JT et al. Br J Nutr 1989. PMID: 2751765', 'Bertone-Johnson ER et al. Arch Intern Med 2005. PMID: 15956003'];
      break;
    }
    case 'FOCUS late': {
      directive = '体重秤不可信（±1–2kg 水分），控糖 ≤25g';
      const bbt3 = (36.9 - p * 0.4).toFixed(1);
      headline = `体温回落 ${bbt3}°C。水肿 ≠ 脂肪。体重秤不可信。${train}`;
      bioDesc = `体温 ${bbt3}°C（孕酮下降，高温区末期向低温区过渡）。雌激素与孕酮双降，皮质醇相对上升，水钠潴留导致体重显示 ±1–2 kg——全是水分，非脂肪。这是全月体重最具误导性的阶段。`;
      actions = [
        { title: '训练', items: [train, '总时长 30–45min，zone 2 优先', '避免力竭组 / 1RM'] },
        { title: '减脂策略', items: [
          `体温从 ${(parseFloat(bbt3) + 0.4).toFixed(1)}°C 回落至 ${bbt3}°C——体重秤此时最不可信，水钠潴留 ±1–2kg 是正常生理现象`,
          '改用腰围 / 照片 / 衣服松紧度作为进度指标，等月经来后体重自然回落',
          '控糖是今日最关键杠杆：游离糖 ≤ 25g/日（皮质醇 + 高糖 = 脂肪储存信号叠加）',
          '每日 2.5L+ 补水——充足水分抑制 ADH，反而减少水钠潴留',
          'Omega-3 2000mg + 姜黄素 500mg 降低炎症性脂肪储存倾向',
        ]},
        { title: '营养', items: ['Omega-3 2000mg EPA+DHA', '姜黄素 500mg', '钙 1000mg', '咖啡因 ≤ 200mg'] },
      ];
      avoid = '酒精（此期对睡眠破坏 ↑40%；皮质醇 + 酒精 = 加速脂肪储存）';
      mechanism = `体温从黄体期高峰（~37.0°C）回落至 ${bbt3}°C，是孕酮撤退的直接信号。Allopregnanolone 撤退 + 皮质醇相对升高，导致体重虚高和脂肪储存倾向上升。Omega-3 + 姜黄素通过抑制促炎路径降低此期炎症性脂肪储存（Thys-Jacobs, 1998）。`;
      papers = ['Thys-Jacobs S et al. Am J Obstet Gynecol 1998. PMID: 9609990', 'Schiller CE et al. CNS Spectr 2014. PMID: 25268245'];
      break;
    }
  }

  return { directive, headline, bioDesc, actions, avoid, mechanism, papers, body: bioDesc, why: mechanism };
}

function buildSkin(phase6: Phase6, d: number, total: number, p: number): PillarContent {
  let directive = '';
  let headline = '', bioDesc = '', avoid = '', mechanism = '';
  let actions: ActionGroup[] = [];
  let papers: string[] = [];

  switch (phase6) {
    case 'RESET early':
      directive = '停用所有活性成分，神经酰胺修复协议';
      headline = `屏障防御协议。TEWL 升至全月峰值，pH ${d <= 2 ? '5.8–6.0' : '5.7–5.9'}。`;
      bioDesc = '经皮失水率（TEWL）升至全周期峰值，角质层完整度下降，皮肤 pH 上升至 5.7–6.0。屏障最脆弱，修复优先。';
      actions = [
        { title: '早间流程', items: ['氨基酸洁面（pH 5.5–6.5），≤30 秒', '5% 泛醇精华（panthenol）', '神经酰胺 NP/AP/EOP 复方面霜', 'SPF50 PA++++ （避免 oxybenzone 化学防晒）'] },
        { title: '晚间流程', items: ['同款温和洁面', '透明质酸 + 5% 烟酰胺（控制浓度）', '神经酰胺 + 角鲨烷封闭层'] },
      ];
      avoid = '高浓度果酸 / BHA（>2%） / 视黄醇及衍生物 / 高浓度 VC（>10%） / 任何物理磨砂';
      mechanism = '经期雌激素和孕酮同时处于最低，皮肤细胞更新减慢，TEWL 升高，屏障功能最弱（Raghunath et al., 2015）。';
      papers = ['Raghunath RS et al. Int J Cosmet Sci 2015. PMID: 26131576'];
      break;

    case 'RESET mid':
      directive = '温和重启：烟酰胺 4% + VC 衍生物，继续禁刷酸';
      headline = '温和过渡。可重启低浓度主动成分（VC 衍生物 / 4% 烟酰胺）。';
      bioDesc = '雌激素开始上升，屏障修复中。可加入温和主动成分，但仍避免高浓度视黄醇和刷酸。';
      actions = [
        { title: '新增（温和）', items: ['4% 烟酰胺（控油 + 屏障修复）', '多肽精华（铜肽 GHK-Cu）', 'VC 衍生物 3–5%（VCE / VCG / SAP）'] },
        { title: '夜间可重启', items: ['0.5% 水杨酸（隔日，限定 T 区）'] },
      ];
      avoid = '高浓度视黄醇 / >2% BHA / 果酸刷酸';
      mechanism = '雌激素上升重新激活皮肤细胞更新，屏障修复中。过渡到进攻准备期的衔接窗口。';
      papers = ['Stevenson S, Thornton J. Clin Interv Aging 2007. PMID: 18044188'];
      break;

    case 'RISE':
      directive = p < 0.6 ? '视黄醇 + AHA/BHA + 高浓度 VC，进攻窗口全开' : `进攻窗口关闭倒计时，${total - d + 1}d 内完成所有进攻性护理`;
      headline = p < 0.3 ? '进攻窗口开启。视黄醇 + AHA/BHA 安全重启。'
               : p < 0.7 ? `进攻全速。VC ${Math.round(10 + p * 5)}% / 视黄醇 / 果酸——全上。`
               : `进攻窗口关闭倒计时（${total - d + 1} 天）。完成所有活性护理。`;
      bioDesc = '雌激素直接刺激成纤维细胞 I 型胶原合成（Stevenson & Thornton, 2007），TEWL 降至全周期最低，对主动成分耐受度峰值。';
      actions = [
        { title: '早间', items: [`${Math.round(10 + p * 5)}% L-抗坏血酸（pH 3.0–3.5）`, '抗氧化层（VE + 阿魏酸）', 'SPF50 PA++++'] },
        { title: '夜间（进攻核心）', items: ['一/三/五：视黄醇 0.3–0.5%', '二/四：乙醇酸 8–10% 或水杨酸 2%', '六/日：修复保湿（神经酰胺 + 玻尿酸）', p > 0.3 && p < 0.9 ? '月度大招可在 D8–D11 启动（微针 / 光电）' : ''].filter(Boolean) as string[] },
      ];
      avoid = '';
      mechanism = '雌激素通过 ERα/ERβ 受体激活成纤维细胞，直接促进 I 型胶原合成，同时降低皮脂腺分泌，使皮肤屏障处于全周期耐受活性成分最高的状态（Stevenson & Thornton, 2007）。';
      papers = ['Stevenson S, Thornton J. Clin Interv Aging 2007. PMID: 18044188'];
      break;

    case 'PEAK':
      directive = 'SPF50 PA++++ 最高优先，防 Tyrosinase 峰值色沉';
      headline = `发光窗口。极简护肤 + SPF50 强制项。雌激素峰值期色沉风险 ↑20–30%。`;
      bioDesc = '雌激素峰值带来最强的皮肤水合度和天然发光感。同时：Tyrosinase（黑色素合成酶）活性同步升高，紫外线诱导色沉风险上升 20–30%。';
      actions = [
        { title: '早间（极简）', items: ['15–20% L-抗坏血酸（容忍度峰值）', 'SPF50 PA++++ ← 今日最高优先级', '轻薄保湿即可'] },
        { title: '晚间', items: ['视黄醇 + 5% 烟酰胺', d === 3 ? '今晚开始过渡至温和护肤' : ''].filter(Boolean) },
      ];
      avoid = '防晒不够——此期是全月最需要 SPF50 的时段';
      mechanism = '雌激素峰值与 Tyrosinase 活性上升同步，紫外线暴露在此期更易触发黑色素沉积（Raghunath et al., 2015）。防晒的优先级高于所有其他护肤步骤。';
      papers = ['Raghunath RS et al. Int J Cosmet Sci 2015. PMID: 26131576'];
      break;

    case 'FOCUS early': {
      directive = '水杨酸 2% + 烟酰胺控油，视黄醇降级至 0.1–0.25%';
      const sebum = Math.round(40 + p * 20);
      headline = `控油防守开启。皮脂腺活性 ↑${sebum}%。水杨酸 + 烟酰胺协议激活。`;
      bioDesc = `孕酮上升 + androgen 相对增强，皮脂腺活性上升约 ${sebum}%（Smith & Thiboutot, 2008），毛囊角化异常风险上升。`;
      actions = [
        { title: '早间（控油核心）', items: ['SLES-free 洁面（避免皂基）', '2–5% 烟酰胺（控油主力）', '凝胶质地轻质保湿', 'SPF50 哑光质地'] },
        { title: '夜间（控油 + 抗菌）', items: ['一/三/五：水杨酸 2% T 区局部', '二/四/六：5% 杜鹃花酸（azelaic acid）全脸（抗炎 + 抗菌 + 美白）', '日：恢复保湿'] },
        { title: '降级', items: ['视黄醇降至 0.1–0.25%', 'VC 降至 8–10%'] },
      ];
      avoid = '高浓度果酸 / 过度清洁（会破坏已脆弱的屏障）';
      mechanism = '孕酮刺激皮脂腺 5α-还原酶活性，产生过量皮脂（Smith & Thiboutot, 2008）。杜鹃花酸同时抑制 C. acnes 细菌、抗炎并调节角化，是此阶段最全面的活性成分。';
      papers = ['Smith KR, Thiboutot DM. J Lipid Res 2008. PMID: 17975220'];
      break;
    }
    case 'FOCUS late':
      directive = '杜鹃花酸 + 神经酰胺抗炎防守，停用刷酸/视黄醇';
      headline = '抗炎 + 防御协议。雌激素撤退 + 皮脂仍高 = 双重风险窗口。';
      bioDesc = '雌激素撤退再度弱化皮肤屏障；皮脂仍在峰值附近，毛囊堵塞 + 炎症双重风险。FOCUS late 是整个周期皮肤最脆弱的窗口之一。';
      actions = [
        { title: '早间', items: ['温和洁面（pH 5.5）', '透明质酸 + 4% 烟酰胺', '神经酰胺面霜', 'SPF50 哑光防晒'] },
        { title: '夜间（抗炎模式）', items: ['5% 杜鹃花酸（首选：控油 + 抗炎 + 抗痘菌一体）', '红没药醇 / 积雪草苷 / 神经酰胺', '局部痘点：2.5% 过氧化苯甲酰（仅点涂）', '周日 1 次硫磺面膜（10%）'] },
      ];
      avoid = '视黄醇 / 高浓度 VC / 任何刷酸 / 颗粒磨砂（屏障弱化期刺激风险极高）';
      mechanism = '雌激素撤退期皮肤细胞更新减慢，同时皮脂腺活性维持高位，形成"表面脱水 + 底层出油"的双重困境。温和抗炎而非激进清洁是唯一正确策略。';
      papers = ['Smith KR, Thiboutot DM. J Lipid Res 2008. PMID: 17975220', 'Raghunath RS et al. Int J Cosmet Sci 2015. PMID: 26131576'];
      break;
  }

  return { directive, headline, bioDesc, actions, avoid, mechanism, papers, body: bioDesc, why: mechanism };
}

function buildMood(phase6: Phase6, d: number, total: number, p: number): PillarContent {
  let directive = '';
  let headline = '', bioDesc = '', avoid = '', mechanism = '';
  let actions: ActionGroup[] = [];
  let papers: string[] = [];

  switch (phase6) {
    case 'RESET early':
      directive = '社交输出降至 60–70%，不作重大情绪决策';
      headline = `社交输出降至 60–70%。Allopregnanolone 撤退期，保护神经化学资源。`;
      bioDesc = `Allopregnanolone（GABA-A 受体激动剂）从黄体晚期高位骤降，γ 氨基丁酸能传递减弱，焦虑 / 易激惹敏感性升高。D${d} 的不适感是化学事件，不是情绪失控。`;
      actions = [{ title: '执行指令', items: ['社交输出降至日常 60–70%（非必要饭局拒绝）', '睡前 50–60min 设"无屏幕缓冲带"', '推荐补剂：镁 300mg + B6 50mg（血清素合成支持）', '每日 20min 晨间户外光照（昼夜节律 + 5-HT）'] }];
      avoid = '重大情绪决策（分手 / 辞职 / 大额采购）—— 撤退性焦虑放大风险厌恶';
      mechanism = 'Allopregnanolone 是内源性神经类固醇，通过 GABA-A 受体产生镇静效果。黄体晚期骤降是 PMS / PMDD 的核心神经化学机制（Schiller et al., 2014）。镁 + B6 是支持 5-HT 合成的循证干预。';
      papers = ['Schiller CE et al. CNS Spectr 2014. PMID: 25008269', 'Fathizadeh N et al. Iran J Nurs Midwifery Res 2010. PMID: 22049278'];
      break;

    case 'RESET mid':
      directive = '重启 1–2 个低强度社交，减少回顾性自我批评';
      headline = '社交带宽回升。重启 1–2 个低强度连接 + 创意输入。';
      bioDesc = '雌激素开始上升，血清素和多巴胺水平逐步回升，社交开放度恢复中。从"战略独处"过渡到"轻量联接"的转折点。';
      actions = [{ title: '执行指令', items: ['重新开启 1–2 个低强度社交（咖啡 / 散步）', '启动"创意输入"：阅读 / 看展 / 听播客', '减少回顾性自我批评'] }];
      avoid = '大型群体社交 / 高压力汇报（带宽仍未全面恢复）';
      mechanism = '雌激素上升驱动血清素合成增加，多巴胺受体敏感性提升，社交开放度化学性恢复。这不是意志力，是激素驱动的转变。';
      papers = ['Sundström-Poromaa I, Gingnell M. Front Neurosci 2014. PMID: 25505380'];
      break;

    case 'RISE':
      directive = p < 0.45 ? '发出你一直犹豫的那封邮件/消息' : '主动约见面，直接提出你想要的';
      headline = p < 0.4 ? '乐观情绪回升。今日发出一封你一直犹豫的邮件。'
               : p < 0.75 ? '社交带宽全开。去要求、去提案、去发送——化学物质在你这边。'
               : '自信心接近峰值。安排高风险对话进入日程。';
      bioDesc = '雌激素提升血清素水平，降低杏仁核对负面社交信号的反应性。多巴胺受体密度上升，对拒绝的恐惧降至周期低点。';
      actions = [{ title: '执行指令', items: [p < 0.4 ? '发出你一直在犹豫的邮件 / 重新联系某个人' : '接受所有社交邀请，主动联系', p > 0.5 ? '约见面 / 提出你想要的事情' : '安排低风险社交热身', '风险承担容量提升，保留 24h 决策冷静期'] }];
      avoid = '';
      mechanism = '雌激素提升多巴胺合成酶 TH 表达，伏隔核奖励反馈增强，产生可测量的自信提升（Dreher et al., 2007）。同时雌激素降低杏仁核对拒绝信号的过度激活。';
      papers = ['Dreher JC et al. PNAS 2007. PMID: 17339591', 'Vyas et al. Biology 2025. PMID: 40906423'];
      break;

    case 'PEAK':
      directive = '推进困难对话，合同/投资类设 48h 冷静期';
      headline = d < 3 ? '自信 + 情绪带宽双峰值。难题对话的最优窗口。' : '最后一个 PEAK 天。完成剩余高风险对话，明天进入深度模式。';
      bioDesc = '雌激素和睾酮双峰驱动杏仁核抑制和前额叶皮层激活，产生最高的情绪调节能力和冲突从容度。情绪带宽最宽。';
      actions = [{ title: '执行指令', items: ['推进你一直拖延的困难对话', '对冲突的耐受度处于周期最高——今天是窗口', '警惕过度承诺：PEAK 答应的事在 FOCUS late 可能成为负担', '重大不可逆决策设置 48h 强制冷静期'] }];
      avoid = '直接签合同 / 做重大投资决策（自信峰值 = 决策偏差风险）';
      mechanism = '雌激素和睾酮同步峰值最大化前额叶皮层对边缘系统的调节，产生最高的情绪调节能力。同时，风险厌恶最低点意味着判断可能偏乐观——重大不可逆决策需要延迟审视。';
      papers = ['Pearson R, Lewis MB. Psychoneuroendocrinology 2005. PMID: 15878437'];
      break;

    case 'FOCUS early': {
      directive = '情绪信号先记录，24h 后再决定回应';
      const sens = Math.round(40 + p * 40);
      headline = `深度连接而非广度社交。情绪敏感度 +${sens}%——精密仪器，不是失控。`;
      bioDesc = `孕酮代谢物 allopregnanolone 增强 GABA 能传递，类似温和镇静效果，适合内观与整合。同时孕酮增加杏仁核对社交威胁的敏感性 +${sens}%。`;
      actions = [{ title: '执行指令', items: ['减少新人破冰类社交（认知负担增加）', '增加 1v1 深度对话（朋友 / 伴侣 / mentor）', '推荐：长篇阅读 / 写日记 / 沉浸式纪录片', '情绪信号先记录，24h 后再决定行动'] }];
      avoid = '发出带情绪色彩的即时回复；强迫自己进行广度社交';
      mechanism = '孕酮通过 allopregnanolone 增强 GABA-A 受体，产生向内聚焦的心理状态。情绪敏感度上升不是失调——是更精准的感知，配合延迟反应机制效果最佳（Pletzer et al., 2017）。';
      papers = ['Pletzer B et al. Horm Behav 2017. PMID: 28476349'];
      break;
    }
    case 'FOCUS late':
      directive = '所有不可逆决策延至 RISE，社交输出降低 30–40%';
      headline = `神经化学保护期。Allopregnanolone 急降，降低社交输出 30–40%。`;
      bioDesc = 'Allopregnanolone 急剧下降是 PMS 与 PMDD 的核心机制（Schiller et al., 2014）。5-HT 合成下降，前额叶背外侧皮层对边缘系统调节减弱。';
      actions = [
        { title: '核心指令', items: ['降低社交输出 30–40%，拒绝非必要应酬', '所有不可逆决策延期至 RISE 期复审', '保护睡眠：7.5–8h 不可侵犯', '每日 20min 晨间户外光照（5-HT 调节）'] },
        { title: '推荐工具', items: ['写 3 件感激事（前额叶激活 + 间接 5-HT）', '限制社交媒体 ≤ 30min/日', '4-7-8 呼吸法 × 5min × 3 次/日'] },
      ];
      avoid = '重大人际决策 / 财务决策（情绪感知准确但判断可能被放大）';
      mechanism = 'Allopregnanolone 骤降解除了对杏仁核的 GABA 抑制，使情绪信号更强烈穿透理性滤网。这是诚实，不是失调——但行动需要延迟窗口（Schiller et al., 2014）。';
      papers = ['Schiller CE et al. CNS Spectr 2014. PMID: 25008269', 'Toffoletto S et al. Front Neurosci 2014. PMID: 25505380'];
      break;
  }

  return { directive, headline, bioDesc, actions, avoid, mechanism, papers, body: bioDesc, why: mechanism };
}

// ── Daily snapshot (5 dimensions) ─────────────────────────────────────────────
function getSnapshotCN(phase6: Phase6, p: number): DailySnapshot {
  switch (phase6) {
    case 'RESET early':
      return {
        energy: '认知低谷，轻任务模式，避免高决策',
        temp:   '36.1–36.3°C（全月最低，孕酮清零）',
        weight: '胰岛素敏感性峰值·赤字上限 300 kcal·轻有氧燃脂',
        skin:   '屏障最脆弱·停用所有活性成分·纯修复',
        mood:   'BS 过滤器最清晰·只记录，不决策，不回应',
      };
    case 'RESET mid':
      return {
        energy: '战略静思模式，大局清晰度最高',
        temp:   '36.2–36.4°C（低温区，雌激素开始启动）',
        weight: '赤字 300–400 kcal·碳水集中训练前后',
        skin:   '过渡期·温和烟酰胺 + VC 衍生物可重启',
        mood:   '直觉最准·战略性独处，减少无效输入',
      };
    case 'RISE':
      return {
        energy: `学习 / 创作效率攀升·新技能最易习得`,
        temp:   `${(36.2 + p * 0.3).toFixed(1)}°C（卵泡低温区，接近排卵将短暂下探）`,
        weight: `赤字 ${lerp(300, 500, p)} kcal·脂肪氧化全月最强·力量训练优先`,
        skin:   p < 0.5 ? '进攻窗口开启·视黄醇 + AHA/BHA 重启' : '进攻全速·高浓度 VC + 视黄醇 + 果酸全上',
        mood:   `拒绝恐惧降至低点·主动社交·${p > 0.5 ? '提案 / 约见面 / 直接要求' : '热身期，发出犹豫已久的信息'}`,
      };
    case 'PEAK':
      return {
        energy: '语言流利度 + 说服力全月峰值·高风险决策日',
        temp:   '排卵前下探 36.0°C → 排卵后急升至 36.6–37.0°C',
        weight: '维持热量·今日增肌效率全月最高·训练后蛋白 0.4g/kg',
        skin:   '天然发光窗口·极简护肤·SPF50 最高优先级',
        mood:   '情绪调节能力全月最强·今日处理难谈话最合适',
      };
    case 'FOCUS early': {
      const bbt = (36.6 + p * 0.3).toFixed(1);
      return {
        energy: '深度专注模式·注意力持久性上升·减少会议',
        temp:   `${bbt}°C（黄体高温区，孕酮驱动体温升高 0.3–0.5°C）`,
        weight: `BMR ↑${lerp(100, 300, p)} kcal·低碳窗口·碳水集中训练前后 1h`,
        skin:   `皮脂腺活跃 ↑${Math.round(40 + p * 20)}%·控油防守·水杨酸 + 烟酰胺启动`,
        mood:   '敏感度 = 精度工具·先记录再回应·24h 冷静原则',
      };
    }
    case 'FOCUS late': {
      const bbt = (36.9 - p * 0.4).toFixed(1);
      return {
        energy: '带宽收窄·保护深度工作时间·减少无效社交',
        temp:   `${bbt}°C（高温区末期，孕酮下降中，向低温过渡）`,
        weight: '水肿 ±1–2 kg 是水分非脂肪·体重秤不可信·控糖 ≤ 25g',
        skin:   '双重风险窗口·抗炎防守·停用视黄醇 / 刷酸',
        mood:   '对不公平容忍度清零·感受即真实信号·等 RISE 再行动',
      };
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export function getReportContentCN(
  phase6: Phase6,
  cycleDay: number,
  dayInPhase: number,
  totalDaysInPhase: number,
  progress: number,
  sleepHours: number,
  fitness: FitnessLevel,
  diet: Diet,
): ReportContent {
  const hormones = getHormonesCN(phase6, progress)!;
  const edge     = getEdgeCN(phase6, progress);
  const status   = getStatusCN(phase6, progress, dayInPhase, totalDaysInPhase, sleepHours);

  return {
    statusLine:     status.statusLine,
    continuityNote: status.continuityNote,
    hormones,
    snapshot: getSnapshotCN(phase6, progress),
    edge,
    energy: buildCognitive(phase6, dayInPhase, totalDaysInPhase, progress),
    body:   buildMetabolic(phase6, dayInPhase, totalDaysInPhase, progress, fitness, diet),
    skin:   buildSkin(phase6, dayInPhase, totalDaysInPhase, progress),
    mood:   buildMood(phase6, dayInPhase, totalDaysInPhase, progress),
  };
}
