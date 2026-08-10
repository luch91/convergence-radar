export interface AuditRecord {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  paymentState: "absent" | "simulated" | "not_applicable";
  occurredAt: Date;
}

export interface AuditSink {
  write(record: AuditRecord): void;
}

export class InMemoryAuditSink implements AuditSink {
  private readonly records: AuditRecord[] = [];

  write(record: AuditRecord): void {
    this.records.push(record);
  }

  list(): AuditRecord[] {
    return [...this.records];
  }
}
