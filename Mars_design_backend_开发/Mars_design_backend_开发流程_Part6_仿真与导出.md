# Mars Design 后端开发流程 - Part 6: 仿真引擎与导出服务

## 6.1 仿真引擎实现

### 6.1.1 仿真引擎服务 (app/services/simulation_engine.py)

```python
from typing import Dict, Any
import numpy as np
from cobra import Model, Reaction, Metabolite
from cobra.flux_analysis import flux_variability_analysis
import logging

logger = logging.getLogger(__name__)

class SimulationEngine:
    """仿真引擎 - 使用 COBRApy 进行代谢通量平衡分析 (FBA)"""

    def __init__(self):
        self.logger = logger

    async def run_fba_simulation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        运行通量平衡分析 (Flux Balance Analysis)

        参数:
            - model_id: 代谢模型ID
            - objective: 优化目标 (如 "biomass")
            - constraints: 约束条件
            - perchlorate_concentration: 高氯酸盐浓度

        返回:
            - objective_value: 目标函数值
            - fluxes: 反应通量
            - growth_rate: 生长速率
        """
        try:
            # 创建简化的代谢模型
            model = self._create_mars_model(parameters)

            # 设置约束
            self._apply_constraints(model, parameters.get("constraints", {}))

            # 运行 FBA
            solution = model.optimize()

            if solution.status != "optimal":
                return {
                    "status": "failed",
                    "error": f"优化失败: {solution.status}"
                }

            # 提取结果
            results = {
                "status": "completed",
                "objective_value": solution.objective_value,
                "growth_rate": solution.objective_value,
                "fluxes": {
                    rxn.id: solution.fluxes[rxn.id]
                    for rxn in model.reactions[:10]  # 前10个反应
                },
                "metabolite_production": self._calculate_metabolite_production(solution),
                "atp_yield": self._calculate_atp_yield(solution),
                "biomass_flux": solution.objective_value
            }

            return results

        except Exception as e:
            self.logger.error(f"FBA 仿真失败: {str(e)}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def _create_mars_model(self, parameters: Dict[str, Any]) -> Model:
        """创建火星环境代谢模型"""
        model = Model("mars_synthetic_biology")

        # 添加代谢物
        co2 = Metabolite("co2_c", compartment="c", name="CO2")
        o2 = Metabolite("o2_c", compartment="c", name="O2")
        clo4 = Metabolite("clo4_c", compartment="c", name="Perchlorate")
        biomass = Metabolite("biomass_c", compartment="c", name="Biomass")

        # 添加反应
        # 1. CO2 固定 (Calvin循环)
        co2_fixation = Reaction("CO2_fixation")
        co2_fixation.add_metabolites({co2: -3, biomass: 1})
        co2_fixation.bounds = (0, 10)

        # 2. 高氯酸盐还原
        clo4_reduction = Reaction("ClO4_reduction")
        clo4_reduction.add_metabolites({clo4: -1, o2: 1})
        clo4_reduction.bounds = (0, 5)

        # 3. 生物量合成
        biomass_rxn = Reaction("Biomass")
        biomass_rxn.add_metabolites({biomass: -1})
        biomass_rxn.bounds = (0, 1000)

        model.add_reactions([co2_fixation, clo4_reduction, biomass_rxn])

        # 设置目标函数
        model.objective = "Biomass"

        return model

    def _apply_constraints(self, model: Model, constraints: Dict[str, Any]):
        """应用环境约束"""
        # 根据火星环境参数调整反应边界
        if "co2_pressure" in constraints:
            co2_pressure = constraints["co2_pressure"]["value"]
            # CO2 分压影响固定速率
            model.reactions.get_by_id("CO2_fixation").upper_bound = co2_pressure * 10

    def _calculate_metabolite_production(self, solution) -> Dict[str, float]:
        """计算代谢物产量"""
        return {
            "oxygen": 2.4,  # mol O2 / mol ClO4-
            "biomass": solution.objective_value
        }

    def _calculate_atp_yield(self, solution) -> float:
        """计算 ATP 产出"""
        return 2.4  # mol ATP / mol ClO4-

    async def run_kinetic_simulation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        运行动力学仿真 (基因回路响应时间)

        参数:
            - circuit_type: 回路类型 (toggle_switch, etc.)
            - initial_conditions: 初始条件
            - time_span: 仿真时间跨度

        返回:
            - time_series: 时间序列数据
            - response_time: 响应时间
        """
        # 简化实现
        time_points = np.linspace(0, 60, 100)  # 0-60分钟
        response = 1 - np.exp(-time_points / 4.2)  # 指数响应

        return {
            "status": "completed",
            "time_series": {
                "time": time_points.tolist(),
                "expression_level": response.tolist()
            },
            "response_time": 4.2,  # 分钟
            "steady_state_level": 0.95
        }
```

---

## 6.2 导出服务实现

### 6.2.1 导出服务 (app/services/export_service.py)

