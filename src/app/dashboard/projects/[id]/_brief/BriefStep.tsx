import { createClient } from "@/lib/supabase/server";
import type { Brief } from "@/lib/brief";
import type { ProductAnalysis } from "@/lib/product";
import BriefForm from "./BriefForm";

export default async function BriefStep({
  projectId,
  productId,
  aspectRatio,
}: {
  projectId: string;
  productId: string | null;
  aspectRatio: string;
}) {
  const supabase = await createClient();
  const [{ data: brief }, { data: product }] = await Promise.all([
    supabase
      .from("project_briefs")
      .select("objective, audience, platform, ad_style, tone, duration_seconds, cta, advanced")
      .eq("project_id", projectId)
      .maybeSingle(),
    productId
      ? supabase.from("products").select("name, ai_analysis").eq("id", productId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const analysis = (product?.ai_analysis ?? null) as ProductAnalysis | null;

  return (
    <div className="mt-8">
      {product?.name && (
        <p className="mb-6 text-xs text-fg-subtle">
          Brief for <span className="text-fg-muted">{product.name}</span>
        </p>
      )}
      <BriefForm
        projectId={projectId}
        aspectRatio={aspectRatio}
        brief={(brief as Brief | null) ?? null}
        audienceIdeas={analysis?.suggested_audiences ?? []}
      />
    </div>
  );
}
