//import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './VerifyPage.css';

export default function VerifyPage () {
  const [items, setItems] = useState([
    {
      id:'1',
      originalBillLabel: 'Chocapic',
      aiSuggestedName: 'Cereal',
      price: 4.5,
      isFoodItem: true,
      classification: 'High Sugar',
    }, 
    {
      id:'2',
      originalBillLabel: 'Pepsi Max',
      aiSuggestedName: 'Soda',
      price: 3.0,
      isFoodItem: false,
      classification: 'Processed',

    }
  ]);
  //const navigate = useNavigate();

  /*const handleConfirm = () =>   {
    navigate('/dashboard');
  }*/
  
    const toggleIsFood=(id:string) => {

      const updatedItems = items.map(item => 
        item.id === id ? {...item, isFoodItem: !item.isFoodItem}: item
      );
      setItems(updatedItems);

    };


  return(
    <section className='verify-page'>
      <h2 className='verify-title'>Verify your Items</h2>
      <ul className='verify-list'>
        {items.map(item =>(
          <li key={item.id} className='verify-item'>
            <p className='verify-label'>Original label: {item.originalBillLabel}</p>
            <p className='verify-suggestion'>AI suggestion: {item.aiSuggestedName}</p>
            <p className='verify-price'>Price: ${item.price}</p>
            <p className='verify-food'>Is Food: {''}
              <button className='verify-toggle-btn' onClick={() => toggleIsFood(item.id)}>
                {item.isFoodItem ? '✅': '❌'}
              </button>
            </p>
            <p className='verify-category'>Category: {item.classification}</p>

          </li>
        ))}
      </ul>

    </section>
  
  );
}