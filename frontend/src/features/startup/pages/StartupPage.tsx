import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  DEV_MODE,
  DEV_SKIP_STARTUP,
} from "../../../config/development";

import Brand from "../../../shared/branding";

import { hasHousehold } from "../services/startup";

export default function StartupPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (
      DEV_MODE &&
      DEV_SKIP_STARTUP
    ) {
      navigate("/app", {
        replace: true,
      });

      return;
    }

    if (hasHousehold()) {
      navigate("/app", {
        replace: true,
      });

      return;
    }

    navigate("/household", {
      replace: true,
    });
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