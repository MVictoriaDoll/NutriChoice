import { useState } from "react";
import { Dashboard } from "./components/Dashboard/Dashboard";

export default function App() {
  const [showDashboard, setShowDashboard] = useState<boolean>(true);
  return (
    <main>
      {showDashboard ? (
        <Dashboard />

      ) : (<div>Welcome screen placeholder</div>)

      }

    </main>
  );
}


