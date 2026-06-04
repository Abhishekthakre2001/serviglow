"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function LineChartBox({
  data = [],
  xKey = "name",
  lines = [],
  height = 260,
  showGrid = false,
  hideAxis = false,
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} hide={hideAxis} />
          <YAxis hide={hideAxis} />
          <Tooltip />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 3}
              dot={line.dot ?? true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}