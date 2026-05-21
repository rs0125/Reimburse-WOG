import { PageProgressBar, SkelLine, CardSkeleton } from "@/app/_components/Skeletons";

export default function Loading() {
  return (
    <>
      <PageProgressBar />
      <div style={{ marginBottom: "0.5rem" }}>
        <SkelLine w="short" />
      </div>

      <div className="page-head" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <SkelLine w="long" />
          <SkelLine w="med" />
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <CardSkeleton lines={4} />
        </div>
        <aside>
          <CardSkeleton lines={3} />
        </aside>
      </div>
    </>
  );
}
