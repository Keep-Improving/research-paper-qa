type AnchorInput = {
  kind: string;
  quoteText?: string | null;
  contextText?: string | null;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  note?: string | null;
};

type CreateQuestionInput = {
  paperId: string;
  userId: string;
  body: string;
  anchor?: AnchorInput | null;
};

type CreateReplyInput = {
  discussionId: string;
  userId: string;
  kind: "answer" | "comment" | "author_response" | "correction" | "replication_note";
  body: string;
  parentReplyId?: string | null;
  isAuthorResponse?: boolean;
};

type CreateVoteInput = {
  userId: string;
  value: "up" | "down" | "helpful";
  discussionId?: string | null;
  replyId?: string | null;
};

type DiscussionPrisma = {
  $transaction?: (callback: (tx: DiscussionPrisma) => Promise<unknown>) => Promise<unknown>;
  anchor?: {
    create: (args: any) => Promise<{ id: string }>;
  };
  discussion?: {
    create?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown[]>;
    findFirst?: (args: any) => Promise<unknown | null>;
  };
  discussionReply?: {
    create: (args: any) => Promise<unknown>;
  };
  vote?: {
    upsert: (args: any) => Promise<unknown>;
  };
};

export async function createQuestion(prisma: DiscussionPrisma, input: CreateQuestionInput) {
  return prisma.$transaction!(async (tx) => {
    const anchor = input.anchor
      ? await tx.anchor!.create({
          data: {
            paperId: input.paperId,
            kind: input.anchor.kind,
            quoteText: input.anchor.quoteText ?? undefined,
            contextText: input.anchor.contextText ?? undefined,
            sourceUrl: input.anchor.sourceUrl ?? undefined,
            imageUrl: input.anchor.imageUrl ?? undefined,
            note: input.anchor.note ?? undefined
          }
        })
      : null;

    const discussion = await tx.discussion!.create!({
      data: {
        paperId: input.paperId,
        authorUserId: input.userId,
        anchorId: anchor?.id ?? null,
        title: input.body,
        body: input.body
      },
      include: discussionInclude
    });

    return mapDiscussion(discussion as DiscussionRow);
  });
}

export async function listPaperDiscussions(prisma: DiscussionPrisma, paperId: string) {
  const rows = await prisma.discussion!.findMany!({
    where: {
      paperId,
      isHidden: false
    },
    include: discussionInclude,
    orderBy: [{ createdAt: "desc" }]
  });

  return rows.map((row) => mapDiscussion(row as DiscussionRow));
}

export async function getDiscussionDetail(prisma: DiscussionPrisma, discussionId: string) {
  const row = await prisma.discussion!.findFirst!({
    where: {
      id: discussionId,
      isHidden: false
    },
    include: discussionDetailInclude
  });

  if (!row) {
    return null;
  }

  return mapDiscussionDetail(row as DiscussionDetailRow);
}

export async function createDiscussionReply(prisma: DiscussionPrisma, input: CreateReplyInput) {
  const reply = await prisma.discussionReply!.create({
    data: {
      discussionId: input.discussionId,
      parentReplyId: input.parentReplyId ?? null,
      authorUserId: input.userId,
      kind: input.kind,
      body: input.body,
      isAuthorResponse: input.kind === "author_response" || Boolean(input.isAuthorResponse)
    },
    include: replyInclude
  });

  return mapReply(reply as DiscussionReplyRow);
}

export async function createVote(prisma: DiscussionPrisma, input: CreateVoteInput) {
  if (input.discussionId) {
    return prisma.vote!.upsert({
      where: {
        discussionId_userId_value: {
          discussionId: input.discussionId,
          userId: input.userId,
          value: input.value
        }
      },
      update: {},
      create: {
        discussionId: input.discussionId,
        userId: input.userId,
        value: input.value
      }
    });
  }

  if (input.replyId) {
    return prisma.vote!.upsert({
      where: {
        replyId_userId_value: {
          replyId: input.replyId,
          userId: input.userId,
          value: input.value
        }
      },
      update: {},
      create: {
        replyId: input.replyId,
        userId: input.userId,
        value: input.value
      }
    });
  }

  throw new Error("Vote requires discussionId or replyId");
}

const discussionInclude = {
  anchor: true,
  author: {
    select: {
      displayName: true
    }
  },
  replies: true,
  votes: true
};

const replyInclude = {
  author: {
    select: {
      displayName: true
    }
  },
  votes: true
};

const discussionDetailInclude = {
  ...discussionInclude,
  replies: {
    where: {
      isHidden: false
    },
    include: replyInclude,
    orderBy: [{ createdAt: "asc" }]
  }
};

type DiscussionRow = {
  id: string;
  paperId: string;
  anchorId: string | null;
  title: string;
  body: string;
  status: string;
  authorUserId: string;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  anchor: DiscussionAnchorRow | null;
  author: {
    displayName: string;
  };
  replies: Array<{ kind: string; isAuthorResponse?: boolean }>;
  votes: Array<{ value: string }>;
};

type DiscussionAnchorRow = {
  id?: string;
  kind?: string;
  title?: string | null;
  quoteText?: string | null;
  contextText?: string | null;
  imageUrl?: string | null;
};

type DiscussionDetailRow = DiscussionRow & {
  replies: DiscussionReplyRow[];
};

type DiscussionReplyRow = {
  id: string;
  discussionId: string;
  parentReplyId: string | null;
  kind: string;
  body: string;
  authorUserId: string;
  isAuthorResponse: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    displayName: string;
  };
  votes: Array<{ value: string }>;
};

export function mapDiscussion(row: DiscussionRow) {
  const answerCount = row.replies.filter((reply) => reply.kind === "answer").length;
  const commentCount = row.replies.filter((reply) => reply.kind === "comment").length;
  const authorResponseCount = row.replies.filter((reply) => reply.kind === "author_response" || reply.isAuthorResponse).length;
  const upVotes = row.votes.filter((vote) => vote.value === "up").length;
  const helpfulVotes = row.votes.filter((vote) => vote.value === "helpful").length;

  return {
    id: row.id,
    paperId: row.paperId,
    anchorId: row.anchorId,
    title: row.title,
    body: row.body,
    status: row.status,
    authorName: row.author.displayName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    anchor: row.anchor,
    answerCount,
    commentCount,
    isAuthorResponse: authorResponseCount > 0,
    heat: upVotes + helpfulVotes + answerCount + commentCount + authorResponseCount
  };
}

export function mapDiscussionDetail(row: DiscussionDetailRow) {
  return {
    ...mapDiscussion(row),
    replies: row.replies.map(mapReply)
  };
}

export function mapReply(row: DiscussionReplyRow) {
  const upCount = row.votes.filter((vote) => vote.value === "up").length;
  const downCount = row.votes.filter((vote) => vote.value === "down").length;
  const helpfulCount = row.votes.filter((vote) => vote.value === "helpful").length;

  return {
    id: row.id,
    discussionId: row.discussionId,
    parentReplyId: row.parentReplyId,
    kind: row.kind,
    body: row.body,
    authorUserId: row.authorUserId,
    authorName: row.author.displayName,
    isAuthorResponse: row.isAuthorResponse || row.kind === "author_response",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    upCount,
    downCount,
    helpfulCount
  };
}
