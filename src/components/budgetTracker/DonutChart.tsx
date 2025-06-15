import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Expense = {
  id: string;
  category: string;
  totalSpending: number;
};

type DonutChartProps = {
  expenses: Expense[];
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF4560",
  "#00E396",
  "#775DD0",
  "#FEB019",
];

const DonutChart: React.FC<DonutChartProps> = ({ expenses }) => {
  const data = Object.values(
    expenses.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = {
          name: curr.category.charAt(0).toUpperCase() + curr.category.slice(1),
          value: 0,
        };
      }
      acc[curr.category].value += curr.totalSpending;
      return acc;
    }, {} as Record<string, { name: string; value: number }>)
  );

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full md:max-w-screen-lg p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold text-center mb-4">Expenses</h2>

      {data.length === 0 ? (
        <p className="text-center text-gray-500">No expenses to display.</p>
      ) : (
        <div className="w-full h-[300px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                label
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold">${total.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
