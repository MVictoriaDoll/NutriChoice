import React, { useEffect, useState } from "react";
import Score from './Score';
import { useNavigate } from 'react-router-dom';
import SummaryList from './SummaryList';
import { getUserProfile } from "../../services/apiService";
import './Dashboard.css';

interface NutritionSummary {
  nutritionScore: number;
  freshFoodsPercentage: number;
  highSugarItemsPercentage: number;
  processedFoodPercentage: number;
  goodNutriScorePercentage: number;
}

export function Dashboard() {

  const navigate = useNavigate();
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profileData = await getUserProfile();

        if (profileData && profileData.nutritionSummary) {
          setSummary(profileData.nutritionSummary);
        } else {
          setSummary({
            nutritionScore: 0,
            freshFoodsPercentage: 0,
            highSugarItemsPercentage: 0,
            processedFoodPercentage: 0,
            goodNutriScorePercentage: 0,
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard data: ', err);
        setError(err.response?.data?.message || 'Could not load your summary.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (isLoading) {
    return <div className="dashboard"><p>Loading your analysis...</p></div>;
  }

  if (error) {
    return <div className="dashboard"><p className="upload-error">Error: {error}</p></div>;
  }

  if (!summary) {
    return <div className="dashboard"><p>No nutrition data available yet. Upload a receipt to get started!</p></div>;
  }



  return (
    <section className="dashboard">
      <h2 className="analysis-title">Shopping Analysis</h2>
      <Score
        nutritionScore={summary.nutritionScore}
        freshFoodsPercentage={Math.round(summary.freshFoodsPercentage)}
        highSugarItemsPercentage={Math.round(summary.highSugarItemsPercentage)}
        processedFoodPercentage={Math.round(summary.processedFoodPercentage)}
        goodNutriScorePercentage={Math.round(summary.goodNutriScorePercentage)}

      />
      <SummaryList
        freshFoodsPercentage={Math.round(summary.freshFoodsPercentage)}
        highSugarItemsPercentage={Math.round(summary.highSugarItemsPercentage)}
        processedFoodPercentage={Math.round(summary.processedFoodPercentage)}
        goodNutriScorePercentage={Math.round(summary.goodNutriScorePercentage)} />

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