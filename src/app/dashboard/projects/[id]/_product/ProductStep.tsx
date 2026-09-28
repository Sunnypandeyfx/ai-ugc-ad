import { createClient } from "@/lib/supabase/server";
import {
  ASSET_BUCKET,
  ASSET_KINDS,
  isAnalysisRunning,
  type AnalysisStatus,
  type AssetKind,
  type ConfirmedFacts,
  type ProductAnalysis,
  type ProductAsset,
} from "@/lib/product";
import AssetSlot from "./AssetSlot";
import AnalyzePanel from "./AnalyzePanel";
import ConfirmProductForm from "./ConfirmProductForm";

type ProductRow = {
  id: string;
  ai_analysis: ProductAnalysis | null;
  analysis_status: AnalysisStatus;
  analysis_count: number;
  analysis_started_at: string | null;
  analyzed_at: string | null;
  confirmed_facts: ConfirmedFacts | null;
  confirmed_at: string | null;
};

export default async function ProductStep({
  projectId,
  productId,
  userId,
}: {
  projectId: string;
  productId: string | null;
  userId: string;
}) {
  const supabase = await createClient();
  let product: ProductRow | null = null;
  let assets: ProductAsset[] = [];

  if (productId) {
    const [{ data: row }, { data: assetRows }] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, ai_analysis, analysis_status, analysis_count, analysis_started_at, analyzed_at, confirmed_facts, confirmed_at",
        )
        .eq("id", productId)
        .single(),
      supabase
        .from("product_assets")
        .select("id, kind, storage_path, created_at")
        .eq("product_id", productId)
        .order("created_at"),
    ]);
    product = row;

    const rows = assetRows ?? [];
    const { data: signed } = rows.length
      ? await supabase.storage.from(ASSET_BUCKET).createSignedUrls(
          rows.map((a) => a.storage_path),
          3600,
        )
      : { data: [] };
    const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    assets = rows.map((a) => ({ ...a, kind: a.kind as AssetKind, url: urlByPath.get(a.storage_path) ?? null }));
  }

  const byKind = (kind: AssetKind) => assets.filter((a) => a.kind === kind);
  const spec = (kind: AssetKind) => ASSET_KINDS.find((k) => k.key === kind)!;
  const slot = (kind: AssetKind, extra?: { required?: boolean; fit?: "cover" | "contain" }) => (
    <AssetSlot
      projectId={projectId}
      userId={userId}
      kind={kind}
      label={spec(kind).label}
      assets={byKind(kind)}
      single={spec(kind).single}
      max={spec(kind).max}
      {...extra}
    />
  );

  const hasMain = byKind("main").length > 0;
  const analysis = product?.ai_analysis ?? null;
  const running = product
    ? isAnalysisRunning(product.analysis_status, product.analysis_started_at)
    : false;
  const analyzedAt = product?.analyzed_at ? new Date(product.analyzed_at).getTime() : 0;
  const photosChanged = Boolean(analysis) && assets.some((a) => new Date(a.created_at).getTime() > analyzedAt);

  const confirmed = product?.confirmed_facts ?? null;
  const initial: ConfirmedFacts = confirmed ?? {
    name: analysis?.product_name ?? "",
    brand_name: analysis?.brand_name ?? "",
    category: analysis?.category ?? "",
    description: "",
    facts: [],
  };
  const suggestions = analysis
    ? [
        ...analysis.visible_text.map((text) => ({ source: "Printed on the product", text })),
        ...analysis.visual_features.map((text) => ({ source: "Visible in your photos", text })),
      ]
    : [];

  return (
    <div className="mt-8 space-y-10">
      <section aria-labelledby="photos-heading">
        <h3 id="photos-heading" className="text-sm font-medium">
          Product photos
        </h3>
        <p className="mt-1 text-xs text-fg-muted">
          Clear photos on a plain background work best. JPG, PNG or WebP — large photos are resized
          automatically.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {slot("main", { required: true })}
          {slot("front")}
          {slot("side")}
          {slot("back")}
        </div>
        <div className="mt-6">{slot("reference")}</div>
        <p className="mt-1.5 text-[11px] text-fg-subtle">
          The product in use, packaging details, or ads whose look you like.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr]">
          {slot("logo", { fit: "contain" })}
          {slot("brand", { fit: "contain" })}
        </div>
      </section>

      <AnalyzePanel
        projectId={projectId}
        hasMain={hasMain}
        running={running}
        failed={product?.analysis_status === "failed"}
        analysis={analysis}
        analysisCount={product?.analysis_count ?? 0}
        photosChanged={photosChanged}
      />

      <section aria-labelledby="confirm-heading">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="confirm-heading" className="text-sm font-medium">
            Confirm product details
          </h3>
          {confirmed && (
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
              Confirmed
            </span>
          )}
        </div>
        <p className="mb-5 mt-1 text-xs text-fg-muted">
          This is the source of truth for your ad. Scripts and scenes will only use what you confirm
          here.
        </p>
        <ConfirmProductForm
          key={`${product?.confirmed_at ?? ""}-${product?.analyzed_at ?? ""}`}
          projectId={projectId}
          initial={initial}
          prefilledFromAi={!confirmed && Boolean(analysis)}
          alreadyConfirmed={Boolean(confirmed)}
          suggestions={suggestions}
          hasMain={hasMain}
        />
      </section>
    </div>
  );
}
