import {
  FlaskConical,
  Bug,
  Dna,
  Terminal,
  Network,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AgentMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
}

export interface DataSource {
  name: string;
  id: string;
  status: "connected" | "syncing" | "offline";
}

export interface LogEntry {
  time: string;
  message: string;
  level: "info" | "warn" | "success" | "error";
}

export interface Reference {
  authors: string;
  title: string;
  journal: string;
  year: number;
}

export interface AgentDetail {
  id: string;
  icon: LucideIcon;
  name: string;
  subtitle: string;
  color: "primary" | "secondary" | "tertiary";
  status: "active" | "idle" | "processing";
  description: string;
  metrics: AgentMetric[];
  dataSources: DataSource[];
  logs: LogEntry[];
  findings: string[];
  references: Reference[];
}

export const agentDetails: Record<string, AgentDetail> = {
  "env-parse": {
    id: "env-parse",
    icon: FlaskConical,
    name: "环境解析",
    subtitle: "Environmental Parsing Agent",
    color: "secondary",
    status: "active",
    description:
      "将火星地质文献与探测器实测数据结构化为约束 JSON，绘制土壤毒性梯度和热震荡模式图谱，驱动下游所有 Agent 的评分与决策。当前正在解析 Jezero 火山口区域的高氯酸盐沉积数据。",
    metrics: [
      { label: "已解析数据集", value: "2,847", trend: "up" },
      { label: "约束参数", value: "186 条", trend: "stable" },
      { label: "毒性梯度覆盖", value: "75%", trend: "up" },
      { label: "热震荡周期", value: "687 sol", trend: "stable" },
    ],
    dataSources: [
      { name: "NASA PDS 行星数据系统", id: "PDS-v4", status: "connected" },
      { name: "MSL Curiosity RAD", id: "MSL-RAD", status: "syncing" },
      { name: "Phoenix Lander TEGA", id: "PHX-TEGA", status: "connected" },
      { name: "MAVEN 大气数据库", id: "MAVEN-01", status: "connected" },
    ],
    logs: [
      { time: "14:32:08", message: "Jezero 高氯酸盐浓度更新：0.5-1.0 wt% ClO₄⁻", level: "info" },
      { time: "14:31:45", message: "UV-C 通量峰值记录：6.4 W/m² (Sol 1241)", level: "warn" },
      { time: "14:30:22", message: "土壤 pH 梯度图谱生成完成 (分辨率 10m)", level: "success" },
      { time: "14:28:11", message: "MAVEN 大气逃逸数据同步完成", level: "info" },
      { time: "14:25:03", message: "热惯量数据与 MRO/THEMIS 红外波段交叉验证通过", level: "success" },
    ],
    findings: [
      "Jezero 火山口三角洲沉积物中高氯酸盐浓度 0.5-1.0 wt%，高于全球均值 (0.4-0.6 wt%)",
      "日温差可达 70°C (-73°C 至 -3°C)，对蛋白质折叠稳定性构成极端挑战",
      "表面 UV-C (200-280nm) 通量约 3.6 W/m²，地下 5cm 处衰减至 0.1%",
      "土壤含铁氧化物 (Fe₂O₃) 约 18%，可为化能自养菌提供电子受体",
      "大气 CO₂ 分压 0.6 kPa，足以支持碳固定但需工程化 RuBisCO 提高亲和力",
    ],
    references: [
      {
        authors: "Hecht, M.H. et al.",
        title: "Detection of Perchlorate and the Soluble Chemistry of Martian Soil at the Phoenix Lander Site",
        journal: "Science",
        year: 2009,
      },
      {
        authors: "Stern, J.C. et al.",
        title: "Evidence for indigenous nitrogen in sedimentary and aeolian deposits from the Curiosity rover",
        journal: "PNAS",
        year: 2015,
      },
      {
        authors: "Hassler, D.M. et al.",
        title: "Mars' Surface Radiation Environment Measured with MSL's Curiosity Rover",
        journal: "Science",
        year: 2014,
      },
    ],
  },

  extremophile: {
    id: "extremophile",
    icon: Bug,
    name: "极端微生物",
    subtitle: "Extremophile Screening Agent",
    color: "secondary",
    status: "processing",
    description:
      "检索全球极端微生物数据库，筛选具有目标耐受能力的底盘候选物种。重点关注耐辐射奇球菌 (Deinococcus radiodurans) 变体及其 DNA 修复机制。当前正在评估嗜冷/耐旱/耐辐射三重耐受组合的基因组特征。",
    metrics: [
      { label: "候选物种", value: "34", trend: "up" },
      { label: "基因组覆盖", value: "98.2%", trend: "stable" },
      { label: "辐射耐受阈值", value: "5,000 Gy", trend: "stable" },
      { label: "筛选置信度", value: "94.7%", trend: "up" },
    ],
    dataSources: [
      { name: "NCBI GenBank", id: "NCBI-GB", status: "connected" },
      { name: "JGI IMG/M", id: "JGI-IMG", status: "connected" },
      { name: "ExtremeDB (定制)", id: "EXT-DB", status: "syncing" },
      { name: "UniProt 蛋白组", id: "UNI-KB", status: "connected" },
    ],
    logs: [
      { time: "14:33:01", message: "D. radiodurans R1 株 RecA 重组酶活性评分：0.97", level: "success" },
      { time: "14:32:18", message: "Chroococcidiopsis sp. 耐干燥评估：存活 4 年无水环境", level: "info" },
      { time: "14:31:05", message: "⚠ Halobacterium NRC-1 高氯酸盐耐受性不足，移出候选列表", level: "warn" },
      { time: "14:29:44", message: "Thermococcus gammatolerans 辐射耐受确认：30,000 Gy", level: "success" },
      { time: "14:27:30", message: "交叉比对完成：12 种共生候选组合生成", level: "info" },
    ],
    findings: [
      "D. radiodurans 可耐受 5,000 Gy 急性辐照 (人类致死剂量的 1000 倍)，依赖 4-10 份基因组冗余拷贝",
      "Mn(II)-正磷酸盐-肽抗氧化复合物保护蛋白质免受氧化损伤，维持 DNA 修复酶活性",
      "Chroococcidiopsis 是唯一已知可在模拟火星 UV 下存活的光合生物 (地下 1cm 保护层)",
      "ESDSA (Extended Synthesis-Dependent Strand Annealing) 是 D. radiodurans 独特的 DNA 修复路径",
      "推荐底盘组合：D. radiodurans (辐射) × Synechocystis PCC 6803 (光合) 双菌共生系统",
    ],
    references: [
      {
        authors: "Daly, M.J. et al.",
        title: "Accumulation of Mn(II) in Deinococcus radiodurans Facilitates Gamma-Radiation Resistance",
        journal: "Science",
        year: 2004,
      },
      {
        authors: "Billi, D. et al.",
        title: "Survival of Chroococcidiopsis Under Simulated Mars Conditions",
        journal: "Astrobiology",
        year: 2019,
      },
      {
        authors: "Cox, M.M. & Battista, J.R.",
        title: "Deinococcus radiodurans — the Consummate Survivor",
        journal: "Nature Reviews Microbiology",
        year: 2005,
      },
    ],
  },

  "gene-func": {
    id: "gene-func",
    icon: Dna,
    name: "基因功能映射",
    subtitle: "Gene Function Mapping Agent",
    color: "secondary",
    status: "active",
    description:
      "交叉引用用于大气固氮的代谢基因簇，定位各耐受性对应的功能基因与操纵子。当前正在构建高氯酸盐还原途径的完整基因调控网络图谱。",
    metrics: [
      { label: "映射基因簇", value: "428", trend: "up" },
      { label: "功能注释率", value: "92%", trend: "up" },
      { label: "操纵子网络", value: "67 条", trend: "stable" },
      { label: "跨物种保守度", value: "78.3%", trend: "stable" },
    ],
    dataSources: [
      { name: "UniProt / Swiss-Prot", id: "UP-SP", status: "connected" },
      { name: "KEGG Pathway", id: "KEGG-P", status: "connected" },
      { name: "NCBI Gene", id: "NCBI-G", status: "connected" },
      { name: "InterPro 结构域", id: "IPR", status: "syncing" },
    ],
    logs: [
      { time: "14:34:12", message: "pcrABCD 操纵子定位完成 — 高氯酸盐还原核心基因簇", level: "success" },
      { time: "14:33:28", message: "nifHDK 固氮酶基因簇兼容性评估中...", level: "info" },
      { time: "14:32:05", message: "crt 类胡萝卜素合成基因 → UV 防护功能确认", level: "success" },
      { time: "14:30:40", message: "⚠ recA 启动子在低温下转录效率下降 42%", level: "warn" },
      { time: "14:28:55", message: "RuBisCO Form II (cbbM) 对低 CO₂ 分压亲和力匹配", level: "info" },
    ],
    findings: [
      "高氯酸盐还原核心基因簇 pcrABCD 已在 Dechloromonas aromatica 中完整鉴定，可水平转移",
      "nifHDK 固氮酶基因簇对氧极度敏感，需搭配 fdxN 铁氧还蛋白保护模块",
      "类胡萝卜素合成基因簇 (crtBIYEP) 可提供 UV-B/C 防护屏障，吸收峰 450-520 nm",
      "冷休克蛋白 CspA 家族基因在 -20°C 下维持 mRNA 二级结构稳定性",
      "建议构建模块化基因盒：[pcrABCD]-[crtBIYEP]-[cspA]-[recA] 四功能联合体",
    ],
    references: [
      {
        authors: "Coates, J.D. & Achenbach, L.A.",
        title: "Microbial Perchlorate Reduction: Rocket-Fuelled Metabolism",
        journal: "Nature Reviews Microbiology",
        year: 2004,
      },
      {
        authors: "Sievert, S.M. et al.",
        title: "Genome of the Epsilonproteobacterial Chemolithoautotroph",
        journal: "Applied & Environmental Microbiology",
        year: 2008,
      },
    ],
  },

  "circuit-design": {
    id: "circuit-design",
    icon: Terminal,
    name: "回路设计",
    subtitle: "Genetic Circuit Design Agent",
    color: "primary",
    status: "active",
    description:
      "设计用于环境感应和响应触发的基因逻辑回路。当前正在编码 UV 感应 → 类胡萝卜素合成开关、高氯酸盐浓度 → pcrABCD 表达的 Toggle Switch 逻辑门。",
    metrics: [
      { label: "逻辑门设计", value: "12", trend: "up" },
      { label: "仿真通过率", value: "87.5%", trend: "up" },
      { label: "iGEM 部件复用", value: "23 件", trend: "stable" },
      { label: "正交性评分", value: "0.94", trend: "stable" },
    ],
    dataSources: [
      { name: "iGEM Registry", id: "iGEM-R", status: "connected" },
      { name: "SynBioHub", id: "SBH-01", status: "connected" },
      { name: "SBOL Visual", id: "SBOL-V", status: "connected" },
    ],
    logs: [
      { time: "14:35:02", message: "UV Toggle Switch v3 仿真完成 — 响应时间 4.2 min", level: "success" },
      { time: "14:34:15", message: "启动子 PrecA 强度校准：-20°C 下衰减 58% → 需冷诱导增强子", level: "warn" },
      { time: "14:33:08", message: "高氯酸盐感应 AND 门：[ClO₄⁻>0.3%] ∧ [Fe³⁺] → pcrABCD 激活", level: "info" },
      { time: "14:31:50", message: "类胡萝卜素合成通路正反馈环路稳定性确认", level: "success" },
      { time: "14:30:22", message: "正交 riboswitch 候选：theophylline aptamer 结合效率 92%", level: "info" },
    ],
    findings: [
      "UV Toggle Switch：SOS 响应启动子 PrecA → CI/Cro 双稳态开关 → crtBIYEP 类胡萝卜素合成",
      "高氯酸盐感应回路：双组分系统 PcrS/PcrR → pcrABCD 操纵子，阈值 0.3 wt% ClO₄⁻",
      "冷诱导增强子 PcspA 可在 -20°C 下维持基础转录，响应 10°C 温升时表达量增加 8 倍",
      "所有回路使用 T7/T3 正交转录系统避免宿主干扰，正交性评分 0.94",
      "建议增加 Kill Switch：营养缺陷型 + 毒素/抗毒素系统 (mazEF) 防止生态逃逸",
    ],
    references: [
      {
        authors: "Gardner, T.S., Cantor, C.R. & Collins, J.J.",
        title: "Construction of a genetic toggle switch in Escherichia coli",
        journal: "Nature",
        year: 2000,
      },
      {
        authors: "Brophy, J.A.N. & Voigt, C.A.",
        title: "Principles of Genetic Circuit Design",
        journal: "Nature Methods",
        year: 2014,
      },
    ],
  },

  "metab-compat": {
    id: "metab-compat",
    icon: Network,
    name: "代谢兼容性",
    subtitle: "Metabolic Compatibility Agent",
    color: "primary",
    status: "processing",
    description:
      "在高氯酸盐环境中模拟生物量通量平衡分析 (FBA)，检查毒性中间体与路径竞争。确保工程化代谢途径与宿主原生代谢网络的兼容性。",
    metrics: [
      { label: "代谢反应", value: "1,847", trend: "stable" },
      { label: "FBA 可行解", value: "342", trend: "up" },
      { label: "毒性中间体", value: "3 种", trend: "down" },
      { label: "生物量通量", value: "0.42 h⁻¹", trend: "up" },
    ],
    dataSources: [
      { name: "BiGG Models", id: "BiGG-2", status: "connected" },
      { name: "KEGG Reaction", id: "KEGG-R", status: "connected" },
      { name: "BRENDA 酶动力学", id: "BRENDA", status: "syncing" },
      { name: "MetaCyc 代谢路径", id: "MC-DB", status: "connected" },
    ],
    logs: [
      { time: "14:36:01", message: "FBA 第 847 轮迭代 — 目标函数收敛中...", level: "info" },
      { time: "14:35:18", message: "⚠ 氯酸盐 (ClO₃⁻) 中间体检测 — 浓度 >2mM 时具有细胞毒性", level: "warn" },
      { time: "14:34:05", message: "碳通量重分配：CO₂ 固定 → 类胡萝卜素支路占比 12%", level: "info" },
      { time: "14:32:40", message: "ATP 产出平衡验证通过 — 净产出 2.4 mol ATP/mol ClO₄⁻", level: "success" },
      { time: "14:31:15", message: "氧化还原电位平衡：NAD⁺/NADH 比值 = 3.2 (可接受范围)", level: "success" },
    ],
    findings: [
      "高氯酸盐还原完整途径：ClO₄⁻ → ClO₃⁻ → ClO₂⁻ → Cl⁻ + O₂，净产生分子氧可供好氧代谢",
      "毒性中间体 ClO₃⁻ 累积风险：需 pcrC (氯酸盐还原酶) 过表达 3 倍以加速中间体清除",
      "Calvin 循环碳固定与类胡萝卜素合成存在丙酮酸竞争 — 建议动态调控开关分时复用",
      "模拟结果：在 0.6 kPa CO₂ 分压下，工程菌理论倍增时间 18.7 小时",
      "双菌共生系统中，光合菌 O₂ 产出量恰好满足异养菌高氯酸盐还原的氧需求 (化学计量匹配)",
    ],
    references: [
      {
        authors: "Orth, J.D., Thiele, I. & Palsson, B.Ø.",
        title: "What is flux balance analysis?",
        journal: "Nature Biotechnology",
        year: 2010,
      },
      {
        authors: "Milo, R. et al.",
        title: "BioNumbers — the database of key numbers in molecular and cell biology",
        journal: "Nucleic Acids Research",
        year: 2010,
      },
    ],
  },

  "struct-predict": {
    id: "struct-predict",
    icon: Layers,
    name: "结构预测",
    subtitle: "Structure Prediction Agent",
    color: "primary",
    status: "active",
    description:
      "利用深度学习 (AlphaFold2/ESMFold) 预测工程蛋白在火星低温环境 (-60°C) 下的折叠稳定性与功能构象。重点验证膜蛋白和 DNA 修复酶的冷适应突变。",
    metrics: [
      { label: "预测结构", value: "156", trend: "up" },
      { label: "平均 pLDDT", value: "87.3", trend: "up" },
      { label: "低温稳定突变", value: "42 个", trend: "up" },
      { label: "MD 仿真时长", value: "1.2 μs", trend: "stable" },
    ],
    dataSources: [
      { name: "AlphaFold DB", id: "AF-DB", status: "connected" },
      { name: "PDB 蛋白数据库", id: "PDB-01", status: "connected" },
      { name: "ESM Atlas", id: "ESM-A", status: "connected" },
      { name: "Swiss-Model", id: "SM-01", status: "syncing" },
    ],
    logs: [
      { time: "14:37:05", message: "PcrA 高氯酸盐还原酶 — pLDDT 91.2, -40°C MD 稳定", level: "success" },
      { time: "14:36:22", message: "RecA 重组酶 G267S 突变体 — 低温活性提升 340%", level: "success" },
      { time: "14:35:10", message: "⚠ CrtI 脱氢酶在 -60°C 下出现局部展开 (残基 142-158)", level: "warn" },
      { time: "14:33:55", message: "膜蛋白 OmpF 变体抗冻稳定性验证通过", level: "info" },
      { time: "14:32:30", message: "分子动力学仿真 #247 完成 — 总计 1.2 μs 轨迹", level: "info" },
    ],
    findings: [
      "AlphaFold2 预测 PcrA 高氯酸盐还原酶结构 pLDDT=91.2，活性位点完整保守",
      "RecA G267S 点突变：降低蛋白柔性阈值，使 DNA 修复活性在 -40°C 下提升 340%",
      "类胡萝卜素脱氢酶 CrtI 存在冷敏感区域 (α-helix 142-158)，建议引入 Pro→Hyp 羟脯氨酸替换",
      "外膜蛋白 OmpF 变体引入 4 个二硫键后，-60°C 下通道开放概率从 12% 提升至 67%",
      "整体评估：42 个低温稳定化突变中 38 个通过 MD 验证 (通过率 90.5%)",
    ],
    references: [
      {
        authors: "Jumper, J. et al.",
        title: "Highly accurate protein structure prediction with AlphaFold",
        journal: "Nature",
        year: 2021,
      },
      {
        authors: "Siddiqui, K.S. & Cavicchioli, R.",
        title: "Cold-Adapted Enzymes",
        journal: "Annual Review of Biochemistry",
        year: 2006,
      },
    ],
  },
};
