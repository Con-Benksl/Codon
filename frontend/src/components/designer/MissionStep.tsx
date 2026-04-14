import { motion } from "motion/react";
import {
  Leaf,
  Wind,
  Droplets,
  Biohazard,
  FlaskConical,
  Sprout,
  Recycle,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDesigner } from "../../views/designer/DesignerContext";
import { viewTransition, fadeSlideUp, stagger } from "../../lib/motion";
import RollbackButton from "./RollbackButton";

interface MockMission {
  id: string;
  name: string;
  goal: string;
  consumed: string;
  icon: LucideIcon;
}

const MOCK_MISSIONS: MockMission[] = [
  { id: "carbon_fix", name: "碳固定", goal: "生物质 ↑", consumed: "CO₂", icon: Leaf },
  { id: "oxygen_gen", name: "产氧", goal: "O₂ ↑", consumed: "H₂O / CO₂", icon: Wind },
  { id: "water_release", name: "水释放", goal: "H₂O ↑", consumed: "含水矿物", icon: Droplets },
  { id: "toxin_clean", name: "毒物清除", goal: "高氯酸盐 ↓", consumed: "ClO₄⁻", icon: Biohazard },
  { id: "nitrogen_fix", name: "氮固定", goal: "NH₃ ↑", consumed: "N₂", icon: FlaskConical },
  { id: "soil_build", name: "土壤构建", goal: "有机质 ↑", consumed: "风化岩", icon: Sprout },
  { id: "metal_bio", name: "生物采矿", goal: "金属离子 ↑", consumed: "矿石", icon: Recycle },
  { id: "uv_shield", name: "UV 屏蔽", goal: "色素层 ↑", consumed: "光能", icon: Sun },
];

export default function MissionStep() {
  const { handleMissionSelect } = useDesigner();

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline text-text tracking-tight">Step 2 · 选择任务</h2>
          <p className="text-lg text-text-muted mt-2">
            根据环境特点，选择一个改造目标
          </p>
        </div>
        <RollbackButton label="重选环境" targetStep={1} />
      </div>

      <motion.div
        variants={stagger(50)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {MOCK_MISSIONS.map((m) => {
          const Icon = m.icon;
          return (
            <motion.button
              key={m.id}
              variants={fadeSlideUp}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                void handleMissionSelect(m.id);
              }}
              className="text-left p-7 rounded-2xl border border-white/20 bg-card-translucent hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 group"
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Icon size={26} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-semibold text-text mb-2">{m.name}</div>
                  <div className="text-base text-text-muted">
                    目标：<span className="text-success font-medium">{m.goal}</span>
                  </div>
                  <div className="text-base text-text-muted mt-0.5">
                    消耗：<span className="text-text font-medium">{m.consumed}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
