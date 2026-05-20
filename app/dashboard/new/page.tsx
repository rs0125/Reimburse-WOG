import TicketForm from "@/app/_components/TicketForm";

export default function NewTicketPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Raise a reimbursement ticket</h1>
          <div className="sub">Provide details and attach receipts or supporting documents.</div>
        </div>
      </div>
      <div className="card">
        <TicketForm />
      </div>
    </>
  );
}
