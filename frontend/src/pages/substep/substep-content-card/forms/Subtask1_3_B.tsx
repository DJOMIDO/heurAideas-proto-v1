// frontend/src/pages/substep/substep-content-card/forms/Subtask1_3_B.tsx

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

interface Subtask1_3_BProps {
  fieldPrefix: string;
}

export default function Subtask1_3_B({}: Subtask1_3_BProps) {
  // Hardcoded recommendations based on the answers from Subtask1_3_A
  const recommendations = [
    {
      method: "Heuristic Evaluation",
      subtitle: "Quick evaluation by the project team",
      score: 95,
      compatibility: "Highly Compatible",
      isRecommended: true,
      color: "green",
      rationale: ["Welcome to HeurAideas!"],
    },
    {
      method: "User Testing",
      subtitle: "Testing with real users",
      score: 80,
      compatibility: "Highly Compatible",
      isRecommended: false,
      color: "blue",
      rationale: ["Welcome to HeurAideas!"],
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-700 leading-relaxed">
        Based on your previous answers, analyse the recommendations and confirm
        if you would like to pursue with heuristics evaluation.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <Card
            key={rec.method}
            className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors h-full flex flex-col"
          >
            <CardContent className="p-6 space-y-4 flex flex-col flex-1">
              <div className="h-6 flex justify-center items-start">
                {rec.isRecommended && (
                  <span className="inline-block px-4 py-1 bg-gradient-to-r from-indigo-400 to-indigo-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wide shadow-sm">
                    RECOMMENDED
                  </span>
                )}
                {!rec.isRecommended && <div className="h-6 w-full"></div>}
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-4xl font-bold text-slate-900 leading-tight">
                  {rec.method}
                </h3>
                <p className="text-sm text-gray-500">{rec.subtitle}</p>

                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-6xl font-extrabold text-slate-900">
                    {rec.score}
                  </span>
                  <span className="text-4xl font-semibold text-gray-400">%</span>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${
                      rec.color === "green"
                        ? "bg-gradient-to-r from-green-300 to-green-700"
                        : "bg-gradient-to-r from-blue-300 to-blue-700"
                    }`}
                    style={{ width: `${rec.score}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      rec.color === "green" ? "bg-green-500" : "bg-blue-500"
                    }`}
                  />
                  <span className="text-base font-semibold text-gray-700">
                    {rec.compatibility}
                  </span>
                </div>
              </div>

              {/* Accordion - Rationale */}
              <Accordion
                type="single"
                collapsible
                className="w-full pt-2 mt-auto"
              >
                <AccordionItem
                  value="rationale"
                  className="border-t border-gray-200"
                >
                  <AccordionTrigger className="text-base font-medium text-gray-600 hover:text-gray-900 py-3">
                    Rationale
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 space-y-2 pt-1 pb-3">
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      {rec.rationale.map((point, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
