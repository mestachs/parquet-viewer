import { OrgUnitDashboard } from "./dashboards/Dashboard";
import { ParquetViewer } from "./ParquetViewer";
import { DuckDBProvider } from "./dashboards/DuckDBProvider";
import "./index.css";

export function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const showDashboard = urlParams.has("dashboard");

  return (
    <div className="app">
      {showDashboard ? (
        <DuckDBProvider>
          <OrgUnitDashboard />
        </DuckDBProvider>
      ) : (
        <ParquetViewer />
      )}
    </div>
  );
}

export default App;
