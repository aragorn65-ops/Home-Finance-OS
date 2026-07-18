import "./DashboardPage.css";

import {
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  HandCoins,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldCheck,
  Target,
  WalletCards,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";
import {
  useMemo,
  useState,
} from "react";

import { currencies } from "../../../shared/data/currencies";
import CurrencyRateLookupButton from "../../../shared/ui/CurrencyRateLookupButton";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "../../../shared/ui/Dialog";
import Input from "../../../shared/ui/Input";
import PageHeader from "../../../shared/ui/PageHeader";
import useReportingMonth from "../../../shared/hooks/useReportingMonth";
import formatCurrency from "../../../shared/utils/formatCurrency";
import {
  normalizeCurrency,
  roundCurrencyAmount,
  roundExchangeRate,
} from "../../../shared/utils/currencyConversion";
import {
  formatMonthLabel,
  isSameMonth,
  parseMonthInput,
} from "../../../shared/utils/monthSelection";

import {
  loadHousehold,
} from "../../household/services/householdStorage";
import HouseholdMemberService from "../../household/services/HouseholdMemberService";
import useSavings from "../../savings/hooks/useSavings";
import SettlementAllocationService from "../../settlements/services/SettlementAllocationService";
import SettlementApplicationDetailsService from "../../settlements/services/SettlementApplicationDetailsService";
import SettlementService from "../../settlements/services/SettlementService";
import TransactionService from "../../transactions/services/TransactionService";

import type {
  Transaction,
} from "../../transactions/models/Transaction";
import {
  normalizeTransactionCategory,
} from "../../transactions/models/TransactionCategory";
import type { SettlementAllocationOption } from "../../settlements/models/SettlementAllocationOption";
import type { Settlement } from "../../settlements/models/Settlement";

interface MetricCardProps {
  label: string;
  value: string;
  subtitle: string;
  tone: "danger" | "success" | "info" | "warning";
  icon: typeof ReceiptText;
}

interface CategoryTotal {
  category: string;
  amount: number;
  percentage: number;
}

interface SettlementPreviewItem {
  category: string;
  amount: number;
  count: number;
}

interface SettlementPreview {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  allocationCount: number;
  items: SettlementPreviewItem[];
}

function MetricCard({
  label,
  value,
  subtitle,
  tone,
  icon: Icon,
}: MetricCardProps) {
  return (
    <article className="dashboard-metric">
      <span
        className={[
          "dashboard-metric__icon",
          `dashboard-metric__icon--${tone}`,
        ].join(" ")}
      >
        <Icon
          size={17}
          aria-hidden="true"
        />
      </span>

      <div>
        <p className="dashboard-metric__label">
          {label}
        </p>

        <strong className="dashboard-metric__value">
          {value}
        </strong>

        <p className="dashboard-metric__subtitle">
          {subtitle}
        </p>
      </div>
    </article>
  );
}

function getCategoryTotals(
  transactions: Transaction[],
  selectedMonth: Date
): CategoryTotal[] {
  const expenses =
    transactions.filter(
      (transaction) =>
        transaction.isActive &&
        transaction.type === "expense" &&
        isSameMonth(
          transaction.transactionDate,
          selectedMonth
        )
    );

  const totalExpenses =
    expenses.reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const totalsByCategory =
    expenses.reduce<
      Record<string, number>
    >((totals, transaction) => {
      const category =
        normalizeTransactionCategory(
          transaction.category
        );

      totals[category] =
        (totals[category] ?? 0) +
        transaction.amount;

      return totals;
    }, {});

  return Object.entries(totalsByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        totalExpenses > 0
          ? Math.round(
              (amount / totalExpenses) *
                100
            )
          : 0,
    }))
    .sort(
      (first, second) =>
        second.amount - first.amount
    )
    .slice(0, 5);
}

function getMemberName(
  memberId: string
): string {
  return (
    HouseholdMemberService
      .getMemberById(memberId)
      ?.displayName ?? "Member"
  );
}

