import { PageProgressBar, SkelLine, CardSkeleton } from "@/app/_components/Skeletons";

export default function Loading() {
  return (
    <>
      <PageProgressBar />
      <div style={{ marginBottom: "0.5rem" }}>
        <SkelLine w="short" />
      </div>
      <div className="page-head">
        <div>
          <SkelLine w="long" />
          <SkelLine w="med" />
        </div>
      </div>
      <CardSkeleton lines={6} />
    </>
  );
}
