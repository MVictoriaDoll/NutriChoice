import React from "react";
import Score from './Score';
import SummaryList from './SummaryList';
import Feedback from './Feedback';
import './Dashboard.css';

export function Dashboard () {
  return (
    <section>
      <h2>Shopping Analysis</h2>
      <Score/>
      <SummaryList/>
      <Feedback/>
    </section>
  );
}