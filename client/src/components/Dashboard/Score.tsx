import { PieChart, Pie, Cell } from "recharts";
import type { NutritionSummary } from "../../Types/dashboard";
import './Dashboard.css';

type Props = {
  nutritionScore: NutritionSummary['nutritionScore'];
  freshFoodsPercentage: NutritionSummary["freshFoodsPercentage"];
  highSugarItemsPercentage: NutritionSummary["highSugarItemsPercentage"];
  processedFoodPercentage: NutritionSummary["processedFoodPercentage"];
};

export default function Score({ nutritionScore, freshFoodsPercentage, highSugarItemsPercentage,processedFoodPercentage  }: Props) {

  // mock data  

  const data = [
    { name: "% fresh foods", value: freshFoodsPercentage, color: "#22c55e" },
    { name: "% high sugar items", value: highSugarItemsPercentage, color: "#f87171" },
    { name: "% processed food", value: processedFoodPercentage , color: "#facc15" },
  ];
  return (
    <div className="score-container">
      <PieChart width={220} height={220}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={75}
          outerRadius={90}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
      <div className="score-text">
        <div className="score-number">{nutritionScore}</div>
        <p className="score-title">NutriScore</p>
      </div>
    </div>
  )
}