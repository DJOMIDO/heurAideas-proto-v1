# backend/scripts/import_template.py

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from app.database import SessionLocal
from app.models.template import (
    ProjectTemplate,
    TemplateStep,
    TemplateSubstep,
    TemplateSubtask,
)

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
                        "status": "todo",
                        "formType": "subtask-1-1-a",
                    },
                    {
                        "id": "b",
                        "title": "System of Interest definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-1-b",
                    },
                    {
                        "id": "c",
                        "title": "SoIs value definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-1-c",
                    },
                ],
            },
            {
                "id": "1.2",
                "title": "Project stakeholder definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "Stakeholders definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-2-a",
                    },
                    {
                        "id": "b",
                        "title": "Value definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-2-b",
                    },
                ],
            },
            {
                "id": "1.3",
                "title": "Inspection project definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "Project definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-3-a",
                    },
                    {
                        "id": "b",
                        "title": "Inspection method selection",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-3-b",
                    },
                    {
                        "id": "c",
                        "title": "Heuristic concept definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-3-c",
                    },
                ],
            },
            {
                "id": "1.4",
                "title": "Inspection Degrees of Freedom definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "Team degree of freedom definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-4-a",
                    }
                ],
            },
            {
                "id": "1.5",
                "title": "Inspection project validation",
                "description": "Inspection process validation",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "Protocol validation",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-1-5-a",
                    }
                ],
            },
        ],
    },
    {
        "id": 2,
        "title": "Activity definition",
        "description": "To be completed...",
        "status": "todo",
        "substeps": [
            {
                "id": "2.1",
                "title": 'Activity analysis "frame" selection',
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "Analytical orientation definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-2-1-a",
                    },
                    {
                        "id": "b",
                        "title": "Theoretical reference selection",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-2-1-b",
                    },
                ],
            },
            {
                "id": "2.2",
                "title": "Selection of the data collection method selection",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "Data source identification",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-2-2-a",
                    },
                    {
                        "id": "b",
                        "title": "Data collection method identification",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-2-2-b",
                    },
                    {
                        "id": "c",
                        "title": "Data collection method selection",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-2-2-c",
                    },
                ],
            },
        ],
    },
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
                    {
                        "id": "a",
                        "title": "KD documentation",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-3-1-a",
                    },
                    {
                        "id": "b",
                        "title": "KD concepts identification",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-3-1-b",
                    },
                    {
                        "id": "c",
                        "title": "KD concepts selection",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-3-1-c",
                    },
                    {
                        "id": "d",
                        "title": "KD conceptual card definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-3-1-d",
                    },
                ],
            },
            {
                "id": "3.2",
                "title": "KD's concepts correlation",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "KD's concepts mapping",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-3-2-a",
                    },
                    {
                        "id": "b",
                        "title": "KD's correlation with activity characteristics",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-3-2-b",
                    },
                ],
            },
        ],
    },
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
                    {
                        "id": "a",
                        "title": "Interaction theory selection",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-4-1-a",
                    },
                    {
                        "id": "b",
                        "title": "Interaction analytical frame validation",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-4-1-b",
                    },
                    {
                        "id": "c",
                        "title": "Interaction questionnaire development",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-4-1-c",
                    },
                ],
            },
            {
                "id": "4.2",
                "title": "Interaction definition",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "AS-IS interaction context definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-4-2-a",
                    },
                    {
                        "id": "b",
                        "title": "TO-BE interaction context definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-4-2-b",
                    },
                    {
                        "id": "c",
                        "title": "Interaction criticality analysis",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-4-2-c",
                    },
                    {
                        "id": "d",
                        "title": "Interaction demension weigthing",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-4-2-d",
                    },
                ],
            },
        ],
    },
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
                    {
                        "id": "a",
                        "title": "Design corpus development",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-5-1-a",
                    },
                    {
                        "id": "b",
                        "title": "Design corpus selection",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-5-1-b",
                    },
                    {
                        "id": "c",
                        "title": "Design corpus metadata definition",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-5-1-c",
                    },
                ],
            },
            {
                "id": "5.2",
                "title": "System's design rationales analysis",
                "description": "",
                "status": "todo",
                "subtasks": [
                    {
                        "id": "a",
                        "title": "Design corpus review",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-5-2-a",
                    },
                    {
                        "id": "b",
                        "title": "Design corpus analysis",
                        "description": "To be completed...",
                        "objective": "",
                        "actions": "",
                        "recommendedDocumentation": "",
                        "status": "todo",
                        "formType": "subtask-5-2-b",
                    },
                ],
            },
        ],
    },
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
                "subtasks": [],
            },
            {
                "id": "6.2",
                "title": "Heuristic writting",
                "description": "",
                "status": "todo",
                "subtasks": [],
            },
            {
                "id": "6.3",
                "title": "Guideline's writting",
                "description": "",
                "status": "todo",
                "subtasks": [],
            },
        ],
    },
]


