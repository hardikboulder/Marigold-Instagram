import { redirect } from "next/navigation";

/**
 * The blog-post form lives at /submit/blog, but the canonical FormTemplateType
 * slug is "vendor-blog-post". This static route shadows the dynamic
 * [formId] handler so anyone landing on /submit/vendor-blog-post gets sent
 * to the dedicated multi-step form instead of the generic one.
 */
export default function VendorBlogPostRedirect() {
  redirect("/submit/blog");
}
