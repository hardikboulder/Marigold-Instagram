import { VendorSubmissionForm } from "./VendorSubmissionForm";

export const dynamic = "force-dynamic";

interface SearchParams {
  searchParams: { draft?: string };
}

export default function VendorSubmitPage({ searchParams }: SearchParams) {
  return <VendorSubmissionForm draftToken={searchParams.draft} />;
}
