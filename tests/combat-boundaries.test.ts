import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../src");
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(resolve(dir, entry.name))
      : /\.(ts|vue)$/.test(entry.name)
        ? [resolve(dir, entry.name)]
        : [],
  );
}
it("keeps the pure engine local and consumers on the public combat entry points", () => {
  const violations: string[] = [];
  for (const file of files(root)) {
    const local = relative(root, file);
    const inside = local.startsWith("combat/");
    const adapter = ["combat/game.ts", "combat/style.ts"].includes(local);
    const source = readFileSync(file, "utf8");
    const scripts = file.endsWith(".vue")
      ? [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
          .map((m) => m[1])
          .join("\n")
      : source;
    const ast = ts.createSourceFile(
      file,
      scripts,
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node) {
      let specifier: ts.Expression | undefined;
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        specifier = node.moduleSpecifier;
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          node.expression.getText(ast) === "require")
      )
        specifier = node.arguments[0];
      if (specifier && ts.isStringLiteral(specifier)) {
        const name = specifier.text;
        const target = relative(root, resolve(dirname(file), name)).replace(
          /\.ts$/,
          "",
        );
        if (
          inside &&
          !adapter &&
          (!name.startsWith(".") ||
            !target.startsWith("combat/") ||
            /\/(game|style)$/.test(target))
        )
          violations.push(`${local}: pure engine imports ${name}`);
        if (
          !inside &&
          target.startsWith("combat/") &&
          !["combat/index", "combat/game"].includes(target)
        )
          violations.push(`${local}: bypasses public entry via ${name}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  expect(violations).toEqual([]);
});
