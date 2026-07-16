import PageHeader from "../../../shared/ui/PageHeader";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Review household spending, balances, utilities, and settlement trends."
      />

      <section className="rounded-lg border bg-white p-6">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Financial reports are coming soon
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            This area will bring together household-level
            summaries while preserving private member
            account visibility.
          </p>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Spending Summary
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Review expenses by period and category.
              </p>
            </div>

            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Utility Trends
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Compare bills, usage, and member shares.
              </p>
            </div>

            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Settlement Activity
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Track amounts paid, received, and remaining.
              </p>
            </div>

            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Export Tools
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Prepare CSV and printable summaries.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
