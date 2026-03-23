const { execSync } = require('child_process');
const fs = require('fs');
try {
  const output = execSync('npx --yes eas-cli build:list --limit=1 --json --non-interactive', { encoding: 'utf8' });
  const jsonStr = output.substring(output.indexOf('['));
  const builds = JSON.parse(jsonStr);
  const url = builds[0].artifacts.buildUrl;
  fs.writeFileSync('apk.txt', url, 'utf8');
} catch (e) {
  console.error(e);
}
