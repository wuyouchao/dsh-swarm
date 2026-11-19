export function monitorDecision({ posts, members, tasks, lastStatusAt, now, idleMs, monitor = { count: 0, lastSeq: 0 } }) {
  const unfinished = tasks.filter(t => !['completed', 'deleted'].includes(t.status));
  if (!unfinished.length) return { post: null, monitor: { count: 0, lastSeq: 0 } };
  const lastPost = posts.at(-1);
  const lastActivity = Math.max(lastStatusAt, lastPost ? Date.parse(lastPost.at) : 0);
  if (members.some(m => ['running', 'provisioning'].includes(m.status)) || now - lastActivity <= idleMs) return { post: null, monitor };
  if (monitor.count >= 3 || (monitor.lastSeq > 0 && (!lastPost || lastPost.seq <= monitor.lastSeq))) return { post: null, monitor };
  return { post: {
    from: 'monitor', to: ['lead'], mentions: ['lead'], kind: 'monitor',
    body: `协作已停滞，请检查留言板并安排下一步。未完成任务：\n${unfinished.map(t => `${t.id} ${t.subject}${t.ownerName ? `（${t.ownerName}）` : ''}`).join('\n')}`.slice(0, 16000),
  }, monitor: { count: monitor.count + 1, lastSeq: 0 } };
}
