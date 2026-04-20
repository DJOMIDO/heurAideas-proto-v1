// frontend/src/pages/substep/substep-content-card/forms/Subtask1_3_A.tsx

import { Button } from "@/components/ui/button";
import TypingIndicator from "@/components/TypingIndicator";

interface Subtask1_3_AProps {
  fieldPrefix: string;
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
}

// Define the questions and options as a constant array
const QUESTIONS = [
  {
    id: "a",
    question: "What is the number of end-users available for inspection?",
    options: ["1-10", "11-30", "31-100", "100+"],
  },
  {
    id: "b",
    question:
      "What is the planned frequency of involvement of these end-users for the inspection?",
    options: ["Once", "Spare times", "Frequently", "As much as needed"],
  },
  {
    id: "c",
    question: "What is the users availability across iterations?",
    options: ["< 30min", "30-60min", "1-2h", "2-4h", ">4h"],
  },
  {
    id: "d",
    question: "Would they pass the inspection in:",
    options: ["A single session", "Multiple sessions"],
  },
  {
    id: "e",
    question: "What is the available total timeline for the inspection?",
    options: ["< 1 week", "2-4 weeks", "1-2 months", "3-6 months", "6+ months"],
  },
  {
    id: "f",
    question:
      "What is the maturity of the project? Does the project already have a prototype?",
    options: [
      "Concept",
      "Low-fidelity prototype",
      "High-fidelity prototype",
      "Beta",
      "Final product",
    ],
  },
  {
    id: "g",
    question: "What level of accuracy is required for this inspection?",
    options: ["Validated issue", "Projected issue", "No matter"],
  },
  {
    id: "h",
    question: "What is the expected frequency of the SoI inspection?",
    options: ["One-time", "Daily", "Weekly", "Monthly", "Annually"],
  },
  {
    id: "i",
    question: "What is the current project team experience in HCI inspections?",
    options: [
      "HCI-related formation",
      "Multiple previous experiences",
      "One or no experience",
    ],
  },
] as const;

export default function Subtask1_3_A({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
}: Subtask1_3_AProps) {
  const getValue = (qId: string) => formData[`${fieldPrefix}-q${qId}`] || "";
  const setValue = (qId: string, value: string) => {
    onFormDataChange(`${fieldPrefix}-q${qId}`, value);
  };

  return (
    <div className="space-y-8">
      {QUESTIONS.map((q) => (
        <div key={q.id} className="space-y-3">
          {/* Question Label */}
          <label className="text-sm font-bold text-black">
            {q.id.toUpperCase()}) {q.question}
          </label>

          {/* Option Button Group */}
          <div className="flex flex-wrap gap-2">
            {q.options.map((option) => {
              const isSelected = getValue(q.id) === option;
              return (
                <Button
                  key={option}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setValue(q.id, option)}
                  className={`
                    text-xs font-normal
                    ${
                      isSelected
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                    }
                    transition-all duration-150
                  `}
                >
                  {option}
                </Button>
              );
            })}
          </div>

          {/* TypingIndicator */}
          <TypingIndicator
            editingUsers={editingUsers}
            fieldName={`${fieldPrefix}-q${q.id}`}
          />
        </div>
      ))}
    </div>
  );
}
