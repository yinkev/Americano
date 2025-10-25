#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pkgPaths = [
  path.join(root, 'package.json'),
  path.join(root, 'apps', 'web', 'package.json'),
];

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const versions = [];
for (const p of pkgPaths) {
  if (!fs.existsSync(p)) continue;
  const j = readJSON(p);
  const prisma = (j.devDependencies && j.devDependencies.prisma) || null;
  const client = (j.dependencies && j.dependencies['@prisma/client']) || null;
  versions.push({ p, prisma, client });
}

const targetPrisma = '^6.18.0';
const mismatches = versions.filter(v => v.prisma && v.prisma !== targetPrisma || v.client && v.client !== '^6.18.0');

if (mismatches.length) {
  console.error('Prisma version mismatch detected:');
  for (const m of mismatches) {
    console.error(`- ${m.p}: prisma=${m.prisma || 'n/a'} @prisma/client=${m.client || 'n/a'}`);
  }
  process.exit(1);
}

console.log('Prisma versions aligned at prisma=@', targetPrisma, 'and @prisma/client=^6.18.0');

