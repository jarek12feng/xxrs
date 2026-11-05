import type { State } from "../world";
/** Only a delivered personal reply proves she received the earlier greeting. */
export function reunionLetterEcho(s: State): string {
  return s.correspondence.letters.some(
    (l) => l.id.startsWith("answer:su:greeting:") && l.sender === "苏婉宁",
  )
    ? "她又提起那封报平安的信：“见到落款时便放了心，如今见到人，就更踏实了。”"
    : "";
}