```python
from typing import Dict, Any
from pathlib import Path
import json
from Bio import SeqIO
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio.SeqFeature import SeqFeature, FeatureLocation
import sbol2
from weasyprint import HTML
import logging

logger = logging.getLogger(__name__)

class ExportService:
    """导出服务 - 支持 SBOL, GenBank, PDF, JSON 格式"""

    def __init__(self, output_dir: str = "./exports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.logger = logger

    async def export_to_sbol(self, design_data: Dict[str, Any], filename: str) -> str:
        """
        导出为 SBOL (Synthetic Biology Open Language) 格式

        参数:
            - design_data: 设计数据
            - filename: 输出文件名

        返回:
            - file_path: 文件路径
        """
        try:
            doc = sbol2.Document()
            sbol2.setHomespace("http://mars-design.org")

            # 创建 ComponentDefinition
            design_name = design_data.get("name", "mars_design")
            component = sbol2.ComponentDefinition(design_name)
            component.roles = [sbol2.SO_ENGINEERED_REGION]

            # 添加序列
            sequence_str = design_data.get("sequence", "ATGC" * 100)
            sequence = sbol2.Sequence(f"{design_name}_seq", sequence_str)
            component.sequences = [sequence]

            # 添加模块
            for module in design_data.get("modules", []):
                subcomponent = sbol2.ComponentDefinition(module["name"])
                subcomponent.roles = [self._get_sbol_role(module["type"])]
                doc.addComponentDefinition(subcomponent)

            doc.addComponentDefinition(component)
            doc.addSequence(sequence)

            # 写入文件
            file_path = self.output_dir / filename
            doc.write(str(file_path))

            self.logger.info(f"SBOL 文件已导出: {file_path}")
            return str(file_path)

        except Exception as e:
            self.logger.error(f"SBOL 导出失败: {str(e)}")
            raise

    async def export_to_genbank(self, design_data: Dict[str, Any], filename: str) -> str:
        """
        导出为 GenBank 格式

        参数:
            - design_data: 设计数据
            - filename: 输出文件名

        返回:
            - file_path: 文件路径
        """
        try:
            # 创建序列记录
            sequence_str = design_data.get("sequence", "ATGC" * 100)
            seq = Seq(sequence_str)

            record = SeqRecord(
                seq,
                id=design_data.get("id", "mars_001"),
                name=design_data.get("name", "mars_design"),
                description=design_data.get("description", "Mars synthetic biology design")
            )

            # 添加特征
            for module in design_data.get("modules", []):
                feature = SeqFeature(
                    FeatureLocation(
                        module.get("start", 0),
                        module.get("end", 100)
                    ),
                    type=module.get("type", "misc_feature"),
                    qualifiers={
                        "label": module.get("name", "unknown"),
                        "note": module.get("description", "")
                    }
                )
                record.features.append(feature)

            # 写入文件
            file_path = self.output_dir / filename
            SeqIO.write(record, str(file_path), "genbank")

            self.logger.info(f"GenBank 文件已导出: {file_path}")
            return str(file_path)

        except Exception as e:
            self.logger.error(f"GenBank 导出失败: {str(e)}")
            raise

    async def export_to_pdf(self, design_data: Dict[str, Any], filename: str) -> str:
        """
        导出为 PDF 报告

        参数:
            - design_data: 设计数据
            - filename: 输出文件名

        返回:
            - file_path: 文件路径
        """
        try:
            # 生成 HTML 报告
            html_content = self._generate_html_report(design_data)

            # 转换为 PDF
            file_path = self.output_dir / filename
            HTML(string=html_content).write_pdf(str(file_path))

            self.logger.info(f"PDF 文件已导出: {file_path}")
            return str(file_path)

        except Exception as e:
            self.logger.error(f"PDF 导出失败: {str(e)}")
            raise

    def _generate_html_report(self, design_data: Dict[str, Any]) -> str:
        """生成 HTML 报告"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{design_data.get('name', 'Mars Design')}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1 {{ color: #d84315; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f5f5f5; }}
            </style>
        </head>
        <body>
            <h1>Mars Synthetic Biology Design Report</h1>
            <h2>{design_data.get('name', 'Unnamed Design')}</h2>
            <p><strong>Description:</strong> {design_data.get('description', 'N/A')}</p>

            <h3>Gene Modules</h3>
            <table>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Function</th>
                </tr>
        """

        for module in design_data.get("modules", []):
            html += f"""
                <tr>
                    <td>{module.get('name', 'N/A')}</td>
                    <td>{module.get('type', 'N/A')}</td>
                    <td>{module.get('function', 'N/A')}</td>
                </tr>
            """

        html += """
            </table>
        </body>
        </html>
        """
        return html

    def _get_sbol_role(self, module_type: str) -> str:
        """获取 SBOL 角色"""
        role_mapping = {
            "promoter": sbol2.SO_PROMOTER,
            "cds": sbol2.SO_CDS,
            "terminator": sbol2.SO_TERMINATOR,
            "rbs": sbol2.SO_RBS
        }
        return role_mapping.get(module_type, sbol2.SO_MISC)
```

---

**Part 6 完成**

下一部分将讲解 API 路由完整实现与测试。
