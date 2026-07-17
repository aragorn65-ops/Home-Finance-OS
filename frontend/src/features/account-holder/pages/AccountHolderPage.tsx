import "./AccountHolderPage.css";

import {
  ShieldCheck,
} from "lucide-react";

import Input from "../../../shared/ui/Input";
import PageHeader from "../../../shared/ui/PageHeader";
import useReportingMonth from "../../../shared/hooks/useReportingMonth";
import {
  parseMonthInput,
} from "../../../shared/utils/monthSelection";

import CashFlowWidget from "../../dashboard/widgets/cash-flow/CashFlowWidget";
import DashboardSummary from "../../dashboard/widgets/dashboard-summary/DashboardSummary";
import NetWorth from "../../dashboard/widgets/NetWorth";

export default function AccountHolderPage() {
  const {
    selectedMonthValue,
    setSelectedMonthValue,
  } = useReportingMonth();

  const selectedMonth =
    parseMonthInput(
      selectedMonthValue
    );

  return (
    <div className="account-holder-page">
      <PageHeader
        title="Account Holder"
        subtitle="Private balance, cash-flow, and net-worth reporting prepared for login-based visibility."
        actions={
          <Input
            type="month"
            aria-label="Reporting month"
            value={selectedMonthValue}
            onChange={(event) =>
              setSelectedMonthValue(
                event.target.value
              )
            }
          />
        }
      />

      <section className="account-holder-page__notice">
        <ShieldCheck
          size={18}
          aria-hidden="true"
        />

        <p>
          This page is separated from the household
          dashboard so account-holder-only reporting can be
          protected when login is added.
        </p>
      </section>

      <section className="account-holder-page__grid">
        <div className="account-holder-page__wide">
          <DashboardSummary />
        </div>

        <NetWorth />

        <div className="account-holder-page__wide">
          <CashFlowWidget
            selectedMonth={
              selectedMonth
            }
          />
        </div>
      </section>
    </div>
  );
}
