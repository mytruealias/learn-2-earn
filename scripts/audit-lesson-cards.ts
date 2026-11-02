import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { adaptCard } from "../lib/lesson/cards";
export function authoredCards() {
  const files = [
    "prisma/seed.ts",
    "prisma/seed-recovery.ts",
    ...readdirSync("prisma/recovery-expansions")
      .filter((f) => f.endsWith(".ts"))
      .map((f) => "prisma/recovery-expansions/" + f),
  ];
  const cards: { [key: string]: unknown }[] = [];
  function value(n: ts.Expression): unknown {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
      return n.text;
    if (ts.isNumericLiteral(n)) return Number(n.text);
    if (ts.isArrayLiteralExpression(n)) return n.elements.map((e) => value(e));
    if (
      ts.isCallExpression(n) &&
      n.expression.getText().replaceAll(" ", "") === "JSON.stringify"
    )
      return JSON.stringify(value(n.arguments[0]));
  }
  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node) {
      if (ts.isObjectLiteralExpression(node)) {
        const card: { [key: string]: unknown } = {};
        for (const p of node.properties)
          if (ts.isPropertyAssignment(p))
            card[p.name.getText(source).replace(/['"]/g, "")] = value(
              p.initializer,
            );
        if (card.type && card.prompt)
          cards.push({
            ...card,
            id: `${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`,
            ...(card.choices
              ? { choicesJson: JSON.stringify(card.choices) }
              : {}),
            ...(card.answer !== undefined
              ? { answerJson: JSON.stringify(card.answer) }
              : {}),
          });
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return cards;
}
if (process.argv[1]?.endsWith("audit-lesson-cards.ts")) {
  const cards = authoredCards(),
    types: Record<string, number> = {},
    kinds: Record<string, number> = {};
  for (const c of cards) {
    types[String(c.type)] = (types[String(c.type)] || 0) + 1;
    const r = adaptCard(c);
    if (!r.ok) throw new Error(`Invalid authored card at ${c.id}`);
    kinds[r.card.public.kind] = (kinds[r.card.public.kind] || 0) + 1;
  }
  console.log(
    JSON.stringify(
      {
        authoredDefinitions: cards.length,
        types,
        adapterKinds: kinds,
        note: "Authored definitions include expansion slots; this is not a deployed database count.",
      },
      null,
      2,
    ),
  );
}
