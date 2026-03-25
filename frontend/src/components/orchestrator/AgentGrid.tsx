import { motion } from "motion/react";
import {
  FlaskConical, Bug, Dna, Terminal, Network, Layers, Database, Cpu,
} from "lucide-react";
import { stagger, fadeSlideUp, cardHover, inViewport } from "../../lib/motion";
import { AnalysisCard, DesignCard } from "../index";

interface Props {
  isZh: boolean;
  onSelectAgent: (id: string) => void;
}

export default function AgentGrid({ isZh, onSelectAgent }: Props) {
  return (
    <motion.div
      variants={stagger(100)}
      initial="hidden"
      whileInView="show"
      {...inViewport}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative"
    >
      {/* 分析层 */}
      <motion.div variants={fadeSlideUp} className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Database size={16} className="text-secondary" />
          <h3 className="font-headline font-bold text-sm tracking-widest uppercase">
            {isZh ? "分析层" : "Analysis Layer"} <span className="text-on-surface-variant/40">v2.4</span>
          </h3>
        </div>
        <motion.div
          variants={stagger(80)}
          initial="hidden"
          whileInView="show"
          {...inViewport}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <motion.div variants={fadeSlideUp}>
            <AnalysisCard
              icon={FlaskConical}
              title={isZh ? "环境解析" : "Environment Parsing"}
              description={isZh
                ? "绘制土壤毒性梯度和热震荡模式，以实现最佳生物群落部署。"
                : "Maps soil toxicity gradients and thermal shock patterns for optimal biota deployment."}
              progress={75}
              tag={isZh ? "环境解析" : "Env Parse"}
              onClick={() => onSelectAgent("env-parse")}
            />
          </motion.div>
          <motion.div variants={fadeSlideUp}>
            <AnalysisCard
              icon={Bug}
              title={isZh ? "极端微生物" : "Extremophile"}
              description={isZh
                ? "检索耐辐射奇球菌变体数据库，以获取辐射抗性性状。"
                : "Screens extremophile variants to mine radiation resistance traits."}
              progress={50}
              tag={isZh ? "生物规范" : "Bio Profile"}
              onClick={() => onSelectAgent("extremophile")}
            />
          </motion.div>
          <motion.div variants={fadeSlideUp} className="md:col-span-2">
            <motion.div
              {...cardHover}
              onClick={() => onSelectAgent("gene-func")}
              className="glass-panel p-5 rounded-xl border-l-2 border-l-secondary flex gap-6 items-center cursor-pointer"
            >
              <Dna size={40} className="text-secondary" />
              <div className="flex-1">
                <h4 className="font-headline font-bold text-on-surface text-sm uppercase mb-1">
                  {isZh ? "基因功能映射" : "Gene Function Mapping"}
                </h4>
                <p className="text-xs text-on-surface-variant font-body">
                  {isZh
                    ? "交叉引用用于大气固氮的代谢基因簇。"
                    : "Cross-references metabolic clusters for atmospheric nitrogen fixation."}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-headline text-on-surface-variant block">{isZh ? "匹配率" : "Match Rate"}</span>
                <span className="text-lg font-headline font-bold text-secondary">92%</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 设计层 */}
      <motion.div variants={fadeSlideUp} className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Cpu size={16} className="text-primary" />
          <h3 className="font-headline font-bold text-sm tracking-widest uppercase">
            {isZh ? "设计层" : "Design Layer"} <span className="text-on-surface-variant/40">{isZh ? "原型_0" : "PROTO_0"}</span>
          </h3>
        </div>
        <motion.div
          variants={stagger(80)}
          initial="hidden"
          whileInView="show"
          {...inViewport}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <motion.div variants={fadeSlideUp}>
            <DesignCard
              icon={Terminal}
              title={isZh ? "回路设计" : "Circuit Design"}
              description={isZh
                ? "编码用于环境感应和响应触发的切换开关。"
                : "Builds switch logic for sensing-triggered responses."}
              steps={2}
              tag={isZh ? "合成逻辑" : "Syn Logic"}
              onClick={() => onSelectAgent("circuit-design")}
            />
          </motion.div>
          <motion.div variants={fadeSlideUp}>
            <DesignCard
              icon={Network}
              title={isZh ? "代谢兼容性" : "Metabolic Compatibility"}
              description={isZh
                ? "在高氯酸盐环境中模拟生物量通量，以确保生存。"
                : "Simulates biomass flux in perchlorate-rich conditions for survival assurance."}
              steps={3}
              tag={isZh ? "代谢映射" : "Metabolic Map"}
              onClick={() => onSelectAgent("metab-compat")}
            />
          </motion.div>
          <motion.div variants={fadeSlideUp} className="md:col-span-2">
            <motion.div
              {...cardHover}
              onClick={() => onSelectAgent("struct-predict")}
              className="glass-panel p-5 rounded-xl border-l-2 border-l-primary flex gap-6 items-center cursor-pointer"
            >
              <Layers size={40} className="text-primary" />
              <div className="flex-1">
                <h4 className="font-headline font-bold text-on-surface text-sm uppercase mb-1">
                  {isZh ? "结构预测" : "Structure Prediction"}
                </h4>
                <p className="text-xs text-on-surface-variant font-body">
                  {isZh
                    ? "利用深度学习折叠蛋白，以实现耐寒功能。"
                    : "Applies deep folding models to engineer cold-resilient proteins."}
                </p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border border-primary bg-surface-container-high flex items-center justify-center">
                  <Network size={12} className="text-primary" />
                </div>
                <div className="w-8 h-8 rounded-full border border-primary bg-surface-container-high flex items-center justify-center">
                  <Terminal size={12} className="text-primary" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
