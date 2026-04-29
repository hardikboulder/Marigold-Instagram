import { PublicSubmissionForm } from "./PublicSubmissionForm";

interface Params {
  params: { formId: string };
}

export const dynamic = "force-dynamic";

export default function PublicSubmitPage({ params }: Params) {
  return <PublicSubmissionForm formId={params.formId} />;
}
