import { sql } from "drizzle-orm";

/** One statement. The conflict update locks the row, then returns the new count. */
export function demoQuestionUpsertSql(key: string, cap: number) {
  return sql`
    INSERT INTO settings (key, value)
    VALUES (${key}, '1')
    ON CONFLICT (key) DO UPDATE
    SET value = CAST(CAST(settings.value AS integer) + 1 AS text)
    WHERE settings.value ~ '^[0-9]+$'
      AND CAST(settings.value AS integer) < ${cap}
    RETURNING value
  `;
}
