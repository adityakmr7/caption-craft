import { runExportPipeline, type ExportJob } from "./exportPipeline";

// Dedicated Worker for Stage 6 (export/burn-in). This is the one stage that
// genuinely needs to be off the main thread: decode -> composite -> encode
// across a whole clip would otherwise freeze the UI for 30-90s+. Live
// preview (Stage 5) stays on the main thread since it's cheap per-frame
// canvas work — see the Phase 1 plan.

export type ExportWorkerRequest = {
  type: "export";
  job: ExportJob;
};

export type ExportWorkerResponse =
  | { type: "progress"; fraction: number }
  | { type: "done"; blob: Blob }
  | { type: "error"; message: string };

self.onmessage = async (event: MessageEvent<ExportWorkerRequest>) => {
  if (event.data.type !== "export") return;

  try {
    const blob = await runExportPipeline(event.data.job, (fraction) => {
      postResponse({ type: "progress", fraction });
    });
    postResponse({ type: "done", blob });
  } catch (err) {
    postResponse({
      type: "error",
      message: err instanceof Error ? err.message : "Export failed.",
    });
  }
};

function postResponse(message: ExportWorkerResponse): void {
  (self as unknown as Worker).postMessage(message);
}
