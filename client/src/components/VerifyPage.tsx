import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import './VerifyPage.css'

export default function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { fileUrl } = (location.state as { fileUrl?: string }) || {}
  console.log('Uploaded file URL:', fileUrl)

  // Initial state with mock items (simulating the uploaded receipt data)
  const [items, setItems] = useState([
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
  ])

  // Toggle food icon when user clicks the button
  const toggleIsFood = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, isFoodItem: !item.isFoodItem } : item
    );
    setItems(updatedItems);
  };

  // Update AI-suggested name when user types in the input
  const handleAiSuggestedName = (id: string, newValue: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, aiSuggestedName: newValue } : item
    )
    setItems(updated)
  }

  const handleConfirm = async () => {
    if (fileUrl) {
      try {
        await fetch('/api/receipts/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl, items }),
        })
      } catch (err) {
        console.error('Failed to confirm receipt:', err)
      }
    }
    navigate('/dashboard')
  }

  return (
    <section className='verify-page'>
      <h2 className='verify-title'>Verify your Items</h2>
      <ul className='verify-list'>
        {items.map(item => (
          <li key={item.id} className='verify-item'>

            <p className='verify-label'>
              Original label: {item.originalBillLabel}
            </p>

            <p className='verify-suggestion'>
              AI suggestion:
              <input
                className='verify-input'
                type="text"
                value={item.aiSuggestedName}
                onChange={e => handleAiSuggestedName(item.id, e.target.value)}
              />
            </p>

            <p className='verify-price'>Price: ${item.price}</p>

            <p className='verify-food'>
              <button
                className='verify-toggle-btn'
                onClick={() => toggleIsFood(item.id)}
              >
                {item.isFoodItem ? 'Is Food 🍎' : 'Not Food 🚫'}
              </button>
            </p>

            <p className='verify-category'>Category: {item.classification}</p>
          </li>
        ))}
      </ul>

      <button
        className="verify-confirm-button"
        onClick={handleConfirm}
      >
        Confirm and continue
      </button>
    </section>
  )
}
