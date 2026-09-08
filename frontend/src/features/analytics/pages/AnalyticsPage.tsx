import "./AnalyticsPage.css";

import {
  AlertCircle,
  CheckCircle2,
  HandCoins,
  PiggyBank,
  ReceiptText,
  TrendingDown,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type {
  LucideIcon,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import Card from "../../../shared/ui/Card";
import Input from "../../../shared/ui/Input";
import PageHeader from "../../../shared/ui/PageHeader";
import useReportingMonth from "../../../shared/hooks/useReportingMonth";
import formatCurrency from "../../../shared/utils/formatCurrency";
import {
  formatMonthLabel,
  isSameMonth,
  parseMonthInput,
} from "../../../shared/utils/monthSelection";

import {
  loadHousehold,
} from "../../household/services/householdStorage";
import AccountService from "../../accounts/services/AccountService";
import HouseholdMemberService from "../../household/services/HouseholdMemberService";
import SettlementAllocationService from "../../settlements/services/SettlementAllocationService";
import useSavings from "../../savings/hooks/useSavings";
import HouseholdExpenseContributionService from "../../transactions/services/HouseholdExpenseContributionService";
import TransactionService from "../../transactions/services/TransactionService";

import {
  normalizeTransactionCategory,
} from "../../transactions/models/TransactionCategory";

import type {
  Transaction,
} from "../../transactions/models/Transaction";
import type { SettlementAllocationOption } from "../../settlements/models/SettlementAllocationOption";

interface AnalyticsMetricProps {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "positive" | "negative" | "neutral";
}

interface CategoryTotal {
  category: string;
  amount: number;
  percentage: number;
}

interface SettlementPairSummary {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  count: number;
  categories: CategoryTotal[];
}

function AnalyticsMetric({
  label,
  value,
  subtitle,
  icon: Icon,
  tone,
}: AnalyticsMetricProps) {
  return (
    <Card className="analytics-metric">
      <span
        className={`analytics-metric__icon analytics-metric__icon--${tone}`}
      >
        <Icon
          size={18}
          aria-hidden="true"
        />
      </span>

      <div>
        <p className="analytics-metric__label">
          {label}
        </p>

        <strong className="analytics-metric__value">
          {value}
        </strong>

        <p className="analytics-metric__subtitle">
          {subtitle}
        </p>
      </div>
    </Card>
  );
}

function getCategoryTotals(
  transactions: Transaction[],
  selectedMonth: Date
): CategoryTotal[] {
  const monthlyExpenses =
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
    monthlyExpenses.reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const totalsByCategory =
    monthlyExpenses.reduce<
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
    .slice(0, 6);
}

function getUtilityTotals(
  transactions: Transaction[],
  selectedMonth: Date
): CategoryTotal[] {
  const utilityCategories = [
    "Electricity",
    "Water",
    "Internet",
  ];

  const utilityExpenses =
    transactions.filter(
      (transaction) =>
        transaction.isActive &&
        transaction.type === "expense" &&
        isSameMonth(
          transaction.transactionDate,
          selectedMonth
        ) &&
        utilityCategories.includes(
          normalizeTransactionCategory(
            transaction.category
          )
        )
    );

  const totalUtilities =
    utilityExpenses.reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const totalsByCategory =
    utilityExpenses.reduce<
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

  return utilityCategories.map((category) => {
    const amount =
      totalsByCategory[category] ?? 0;

    return {
      category,
      amount,
      percentage:
        totalUtilities > 0
          ? Math.round(
              (amount / totalUtilities) *
                100
            )
          : 0,
    };
  });
}

function getMonthlyExpenseTransactions(
  transactions: Transaction[],
  selectedMonth: Date,
  category?: string
): Transaction[] {
  return transactions
    .filter((transaction) => {
      if (
        !transaction.isActive ||
        transaction.type !== "expense" ||
        !isSameMonth(
          transaction.transactionDate,
          selectedMonth
        )
      ) {
        return false;
      }

      if (!category) {
        return true;
      }

      return (
        normalizeTransactionCategory(
          transaction.category
        ) === category
      );
    })
    .sort(
      (first, second) =>
        second.transactionDate.getTime() -
        first.transactionDate.getTime()
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

function getMemberName(
  memberId: string
): string {
  return (
    HouseholdMemberService
      .getMemberById(memberId)
      ?.displayName ?? "Member"
  );
}

function getSettlementSummaries(
  allocations: SettlementAllocationOption[]
): SettlementPairSummary[] {
  const summaries = new Map<
    string,
    SettlementPairSummary
  >();

  for (const allocation of allocations) {
    const key =
      `${allocation.fromMemberId}::${allocation.toMemberId}`;

    const category =
      normalizeTransactionCategory(
        allocation.category
      );

    const existing =
      summaries.get(key);

    if (!existing) {
      summaries.set(key, {
        fromMemberId:
          allocation.fromMemberId,
        toMemberId:
          allocation.toMemberId,
        amount:
          allocation.outstandingAmount,
        count: 1,
        categories: [
          {
            category,
            amount:
              allocation.outstandingAmount,
            percentage: 0,
          },
        ],
      });

      continue;
    }

    const categories =
      [...existing.categories];

    const categoryIndex =
      categories.findIndex(
        (item) =>
          item.category === category
      );

    if (categoryIndex >= 0) {
      categories[categoryIndex] = {
        ...categories[categoryIndex],
        amount:
          roundCurrency(
            categories[categoryIndex].amount +
              allocation.outstandingAmount
          ),
      };
    } else {
      categories.push({
        category,
        amount:
          allocation.outstandingAmount,
        percentage: 0,
      });
    }

    const nextAmount =
      roundCurrency(
        existing.amount +
          allocation.outstandingAmount
      );

    summaries.set(key, {
      ...existing,
      amount:
        nextAmount,
      count:
        existing.count + 1,
      categories:
        categories
          .map((item) => ({
            ...item,
            percentage:
              nextAmount > 0
                ? Math.round(
                    (item.amount /
                      nextAmount) *
                      100
                  )
                : 0,
          }))
          .sort(
            (first, second) =>
              second.amount -
              first.amount
          ),
    });
  }

  return Array.from(
    summaries.values()
  ).sort(
    (first, second) =>
      second.amount - first.amount
  );
}

export default function AnalyticsPage() {
  const household =
    loadHousehold();

  const householdId =
    household?.id ?? "";

  const currency =
    household?.currency ?? "PHP";

  const {
    selectedMonthValue,
    setSelectedMonthValue,
  } = useReportingMonth();

  const selectedMonth =
    parseMonthInput(
      selectedMonthValue
    );

  const [
    selectedExpenseCategory,
    setSelectedExpenseCategory,
  ] = useState<string | null>(null);

  const {
    activeGoals,
    activities: savingsActivities,
    progressByGoalId,
    summary: savingsSummary,
  } = useSavings();

  const transactions =
    useMemo(
      () =>
        TransactionService.getTransactions(),
      []
    );

  const outstandingSettlementAllocations =
    useMemo(
      () =>
        household
          ? SettlementAllocationService
              .getOutstandingAllocations(
                household.id
              )
              .filter(
                (allocation) =>
                  isSameMonth(
                    allocation.transactionDate,
                    selectedMonth
                  )
              )
          : [],
      [
        household,
        selectedMonth,
      ]
    );

  const settlementSummaries =
    useMemo(
      () =>
        getSettlementSummaries(
          outstandingSettlementAllocations
        ),
      [outstandingSettlementAllocations]
    );

  const totalSettlementOutstanding =
    roundCurrency(
      settlementSummaries.reduce(
        (total, summary) =>
          total + summary.amount,
        0
      )
    );

  const accountTotals =
    useMemo(() => {
      const activeAccounts =
        household
          ? AccountService
              .getActiveAccounts()
              .filter(
                (account) =>
                  account.householdId ===
                  household.id
              )
          : [];

      const totalAssets =
        activeAccounts
          .filter(
            (account) =>
              account.accountClass ===
              "asset"
          )
          .reduce(
            (total, account) =>
              total +
              AccountService
                .getReportingBalance(
                  account
                ),
            0
          );

      const totalLiabilities =
        activeAccounts
          .filter(
            (account) =>
              account.accountClass ===
              "liability"
          )
          .reduce(
            (total, account) =>
              total +
              AccountService
                .getReportingBalance(
                  account
                ),
            0
          );

      return {
        totalAssets:
          roundCurrency(totalAssets),
        totalLiabilities:
          roundCurrency(
            totalLiabilities
          ),
        netWorth:
          roundCurrency(
            totalAssets -
              totalLiabilities
          ),
        accountCount:
          activeAccounts.length,
      };
    }, [household]);

  const accountScale =
    Math.max(
      1,
      accountTotals.totalAssets,
      accountTotals.totalLiabilities
    );

  const monthlySavingsContributions =
    useMemo(
      () =>
        savingsActivities
          .filter(
            (activity) =>
              activity.isActive &&
              activity.activityType ===
                "contribution" &&
              isSameMonth(
                activity.activityDate,
                selectedMonth
              )
          )
          .reduce(
            (total, activity) =>
              total + activity.amount,
            0
          ),
      [
        savingsActivities,
        selectedMonth,
      ]
    );

  const monthlySavingsWithdrawals =
    useMemo(
      () =>
        savingsActivities
          .filter(
            (activity) =>
              activity.isActive &&
              activity.activityType ===
                "withdrawal" &&
              isSameMonth(
                activity.activityDate,
                selectedMonth
              )
          )
          .reduce(
            (total, activity) =>
              total + activity.amount,
            0
          ),
      [
        savingsActivities,
        selectedMonth,
      ]
    );

  const totalExpenses =
    TransactionService.getTotalExpenses(
      selectedMonth
    );

  const categoryTotals =
    useMemo(
      () =>
        getCategoryTotals(
          transactions,
          selectedMonth
        ),
      [
        transactions,
        selectedMonth,
      ]
    );

  const activeExpenseCategory =
    categoryTotals.some(
      (category) =>
        category.category ===
        selectedExpenseCategory
    )
      ? selectedExpenseCategory
      : categoryTotals[0]?.category ??
        null;

  const categoryDrilldownTransactions =
    useMemo(
      () =>
        getMonthlyExpenseTransactions(
          transactions,
          selectedMonth,
          activeExpenseCategory ??
            undefined
        ),
      [
        transactions,
        selectedMonth,
        activeExpenseCategory,
      ]
    );

  const utilityTotals =
    useMemo(
      () =>
        getUtilityTotals(
          transactions,
          selectedMonth
        ),
      [
        transactions,
        selectedMonth,
      ]
    );

  const totalUtilities =
    utilityTotals.reduce(
      (total, utility) =>
        total + utility.amount,
      0
    );

  const expenseContributionSummary =
    useMemo(
      () =>
        householdId
          ? HouseholdExpenseContributionService
              .getMonthlySummary(
                householdId,
                selectedMonth
              )
          : {
              totalAmount: 0,
              memberContributions: [],
            },
      [
        householdId,
        selectedMonth,
      ]
    );

  const contributingMemberCount =
    expenseContributionSummary
      .memberContributions
      .filter(
        (contribution) =>
          contribution.amount > 0
      )
      .length;

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={`${formatMonthLabel(
          selectedMonth
        )} - Household financial insights`}
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

      <div className="analytics-page">
        <section className="analytics-metrics">
          <AnalyticsMetric
            label="Household Expenses"
            value={formatCurrency(
              totalExpenses,
              currency
            )}
            subtitle="Selected month"
            icon={ReceiptText}
            tone="negative"
          />

          <AnalyticsMetric
            label="Members Contributing"
            value={String(
              contributingMemberCount
            )}
            subtitle={`${expenseContributionSummary.memberContributions.length} active members tracked`}
            icon={UsersRound}
            tone="neutral"
          />

          <AnalyticsMetric
            label="Outstanding"
            value={formatCurrency(
              totalSettlementOutstanding,
              currency
            )}
            subtitle="Unpaid member reimbursements"
            icon={TrendingDown}
            tone="negative"
          />
        </section>

        <section className="analytics-grid">
          <Card className="analytics-panel analytics-panel--wide">
            <div className="analytics-panel__header">
              <div>
                <h2>Member Expense Contribution</h2>

                <p>
                  Household-expense responsibility for{" "}
                  {formatMonthLabel(
                    selectedMonth
                  )}
                  .
                </p>
              </div>

              <UsersRound
                size={18}
                aria-hidden="true"
              />
            </div>

            {expenseContributionSummary.totalAmount ===
            0 ? (
              <p className="analytics-empty">
                No shared household expense contributions for this month.
              </p>
            ) : (
              <div className="analytics-contributions">
                <div className="analytics-contribution-total">
                  <span>
                    Household expenses
                  </span>

                  <strong>
                    {formatCurrency(
                      expenseContributionSummary.totalAmount,
                      currency
                    )}
                  </strong>
                </div>

                {expenseContributionSummary
                  .memberContributions
                  .map((contribution) => (
                  <div
                    key={contribution.memberId}
                    className="analytics-contribution"
                  >
                    <div className="analytics-contribution__top">
                      <span>
                        {contribution.memberName}
                      </span>

                      <strong>
                        {formatCurrency(
                          contribution.amount,
                          currency
                        )}
                      </strong>
                    </div>

                    <div className="analytics-contribution__track">
                      <span
                        className="analytics-contribution__bar"
                        style={{
                          width: `${Math.max(
                            contribution.percentage,
                            contribution.amount >
                              0
                              ? 3
                              : 0
                          )}%`,
                        }}
                      />
                    </div>

                    <p>
                      {contribution.percentage}% across{" "}
                      {contribution.expenseCount} expense
                      {contribution.expenseCount ===
                      1
                        ? ""
                        : "s"}
                    </p>
                  </div>
                  ))}
              </div>
            )}
          </Card>

          <Card className="analytics-panel">
            <div className="analytics-panel__header">
              <div>
                <h2>Top Expense Categories</h2>

                <p>
                  Selected month category mix.
                </p>
              </div>

              <ReceiptText
                size={18}
                aria-hidden="true"
              />
            </div>

            {categoryTotals.length === 0 ? (
              <p className="analytics-empty">
                No expenses recorded for this month.
              </p>
            ) : (
              <div className="analytics-categories">
                {categoryTotals.map(
                  (category) => (
                    <button
                      type="button"
                      key={category.category}
                      className={`analytics-category analytics-category--button ${
                        activeExpenseCategory ===
                        category.category
                          ? "analytics-category--active"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedExpenseCategory(
                          category.category
                        )
                      }
                    >
                      <div className="analytics-category__top">
                        <span>
                          {category.category}
                        </span>

                        <strong>
                          {formatCurrency(
                            category.amount,
                            currency
                          )}
                        </strong>
                      </div>

                      <div className="analytics-category__track">
                        <span
                          className="analytics-category__bar"
                          style={{
                            width: `${Math.max(
                              category.percentage,
                              3
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="analytics-category__meta">
                        {category.percentage}% of monthly
                        expenses
                      </p>
                    </button>
                  )
                )}
              </div>
            )}
          </Card>

          <Card className="analytics-panel">
            <div className="analytics-panel__header">
              <div>
                <h2>Category Drilldown</h2>

                <p>
                  {activeExpenseCategory
                    ? `${activeExpenseCategory} expenses in ${formatMonthLabel(
                        selectedMonth
                      )}.`
                    : `Expenses in ${formatMonthLabel(
                        selectedMonth
                      )}.`}
                </p>
              </div>

              <ReceiptText
                size={18}
                aria-hidden="true"
              />
            </div>

            {!activeExpenseCategory ? (
              <p className="analytics-empty">
                No expenses recorded for this month.
              </p>
            ) : categoryDrilldownTransactions.length ===
              0 ? (
              <p className="analytics-empty">
                No transactions found for this category.
              </p>
            ) : (
              <div className="analytics-drilldown">
                {categoryDrilldownTransactions
                  .slice(0, 8)
                  .map((transaction) => (
                    <article
                      key={transaction.id}
                      className="analytics-drilldown__item"
                    >
                      <div>
                        <h3>
                          {transaction.description ||
                            normalizeTransactionCategory(
                              transaction.category
                            )}
                        </h3>

                        <p>
                          {transaction.transactionDate
                            .toLocaleDateString()}{" "}
                          -{" "}
                          {normalizeTransactionCategory(
                            transaction.category
                          )}
                        </p>
                      </div>

                      <strong>
                        {formatCurrency(
                          transaction.amount,
                          currency
                        )}
                      </strong>
                    </article>
                  ))}
              </div>
            )}
          </Card>

          <Card className="analytics-panel">
            <div className="analytics-panel__header">
              <div>
                <h2>Utility Costs</h2>

                <p>
                  Electricity, water, and internet for
                  the selected month.
                </p>
              </div>

              <ReceiptText
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="analytics-utility-total">
              <span>
                Monthly Utilities
              </span>

              <strong>
                {formatCurrency(
                  totalUtilities,
                  currency
                )}
              </strong>
            </div>

            {totalUtilities === 0 ? (
              <p className="analytics-empty">
                No utility expenses recorded for this
                month.
              </p>
            ) : (
              <div className="analytics-categories">
                {utilityTotals.map(
                  (utility) => (
                    <div
                      key={utility.category}
                      className="analytics-category"
                    >
                      <div className="analytics-category__top">
                        <span>
                          {utility.category}
                        </span>

                        <strong>
                          {formatCurrency(
                            utility.amount,
                            currency
                          )}
                        </strong>
                      </div>

                      <div className="analytics-category__track">
                        <span
                          className="analytics-category__bar analytics-category__bar--utility"
                          style={{
                            width: `${Math.max(
                              utility.percentage,
                              utility.amount > 0
                                ? 3
                                : 0
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="analytics-category__meta">
                        {utility.percentage}% of monthly
                        utilities
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </Card>

          <Card className="analytics-panel">
            <div className="analytics-panel__header">
              <div>
                <h2>Account Position</h2>

                <p>
                  Active household account balances.
                </p>
              </div>

              <WalletCards
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="analytics-account-total">
              <span>
                Net Worth
              </span>

              <strong>
                {formatCurrency(
                  accountTotals.netWorth,
                  currency
                )}
              </strong>
            </div>

            {accountTotals.accountCount === 0 ? (
              <p className="analytics-empty">
                No active accounts available.
              </p>
            ) : (
              <div className="analytics-account-bars">
                <div className="analytics-account-row">
                  <div className="analytics-account-row__top">
                    <span>
                      Assets
                    </span>

                    <strong>
                      {formatCurrency(
                        accountTotals.totalAssets,
                        currency
                      )}
                    </strong>
                  </div>

                  <div className="analytics-account-row__track">
                    <span
                      className="analytics-account-row__bar analytics-account-row__bar--asset"
                      style={{
                        width: `${Math.max(
                          (
                            accountTotals.totalAssets /
                            accountScale
                          ) *
                            100,
                          accountTotals.totalAssets >
                            0
                            ? 3
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="analytics-account-row">
                  <div className="analytics-account-row__top">
                    <span>
                      Liabilities
                    </span>

                    <strong>
                      {formatCurrency(
                        accountTotals.totalLiabilities,
                        currency
                      )}
                    </strong>
                  </div>

                  <div className="analytics-account-row__track">
                    <span
                      className="analytics-account-row__bar analytics-account-row__bar--liability"
                      style={{
                        width: `${Math.max(
                          (
                            accountTotals.totalLiabilities /
                            accountScale
                          ) *
                            100,
                          accountTotals
                            .totalLiabilities > 0
                            ? 3
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="analytics-panel analytics-panel--wide">
            <div className="analytics-panel__header">
              <div>
                <h2>Settlement Status</h2>

                <p>
                  Outstanding settlement items from
                  original transactions in{" "}
                  {formatMonthLabel(
                    selectedMonth
                  )}
                  .
                </p>
              </div>

              <HandCoins
                size={18}
                aria-hidden="true"
              />
            </div>

            {settlementSummaries.length === 0 ? (
              <div className="analytics-settled-state">
                <span className="analytics-settled-state__icon">
                  <CheckCircle2
                    size={22}
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <h3>
                    All Settled for{" "}
                    {formatMonthLabel(
                      selectedMonth
                    )}
                  </h3>

                  <p>
                    No unpaid member reimbursements remain
                    for this month.
                  </p>
                </div>
              </div>
            ) : (
              <div className="analytics-settlement-list">
                <div className="analytics-settlement-total">
                  <span>
                    Outstanding
                  </span>

                  <strong>
                    {formatCurrency(
                      totalSettlementOutstanding,
                      currency
                    )}
                  </strong>
                </div>

                {settlementSummaries.map(
                  (summary) => (
                    <article
                      key={`${summary.fromMemberId}-${summary.toMemberId}`}
                      className="analytics-settlement"
                    >
                      <div className="analytics-settlement__top">
                        <div>
                          <h3>
                            {getMemberName(
                              summary.fromMemberId
                            )}
                            {" -> "}
                            {getMemberName(
                              summary.toMemberId
                            )}
                          </h3>

                          <p>
                            {summary.count} unpaid item
                            {summary.count === 1
                              ? ""
                              : "s"}
                          </p>
                        </div>

                        <strong>
                          {formatCurrency(
                            summary.amount,
                            currency
                          )}
                        </strong>
                      </div>

                      <div className="analytics-settlement__categories">
                        {summary.categories.map(
                          (category) => (
                            <span
                              key={
                                category.category
                              }
                            >
                              <AlertCircle
                                size={12}
                                aria-hidden="true"
                              />
                              {category.category}:{" "}
                              {formatCurrency(
                                category.amount,
                                currency
                              )}
                            </span>
                          )
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </Card>

          <Card className="analytics-panel">
            <div className="analytics-panel__header">
              <div>
                <h2>Savings Momentum</h2>

                <p>
                  Contributions and active goal progress
                  for the selected month.
                </p>
              </div>

              <PiggyBank
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="analytics-savings-summary">
              <div>
                <span>
                  Contributions
                </span>

                <strong>
                  {formatCurrency(
                    monthlySavingsContributions,
                    currency
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Withdrawals
                </span>

                <strong>
                  {formatCurrency(
                    monthlySavingsWithdrawals,
                    currency
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Overall Progress
                </span>

                <strong>
                  {
                    savingsSummary
                      .overallProgressPercentage
                  }
                  %
                </strong>
              </div>
            </div>

            {activeGoals.length === 0 ? (
              <p className="analytics-empty">
                No active savings goals.
              </p>
            ) : (
              <div className="analytics-savings-goals">
                {activeGoals
                  .slice(0, 4)
                  .map((goal) => {
                    const progress =
                      progressByGoalId[
                        goal.id
                      ];

                    const progressPercentage =
                      Math.min(
                        progress
                          ?.progressPercentage ??
                          0,
                        100
                      );

                    return (
                      <div
                        key={goal.id}
                        className="analytics-savings-goal"
                      >
                        <div className="analytics-savings-goal__top">
                          <span>
                            {goal.name}
                          </span>

                          <strong>
                            {formatCurrency(
                              progress?.savedAmount ??
                                0,
                              currency
                            )}
                            {" / "}
                            {formatCurrency(
                              goal.targetAmount,
                              currency
                            )}
                          </strong>
                        </div>

                        <div className="analytics-savings-goal__track">
                          <span
                            className="analytics-savings-goal__bar"
                            style={{
                              width: `${Math.max(
                                progressPercentage,
                                3
                              )}%`,
                            }}
                          />
                        </div>

                        <p>
                          {progress
                            ?.progressPercentage ??
                            0}
                          % funded
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
