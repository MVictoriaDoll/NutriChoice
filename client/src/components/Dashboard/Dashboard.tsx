import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Score from "./Score";
import SummaryList from "./SummaryList";
import "./Dashboard.css";

type Summary = {
  nutritionScore: number;
  freshFoodsPercentage: number;
  highSugarItemsPercentage: number;
  processedFoodPercentage: number;
  goodNutriScorePercentage: number;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [summary, setSummary] = useState<Summary | null>(null);

useEffect(() => {
  const fetchSummary = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `http://localhost:3000/api/receipts/analysis`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error("Dashboard summary error:", err);
    }
  };

  fetchSummary(); // ya no hace falta el if(receiptId)
}, [getAccessTokenSilently]);


  return (
    <section className="dashboard">
      <h2 className="analysis-title">Shopping Analysis</h2>
      <Score
        nutritionScore={summary?.nutritionScore || 0}
        freshFoodsPercentage={summary?.freshFoodsPercentage || 0}
        highSugarItemsPercentage={summary?.highSugarItemsPercentage || 0}
        processedFoodPercentage={summary?.processedFoodPercentage || 0}
      />
      <SummaryList
        freshFoodsPercentage={summary?.freshFoodsPercentage || 0}
        highSugarItemsPercentage={summary?.highSugarItemsPercentage || 0}
        processedFoodPercentage={summary?.processedFoodPercentage || 0}
        goodNutriScorePercentage={summary?.goodNutriScorePercentage || 0}
      />
      <button
        className="feedback-button"
        onClick={() => navigate("/feedback")}
      >
        Get Feedback
      </button>
    </section>
  );
}