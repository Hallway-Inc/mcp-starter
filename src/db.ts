import pg from "pg";
import { env } from "./env.js";

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

interface CharacterEmailConfig {
  companyEmail: string;
  companyName: string;
  personaName: string;
}

export async function getCharacterEmailConfig(
  characterId: string,
): Promise<CharacterEmailConfig> {
  const result = await pool.query(
    `SELECT "companyEmail", "companyName", "personaName"
		 FROM "CharacterConfig"
		 WHERE "characterId" = $1`,
    [characterId],
  );

  if (result.rows.length === 0) {
    throw new Error(`No config found for character ${characterId}`);
  }

  const row = result.rows[0];
  if (!row.companyEmail) {
    throw new Error(`No companyEmail configured for character ${characterId}`);
  }

  return {
    companyEmail: row.companyEmail,
    companyName: row.companyName || "Unknown Company",
    personaName: row.personaName || "Hallway Agent",
  };
}
