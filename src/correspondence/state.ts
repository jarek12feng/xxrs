export const messageKinds = [
  "rumor",
  "news",
  "opportunity",
  "notice",
  "invitation",
  "request",
  "reply",
] as const;
export type MessageKind = (typeof messageKinds)[number];
export const destinations = [
  "world",
  "arena",
  "relationship",
  "sect",
  "story",
] as const;
export interface Letter {
  id: string;
  kind: MessageKind;
  sender: string;
  reliability: "personal" | "public" | "hearsay";
  title: string;
  body: string;
  received: number;
  read: boolean;
  followed: boolean;
  response: "none" | "accepted" | "declined" | "confirmed";
  destination: (typeof destinations)[number];
  expires: number | null;
}
export interface Correspondence {
  letters: Letter[];
}
export const freshCorrespondence = (): Correspondence => ({ letters: [] });
// More than the maximum normal lifespan's yearly notices; do not erase personal history.
export const LETTER_LIMIT = 2048;
export function validCorrespondence(
  value: unknown,
  month: number,
): value is Correspondence {
  if (!value || typeof value !== "object") return false;
  const letters = (value as Correspondence).letters;
  if (!Array.isArray(letters) || letters.length > LETTER_LIMIT) return false;
  const ids = new Set<string>();
  const text = (v: unknown, max: number) =>
    typeof v === "string" && v.length > 0 && v.length <= max;
  return letters.every((l) => {
    if (!l || !text(l.id, 100) || !/^[a-z0-9:-]+$/.test(l.id) || ids.has(l.id))
      return false;
    ids.add(l.id);
    return (
      messageKinds.includes(l.kind) &&
      text(l.sender, 100) &&
      text(l.title, 160) &&
      text(l.body, 4000) &&
      ["personal", "public", "hearsay"].includes(l.reliability) &&
      Number.isSafeInteger(l.received) &&
      l.received >= 0 &&
      l.received <= month &&
      typeof l.read === "boolean" &&
      typeof l.followed === "boolean" &&
      ["none", "accepted", "declined", "confirmed"].includes(l.response) &&
      (l.response === "none" || l.read) &&
      destinations.includes(l.destination) &&
      (l.expires === null ||
        (Number.isSafeInteger(l.expires) && l.expires > l.received))
    );
  });
}
