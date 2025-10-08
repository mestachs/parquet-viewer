import { useParams } from "react-router-dom";
import { OrgUnitDashboard } from "./Dashboard";

export function DashboardPage() {
  const { dashboardName } = useParams<{ dashboardName: string }>();

  if (!dashboardName) {
    return <div>Dashboard not found</div>;
  }

  return <OrgUnitDashboard dashboardName={dashboardName} />;
}
