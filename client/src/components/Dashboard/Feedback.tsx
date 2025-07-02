import "./Dashboard.css";

export default function Feedback() {
  return (
    <section className="dashboard">
      <h2 className="analysis-title">Your Grocery Feedback</h2>
      <article className="feedback-card">
        <div className="feedback-text"> 
          Your grocery choices this week included a mix of fresh and processed items.
          <h3 className="feedback-subtitle"> What You Did Well</h3>
          <p>Well done on including legumes like lentils and green peas — great plant-based proteins!</p>
          <h3 className="feedback-subtitle"> What to Improve</h3>
          <p> However, consider reducing the number of ultra-processed snacks like chips, cookies, and sugary drinks.
          Try to balance your meals by adding more fruits and fresh vegetables next time.
          Keep an eye on items high in salt like processed meats and salty snacks.</p>
        </div> 
        <p className="feedback-text">
           Your effort to shop consciously is a great step toward healthier habits!
        </p>
        <p className="feedback-tip">
          💬 Tip: Swap processed snacks for nuts or fresh fruits!
        </p>
      </article>
    </section>
  );
}
