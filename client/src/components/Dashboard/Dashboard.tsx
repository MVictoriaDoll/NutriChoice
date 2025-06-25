import React from "react";
import Score from './Score';
import { useNavigate } from 'react-router-dom';
import SummaryList from './SummaryList';
import './Dashboard.css';

export function Dashboard() {
const navigate = useNavigate();
  return (
    <section className="dashboard">
      <h2 className="analysis-title">Shopping Analysis</h2>
      <Score
        nutritionScore={72}
        freshFoodsPercentage={45}
        highSugarItemsPercentage={15}
        processedFoodPercentage={30}

      />
      <SummaryList
        freshFoodsPercentage={45}
        highSugarItemsPercentage={15}
        processedFoodPercentage={30}
        goodNutriScorePercentage={60} />
  
      {/* Button to navigate to the Feedback page (Page 4 - Groceries list idea). That page will display:
      - Healthy items frequently bought 
      - Missing nutrition recommendations
      - Least unhealthy "sin" items (like snacks or ice cream)*/}
        <button
      className="feedback-button"
      onClick={() => navigate('/feedback')}
    >
      Get Feedback
    </button>
    </section>
  );
}