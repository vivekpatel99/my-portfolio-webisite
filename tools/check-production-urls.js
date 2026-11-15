import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// React Router uses these bases to parse relative URLs, never as backend endpoints.
// Match the surrounding code, not every bare localhost literal. If its compiled
// shape changes, CI fails closed so the exception must be reviewed again.
const routerParsingBases = [
  /let (\w+)="http:\/\/localhost";(\w+)&&\(\1="null"!==\2\.location\.origin\?\2\.location\.origin:\2\.location\.href\)/g,
  /var (\w+)=new URL\("http:\/\/localhost"\);function (\w+)\((\w+)\)\{if\(\3\.createURL\)return \3\.createURL\("\/"\);try\{return new URL\(\3\.createHref\("\/"\),\1\)/g,
];
const unsafeUrl = /(https?|wss?):\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:[0-9]+)?|https?:\\?\/\\?\/(yourserver\.io|(placeholder|your-deployment|example)[-.a-z0-9]*\.convex\.cloud)/g;

export function findUnsafeProductionUrls(source) {
  for (const pattern of routerParsingBases) {
    source = source.replace(pattern, (match) => match.replace('http://localhost', 'router-relative-url-base'));
  }
  return [...source.matchAll(unsafeUrl)].map((match) => match[0]);
}

function checkDirectory(directory) {
  let invalid = false;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) invalid = checkDirectory(file) || invalid;
    else {
      const content = readFileSync(file);
      if (content.includes(0)) continue;
      const matches = findUnsafeProductionUrls(content.toString('utf8'));
      if (matches.length) {
        console.error(`${file}: unsafe backend URLs: ${[...new Set(matches)].join(', ')}`);
        invalid = true;
      }
    }
  }
  return invalid;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (checkDirectory(process.argv[2] || 'dist')) process.exitCode = 1;
}
