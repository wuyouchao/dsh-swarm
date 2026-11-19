import { z } from 'zod';
import { newBoard, SwarmError } from './board.js';

export const tierSchema = z.string().trim().min(1).max(64);
export const routeSchema = z.object({ provider: z.string().trim().min(1), model: z.string().trim().min(1), reasoningEffort: z.string().trim().min(1).optional() }).strict();
const memberSchema = z.object({
  name: z.string(), role: z.enum(['lead', 'teammate']), status: z.enum(['running', 'inactive', 'provisioning', 'failed']),
  sessionId: z.string(), description: z.string().optional(), tier: tierSchema.optional(),
  provider: z.string().optional(), model: z.string().optional(), lastPostSeq: z.number().int().positive().optional(),
  retired: z.literal(true).optional(),
}).strict();
const taskSchema = z.object({ id: z.string(), subject: z.string(), status: z.string(), ownerName: z.string().optional(), ready: z.boolean() }).strict();
const postSchema = z.object({
  seq: z.number().int().positive(), at: z.string(), from: z.string(), to: z.array(z.string()), mentions: z.array(z.string()),
  kind: z.enum(['brief', 'message', 'report', 'monitor']), body: z.string().max(16000),
}).strict();
export const domainSpec = {
  name: 'local_swarm_board', version: 1, layout: 'per-record',
  tables: { boards: { valueSchema: z.object({
    swarmId: z.string(), title: z.string(), nextSeq: z.number().int().positive(), posts: z.array(postSchema).max(2000),
    members: z.array(memberSchema).default([]), tasks: z.array(taskSchema).default([]),
    monitor: z.object({ count: z.number().int().min(0).max(3), lastSeq: z.number().int().nonnegative() }).default({ count: 0, lastSeq: 0 }),
  }).strict() } },
};

export class BoardStore {
  constructor(table) { this.table = table; this.queues = new Map(); this.closed = false; }
  has(swarmId) { return !!this.table.get(swarmId); }
  read(swarmId) { return this.table.get(swarmId) ?? newBoard(swarmId); }
  find(sessionId) {
    return this.table.get(sessionId) ?? [...this.table.entries()].map(([, b]) => b).find(b => b.members.some(m => m.sessionId === sessionId));
  }
  async change(swarmId, operation) {
    if (this.closed) throw new SwarmError('DISPOSED', 'Swarm 已卸载');
    const next = (this.queues.get(swarmId) ?? Promise.resolve()).catch(() => {}).then(async () => {
      const current = this.read(swarmId);
      const { board, value } = await operation(current);
      if (board !== current) await this.table.put(swarmId, board);
      return value;
    });
    this.queues.set(swarmId, next);
    try { return await next; }
    finally { if (this.queues.get(swarmId) === next) this.queues.delete(swarmId); }
  }
  async close() { this.closed = true; await Promise.allSettled([...this.queues.values()]); }
}