function roundCurrency(
  amount: number
): number {
  return (
    Math.round(amount * 100) /
    100
  );
}

function getTransactionReportingCurrency(
  transactions: Transaction[],
  fallbackCurrency: string
): string {
  const currencies =
    transactions
      .map((transaction) =>
        normalizeCurrency(
          transaction.baseCurrency,
          fallbackCurrency
        )
      )
      .filter(Boolean);

  if (currencies.length === 0) {
    return normalizeCurrency(
      fallbackCurrency
    );
  }

  const firstCurrency =
    currencies[0];

  return currencies.every(
    (currency) =>
      currency === firstCurrency
  )
    ? firstCurrency
    : normalizeCurrency(
        fallbackCurrency
      );
}

function getSettlementPreviews(
  allocations: SettlementAllocationOption[]
): SettlementPreview[] {
  const previews = new Map<
    string,
    SettlementPreview
  >();

  for (const allocation of allocations) {
    if (
      allocation.outstandingAmount <= 0
    ) {
      continue;
    }

    const previewKey =
      `${allocation.fromMemberId}::${allocation.toMemberId}`;

    const category =
      normalizeTransactionCategory(
        allocation.category
      );

    const existing =
      previews.get(previewKey);

    if (!existing) {
      previews.set(
        previewKey,
        {
          fromMemberId:
            allocation.fromMemberId,

          toMemberId:
            allocation.toMemberId,

          amount:
            allocation.outstandingAmount,

          allocationCount: 1,

          items: [
            {
              category,
              amount:
                allocation.outstandingAmount,
              count: 1,
            },
          ],
        }
      );

      continue;
    }

    const itemIndex =
      existing.items.findIndex(
        (item) =>
          item.category === category
      );

    const nextItems =
      [...existing.items];

    if (itemIndex >= 0) {
      nextItems[itemIndex] = {
        ...nextItems[itemIndex],

        amount:
          roundCurrency(
            nextItems[itemIndex].amount +
              allocation.outstandingAmount
          ),

        count:
          nextItems[itemIndex].count + 1,
      };
    } else {
      nextItems.push({
        category,
        amount:
          allocation.outstandingAmount,
        count: 1,
      });
    }

    previews.set(
      previewKey,
      {
        ...existing,

        amount:
          roundCurrency(
            existing.amount +
              allocation.outstandingAmount
          ),

        allocationCount:
          existing.allocationCount + 1,

        items:
          nextItems.sort(
            (first, second) =>
              second.amount -
              first.amount
          ),
      }
    );
  }

  return Array.from(
    previews.values()
  ).sort(
    (first, second) =>
      second.amount - first.amount
  );
}

function settlementBelongsToMonth(
  settlement: Settlement,
  selectedMonth: Date
): boolean {
  const applicationDetails =
    SettlementApplicationDetailsService
      .getBySettlementId(
        settlement.id
      );

  if (applicationDetails.length === 0) {
    return isSameMonth(
      settlement.settlementDate,
      selectedMonth
    );
  }

  return applicationDetails.some(
    (details) =>
      isSameMonth(
        details.transactionDate,
        selectedMonth
      )
  );
}

