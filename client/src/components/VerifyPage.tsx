import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, FC } from 'react';
import { getReceiptById, verifyReceipt } from '../services/apiService';
import type { Item } from '../Types/verifypage';
import './VerifyPage.css';


export default function VerifyPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { receiptId } = useParams<{ receiptId: string }>();
  const navigate = useNavigate();
  // Navigate to the dashboard when user confirms the list

  useEffect(() => {
    if (!receiptId) {
      setError('No receipt ID found in URL');
      setIsLoading(false);
      return;
    };

    const fetchReceiptItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getReceiptById(receiptId);
        console.log('Data received from backend:', data);
        setItems(data.items || []);
      } catch (err: any) {
        console.error('Error fetching receipt', err);
        setError(err.response?.data?.message || 'Failed to fetch receipt data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReceiptItems();
  }, [receiptId]);

  const handleConfirm = async () => {
    if (!receiptId) return;
    const calculatedSummary = {
      /*...calculation logic ...*/
      calculatedScore: 0,
      freshFoods: 0,
      highSugarItems: 0,
      processedFood: 0,
      goodNutriScore: 0,
    };

    const foodItemCount = items.filter(item => item.isFoodItem).length;
    if (foodItemCount > 0) {
      let freshCount = 0, sugarCount = 0, processedCount = 0, goodScoreCount = 0;
      items.forEach(item => {
        if (item.isFoodItem) {
          switch (item.classification) {
            case 'Fresh Food': freshCount++; break;
            case 'High Sugar': sugarCount++; break;
            case 'Processed': processedCount++; break;
            case 'Good Nutri-Score': goodScoreCount++; break;
          }
        }
      });
      calculatedSummary.freshFoods = (freshCount / foodItemCount) * 100;
      calculatedSummary.highSugarItems = (sugarCount / foodItemCount) * 100;
      calculatedSummary.processedFood = (processedCount / foodItemCount) * 100;
      calculatedSummary.goodNutriScore = (goodScoreCount / foodItemCount) * 100;
      calculatedSummary.calculatedScore = (calculatedSummary.freshFoods + calculatedSummary.goodNutriScore) - (calculatedSummary.processedFood + calculatedSummary.highSugarItems);
    };

    try {
      await verifyReceipt(receiptId, {
        items: items,
        nutritionSummary: calculatedSummary,
        aiFeedbackReceipt: 'User verified',
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error verifying receipt:', err);
      setError('Failed to save your changes. Please try again.');
    }
  }


  const toggleIsFood = (id: string) => {

    const updatedItems = items.map(item =>
      item.id === id ? { ...item, isFoodItem: !item.isFoodItem } : item
    );
    setItems(updatedItems);

  };
  // Update AI-suggested name when user types in the input

  const handleAiSuggestedName = (id: string, newValue: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, aiSuggestedName: newValue } : item
    );
    setItems(updatedItems);
  };

  if (isLoading) {
    return <div className="verify-page"><p>Loading receipt data...</p></div>;
  }

  if (error) {
    return <div className="verify-page"><p className="upload-error">Error: {error}</p></div>;
  }

  return (
    <section className='verify-page'>
      <h2 className='verify-title'>Verify your Items</h2>
      <ul className='verify-list'>
        {items.map(item => (
          <li key={item.id} className='verify-item'>
            {/* Original product label as shown on the receipt */}
            <p className='verify-label'>Original label: {item.originalBillLabel}</p>
            {/* Editable input for AI-suggested name */}
            <p className='verify-suggestion'>
              AI suggestion:
              <input className='verify-input' type="text" value={item.aiSuggestedName} onChange={(e) => handleAiSuggestedName(item.id, e.target.value)} />
            </p>
            {/* Price as shown on the receipt (not editable) */}
            <p className='verify-price'>Price: ${item.price}</p>
            {/* Toggle to mark if item is food or not */}
            <p className='verify-food'> {/*Is Food: {''}*/}
              <button className='verify-toggle-btn' onClick={() => toggleIsFood(item.id)}>
                {item.isFoodItem ? 'Is Food 🍎' : 'Not Food 🚫'}
              </button>
            </p>
            <p className='verify-category'>Category: {item.classification}</p>

          </li>
        ))}
      </ul>
      {/* Confirm and go to the dashboard */}
      <button className="verify-confirm-button" onClick={handleConfirm}>
        Confirm and continue
      </button>

    </section>

  );
}