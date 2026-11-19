export class SwarmError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export function newBoard(swarmId) {
  return { swarmId, title: 'Swarm', nextSeq: 1, posts: [], members: [], tasks: [], monitor: { count: 0, lastSeq: 0 } };
}

export function resolveMentions(mentions, members, from) {
  const recipients = new Set();
  for (const raw of mentions) {
    const name = raw.replace(/^@/, '');
    let matches;
    if (name === 'all') matches = members.filter(m => m.role === 'lead' || (!m.retired && ['running', 'inactive'].includes(m.status)));
    else {
      const exact = members.find(m => m.name === name);
      if (exact?.retired) throw new SwarmError('MEMBER_RETIRED', `${name} 已移除`);
      matches = exact ? [exact] : members.filter(m => !m.retired && m.name.startsWith(`${name}-`) && /^\d+$/.test(m.name.slice(name.length + 1)));
    }
    if (!matches.length && name !== 'all') throw new SwarmError('UNKNOWN_MENTION', `无法解析点名 ${raw}`);
    for (const member of matches) if (member.name !== from) recipients.add(member.name);
  }
  return [...recipients];
}

export function appendPost(board, input, maxPosts = 2000, at = new Date().toISOString()) {
  if (!Number.isSafeInteger(maxPosts) || maxPosts < 1 || maxPosts > 2000) throw new SwarmError('INVALID_INPUT', '帖子上限必须为 1 至 2000');
  if (typeof input.body !== 'string' || !input.body.trim() || input.body.length > 16000) throw new SwarmError('INVALID_INPUT', '正文必须为 1 至 16000 字符');
  if (!Number.isSafeInteger(board.nextSeq) || board.nextSeq >= Number.MAX_SAFE_INTEGER) throw new SwarmError('SEQ_EXHAUSTED', '留言序号已耗尽');
  const post = { seq: board.nextSeq, at, from: input.from, to: [...input.to], mentions: [...input.mentions], kind: input.kind ?? 'message', body: input.body };
  const members = board.members.map(m => m.name === post.from ? { ...m, lastPostSeq: post.seq } : m);
  return { board: { ...board, members, nextSeq: post.seq + 1, posts: [...board.posts, post].slice(-maxPosts) }, post };
}

export function slicePosts(board, { afterSeq, limit = 50 } = {}) {
  return afterSeq === undefined ? board.posts.slice(-limit) : board.posts.filter(p => p.seq > afterSeq).slice(0, limit);
}

export function boardView(board, { live = false, members = board.members, tasks = board.tasks, afterSeq, tiers } = {}) {
  return { swarmId: board.swarmId, title: board.title, live, members, tasks,
    posts: slicePosts(board, { afterSeq: afterSeq ?? 0, limit: 500 }), nextSeq: board.nextSeq, tiers };
}

export function postText(post) {
  return `Board #${post.seq} from ${post.from} to ${post.to.join(', ')}:\n${post.body}`;
}