export default function DashboardPage() {
  const household =
    loadHousehold();

  const householdId =
    household?.id ?? "";

  const currency =
    household?.currency ?? "PHP";

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const {
    selectedMonthValue,
    setSelectedMonthValue,
  } = useReportingMonth();

  const selectedMonth =
    parseMonthInput(
      selectedMonthValue
    );

  const {
    summary: savingsSummary,
    activities: savingsActivities,
  } = useSavings();

  const transactions =
    useMemo(
      () =>
        TransactionService
          .getTransactions()
          .filter(
            (transaction) =>
              transaction.householdId ===
              householdId
          ),
      [householdId]
    );

  const monthlyExpenseTransactions =
    useMemo(
      () => {
        const referenceMonth =
          parseMonthInput(
            selectedMonthValue
          );

        return transactions.filter(
          (transaction) =>
            transaction.isActive &&
            transaction.type ===
              "expense" &&
            isSameMonth(
              transaction.transactionDate,
              referenceMonth
            )
        );
      },
      [
        transactions,
        selectedMonthValue,
      ]
    );

  const lockedExpenseCurrency =
    useMemo(
      () =>
        getTransactionReportingCurrency(
          monthlyExpenseTransactions,
          currency
        ),
      [
        monthlyExpenseTransactions,
        currency,
      ]
    );

  const [
    remittanceCurrency,
    setRemittanceCurrency,
  ] = useState(
    currency === "PHP"
      ? "SAR"
      : "PHP"
  );

  const [
    remittanceRate,
    setRemittanceRate,
  ] = useState(0);

  const [
    remittanceRateDate,
    setRemittanceRateDate,
  ] = useState(today);

  const [
    isRemittanceToolOpen,
    setIsRemittanceToolOpen,
  ] = useState(false);

  const monthlyExpenses =
    useMemo(
      () => {
        return monthlyExpenseTransactions
          .reduce(
            (total, transaction) =>
              total +
              transaction.amount,
            0
          );
      },
      [
        monthlyExpenseTransactions,
      ]
    );

  const monthlyContributions =
    useMemo(
      () => {
        const referenceMonth =
          parseMonthInput(
            selectedMonthValue
          );

        return savingsActivities
          .filter(
            (activity) =>
              activity.isActive &&
              activity.activityType ===
                "contribution" &&
              isSameMonth(
                activity.activityDate,
                referenceMonth
              )
          )
          .reduce(
            (total, activity) =>
              total + activity.amount,
            0
          );
      },
      [
        savingsActivities,
        selectedMonthValue,
      ]
    );

  const categoryTotals =
    useMemo(
      () => {
        const referenceMonth =
          parseMonthInput(
            selectedMonthValue
          );

        return getCategoryTotals(
          transactions,
          referenceMonth
        );
      },
      [
        transactions,
        selectedMonthValue,
      ]
    );

  const outstandingAllocations =
    useMemo(
      () =>
        householdId
          ? SettlementAllocationService
              .getOutstandingAllocations(
                householdId
              )
          : [],
      [householdId]
    );

  const monthlyOutstandingAllocations =
    useMemo(
      () =>
        outstandingAllocations.filter(
          (allocation) =>
            isSameMonth(
              allocation.transactionDate,
              selectedMonth
            )
        ),
      [
        outstandingAllocations,
        selectedMonth,
      ]
    );

  const settlementPreviews =
    useMemo(
      () =>
        getSettlementPreviews(
          monthlyOutstandingAllocations
        ),
      [monthlyOutstandingAllocations]
    );

  const totalOutstanding =
    roundCurrency(
      settlementPreviews.reduce(
        (total, preview) =>
          total + preview.amount,
        0
      )
    );

  const effectiveRemittanceRate =
    lockedExpenseCurrency ===
    remittanceCurrency
      ? 1
      : remittanceRate;

  const hasRemittanceRate =
    effectiveRemittanceRate > 0;

  const recentSettlements =
    useMemo(
      () =>
        householdId
          ? SettlementService
              .getActiveSettlementsByHouseholdId(
                householdId
              )
              .filter(
                (settlement) =>
                  settlementBelongsToMonth(
                    settlement,
                    selectedMonth
                  )
              )
              .slice(0, 3)
          : [],
      [
        householdId,
        selectedMonth,
      ]
    );

  const recentTransactions =
    transactions
      .filter(
        (transaction) =>
          transaction.isActive &&
          isSameMonth(
            transaction.transactionDate,
            selectedMonth
          )
      )
      .slice(0, 5);

  return (
    <div className="compact-dashboard">
      <PageHeader
        title="Dashboard"
        subtitle={`${formatMonthLabel(
          selectedMonth
        )} - Household overview`}
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

      <section className="dashboard-metrics">
        <MetricCard
          label="Total Expenses"
          value={formatCurrency(
            monthlyExpenses,
            lockedExpenseCurrency
          )}
          subtitle={`This month in ${lockedExpenseCurrency}`}
          tone="danger"
          icon={ReceiptText}
        />

        <MetricCard
          label="Total Savings"
          value={formatCurrency(
            savingsSummary.totalSaved,
            currency
          )}
          subtitle={`${savingsSummary.activeGoalCount} active goals`}
          tone="success"
          icon={PiggyBank}
        />

        <MetricCard
          label="Monthly Contributions"
          value={formatCurrency(
            monthlyContributions,
            currency
          )}
          subtitle="Savings this month"
          tone="info"
          icon={Target}
        />

        <MetricCard
          label="Outstanding"
          value={formatCurrency(
            totalOutstanding,
            lockedExpenseCurrency
          )}
          subtitle={`${settlementPreviews.length} pending in ${lockedExpenseCurrency}`}
          tone="warning"
          icon={WalletCards}
        />
      </section>

      {settlementPreviews.length === 0 ? (
        <section className="dashboard-panel dashboard-panel--settled">
          <div className="dashboard-settled">
            <span className="dashboard-settled__icon">
              <CheckCircle2
                size={20}
                aria-hidden="true"
              />
            </span>

            <div>
              <h2>
                All Settled for{" "}
                {formatMonthLabel(
                  selectedMonth
                )}
              </h2>

              <p>
                No unpaid settlement items remain for
                this month.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="dashboard-panel dashboard-panel--alert">
          <div className="dashboard-panel__header">
            <h2>Outstanding Settlements</h2>

            <Link to="/app/settlements">
              View all
              <ArrowRight
                size={14}
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="settlement-preview-list">
            {settlementPreviews
              .slice(0, 3)
              .map((preview) => (
                <div
                  key={`${preview.fromMemberId}-${preview.toMemberId}`}
                  className="settlement-preview"
                >
                  <div>
                    <p className="settlement-preview__route">
                      <span>
                        {getMemberName(
                          preview.fromMemberId
                        )}
                      </span>
                      <ArrowRight
                        size={14}
                        aria-hidden="true"
                      />
                      <span>
                        {getMemberName(
                          preview.toMemberId
                        )}
                      </span>
                    </p>

                    <p className="settlement-preview__meta">
                      {preview.allocationCount} open item
                      {preview.allocationCount ===
                      1
                        ? ""
                        : "s"}
                    </p>

                    <div className="settlement-preview__items">
                      {preview.items
                        .slice(0, 3)
                        .map((item) => (
                          <span
                            key={
                              item.category
                            }
                          >
                            {item.category}:{" "}
                            {formatCurrency(
                              item.amount,
                              lockedExpenseCurrency
                            )}
                          </span>
                        ))}
                    </div>
                  </div>

                  <strong>
                    {formatCurrency(
                      preview.amount,
                      lockedExpenseCurrency
                    )}
                  </strong>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="dashboard-layout">
        <section className="dashboard-panel dashboard-panel--month">
            <div className="dashboard-panel__header">
              <h2>Month at a Glance</h2>

              <Link to="/app/transactions">
                View all
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                />
              </Link>
            </div>

            {categoryTotals.length === 0 ? (
              <p className="dashboard-empty">
                No household expenses recorded this month.
              </p>
            ) : (
              <div className="category-list">
                {categoryTotals.map(
                  (categoryTotal, index) => (
                    <div
                      key={categoryTotal.category}
                      className="category-row"
                    >
                      <div className="category-row__top">
                        <span>
                          {
                            categoryTotal.category
                          }
                        </span>

                        <strong>
                          {formatCurrency(
                            categoryTotal.amount,
                            lockedExpenseCurrency
                          )}
                          <span>
                            {
                              categoryTotal.percentage
                            }
                            %
                          </span>
                        </strong>
                      </div>

                      <div className="category-row__track">
                        <div
                          className={`category-row__bar category-row__bar--${index % 5}`}
                          style={{
                            width: `${Math.max(
                              categoryTotal.percentage,
                              4
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}

                <div className="category-total">
                  <span>Total</span>
                  <strong>
                    {formatCurrency(
                      monthlyExpenses,
                      lockedExpenseCurrency
                    )}
                  </strong>
                </div>
              </div>
            )}
        </section>

        <section className="dashboard-panel dashboard-panel--private">
            <div className="dashboard-panel__header">
              <h2>Account Holder</h2>

              <Link to="/app/account-holder">
                Open
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className="account-holder-preview">
              <ShieldCheck
                size={22}
                aria-hidden="true"
              />

              <p>
                Private balance, cash-flow, and net-worth
                reports are separated here for the future
                login visibility rule.
              </p>
            </div>
        </section>

        <section className="dashboard-panel dashboard-panel--savings">
          <div className="dashboard-panel__header">
            <h2>Savings Goals</h2>

            <Link to="/app/savings">
              View all
              <ArrowRight
                size={14}
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="savings-compact">
            <div className="savings-compact__target">
              <Target
                size={30}
                aria-hidden="true"
              />

              <p>
                {savingsSummary.activeGoalCount >
                0
                  ? `${savingsSummary.activeGoalCount} active savings goal${
                      savingsSummary.activeGoalCount ===
                      1
                        ? ""
                        : "s"
                    }`
                  : "No active savings goals."}
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-panel dashboard-panel--quick">
            <div className="dashboard-panel__header">
              <h2>Quick Actions</h2>
            </div>

            <div className="quick-actions">
              <Link to="/app/transactions">
                <ReceiptText
                  size={18}
                  aria-hidden="true"
                />
                Add Expense
              </Link>

              <Link to="/app/savings">
                <Plus
                  size={18}
                  aria-hidden="true"
                />
                Add Contribution
              </Link>

              <Link to="/app/settlements">
                <ArrowRightLeft
                  size={18}
                  aria-hidden="true"
                />
                Record Settlement
              </Link>

              <button
                type="button"
                onClick={() =>
                  setIsRemittanceToolOpen(
                    true
                  )
                }
              >
                <WalletCards
                  size={18}
                  aria-hidden="true"
                />
                Estimate Remittance
              </button>

              <Link to="/app/savings">
                <Target
                  size={18}
                  aria-hidden="true"
                />
                Create Goal
              </Link>
            </div>
        </section>

        <section className="dashboard-panel dashboard-panel--activity">
            <div className="dashboard-panel__header">
              <h2>Recent Activity</h2>
            </div>

            <div className="activity-list">
              {recentTransactions.length ===
                0 &&
              recentSettlements.length ===
                0 ? (
                <p className="dashboard-empty">
                  No recent household activity.
                </p>
              ) : (
                <>
                  {recentTransactions.map(
                    (transaction) => (
                      <div
                        key={transaction.id}
                        className="activity-row"
                      >
                        <span className="activity-row__icon">
                          <ReceiptText
                            size={15}
                            aria-hidden="true"
                          />
                        </span>

                        <div>
                          <p>
                            {
                              transaction.description
                            }
                          </p>

                          <span>
                            {
                              transaction.category
                            }
                          </span>
                        </div>

                        <strong>
                          {formatCurrency(
                            transaction.amount,
                            transaction.baseCurrency ??
                              lockedExpenseCurrency
                          )}
                        </strong>
                      </div>
                    )
                  )}

                  {recentSettlements.map(
                    (settlement) => (
                      <div
                        key={settlement.id}
                        className="activity-row"
                      >
                        <span className="activity-row__icon activity-row__icon--settlement">
                          <HandCoins
                            size={15}
                            aria-hidden="true"
                          />
                        </span>

                        <div>
                          <p>
                            Settlement recorded
                          </p>

                          <span>
                            <CalendarDays
                              size={12}
                              aria-hidden="true"
                            />
                            {settlement.settlementDate.toLocaleDateString()}
                          </span>
                        </div>

                        <strong>
                          {formatCurrency(
                            settlement.amount,
                            lockedExpenseCurrency
                          )}
                        </strong>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
        </section>
      </section>

      <Dialog
        open={isRemittanceToolOpen}
        onClose={() =>
          setIsRemittanceToolOpen(false)
        }
        className="dashboard-tool-dialog"
      >
        <DialogHeader title="Remittance Calculator" />

        <DialogBody>
          <div className="remittance-estimate">
            <div className="remittance-estimate__source">
              <span>Locked dashboard totals</span>
              <strong>
                {formatCurrency(
                  monthlyExpenses +
                    totalOutstanding,
                  lockedExpenseCurrency
                )}
              </strong>
            </div>

            <div className="remittance-estimate__controls">
              <div>
                <label htmlFor="remittance-currency">
                  Estimate Currency
                </label>

                <select
                  id="remittance-currency"
                  value={remittanceCurrency}
                  onChange={(event) => {
                    setRemittanceCurrency(
                      event.target.value
                    );
                    setRemittanceRate(0);
                  }}
                >
                  {currencies
                    .filter(
                      (option) =>
                        option.value
                    )
                    .map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="remittance-rate">
                  Rate
                </label>

                <input
                  id="remittance-rate"
                  type="number"
                  min="0"
                  step="0.000001"
                  value={remittanceRate || ""}
                  onChange={(event) =>
                    setRemittanceRate(
                      roundExchangeRate(
                        Number(
                          event.target.value
                        )
                      )
                    )
                  }
                  placeholder={`1 ${lockedExpenseCurrency} = ${remittanceCurrency}`}
                />
              </div>
            </div>

            {lockedExpenseCurrency !==
              remittanceCurrency && (
              <CurrencyRateLookupButton
                fromCurrency={
                  lockedExpenseCurrency
                }
                toCurrency={
                  remittanceCurrency
                }
                effectiveDate={
                  remittanceRateDate
                }
                onRateSelected={(rate) => {
                  setRemittanceRate(
                    rate.rate
                  );
                  setRemittanceRateDate(
                    rate.effectiveDate
                  );
                }}
              />
            )}

            <div className="remittance-estimate__totals">
              <div>
                <span>Monthly expenses</span>
                <strong>
                  {hasRemittanceRate
                    ? formatCurrency(
                        roundCurrencyAmount(
                          monthlyExpenses *
                            effectiveRemittanceRate
                        ),
                        remittanceCurrency
                      )
                    : "Enter rate"}
                </strong>
              </div>

              <div>
                <span>Outstanding settlements</span>
                <strong>
                  {hasRemittanceRate
                    ? formatCurrency(
                        roundCurrencyAmount(
                          totalOutstanding *
                            effectiveRemittanceRate
                        ),
                        remittanceCurrency
                      )
                    : "Enter rate"}
                </strong>
              </div>

              <div className="remittance-estimate__total">
                <span>Ballpark remittance</span>
                <strong>
                  {hasRemittanceRate
                    ? formatCurrency(
                        roundCurrencyAmount(
                          (
                            monthlyExpenses +
                            totalOutstanding
                          ) *
                            effectiveRemittanceRate
                        ),
                        remittanceCurrency
                      )
                    : "Enter rate"}
                </strong>
              </div>
            </div>

            <p className="remittance-estimate__note">
              Display-only estimate from locked{" "}
              {lockedExpenseCurrency} dashboard totals.
              Saved transactions are not recomputed.
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <button
            type="button"
            onClick={() =>
              setIsRemittanceToolOpen(
                false
              )
            }
            className="dashboard-tool-dialog__close"
          >
            Close
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
