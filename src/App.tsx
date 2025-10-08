import { ParquetViewer } from "./ParquetViewer";
import { DuckDBProvider } from "./dashboards/DuckDBProvider";
import "./index.css";
import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "./dashboards/DashboardPage";

export function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<ParquetViewer />} />
        <Route
          path="/dashboard/:dashboardName"
          element={
            <DuckDBProvider>
              <DashboardPage />
            </DuckDBProvider>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
