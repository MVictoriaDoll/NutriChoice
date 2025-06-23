import type { NutritionSummary } from "../../Types/dashboard";
import './Dashboard.css';

type Props = {
  freshFoodsPercentage: NutritionSummary["freshFoodsPercentage"];
  highSugarItemsPercentage: NutritionSummary["highSugarItemsPercentage"];
  processedFoodPercentage: NutritionSummary["processedFoodPercentage"];
  goodNutriScorePercentage: NutritionSummary['goodNutriScorePercentage'];
};

export default function SummaryList (props:Props){
  const { 
  freshFoodsPercentage, 
  highSugarItemsPercentage, 
  processedFoodPercentage,
  goodNutriScorePercentage } = props; 
  
   const items = [
    {
      label: '% fresh food',
      value: freshFoodsPercentage,
      icon:'🥦',
      color:"#22c55e",
    },
    {
      label: '% high sugar item',
      value: highSugarItemsPercentage,
      icon:'🍭',
      color:"#f87171",
    },
    {
      label: '% processed food',
      value: processedFoodPercentage,
      icon:'🍔',
      color:"#facc15",
    }, 
      {
      label: '%Nutri-score',
      value: goodNutriScorePercentage,
      icon:'✅',
      color:"#4ade80",
    },

  ];  

  return (
    <ul className="summary-list">
    {items.map((item) => (
      <li key={item.label} className="summary-item">
        <span className="icon" style={{ backgroundColor: item.color}}>
          {item.icon}
        </span>
        <span className="label">{item.label}</span>
        <span className="value">{item.value}%</span>
      </li>
    ))

    }

    </ul>
  )
}