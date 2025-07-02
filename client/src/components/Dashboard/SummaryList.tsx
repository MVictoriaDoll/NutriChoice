import type { NutritionSummary } from "../../Types/dashboard";
import './Dashboard.css';

type Props = {
  freshFoodsPercentage: NutritionSummary["freshFoodsPercentage"];
  highSugarItemsPercentage: NutritionSummary["highSugarItemsPercentage"];
  processedFoodPercentage: NutritionSummary["processedFoodPercentage"];
  goodNutriScorePercentage: NutritionSummary['goodNutriScorePercentage'];
};

//shows a breakdown of food categories with icons and percentages
export default function SummaryList (props:Props){
  const { 
  freshFoodsPercentage, 
  highSugarItemsPercentage, 
  processedFoodPercentage,
  goodNutriScorePercentage } = props; 
  
   const items = [
    {
      label: '% Fresh Food',
      value: freshFoodsPercentage,
      iconClass: 'fa-solid fa-apple-whole',
      color:"#22c55e",
    },
    {
      label: '% High Sugar Item',
      value: highSugarItemsPercentage,
      iconClass:'fa-solid fa-ice-cream',
      color:"#f87171",
    },
    {
      label: '% Processed Food',
      value: processedFoodPercentage,
      iconClass:'fa-solid fa-burger',
      color:"#facc15",
    }, 
      {
      label: '% Nutri-score',
      value: goodNutriScorePercentage,
      iconClass: 'fas fa-check-circle',
      color:"#4ade80",
    },

  ];  

  return (
    <ul className="summary-list">
    {items.map((item) => (
      <li key={item.label} className="summary-item">
         {/* Colored icon */}
        <span className="icon" style={{ backgroundColor: item.color}}>
            <i className={item.iconClass}></i>
        </span>
        <span className="label">{item.label}</span>
        <span className="value">{Math.round(item.value)}%</span>
      </li>
    ))

    }

    </ul>
  )
}