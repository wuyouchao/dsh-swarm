import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { remoteDescriptor } from './remote.js';

const root = new URL('./', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const dictionaries = {};
for (const language of ['zh', 'en']) dictionaries[language] = JSON.parse(await read(`locale/${language}.json`)).ui;
const missing = ['zh', 'en'].flatMap(a => Object.keys(dictionaries[a]).filter(k => !(k in dictionaries[a === 'zh' ? 'en' : 'zh'])).map(k => `${a}:${k}`));
if (missing.length) throw new Error(`Locale keys differ: ${missing.join(', ')}`);
const source = await read('client-source.js');
const used = new Set([...source.matchAll(/\bt\('([A-Za-z_]+)'\)/g)].map(m => m[1]));
for (const prefix of ['kind_', 'status_', 'task_']) for (const key of Object.keys(dictionaries.en)) if (key.startsWith(prefix)) used.add(key);
const undefinedKeys = [...used].filter(k => !(k in dictionaries.en));
if (undefinedKeys.length) throw new Error(`Locale keys used but not defined: ${undefinedKeys.join(', ')}`);
const bees = {};
for (const variant of ['lead', 'mint', 'iris', 'sky', 'rose']) {
  const image = await readFile(new URL(`art/${variant}.png`, root));
  bees[variant] = `data:image/png;base64,${image.toString('base64')}`;
}
const css = await read('client.css');
const body = source.replace(/^export default function pluginFactory\(require\)/m, 'function pluginFactory(require)').replace(/^export (const|function) /gm, '$1 ');
if (/^export /m.test(body)) throw new Error('client-source.js has an export build.js cannot strip');
const output = `window.__ModuleLoader__.load({ id: '@local/dsh-swarm', factory(require) {\nconst dictionaries = ${JSON.stringify(dictionaries)};\nconst css = ${JSON.stringify(css)};\nconst bees = ${JSON.stringify(bees)};\n${remoteDescriptor.toString()}\n${body}\nreturn pluginFactory(require);\n} });\n`;
new Script(output, { filename: 'client.js' });
await writeFile(new URL('client.js', root), output);
console.log(`Built ${fileURLToPath(new URL('client.js', root))} (${output.length} characters, ${used.size} locale keys)`);
