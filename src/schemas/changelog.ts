// Changelog ("Was ist neu") - kein DB-Schema, sondern die Form der mit jedem
// Deploy ausgelieferten Datei public/changelog.json. Pro Version eine Kennung,
// ein ISO-Datum und eine kurze, nutzerseitig verstaendliche Stichpunktliste.
// Eintraege newest-first; der erste Eintrag ist die jeweils neueste Version.
import { z } from "zod";

export const changelogEntry = z.object({
  version: z.string(),
  date: z.string(),
  changes: z.array(z.string()).min(1),
});
export type ChangelogEntry = z.infer<typeof changelogEntry>;

export const changelogFile = z.object({
  versions: z.array(changelogEntry).min(1),
});
export type ChangelogFile = z.infer<typeof changelogFile>;
