export type AuthorIdentityRole = "first_author" | "corresponding_author";
export type AuthorIdentitySource =
  | "pdf_text"
  | "publisher_page"
  | "crossref"
  | "openalex"
  | "manual_seed"
  | "imported_file";
export type AuthorIdentityStatus = "verified" | "needs_verification";

type UpsertPaperAuthorIdentityInput = {
  paperId: string;
  role: AuthorIdentityRole;
  email: string;
  name?: string | null;
  source: AuthorIdentitySource;
  status?: AuthorIdentityStatus;
};

type AuthorIdentityPrisma = {
  paperAuthorIdentity: {
    upsert: (args: any) => Promise<unknown>;
    findFirst?: (args: any) => Promise<unknown | null>;
  };
  discussion?: {
    findUnique: (args: any) => Promise<{ id: string; paperId: string } | null>;
  };
  user?: {
    findUnique: (args: any) => Promise<{ id: string; email: string; emailVerifiedAt?: Date | null } | null>;
  };
};

type CanCreateAuthorResponseInput = {
  discussionId: string;
  userId: string;
};

type AuthorIdentityCandidateInput = {
  paperId: string;
  firstAuthorName?: string | null;
  text: string;
  source?: AuthorIdentitySource;
};

export type AuthorIdentityCandidate = UpsertPaperAuthorIdentityInput;

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const correspondencePattern = /(correspondence|corresponding|correspondence to|corresponding author|contact|email)/i;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function upsertPaperAuthorIdentity(
  prisma: AuthorIdentityPrisma,
  input: UpsertPaperAuthorIdentityInput
) {
  const normalizedEmail = normalizeEmail(input.email);
  const status = input.status ?? "verified";

  return prisma.paperAuthorIdentity.upsert({
    where: {
      paperId_normalizedEmail_role: {
        paperId: input.paperId,
        normalizedEmail,
        role: input.role
      }
    },
    update: {
      email: input.email.trim(),
      name: input.name ?? undefined,
      source: input.source,
      status
    },
    create: {
      paperId: input.paperId,
      role: input.role,
      name: input.name ?? undefined,
      email: input.email.trim(),
      normalizedEmail,
      source: input.source,
      status
    }
  });
}

export async function canCreateAuthorResponse(
  prisma: AuthorIdentityPrisma,
  input: CanCreateAuthorResponseInput
) {
  const discussion = await prisma.discussion!.findUnique({
    where: { id: input.discussionId },
    select: { id: true, paperId: true }
  });

  if (!discussion) {
    return false;
  }

  const user = await prisma.user!.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, emailVerifiedAt: true }
  });

  if (!user?.email || !user.emailVerifiedAt) {
    return false;
  }

  const identity = await prisma.paperAuthorIdentity.findFirst!({
    where: {
      paperId: discussion.paperId,
      normalizedEmail: normalizeEmail(user.email),
      status: "verified",
      role: {
        in: ["corresponding_author", "first_author"]
      }
    }
  });

  return Boolean(identity);
}

export function buildAuthorIdentityCandidatesFromText(input: AuthorIdentityCandidateInput) {
  const source = input.source ?? "pdf_text";
  const matches = Array.from(input.text.matchAll(emailPattern));
  const candidates = new Map<string, AuthorIdentityCandidate>();

  for (const match of matches) {
    const email = normalizeEmail(match[0]);
    const windowStart = Math.max(0, match.index - 120);
    const windowEnd = Math.min(input.text.length, match.index + match[0].length + 120);
    const nearbyText = input.text.slice(windowStart, windowEnd);

    if (correspondencePattern.test(nearbyText)) {
      candidates.set(`corresponding_author:${email}`, {
        paperId: input.paperId,
        role: "corresponding_author",
        email,
        source,
        status: "verified"
      });
    }
  }

  return Array.from(candidates.values());
}
