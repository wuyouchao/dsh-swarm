const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
exports.name = 'swarm-registration-smoke';
exports.inject = ['agents', 'commands', 'swarmBoard', 'tools', 'agentDefaultModel', 'subagents'];
exports.apply = ctx => {
  setImmediate(async () => {
    try {
      await ctx.loader.await();
      const { agent } = await ctx.agents.create({ sessionId: `session-${randomUUID()}`, meta: { cwd: process.cwd() }, agentOptions: ctx.agentDefaultModel.currentSelection() });
      const signal = new AbortController().signal;
      assert.equal(ctx.commands.find(agent, 'swarm'), undefined);
      const run = async line => {
        const result = await ctx.commands.execute(agent, line, [], signal);
        assert.equal(result?.result.kind, 'success', JSON.stringify(result));
      };
      const prior = { id: randomUUID(), role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '验收背景：已有两个 CSV 输入。' }] };
      agent.session.append('user/message', prior, { surfaceOp: 'append' });
      assert.equal(ctx.tools.get('spawn_teammate', agent), undefined);
      await run('/swarm-mode');
      const set = await ctx.tools.resolve({agent, signal, modelSelection: agent.model.current()});
      const tool = set.view(agent).get('spawn_teammate');
      assert.ok(tool, 'spawn_teammate missing');
      const response = await tool.execute({name:'smoke-worker', description:'Local registration check', prompt:'Reply OK.'},{agent, signal});
      assert.ok(response.ok, JSON.stringify(response));
      const board = JSON.parse(await ctx.swarmBoard.call(JSON.stringify({sessionId:agent.id,action:'view'}))).data;
      assert.deepEqual(board.members.map(m=>m.name).sort(), ['lead','smoke-worker']);
      assert.ok(board.posts.some(p=>p.kind==='brief' && p.from==='lead' && p.to.includes('smoke-worker')));
      assert.deepEqual(board.tiers, {});
      const child = ctx.agents.get(response.data.member.sessionId);
      assert.deepEqual(child.model.current(), agent.model.current());
      assert.equal(ctx.subagents.rootOf(child), agent);
      await run('/swarm-mode');
      const again = JSON.parse(await ctx.swarmBoard.call(JSON.stringify({sessionId: agent.id, action:'view'}))).data;
      assert.equal(again.swarmId, board.swarmId);
      assert.deepEqual(again.posts, board.posts);
      assert.ok(agent.session.deriveMessages().some(message => message.id === prior.id));
      await run('/swarm-mode 根据前面的 CSV 输入继续');
      assert.ok(ctx.tools.get('board_post', child), 'child board_post missing');
      console.log('SMOKE PASS: spawn_teammate admitted, current model inherited and child parentage verified, same board has lead + smoke-worker and brief.');
      set.dispose(); ctx.appExit(0);
    } catch(e) { console.error(e); ctx.appExit(1); }
  });
};
