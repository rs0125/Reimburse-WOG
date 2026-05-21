import { PageProgressBar, TicketListSkeleton } from "@/app/_components/Skeletons";

export default function Loading() {
  return (
    <>
      <PageProgressBar />
      <div className="page-head">
        <div>
          <h1>Admin · Reimbursement review</h1>
          <div className="sub">Loading tickets…</div>
        </div>
      </div>
      <TicketListSkeleton count={6} />
    </>
  );
}
