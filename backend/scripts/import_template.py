#!/usr/bin/env python3

import json
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from app.database import SessionLocal, engine, Base
from app.models.template import ProjectTemplate, TemplateStep, TemplateSubstep, TemplateSubtask

# 模板数据
TEMPLATE_DATA = [
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
                    {
                        "id": "a",
                        "title": "Activity definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo"
                    },
                    {
                        "id": "b",
                        "title": "System of Interest definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo"
                    },
                    {
                        "id": "c",
                        "title": "SoIs value definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo"
                    },
                    {
                        "id": "d",
                        "title": "Stakeholders needs definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo"
                    }
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
                    {
                        "id": "a",
                        "title": "Definition of the HE motivation",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo"
                    },
                    {
                        "id": "b",
                        "title": "HE timeline",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo"
                    }
                ]
            },
            {
                "id": "1.4",
                "title": "Inspection Degrees of Freedom definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "Individual Degree of Freedom",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo"
                    },
                    {
                        "id": "b",
                        "title": "External Degree of Freedom",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo"
                    }
                ]
            }
        ]
    }
]


def import_template(db: Session):
    """导入模板数据"""
    
    # 1. 创建模板主记录
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
    
    print(f"创建模板：{template.name} (ID={template.id})")
    
    # 2. 遍历步骤数据
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
        
        print(f"创建步骤：{step.code} - {step.title}")
        
        # 3. 遍历子步骤数据
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
            
            print(f"创建子步骤：{substep.code} - {substep.title}")
            
            # 4. 遍历子任务数据
            for subtask_idx, subtask_data in enumerate(substep_data.get("subtasks", [])):
                # 构建 field_config（根据子任务字段）
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
                
                print(f"创建子任务：{subtask.code} - {subtask.title}")
    
    print(f"\n模板导入完成！")
    print(f"   模板 ID: {template.id}")
    print(f"   模板名称：{template.name}")
    print(f"   版本：{template.version}")

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
