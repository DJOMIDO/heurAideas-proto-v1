#!/usr/bin/env python3
# backend/scripts/import_template.py
"""
模板导入脚本（幂等版本）
如果模板已存在，跳过导入
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from app.database import SessionLocal, engine, Base
from app.models.template import ProjectTemplate, TemplateStep, TemplateSubstep, TemplateSubtask

# ========== 完整的 6 个 Steps 模板数据（保持不变） ==========
TEMPLATE_DATA = [
    # Step 1
    {
        "id": 1,
        "title": "Prerequisite",
        "description": "To be completed...",
        "status": "todo",
        "substeps": [
            {
                "id": "1.1",
                "title": "System of Interest context definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Activity definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "System of Interest definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "c", "title": "SoIs value definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "d", "title": "Stakeholders needs definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            },
            {
                "id": "1.2",
                "title": "Definition of the project's stakeholders",
                "description": "",
                "status": "todo",
                "subtasks": []
            },
            {
                "id": "1.3",
                "title": "HE confirmation",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Definition of the HE motivation", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "HE timeline", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            },
            {
                "id": "1.4",
                "title": "Inspection Degrees of Freedom definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Individual Degree of Freedom", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "External Degree of Freedom", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            },
            {
                "id": "1.5",
                "title": "Inspection protocol validation",
                "description": "",
                "status": "todo",
                "subtasks": []
            }
        ]
    },
    # Step 2
    {
        "id": 2,
        "title": "Activity analysis",
        "description": "To be completed...",
        "status": "todo",
        "substeps": [
            {
                "id": "2.1",
                "title": "Activity analysis \"frame\" selection",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Analytical orientation definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "Theoretical reference selection", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "c", "title": "Validation of the analysis frame", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "d", "title": "Selection of the representation format", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            },
            {
                "id": "2.2",
                "title": "Selection of the data collection method selection",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Data source identification", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "Data collection method identification", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "c", "title": "Data collection method selection", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            },
            {
                "id": "2.3",
                "title": "Activity analysis application",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Activity decomposition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "Activity characterization", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            }
        ]
    },
    # Step 3
    {
        "id": 3,
        "title": "Definition of the heuristic's knowledge domain (KD)",
        "description": "To be completed...",
        "status": "todo",
        "substeps": [
            {
                "id": "3.1",
                "title": "KD conceptualization",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "KD documentation", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "KD concepts identification", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "c", "title": "KD concepts selection", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "d", "title": "KD conceptual card definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            },
            {
                "id": "3.2",
                "title": "KD's concepts correlation",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "KD's concepts mapping", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "KD's correlation with activity characteristics", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            }
        ]
    },
    # Step 4
    {
        "id": 4,
        "title": "Interaction analysis",
        "description": "To be completed...",
        "status": "todo",
        "substeps": [
            {
                "id": "4.1",
                "title": "Interaction analytical frame development",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Interaction theory selection", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "Interaction analytical frame validation", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "c", "title": "Interaction questionnaire development", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            },
            {
                "id": "4.2",
                "title": "Interaction definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "AS-IS interaction context definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "TO-BE interaction context definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "c", "title": "Interaction criticality analysis", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "d", "title": "Interaction demension weigthing", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            }
        ]
    },
    # Step 5
    {
        "id": 5,
        "title": "Design rationales analysis",
        "description": "To be completed...",
        "status": "todo",
        "substeps": [
            {
                "id": "5.1",
                "title": "Corpus definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Design corpus development", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "Design corpus selection", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "c", "title": "Design corpus metadata definition", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            },
            {
                "id": "5.2",
                "title": "System's design rationales analysis",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {"id": "a", "title": "Design corpus review", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"},
                    {"id": "b", "title": "Design corpus analysis", "description": "To be completed...", "objective": "", "actions": "", "recommendedDocumentation": "", "status": "todo"}
                ]
            }
        ]
    },
    # Step 6
    {
        "id": 6,
        "title": "Heuristics and guidelines definition",
        "description": "To be completed...",
        "status": "todo",
        "substeps": [
            {
                "id": "6.1",
                "title": "Data correlation",
                "description": "",
                "status": "todo",
                "subtasks": []
            },
            {
                "id": "6.2",
                "title": "Heuristic writting",
                "description": "",
                "status": "todo",
                "subtasks": []
            },
            {
                "id": "6.3",
                "title": "Guideline's writting",
                "description": "",
                "status": "todo",
                "subtasks": []
            }
        ]
    }
]
# ========== 模板数据结束 ==========


def import_template(db: Session):
    """导入模板数据（幂等：如果已存在则跳过）"""
    
    # 幂等检查：如果已有模板数据，跳过导入
    existing_count = db.query(TemplateStep).count()
    if existing_count > 0:
        print(f"Templates already exist ({existing_count} steps), skipping import")
        return True
    
    # 1. 清理旧数据（只在首次导入时执行）
    print("清理旧模板数据...")
    db.query(TemplateSubtask).delete()
    db.query(TemplateSubstep).delete()
    db.query(TemplateStep).delete()
    db.query(ProjectTemplate).delete()
    db.commit()
    print("旧数据已清理")
    
    # 2. 创建模板主记录
    template = ProjectTemplate(
        name="Heuristic Evaluation",
        version="v1.0",
        description="Standard heuristic evaluation methodology",
        is_default=True,
        is_active=True
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    print(f"\n创建模板：{template.name} (ID={template.id})")
    
    # 3. 遍历步骤数据
    total_substeps = 0
    total_subtasks = 0
    
    for step_data in TEMPLATE_DATA:
        step = TemplateStep(
            template_id=template.id,
            code=str(step_data["id"]),
            title=step_data["title"],
            description=step_data.get("description", ""),
            order=step_data["id"]
        )
        db.add(step)
        db.commit()
        db.refresh(step)
        
        print(f"\n步骤 {step.code}: {step.title}")
        
        # 4. 遍历子步骤数据
        for substep_idx, substep_data in enumerate(step_data.get("substeps", [])):
            substep = TemplateSubstep(
                template_step_id=step.id,
                code=substep_data["id"],
                title=substep_data["title"],
                description=substep_data.get("description", ""),
                order=substep_idx + 1
            )
            db.add(substep)
            db.commit()
            db.refresh(substep)
            
            total_substeps += 1
            print(f"   └─ 子步骤 {substep.code}: {substep.title}")
            
            # 5. 遍历子任务数据
            for subtask_idx, subtask_data in enumerate(substep_data.get("subtasks", [])):
                field_config = {
                    "fields": [
                        {"name": "activityName", "type": "input", "label": "Activity Name", "required": True},
                        {"name": "activityDefinition", "type": "textarea", "label": "Activity Definition", "required": True},
                        {"name": "primaryElements", "type": "table", "label": "Primary Elements", "columns": ["Element", "Definition"]},
                        {"name": "soiStakeholder", "type": "input", "label": "SoI Stakeholder"},
                        {"name": "systemsEngineer", "type": "input", "label": "Systems Engineer"},
                        {"name": "stakeholderRoles", "type": "list", "label": "Stakeholder Roles"},
                        {"name": "additionalStakeholders", "type": "textarea", "label": "Additional Stakeholders"}
                    ]
                }
                
                subtask = TemplateSubtask(
                    template_substep_id=substep.id,
                    code=subtask_data["id"],
                    title=subtask_data["title"],
                    description=subtask_data.get("description", ""),
                    objective=subtask_data.get("objective", ""),
                    actions=subtask_data.get("actions", ""),
                    recommended_documentation=subtask_data.get("recommendedDocumentation", ""),
                    field_config=field_config,
                    order=subtask_idx + 1
                )
                db.add(subtask)
                db.commit()
                db.refresh(subtask)
                
                total_subtasks += 1
    
    print(f"\n{'='*60}")
    print(f"模板导入完成！")
    print(f"   模板 ID: {template.id}")
    print(f"   模板名称：{template.name}")
    print(f"   版本：{template.version}")
    print(f"   步骤数：{len(TEMPLATE_DATA)}")
    print(f"   子步骤数：{total_substeps}")
    print(f"   子任务数：{total_subtasks}")
    print(f"{'='*60}")
    return True


def main():
    """主函数"""
    db = SessionLocal()
    try:
        import_template(db)
    except Exception as e:
        print(f"导入失败：{e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
    