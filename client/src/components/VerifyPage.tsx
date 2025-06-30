import { useNavigate} from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Item } from '../Types/verifypage';
import { useParams } from 'react-router-dom';

import './VerifyPage.css';



export default function VerifyPage() {
 const { receiptId } = useParams();


  console.log('VerifyPage mounted');
 console.log('receiptId from useParams:', receiptId);


  const [items, setItems] = useState<Item[]>([]);
  const navigate = useNavigate();

  //const {receiptId} = useParams();


  // Navigate to the dashboard when user confirms the list
  const handleConfirm = async () => {
  if (!receiptId) return;

  try {
    const response = await fetch(`http://localhost:3000/api/receipts/${receiptId}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': '68613d982ab9f1d60d54d2b6',
      },
      body: JSON.stringify({
        items,
        nutritionSummary: {},  
        aiFeedbackReceipt: "", 
      }),
    });

    if (!response.ok) {
      throw new Error('Error verifying receipt');
    }

    console.log(' Receipt verified');
    navigate('/dashboard');
  } catch (error) {
    console.error('Error verifying receipt:', error);
    alert('There was an error verifying your receipt');
  }
};

  
useEffect (() => {
  if(!receiptId) return;
  console.log('🔍 Starting fetch for receiptId:', receiptId);
  const fetchReceiptItems = async () => {
    try {
      const response = await fetch (`http://localhost:3000/api/receipts/${receiptId}`, {
        headers: {
          'X-User-Id': '68613d982ab9f1d60d54d2b6',

        },
      });

      if(!response.ok) {
        throw new Error('Failed to fetch receipt');
      }

      const data = await response.json();
      console.log('data recibida del backend:', data);
      setItems(data.items || []);

    } catch (error){
      console.error('Erro fetching receip', error)
    }
  };
  fetchReceiptItems();
}, [receiptId]);



  // Toggle food icon when user clicks the button

  const toggleIsFood = (id: string) => {

    const updatedItems = items.map(item =>
      item.id === id ? { ...item, isFoodItem: !item.isFoodItem } : item
    );
    setItems(updatedItems);

  };
   // Update AI-suggested name when user types in the input

  const handleAiSuggestedName = (id:string, newValue:string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, aiSuggestedName: newValue } : item
    );
    setItems(updatedItems);

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
             <input className='verify-input' type="text" value={item.aiSuggestedName} onChange={(e)=> handleAiSuggestedName(item.id, e.target.value)} />
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