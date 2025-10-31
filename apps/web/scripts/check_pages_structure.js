const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function listPages() {
  const out = cp.execSync("rg --files --glob 'src/app/**/page.tsx'", {
    encoding: 'utf8',
  }).trim();
  return out ? out.split(/\n/) : [];
}

function firstMeaningfulLine(txt) {
  const lines = txt.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*$/.test(l)) continue;
    if (/^\s*\/\//.test(l)) continue;
    if (/^\s*\/\*/.test(l)) {
      // Skip block comment
      let j = i;
      let closed = false;
      while (j < lines.length) {
        if (/\*\//.test(lines[j])) {
          closed = true;
          i = j;
          break;
        }
        j++;
      }
      if (!closed) return { index: i + 1, line: l.trim() };
      continue;
    }
    return { index: i + 1, line: l.trim() };
  }
  return { index: -1, line: '' };
}

function directiveStatus(txt) {
  const fm = firstMeaningfulLine(txt);
  const hasClient = /^\s*['\"]use client['\"];?/m.test(txt);
  const hasServer = /^\s*['\"]use server['\"];?/m.test(txt);
  const directive = hasClient ? 'use client' : hasServer ? 'use server' : '';
  let ok = true;
  if (directive) {
    const fl = fm.line;
    const validForms = new Set([
      `'${directive}'`,
      `'${directive}';`,
      `"${directive}"`,
      `"${directive}";`,
      `${directive}`,
      `${directive};`,
    ]);
    ok = validForms.has(fl);
  }
  return { directive: directive || 'none', directiveOK: ok, first: fm.index, firstLine: fm.line };
}

function hasDefaultExport(txt) {
  return /^\s*export\s+default\b/m.test(txt);
}

function extractImports(txt) {
  const re = /^\s*import\s+[^'";]+from\s+['\"]([^'\"]+)['\"];?|^\s*import\s+['\"]([^'\"]+)['\"][;]?/mg;
  const imports = [];
  let m;
  while ((m = re.exec(txt))) {
    const p = m[1] || m[2];
    if (!p) continue;
    // Skip CSS or image imports
    if (/\.(css|scss|sass|png|jpg|jpeg|gif|svg|ico|webp|avif)(\?.*)?$/i.test(p)) continue;
    imports.push(p);
  }
  return imports;
}

function loadTsconfig() {
  const tsconfigPath = path.resolve('tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return null;
  const raw = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  return raw;
}

function createResolver() {
  const ts = loadTsconfig();
  const baseUrl = ts?.compilerOptions?.baseUrl ? path.resolve(ts.compilerOptions.baseUrl) : process.cwd();
  const paths = ts?.compilerOptions?.paths || {};
  const pathEntries = Object.entries(paths).map(([key, arr]) => {
    return { key, prefix: key.replace(/\*$/, ''), targets: arr.map((a) => a.replace(/\*$/, '')) };
  });
  function resolveAlias(spec) {
    for (const { key, prefix, targets } of pathEntries) {
      if (key === '*' || spec === key || spec.startsWith(prefix)) {
        for (const t of targets) {
          const rest = spec.startsWith(prefix) ? spec.slice(prefix.length) : spec;
          const candidate = path.resolve(baseUrl, t + rest);
          const resolved = resolveFile(candidate);
          if (resolved) return resolved;
        }
      }
    }
    return null;
  }
  function resolveRelative(fromFile, spec) {
    const candidate = path.resolve(path.dirname(fromFile), spec);
    return resolveFile(candidate);
  }
  function resolveNodeModules(spec, fromFile) {
    try {
      return require.resolve(spec, { paths: [path.dirname(fromFile)] });
    } catch {
      return null;
    }
  }
  function resolveFile(candidate) {
    const exts = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];
    const files = [candidate, ...exts.map((e) => candidate + e), ...exts.map((e) => path.join(candidate, 'index' + e))];
    for (const f of files) {
      if (fs.existsSync(f)) return f;
    }
    return null;
  }
  return function resolve(fromFile, spec) {
    if (spec.startsWith('.') || spec.startsWith('/')) {
      return resolveRelative(fromFile, spec);
    }
    const alias = resolveAlias(spec);
    if (alias) return alias;
    return resolveNodeModules(spec, fromFile);
  };
}

function analyze() {
  const pages = listPages();
  const resolve = createResolver();
  const results = [];
  for (const f of pages) {
    const txt = fs.readFileSync(f, 'utf8');
    const dir = directiveStatus(txt);
    const def = hasDefaultExport(txt);
    const imports = extractImports(txt);
    const missing = [];
    for (const s of imports) {
      const resolved = resolve(f, s);
      if (!resolved) missing.push(s);
    }
    results.push({ file: f, directive: dir.directive, directiveOK: dir.directiveOK, firstLine: dir.firstLine, defaultExport: def, missingImports: missing });
  }
  return results;
}

if (require.main === module) {
  const res = analyze();
  for (const r of res) {
    console.log(JSON.stringify(r));
  }
}

