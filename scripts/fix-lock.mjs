// 把 package-lock.json 的下载地址统一成 npm 官方标准格式。
// 本机 npm 源是公司内网 Artifactory，生成的 lock 在 GitHub Actions 上装不了；
// 本地安装不受影响（npm 默认会把 registry.npmjs.org 换成本机配置的源）。
// 用法：npm run fix-lock        检查：npm run fix-lock -- --check
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../package-lock.json', import.meta.url);
const lock = JSON.parse(readFileSync(file, 'utf8'));
const check = process.argv.includes('--check');
const bad = [];

for (const [key, pkg] of Object.entries(lock.packages)) {
  if (!key || !pkg.resolved) continue;
  const name = pkg.name ?? key.split('node_modules/').pop();
  const url = `https://registry.npmjs.org/${name}/-/${name.split('/').pop()}-${pkg.version}.tgz`;
  if (pkg.resolved !== url) {
    bad.push(name);
    pkg.resolved = url;
  }
}

if (check) {
  if (bad.length) {
    console.error(`package-lock.json 里有 ${bad.length} 个非 npm 官方地址（例如 ${bad[0]}），请在本地运行 npm run fix-lock 后重新提交`);
    process.exit(1);
  }
  console.log('package-lock.json 地址检查通过');
} else {
  writeFileSync(file, JSON.stringify(lock, null, 2) + '\n');
  console.log(bad.length ? `已修正 ${bad.length} 个地址` : '无需修正');
}
