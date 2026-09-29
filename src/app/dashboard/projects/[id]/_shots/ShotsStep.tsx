import { createClient } from "@/lib/supabase/server";
import { getVideoProvider } from "@/lib/providers/video";
import { MAX_SHOT_GENERATIONS } from "@/lib/generation";
import { shotTypeLabel, type Shot } from "@/lib/storyboard";
import ShotGenerationCard from "./ShotGenerationCard";

export default async function ShotsStep({ projectId, userId }: { projectId: string; userId: string }) {
  const supabase = await createClient();
  const [{ data: shotRows }, { data: profile }] = await Promise.all([
    supabase
      .from("storyboard_shots")
      .select(
        "id, position, shot_type, duration_seconds, scene, camera, on_screen_text, voiceover, sound, facts_used, video_status, video_url, video_error, generation_count, active_job_id",
      )
      .eq("project_id", projectId)
      .order("position"),
    supabase.from("profiles").select("credits_remaining").eq("id", userId).single(),
  ]);

  const shots = shotRows ?? [];
  if (shots.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border-strong p-6 text-sm text-fg-muted">
        No approved storyboard yet.
      </div>
    );
  }

  const generatable = shots.filter((s) => s.shot_type === "product" || s.shot_type === "lifestyle");
  const versionsByShot: Record<string, { id: string; video_url: string; created_at: string }[]> = {};
  if (generatable.length > 0) {
    const { data: versions } = await supabase
      .from("generation_jobs")
      .select("id, shot_id, video_url, created_at")
      .in("shot_id", generatable.map((s) => s.id))
      .eq("status", "ready")
      .order("created_at", { ascending: false });
    for (const v of versions ?? []) {
      if (!v.video_url) continue;
      (versionsByShot[v.shot_id] ??= []).push({ id: v.id, video_url: v.video_url, created_at: v.created_at });
    }
  }

  const cost = getVideoProvider().estimateCredits(0);

  return (
    <div className="mt-8 space-y-4">
      <p className="text-xs text-fg-muted">
        Generating a product or lifestyle shot costs {cost} credit{cost === 1 ? "" : "s"} and uses your
        product&rsquo;s main photo as the starting frame. You have {profile?.credits_remaining ?? 0} credit
        {profile?.credits_remaining === 1 ? "" : "s"}.
      </p>
      <ol className="space-y-3">
        {shots.map((shot) => (
          <li key={shot.id} className="rounded-xl border border-border bg-bg-elevated p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
                  {shot.position}
                </span>
                <span className="text-xs text-fg-muted">{shotTypeLabel(shot.shot_type)}</span>
                <span className="text-xs text-fg-subtle">{shot.duration_seconds}s</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-fg">{shot.scene}</p>

            {shot.shot_type === "product" || shot.shot_type === "lifestyle" ? (
              <ShotGenerationCard
                projectId={projectId}
                shot={shot as Shot & { video_status: string; video_url: string | null; video_error: string | null; generation_count: number; active_job_id: string | null }}
                cost={cost}
                creditsRemaining={profile?.credits_remaining ?? 0}
                maxGenerations={MAX_SHOT_GENERATIONS}
                versions={versionsByShot[shot.id] ?? []}
              />
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-border-strong px-3 py-2 text-xs text-fg-subtle">
                {shot.shot_type === "presenter"
                  ? "Presenter shots render through your chosen creator — that wiring arrives in a later update."
                  : "Text and end-card shots are composed during export, not generated as video."}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
