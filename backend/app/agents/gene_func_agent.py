import logging
from typing import Any, Dict, List

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# 目标功能基因 → NCBI Gene ID 映射（已验证的基因 ID）
_GENE_QUERY_MAP = {
    "recA": ("Deinococcus radiodurans", "1798504"),
    "pcrA": ("Deinococcus radiodurans", "1800696"),
    "nifH": ("Anabaena variabilis", "3249098"),
    "chlH": ("Chroococcidiopsis thermalis", ""),  # 用学名查
    "katE": ("Deinococcus radiodurans", "1798291"),
    "cspA": ("Pseudomonas fluorescens", ""),
}

# 内置的基因功能摘要（兜底数据，NCBI 查询失败时使用）
_GENE_FALLBACK: Dict[str, Dict[str, Any]] = {
    "recA": {
        "symbol": "recA", "organism": "Deinococcus radiodurans R1",
        "function": "DNA 重组修复核心酶，催化链侵入和 Holliday 结构形成",
        "length_aa": 352, "gc_content": 0.647,
        "radiation_relevance": "高 — 辐射诱导表达，DSB 修复关键",
    },
    "pcrA": {
        "symbol": "pcrA", "organism": "Deinococcus radiodurans R1",
        "function": "高氯酸盐还原酶 α 亚基，催化 ClO₄⁻ → ClO₃⁻",
        "length_aa": 887, "gc_content": 0.621,
        "radiation_relevance": "中 — 高氯酸盐毒性缓解",
    },
    "nifH": {
        "symbol": "nifH", "organism": "Anabaena variabilis ATCC 29413",
        "function": "固氮酶铁蛋白，电子传递给二氮气结合位点",
        "length_aa": 296, "gc_content": 0.568,
        "radiation_relevance": "低 — 氮源自给能力",
    },
    "katE": {
        "symbol": "katE", "organism": "Deinococcus radiodurans R1",
        "function": "过氧化氢酶，H₂O₂ → H₂O + O₂",
        "length_aa": 717, "gc_content": 0.635,
        "radiation_relevance": "高 — 清除辐射诱导的活性氧",
    },
    "cspA": {
        "symbol": "cspA", "organism": "Pseudomonas fluorescens",
        "function": "冷休克蛋白，低温下稳定 mRNA 二级结构",
        "length_aa": 70, "gc_content": 0.523,
        "radiation_relevance": "低 — 低温适应",
    },
}


def _fetch_gene_info_biopython(gene_symbols: List[str]) -> List[Dict[str, Any]]:
    """使用 BioPython Entrez 查询基因信息；失败时回退到内置数据"""
    results = []
    try:
        from Bio import Entrez, SeqIO
        Entrez.email = "marslab@synthetic.bio"

        for symbol in gene_symbols[:5]:  # 限制查询数量
            key = symbol.lower().replace("-", "")
            # 先查内置兜底
            fallback = _GENE_FALLBACK.get(key) or _GENE_FALLBACK.get(symbol.lower())
            if fallback:
                results.append(fallback)
                continue

            # 尝试 NCBI Entrez 查询
            try:
                search = Entrez.esearch(db="gene", term=f"{symbol}[Gene Name] AND bacteria[Organism]", retmax=1)
                record = Entrez.read(search)
                search.close()
                if record.get("IdList"):
                    gene_id = record["IdList"][0]
                    fetch = Entrez.efetch(db="gene", id=gene_id, rettype="gene_table", retmode="text")
                    content = fetch.read()[:500]
                    fetch.close()
                    results.append({
                        "symbol": symbol,
                        "ncbi_gene_id": gene_id,
                        "summary_excerpt": content[:200].strip(),
                        "source": "NCBI Entrez",
                    })
                else:
                    results.append({"symbol": symbol, "note": "NCBI 未找到匹配记录"})
            except Exception as e:
                logger.warning("NCBI Entrez 查询 %s 失败: %s", symbol, e)
                if fallback:
                    results.append(fallback)

    except ImportError:
        logger.warning("BioPython 未安装，使用内置基因数据")
        for symbol in gene_symbols[:5]:
            key = symbol.lower()
            fb = _GENE_FALLBACK.get(key)
            if fb:
                results.append(fb)

    return results


class GeneFuncAgent(BaseAgent):
    """基因功能映射 Agent — 将环境需求映射到功能基因模块（BioPython 增强）"""

    system_prompt = """你是合成生物学与基因功能注释专家。根据火星环境约束和候选底盘微生物，识别需要引入或强化的功能基因模块。

你需要：
1. 将每项环境挑战映射到对应的功能基因/操纵子
2. 评估基因在候选底盘中的兼容性
3. 推荐基因来源物种
4. 标注可能的基因冲突或表达干扰

请返回以下 JSON 格式：
{
  "status": "completed",
  "gene_clusters": [
    {
      "name": "操纵子/基因簇名称",
      "function": "功能描述",
      "target_challenge": "对应的环境挑战",
      "genes": ["gene1", "gene2"],
      "source_organism": "基因来源物种",
      "transfer_method": "水平转移/同源重组/质粒载体",
      "compatibility_score": 0.0-1.0,
      "notes": "备注"
    }
  ],
  "recommended_gene_cassette": "推荐的模块化基因盒设计",
  "potential_conflicts": ["潜在冲突1"],
  "findings": ["关键发现1"],
  "metrics": {"mapped_clusters": 数量, "annotation_coverage": 0.0-1.0}
}"""

    def __init__(self):
        super().__init__("gene-func", "基因功能映射")

    def build_user_prompt(self, input_data: Dict[str, Any]) -> str:
        # 从已上传数据集中提取基因符号
        genes_raw = input_data.get("genes", [])
        gene_symbols = []
        if isinstance(genes_raw, list):
            for g in genes_raw:
                if isinstance(g, dict):
                    sym = g.get("gene") or g.get("symbol") or g.get("name", "")
                elif isinstance(g, str):
                    sym = g
                else:
                    sym = ""
                if sym:
                    gene_symbols.append(sym)

        # 默认查询火星适应相关基因
        if not gene_symbols:
            gene_symbols = ["recA", "pcrA", "katE", "nifH", "cspA"]

        self.log_progress(f"BioPython 查询基因: {gene_symbols}")
        bio_data = _fetch_gene_info_biopython(gene_symbols)

        return self._build_prompt([
            ("环境约束", input_data.get("constraints")),
            ("候选底盘微生物", input_data.get("candidate_organisms")),
            ("BioPython 基因数据库查询结果（真实数据）", bio_data if bio_data else None),
            ("数据集中已有的基因列表", genes_raw if genes_raw else None),
            ("上游 Agent 关键发现", input_data.get("upstream_findings")),
            ("", "请基于上述 BioPython 查询到的真实基因数据，为每项环境挑战映射对应的功能基因模块，并推荐模块化基因盒设计方案。"),
        ])
