// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/KnowledgeLevelChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { KnowledgeLevel } from "./types";
import { LEVEL_COLORS, LEVEL_LABELS } from "./types";

interface KnowledgeLevelChartProps {
  data: Record<string, any>;
  title: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  "heuristics-evaluation": "Heuristics Evaluation",
  "soi": "SoI",
  "systems-engineering": "Systems Engineering",
  "interaction-design": "Interaction Design",
  "inspected-criteria": "Inspected Criteria",
};

const levelToIndex = (level: KnowledgeLevel | string): number => {
  const levels: KnowledgeLevel[] = [
    "none",
    "very-low",
    "low",
    "medium",
    "high",
    "very-high",
  ];
  return levels.indexOf(level as KnowledgeLevel);
};

export default function KnowledgeLevelChart({
  data,
  title,
}: KnowledgeLevelChartProps) {
  const chartData = [
    {
      name: DOMAIN_LABELS["heuristics-evaluation"],
      level: data["heuristics-evaluation"] || "none",
    },
    {
      name: DOMAIN_LABELS["soi"],
      level: data["soi"] || "none",
    },
    {
      name: DOMAIN_LABELS["systems-engineering"],
      level: data["systems-engineering"] || "none",
    },
    {
      name: DOMAIN_LABELS["interaction-design"],
      level: data["interaction-design"] || "none",
    },
    {
      name: DOMAIN_LABELS["inspected-criteria"],
      level: data["inspected-criteria"] || "none",
    },
  ].map((item) => ({
    ...item,
    levelIndex: levelToIndex(item.level),
    fill: LEVEL_COLORS[item.level as KnowledgeLevel] || LEVEL_COLORS.none,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: -20, bottom: 70 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 10 }}
            interval={0}
          />

          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 11 }}
            tickFormatter={(value: number) =>
              LEVEL_LABELS[
                ["none", "very-low", "low", "medium", "high", "very-high"][
                  value
                ] as KnowledgeLevel
              ] || ""
            }
            width={80}
            allowDecimals={false}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const entry = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs">
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-gray-600">
                      Level:{" "}
                      {LEVEL_LABELS[entry.level as KnowledgeLevel] ||
                        entry.level}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar dataKey="levelIndex" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
