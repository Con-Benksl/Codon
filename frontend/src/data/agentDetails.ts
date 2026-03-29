import {
  Satellite,
  Cpu,
  ShieldCheck,
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
  capabilities: string[];
  metrics: AgentMetric[];
  dataSources: DataSource[];
  logs: LogEntry[];
  findings: string[];
  references: Reference[];
}

export const agentDetails: Record<string, AgentDetail> = {
  "env-agent": {
    id: "env-agent",
    icon: Satellite,
    name: "环境智能体",
    subtitle: "Environment Agent",
    color: "secondary",
    status: "active",
    description:
      "整合火星地质文献、探测器实测数据与极端微生物数据库，将环境条件结构化为约束参数，并自动筛选具有耐辐射/耐寒/耐盐三重耐受能力的候选底盘物种。",
    capabilities: ["环境解析", "极端微生物筛选", "约束参数生成", "物种评分"],
    metrics: [
      { label: "已解析数据集", value: "2,847", trend: "up" },
      { label: "候选物种", value: "34", trend: "up" },
      { label: "约束参数", value: "186 条", trend: "stable" },
      { label: "筛选置信度", value: "94.7%", trend: "up" },
    ],
    dataSources: [
      { name: "NASA PDS 行星数据系统", id: "PDS-v4", status: "connected" },
      { name: "NCBI GenBank", id: "NCBI-GB", status: "connected" },
      { name: "MSL Curiosity RAD", id: "MSL-RAD", status: "syncing" },
      { name: "ExtremeDB (定制)", id: "EXT-DB", status: "syncing" },
    ],
    logs: [
      { time: "14:33:01", message: "D. radiodurans R1 株 RecA 重组酶活性评分：0.97", level: "success" },
      { time: "14:32:08", message: "Jezero 高氯酸盐浓度更新：0.5-1.0 wt% ClO₄⁻", level: "info" },
      { time: "14:31:45", message: "UV-C 通量峰值记录：6.4 W/m² (Sol 1241)", level: "warn" },
      { time: "14:30:22", message: "土壤 pH 梯度图谱生成完成 (分辨率 10m)", level: "success" },
      { time: "14:28:11", message: "推荐底盘：D. radiodurans × Synechocystis 双菌共生系统", level: "info" },
    ],
    findings: [
      "Jezero 火山口高氯酸盐浓度 0.5-1.0 wt%，土壤含铁氧化物约 18%，可为化能自养菌提供电子受体",
      "D. radiodurans 可耐受 5,000 Gy 急性辐照，依赖 4-10 份基因组冗余拷贝及 ESDSA 修复路径",
      "Chroococcidiopsis 是唯一已知可在模拟火星 UV 下存活的光合生物，推荐双菌共生底盘组合",
    ],
    references: [
      {
        authors: "Hecht, M.H. et al.",
        title: "Detection of Perchlorate and the Soluble Chemistry of Martian Soil at the Phoenix Lander Site",
        journal: "Science",
        year: 2009,
      },
      {
        authors: "Daly, M.J. et al.",
        title: "Accumulation of Mn(II) in Deinococcus radiodurans Facilitates Gamma-Radiation Resistance",
        journal: "Science",
        year: 2004,
      },
    ],
  },

  "design-agent": {
    id: "design-agent",
    icon: Cpu,
    name: "设计智能体",
    subtitle: "Design Agent",
    color: "primary",
    status: "processing",
    description:
      "基于环境约束自动完成基因功能映射、遗传回路设计和代谢通量平衡分析。将三条技术路线（基因组学、合成生物学、代谢工程）整合为统一的模块化基因盒设计方案。",
    capabilities: ["基因功能映射", "回路设计", "代谢兼容性", "FBA 分析"],
    metrics: [
      { label: "映射基因簇", value: "428", trend: "up" },
      { label: "逻辑门设计", value: "12", trend: "up" },
      { label: "代谢反应", value: "1,847", trend: "stable" },
      { label: "FBA 可行解", value: "342", trend: "up" },
    ],
    dataSources: [
      { name: "KEGG Pathway", id: "KEGG-P", status: "connected" },
      { name: "iGEM Registry", id: "iGEM-R", status: "connected" },
      { name: "BiGG Models", id: "BiGG-2", status: "connected" },
      { name: "InterPro 结构域", id: "IPR", status: "syncing" },
    ],
    logs: [
      { time: "14:35:02", message: "UV Toggle Switch v3 仿真完成 — 响应时间 4.2 min", level: "success" },
      { time: "14:34:12", message: "pcrABCD 操纵子定位完成 — 高氯酸盐还原核心基因簇", level: "success" },
      { time: "14:34:05", message: "碳通量重分配：CO₂ 固定 → 类胡萝卜素支路占比 12%", level: "info" },
      { time: "14:33:08", message: "高氯酸盐感应 AND 门：[ClO₄⁻>0.3%] ∧ [Fe³⁺] → pcrABCD 激活", level: "info" },
      { time: "14:32:40", message: "⚠ 氯酸盐 (ClO₃⁻) 中间体浓度 >2mM 需 pcrC 过表达 3 倍清除", level: "warn" },
    ],
    findings: [
      "建议构建模块化基因盒：[pcrABCD 高氯酸盐还原]-[crtBIYEP UV 防护]-[cspA 冷适应]-[recA DNA 修复]",
      "UV Toggle Switch：SOS 响应启动子 PrecA → CI/Cro 双稳态开关 → 类胡萝卜素合成，响应时间 4.2 min",
      "双菌共生系统代谢化学计量匹配：光合菌 O₂ 产出量恰好满足异养菌高氯酸盐还原需求",
    ],
    references: [
      {
        authors: "Brophy, J.A.N. & Voigt, C.A.",
        title: "Principles of Genetic Circuit Design",
        journal: "Nature Methods",
        year: 2014,
      },
      {
        authors: "Orth, J.D., Thiele, I. & Palsson, B.Ø.",
        title: "What is flux balance analysis?",
        journal: "Nature Biotechnology",
        year: 2010,
      },
    ],
  },

  "verify-agent": {
    id: "verify-agent",
    icon: ShieldCheck,
    name: "验证智能体",
    subtitle: "Verification Agent",
    color: "tertiary",
    status: "active",
    description:
      "利用深度学习（AlphaFold2/ESMFold）预测工程蛋白在火星低温下的折叠稳定性，通过分子动力学仿真验证关键突变，并对整体设计方案进行多维度评估与优化建议输出。",
    capabilities: ["结构预测", "低温稳定性验证", "MD 仿真", "方案评估"],
    metrics: [
      { label: "预测结构", value: "156", trend: "up" },
      { label: "平均 pLDDT", value: "87.3", trend: "up" },
      { label: "低温稳定突变", value: "42 个", trend: "up" },
      { label: "验证通过率", value: "90.5%", trend: "stable" },
    ],
    dataSources: [
      { name: "AlphaFold DB", id: "AF-DB", status: "connected" },
      { name: "PDB 蛋白数据库", id: "PDB-01", status: "connected" },
      { name: "ESM Atlas", id: "ESM-A", status: "connected" },
      { name: "Swiss-Model", id: "SM-01", status: "syncing" },
    ],
    logs: [
      { time: "14:37:05", message: "PcrA 高氯酸盐还原酶 — pLDDT 91.2, -40°C MD 稳定", level: "success" },
      { time: "14:36:22", message: "RecA G267S 突变体 — 低温活性提升 340%", level: "success" },
      { time: "14:35:10", message: "⚠ CrtI 脱氢酶在 -60°C 下出现局部展开 (残基 142-158)", level: "warn" },
      { time: "14:33:55", message: "膜蛋白 OmpF 变体抗冻稳定性验证通过", level: "info" },
      { time: "14:32:30", message: "分子动力学仿真 #247 完成 — 总计 1.2 μs 轨迹", level: "info" },
    ],
    findings: [
      "RecA G267S 点突变降低蛋白柔性阈值，DNA 修复活性在 -40°C 下提升 340%；OmpF 变体引入 4 个二硫键后通道开放概率从 12% 提升至 67%",
      "CrtI 脱氢酶存在冷敏感区域 α-helix 142-158，建议引入 Pro→Hyp 羟脯氨酸替换增强稳定性",
      "42 个低温稳定化突变中 38 个通过 MD 验证（通过率 90.5%），整体方案可行性评级：高",
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
