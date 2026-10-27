const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const files = [];
function visit(dir) {
  for (const name of fs.readdirSync(dir)) {
    const item = path.join(dir, name);
    if (fs.statSync(item).isDirectory()) visit(item);
    else if (/\.tsx?$/.test(item)) files.push(item);
  }
}
visit('src');
let errors = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const parsed = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const result = ts.transpileModule(text, {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, strict: true },
  });
  const diagnostics = [...parsed.parseDiagnostics, ...(result.diagnostics || [])].filter(d => d.category === ts.DiagnosticCategory.Error);
  for (const d of diagnostics) console.error(file, ts.flattenDiagnosticMessageText(d.messageText, ' '));
  errors += diagnostics.length;
}
console.log(`${files.length} TS/TSX modules; ${errors} syntax/transpile errors.`);
console.log('Scope: parsing and transpilation only, not dependency-aware typechecking or a Next.js build.');
process.exitCode = errors ? 1 : 0;
