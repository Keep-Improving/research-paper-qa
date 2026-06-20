import { readFile } from "node:fs/promises";

import { PrismaClient } from "@prisma/client";

import {
  buildAuthorIdentityCandidatesFromText,
  normalizeEmail,
  upsertPaperAuthorIdentity,
  type AuthorIdentityRole,
  type AuthorIdentitySource,
  type AuthorIdentityStatus
} from "../lib/repositories/authorIdentities";

type IdentityRecord = {
  paperId: string;
  role: AuthorIdentityRole;
  email: string;
  name?: string;
  source?: AuthorIdentitySource;
  status?: AuthorIdentityStatus;
};

type TextRecord = {
  paperId: string;
  text: string;
  firstAuthorName?: string;
  source?: AuthorIdentitySource;
};

type ImportPayload = IdentityRecord[] | {
  identities?: IdentityRecord[];
  texts?: TextRecord[];
};

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("Usage: tsx scripts/import-author-identities.ts <identities.json>");
  }

  const payload = JSON.parse(await readFile(filePath, "utf8")) as ImportPayload;
  const records = Array.isArray(payload) ? payload : payload.identities ?? [];
  const textRecords = Array.isArray(payload) ? [] : payload.texts ?? [];
  const prisma = new PrismaClient();

  try {
    let importedCount = 0;

    for (const record of records) {
      validateIdentityRecord(record);
      await upsertPaperAuthorIdentity(prisma, {
        paperId: record.paperId,
        role: record.role,
        email: record.email,
        name: record.name,
        source: record.source ?? "imported_file",
        status: record.status ?? "verified"
      });
      importedCount += 1;
    }

    for (const textRecord of textRecords) {
      if (!textRecord.paperId || !textRecord.text) {
        throw new Error("Each text record requires paperId and text.");
      }

      const candidates = buildAuthorIdentityCandidatesFromText({
        paperId: textRecord.paperId,
        firstAuthorName: textRecord.firstAuthorName,
        text: textRecord.text,
        source: textRecord.source ?? "pdf_text"
      });

      for (const candidate of candidates) {
        await upsertPaperAuthorIdentity(prisma, candidate);
        importedCount += 1;
      }
    }

    console.log(`Imported ${importedCount} author identities.`);
  } finally {
    await prisma.$disconnect();
  }
}

function validateIdentityRecord(record: IdentityRecord) {
  if (!record.paperId || !record.role || !record.email) {
    throw new Error("Each identity record requires paperId, role, and email.");
  }

  if (!["first_author", "corresponding_author"].includes(record.role)) {
    throw new Error(`Unsupported author identity role: ${record.role}`);
  }

  if (!normalizeEmail(record.email).includes("@")) {
    throw new Error(`Invalid email: ${record.email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
