import PageHeader from "../../../shared/ui/PageHeader";

export default function SavingsPage() {
  return (
    <>
      <PageHeader
        title="Savings"
        subtitle="Plan household savings goals and track progress over time."
      />

      <section className="rounded-lg border bg-white p-6">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Savings goals are coming soon
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            This area will support household savings goals,
            target amounts, member contributions, deadlines,
            and progress tracking.
          </p>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Goal Tracking
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Set targets and monitor completion.
              </p>
            </div>

            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Contributions
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Record contributions by household member.
              </p>
            </div>

            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Deadlines
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Add target dates and savings milestones.
              </p>
            </div>

            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Progress
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                See saved, remaining, and completion rates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
