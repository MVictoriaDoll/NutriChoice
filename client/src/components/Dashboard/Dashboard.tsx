import React from "react";
import Score from './Score';
import { useEffect, useState } from "react";
import type {NutritionSummary} from '../../Types/dashboard';
import { useNavigate } from 'react-router-dom';
import SummaryList from './SummaryList';
import './Dashboard.css';

export function Dashboard() {
const [summary, setSummary] = useState<NutritionSummary | null>(null);

useEffect(() => {
  const fetchSummary = async () => {
    try {
      const response = await fetch("http://localhost:3000/receipts", {
        headers: {
          "X-User-Id": "test-user-123",
        },
      });
      const data = await response.json();
      const last = data[data.length - 1]; // último recibo
      setSummary(last.nutritionSummary);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  fetchSummary();
}, []);

const navigate = useNavigate();

if(!summary) return <p>Loading...</p>
  return (
    <section className="dashboard">
      <h2 className="analysis-title">Shopping Analysis</h2>
      <Score
        nutritionScore={summary.nutritionScore}
        freshFoodsPercentage={summary.freshFoodsPercentage}
        highSugarItemsPercentage={summary.highSugarItemsPercentage}
        processedFoodPercentage={summary.processedFoodPercentage}

      />
      <SummaryList
        freshFoodsPercentage={summary.freshFoodsPercentage}
        highSugarItemsPercentage={summary.highSugarItemsPercentage}
        processedFoodPercentage={summary.processedFoodPercentage}
        goodNutriScorePercentage={summary.goodNutriScorePercentage} />
  
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