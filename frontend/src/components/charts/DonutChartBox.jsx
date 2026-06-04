"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DonutChartBox({
  data = [],
  height = 240,
  innerRadius = 55,
  outerRadius = 85,
  centerText = "",
  centerSubText = "",
}) {
  return (
    <div className="relative" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
          >
            {data.map((item, index) => (
              <Cell key={index} fill={item.color || "#3b82f6"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {(centerText || centerSubText) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerText && (
            <div className="text-xl font-bold text-slate-800">{centerText}</div>
          )}
          {centerSubText && (
            <div className="text-xs text-slate-500">{centerSubText}</div>
          )}
        </div>
      )}
    </div>
  );
}