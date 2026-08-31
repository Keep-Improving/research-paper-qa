ALTER TABLE "Paper" ADD COLUMN "identityTitle" TEXT NOT NULL DEFAULT '';

UPDATE "Paper"
SET "identityTitle" = lower(regexp_replace(regexp_replace("title", '[^[:alnum:][:alpha:]]+', ' ', 'g'), '\\s+', ' ', 'g'));

CREATE INDEX "Paper_identityTitle_idx" ON "Paper"("identityTitle");

CREATE TABLE "PaperLink" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaperLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaperLink_url_key" ON "PaperLink"("url");
CREATE INDEX "PaperLink_paperId_idx" ON "PaperLink"("paperId");
ALTER TABLE "PaperLink" ADD CONSTRAINT "PaperLink_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
