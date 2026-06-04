"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function BarChartBox({
  data = [],
  xKey = "name",
  barKey = "value",
  height = 300,
  color = "#0E73B8",
  radius = [6, 6, 0, 0],
  showGrid = true,
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={barKey} fill={color} radius={radius} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}