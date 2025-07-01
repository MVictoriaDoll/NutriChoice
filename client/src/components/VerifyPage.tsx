import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Item } from '../Types/verifypage';
import { useAuth0 } from '@auth0/auth0-react';

import './VerifyPage.css';


export default function VerifyPage() {
  const [items, setItems] = useState<Item[]>([]);

  const {receiptId} = useParams();
  const { getAccessTokenSilently } = useAuth0();

  
  // Initial state with mock items (simulating the uploaded receipt data)
  /*const [items, setItems] = useState([
    {
      id: '1',
      originalBillLabel: 'Chocapic',
      aiSuggestedName: 'Cereal',
      price: 4.5,
      isFoodItem: true,
      classification: 'High Sugar',
    },
    {
      id: '2',
      originalBillLabel: 'Pepsi Max',
      aiSuggestedName: 'Soda',
      price: 3.0,
      isFoodItem: false,
      classification: 'Processed',

    }
  ]);*/

  const navigate = useNavigate();
    // Navigate to the dashboard when user confirms the list
  const handleConfirm = () =>   {
    navigate('/dashboard');
  }
  
useEffect(() => {
  if (!receiptId) return;

  const fetchReceiptItems = async () => {
    try {
      const token = await getAccessTokenSilently();

      const response = await fetch(`http://localhost:4000/api/receipts/${receiptId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch receipt');
      }

      const data = await response.json();
      console.log('✅ Data recibida del backend:', data);
      setItems(data.items || []);
    } catch (error) {
      console.error('❌ Error fetching receipt:', error);
    }
  };

  fetchReceiptItems();
}, [receiptId, getAccessTokenSilently]);




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