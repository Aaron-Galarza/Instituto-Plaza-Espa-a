import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuditEvent } from '@plaza/shared';
import { DATA_STORE } from '../config/tokens';
import type { DataStore } from '../database/data-store';

export interface AuditActor {
  id: string;
  name: string;
  role: string;
}

export interface AuditInput {
  actor: AuditActor;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(@Inject(DATA_STORE) private readonly store: DataStore) {}

  async record(input: AuditInput, tx: DataStore = this.store): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: randomUUID(),
      userId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      at: new Date().toISOString(),
      metadata: input.metadata ?? {},
    };
    const saved = await tx.repo('auditEvents').insert(event);
    this.logger.log(`${input.action} ${input.entity}/${input.entityId} por ${input.actor.name}`);
    return saved;
  }

  /** Registro best-effort para acciones no críticas (por ejemplo, login fallido). */
  async safeRecord(input: AuditInput): Promise<void> {
    try {
      await this.record(input);
    } catch (error) {
      this.logger.warn(`No se pudo registrar auditoría: ${(error as Error).message}`);
    }
  }
}
