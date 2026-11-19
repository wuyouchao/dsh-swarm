import test from 'node:test';
import assert from 'node:assert/strict';
import { appendPost, boardView, newBoard, resolveMentions, slicePosts } from '../lib/board.js';
import { monitorDecision } from '../lib/monitor.js';

const members = [
  { name: 'lead', role: 'lead', status: 'inactive' },
  { name: 'fix-1', role: 'teammate', status: 'running' },
  { name: 'fix-2', role: 'teammate', status: 'inactive' },
  { name: 'fix-x', role: 'teammate', status: 'inactive' },
  { name: 'failed', role: 'teammate', status: 'failed' },
  { name: 'starting', role: 'teammate', status: 'provisioning' },
];
const input = { from: 'lead', to: [], mentions: [], body: '任务说明', kind: 'message' };

test('点名支持精确名、@ 前缀、编号组和去重，排除发送者', () => {
  assert.deepEqual(resolveMentions(['@fix-1', 'fix', 'lead'], members, 'lead'), ['fix-1', 'fix-2']);
  assert.deepEqual(resolveMentions(['fix-1'], members, 'fix-1'), []);
  assert.deepEqual(resolveMentions([], members, 'lead'), []);
  assert.deepEqual(resolveMentions(['fix'], [...members, { name: 'fix', role: 'teammate', status: 'inactive' }], 'lead'), ['fix']);
});
test('all 包含 inactive 的 active 成员和 lead，排除 failed、provisioning 与发送者', () => {
  assert.deepEqual(resolveMentions(['all'], members, 'fix-1'), ['lead', 'fix-2', 'fix-x']);
});
test('未知点名拒绝整条帖子', () => {
  assert.throws(() => resolveMentions(['fix-1', 'missing'], members, 'lead'), { code: 'UNKNOWN_MENTION' });
});
test('序号单调增长，裁剪保留最新帖子且不修改旧 Board', () => {
  const old = newBoard('swarm');
  let board = old;
  for (let i = 0; i < 5; i++) board = appendPost(board, input, 3).board;
  assert.deepEqual(board.posts.map(p => p.seq), [3, 4, 5]);
  assert.equal(board.nextSeq, 6);
  assert.deepEqual(old.posts, []);
  assert.throws(() => appendPost(board, { ...input, body: 'x'.repeat(16001) }), { code: 'INVALID_INPUT' });
});
test('读取最近帖子与增量切片，面板最多返回 500 条', () => {
  let board = newBoard('swarm');
  for (let i = 0; i < 600; i++) board = appendPost(board, input).board;
  assert.equal(slicePosts(board).length, 50);
  assert.equal(slicePosts(board)[0].seq, 551);
  assert.deepEqual(slicePosts(board, { afterSeq: 598, limit: 1 }).map(p => p.seq), [599]);
  assert.equal(boardView(board).posts.length, 500);
  assert.equal(boardView(board, { afterSeq: 500 }).posts[0].seq, 501);
  assert.deepEqual(boardView(board, { afterSeq: 600 }).posts, []);
});
const stalled = {
  posts: [{ seq: 1, at: new Date(1000).toISOString() }], members: [{ name: 'lead', status: 'inactive' }],
  tasks: [{ id: 'task-1', subject: '实现接口', status: 'pending', ownerName: 'fix-1' }],
  now: 100000, idleMs: 90000, lastStatusAt: 1000, monitor: { count: 0, lastSeq: 0 },
};
test('停滞时生成列出未完成任务的 monitor 帖', () => {
  const result = monitorDecision(stalled);
  assert.deepEqual(result.post.to, ['lead']);
  assert.equal(result.post.from, 'monitor');
  assert.match(result.post.body, /task-1 实现接口/);
  assert.equal(result.monitor.count, 1);
});
test('成员运行、正在创建、近期状态或帖子变化、没有待办时不提醒', () => {
  for (const status of ['running', 'provisioning']) assert.equal(monitorDecision({ ...stalled, members: [{ status }] }).post, null);
  assert.equal(monitorDecision({ ...stalled, lastStatusAt: 20000 }).post, null);
  assert.equal(monitorDecision({ ...stalled, posts: [{ seq: 2, at: new Date(20000).toISOString() }] }).post, null);
  assert.equal(monitorDecision({ ...stalled, tasks: [{ status: 'completed' }] }).post, null);
});
test('没有新帖时不重复提醒，有新帖才可继续，连续最多三次', () => {
  const monitor = { count: 1, lastSeq: 2 };
  assert.equal(monitorDecision({ ...stalled, posts: [{ seq: 2, at: new Date(1000).toISOString() }], monitor }).post, null);
  assert.ok(monitorDecision({ ...stalled, posts: [{ seq: 3, at: new Date(1000).toISOString() }], monitor }).post);
  assert.equal(monitorDecision({ ...stalled, posts: [{ seq: 7, at: new Date(1000).toISOString() }], monitor: { count: 3, lastSeq: 6 } }).post, null);
  assert.deepEqual(monitorDecision({ ...stalled, tasks: [], monitor: { count: 3, lastSeq: 6 } }).monitor, { count: 0, lastSeq: 0 });
});
