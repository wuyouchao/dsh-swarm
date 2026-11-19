export function remoteDescriptor(commandExecute) {
  const text = commandExecute?.parameters.find(p => p.name === 'line')?.codec;
  if (text?.mode !== 'strict' || typeof text.create !== 'function') throw new Error('Swarm requires the registered strict string codec');
  const codec = { ...text, typeSymbol: '@local/dsh-swarm#Json' };
  return {
    id: '@local/dsh-swarm#swarmBoard/call', service: 'swarmBoard', namespace: 'swarmBoard', method: 'call',
    invocation: { kind: 'direct' },
    parameters: [{ name: 'requestJson', wire: 'requestJson', source: 'json', codec, strictCodec: codec }],
    result: codec,
  };
}