def sync_template(db: Session):
    print("Synchronizing template data...")

    print("Cleaning up data associated with old templates...")
    from sqlalchemy import text # pyright: ignore[reportMissingImports]
    
    print("Remove the foreign key reference from the project data to the template...")
    db.execute(text("UPDATE project_subtasks SET template_subtask_id = NULL"))
    db.execute(text("UPDATE project_substeps SET template_substep_id = NULL"))
    db.execute(text("UPDATE project_steps SET template_step_id = NULL"))
    db.execute(text("UPDATE projects SET template_id = NULL"))
    db.commit()

    db.query(TemplateSubtask).delete()
    db.query(TemplateSubstep).delete()
    db.query(TemplateStep).delete()
    db.query(ProjectTemplate).delete()
    db.commit()

    from sqlalchemy import text # pyright: ignore[reportMissingImports]
    
    print("Reset the ID sequence for the template table...")
    db.execute(text("ALTER SEQUENCE template_subtasks_id_seq RESTART WITH 1"))
    db.execute(text("ALTER SEQUENCE template_substeps_id_seq RESTART WITH 1"))
    db.execute(text("ALTER SEQUENCE template_steps_id_seq RESTART WITH 1"))
    db.execute(text("ALTER SEQUENCE project_templates_id_seq RESTART WITH 1"))
    db.commit()
    print("Old data has been cleared, and the sequence has been reset to 1.")

    template = ProjectTemplate(
        name="Heuristic Evaluation Framework",
        version="v2.1",
        description="Updated structure with dynamic form routing and task/subtask hierarchy",
        is_default=True,
        is_active=True,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    print(f"Creating Templates：{template.name} (ID={template.id}, Version={template.version})\n")

    total_substeps = 0
    total_subtasks = 0

    for step_data in TEMPLATE_DATA:
        step = TemplateStep(
            template_id=template.id,
            code=str(step_data["id"]),
            title=step_data["title"],
            description=step_data.get("description", ""),
            order=step_data["id"],
        )
        db.add(step)
        db.commit()
        db.refresh(step)
        print(f"Step {step.code}: {step.title}")

        for substep_idx, substep_data in enumerate(step_data.get("substeps", [])):
            substep = TemplateSubstep(
                template_step_id=step.id,
                code=substep_data["id"],
                title=substep_data["title"],
                description=substep_data.get("description", ""),
                order=substep_idx + 1,
            )
            db.add(substep)
            db.commit()
            db.refresh(substep)
            total_substeps += 1
            print(f"Substep {substep.code}: {substep.title}")

            for subtask_idx, subtask_data in enumerate(
                substep_data.get("subtasks", [])
            ):
                subtask = TemplateSubtask(
                    template_substep_id=substep.id,
                    code=subtask_data["id"],
                    title=subtask_data["title"],
                    description=subtask_data.get("description", ""),
                    objective=subtask_data.get("objective", ""),
                    actions=subtask_data.get("actions", ""),
                    recommended_documentation=subtask_data.get(
                        "recommendedDocumentation", ""
                    ),
                    field_config=None,
                    form_type=subtask_data.get("formType"),
                    order=subtask_idx + 1,
                )
                db.add(subtask)
                db.commit()
                db.refresh(subtask)
                total_subtasks += 1
                print(
                    f"      Subtask {subtask.code}: {subtask.title} [form_type={subtask.form_type}]"
                )

    print(f"\n{'='*60}")
    print(f"Template synchronization complete!")
    print(
        f"Summary: {len(TEMPLATE_DATA)} Steps | {total_substeps} Substeps | {total_subtasks} Subtasks"
    )
    print(f"The front end will dynamically match components based on the `form_type` field.")
    print(f"{'='*60}")
    return True


def main():
    db = SessionLocal()
    try:
        sync_template(db)
    except Exception as e:
        print(f"Synchronization failed: {e}")
        import traceback

        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
