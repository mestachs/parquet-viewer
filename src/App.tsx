import { OrgUnitDashboard } from "./dashboards/Dashboard"
import { DuckDBProvider } from "./dashboards/DuckDBProvider";
import "./index.css";

export function App() {
  return (
    <div className="app">
      <DuckDBProvider>
        <OrgUnitDashboard/>
      </DuckDBProvider>
    </div>
  );
}

export default App;
