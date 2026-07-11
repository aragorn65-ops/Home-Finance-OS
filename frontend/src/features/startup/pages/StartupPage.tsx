import Brand from "../../../shared/branding";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { hasHousehold } from "../services/startup";

export default function StartupPage() {
  const navigate = useNavigate();

  useEffect(() => {
  if (hasHousehold()) {
    navigate("/app", { replace: true });
  } else {
    navigate("/household", { replace: true });
  }
}, [navigate]);

  return (
  <div className="startup-page">
    <div className="startup-content">
      <Brand />

      <p className="startup-message">
        Preparing your workspace...
      </p>
    </div>
  </div>
);
}