import type { IngestionService } from "./ingestion-service.js";

export function startIngestionSchedule(
  service: IngestionService,
  intervalMs: number,
  runImmediately = true
): () => void {
  const execute = async (): Promise<void> => {
    try {
      await service.run();
    } catch (error) {
      console.error("Ingestion run failed.", error);
    }
  };

  if (runImmediately) {
    void execute();
  }
  const timer = setInterval(() => void execute(), intervalMs);
  return () => clearInterval(timer);
}
