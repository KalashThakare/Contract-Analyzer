"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Summary } from "@/types";

const COLORS = ["#dc2626", "#d97706", "#059669"];

interface RiskGaugeProps {
  summary: Summary;
}

export default function RiskGauge({ summary }: RiskGaugeProps) {
  const data = [
    { name: "High Risk", value: summary.high_risk_count },
    { name: "Medium Risk", value: summary.medium_risk_count },
    { name: "Low Risk", value: summary.low_risk_count },
  ].filter((d) => d.value > 0);

  return (
    <div className="panel-card p-4 mt-3">
      <h2 className="section-heading">Distribution</h2>
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={
              ((v: number) => [v + " clauses"]) as never
            }
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: "#64748b" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
