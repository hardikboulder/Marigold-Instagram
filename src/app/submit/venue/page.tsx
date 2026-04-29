import { VenueSubmissionWizard } from "./VenueSubmissionWizard";

export const dynamic = "force-dynamic";

interface SearchParams {
  searchParams: { draft?: string };
}

export default function VenueSubmitPage({ searchParams }: SearchParams) {
  return <VenueSubmissionWizard draftToken={searchParams.draft} />;
}
