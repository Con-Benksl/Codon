import { motion } from "motion/react";
import { Database, Download, Share2 } from "lucide-react";
import { buttonPress, inViewport } from "../../lib/motion";

interface Props {
  isZh: boolean;
  onNavigateOutput: () => void;
}

export default function DesignSpecBar({ isZh, onNavigateOutput }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...inViewport}
      className="mt-12"
    >
      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/15 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <Database size={18} className="text-primary" />
          <span className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">
            {isZh ? "设计规范书：" : "Design Spec:"}
          </span>
        </div>
        <div className="flex-1 bg-surface-container-lowest px-4 py-2 rounded font-mono text-xs text-primary/70 overflow-hidden text-ellipsis whitespace-nowrap">
          XENO_BIO_v1.0.4_PATH_ID_8842-B-ALPHA_CONSTRAINED_STABLE
        </div>
        <div className="flex gap-2">
          <motion.button {...buttonPress} className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant">
            <Download size={18} />
          </motion.button>
          <motion.button {...buttonPress} className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant">
            <Share2 size={18} />
          </motion.button>
          <motion.button
            {...buttonPress}
            onClick={onNavigateOutput}
            className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded font-headline font-bold text-[10px] uppercase tracking-widest hover:bg-primary/30 transition-all"
          >
            {isZh ? "执行生物打印" : "Run Bioprint"}
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
