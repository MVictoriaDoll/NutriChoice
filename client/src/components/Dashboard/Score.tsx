import { PieChart, Pie, Cell } from "recharts";
import './Dashboard.css';


export default function Score() {

  // mock data  

  const data = [
    { name: "% fresh foods", value: 45, color: "#22c55e" },
    { name: "% high sugar items", value: 15, color: "#f87171" },
    { name: "% processed food", value: 30, color: "#facc15" },
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
        <div className="score-number">72</div>
        <p className="score-title">NutriScore</p>
      </div>
    </div>
  )
}