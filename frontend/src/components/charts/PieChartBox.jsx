"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function PieChartBox({
  data = [],
  dataKey = "value",
  nameKey = "name",
  height = 280,
  outerRadius = 90,
  innerRadius = 0,
  showLegend = true,
  showLabel = true,
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            label={showLabel ? ({ percent }) => `${(percent * 100).toFixed(0)}%` : false}
          >
            {data.map((item, index) => (
              <Cell key={index} fill={item.color || "#3b82f6"} />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend verticalAlign="bottom" />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}