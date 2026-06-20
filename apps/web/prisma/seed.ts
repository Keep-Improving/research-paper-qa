import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const reader = await prisma.user.upsert({
    where: { email: "reader@example.test" },
    update: {},
    create: {
      id: "user-reader",
      displayName: "Reader",
      email: "reader@example.test"
    }
  });

  const author = await prisma.user.upsert({
    where: { email: "author@example.test" },
    update: {},
    create: {
      id: "user-author",
      displayName: "A. Vaswani",
      email: "author@example.test",
      role: "researcher"
    }
  });

  const transformer = await prisma.paper.upsert({
    where: { id: "paper-transformer" },
    update: {},
    create: {
      id: "paper-transformer",
      title: "Attention Is All You Need",
      authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
      venue: "NeurIPS",
      year: 2017,
      doi: "10.48550/arXiv.1706.03762",
      abstract: "A compact seed record for exercising real research-paper discussion workflows."
    }
  });

  await prisma.paper.upsert({
    where: { id: "paper-contrastive" },
    update: {},
    create: {
      id: "paper-contrastive",
      title: "A Simple Framework for Contrastive Learning of Visual Representations",
      authors: ["Ting Chen", "Simon Kornblith", "Mohammad Norouzi"],
      venue: "ICML",
      year: 2020,
      doi: "10.48550/arXiv.2002.05709",
      abstract: "Seed data for empty and search states."
    }
  });

  const equationAnchor = await prisma.anchor.upsert({
    where: { id: "anchor-equation-scale" },
    update: {},
    create: {
      id: "anchor-equation-scale",
      paperId: transformer.id,
      title: "Equation 1 attention scaling",
      kind: "text",
      quoteText: "Attention(Q, K, V) = softmax(QK^T / sqrt(dk))V",
      contextText: "The scaling term keeps dot products from growing too large as key dimensionality increases.",
      pageNumber: 4,
      sectionLabel: "3.2.1 Scaled Dot-Product Attention",
      position: "Section 3.2.1, equation block"
    }
  });

  const figureAnchor = await prisma.anchor.upsert({
    where: { id: "anchor-figure-caption" },
    update: {},
    create: {
      id: "anchor-figure-caption",
      paperId: transformer.id,
      title: "Figure 1 model architecture",
      kind: "figure",
      quoteText: "The Transformer follows this overall architecture using stacked self-attention.",
      contextText: "Encoder and decoder stacks are shown with multi-head attention, residual connections, and feed-forward layers.",
      pageNumber: 3,
      sectionLabel: "3 Model Architecture",
      position: "Figure 1 caption",
      imageAlt: "Transformer architecture diagram anchor",
      imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 180'%3E%3Crect width='420' height='180' fill='%23f6f5f1'/%3E%3Crect x='44' y='32' width='132' height='116' fill='%23ffffff' stroke='%23696358'/%3E%3Crect x='244' y='32' width='132' height='116' fill='%23ffffff' stroke='%23696358'/%3E%3Cpath d='M176 90h68' stroke='%232f5f73' stroke-width='3'/%3E%3Cpath d='M232 78l14 12-14 12' fill='none' stroke='%232f5f73' stroke-width='3'/%3E%3Ctext x='110' y='84' text-anchor='middle' font-family='Georgia' font-size='16' fill='%2326211b'%3EEncoder%3C/text%3E%3Ctext x='310' y='84' text-anchor='middle' font-family='Georgia' font-size='16' fill='%2326211b'%3EDecoder%3C/text%3E%3Ctext x='210' y='160' text-anchor='middle' font-family='Georgia' font-size='13' fill='%23696358'%3EFigure anchor seed%3C/text%3E%3C/svg%3E"
    }
  });

  const attentionDiscussion = await prisma.discussion.upsert({
    where: { id: "discussion-attention-scale" },
    update: {},
    create: {
      id: "discussion-attention-scale",
      paperId: transformer.id,
      anchorId: equationAnchor.id,
      title: "Why does scaled dot-product attention divide by sqrt(dk)?",
      body: "The paper states that scaling prevents extremely small gradients. What empirical or theoretical evidence supports this specific normalizer?",
      status: "author_responded",
      authorUserId: reader.id
    }
  });

  await prisma.discussion.upsert({
    where: { id: "discussion-figure-residual" },
    update: {},
    create: {
      id: "discussion-figure-residual",
      paperId: transformer.id,
      anchorId: figureAnchor.id,
      title: "Are the residual paths in Figure 1 applied before or after normalization?",
      body: "The diagram is compact. The implementation order affects how readers reproduce the architecture.",
      status: "open",
      authorUserId: reader.id
    }
  });

  await prisma.discussion.upsert({
    where: { id: "discussion-bleu-dispute" },
    update: {},
    create: {
      id: "discussion-bleu-dispute",
      paperId: transformer.id,
      anchorId: equationAnchor.id,
      title: "BLEU comparison needs clearer tokenizer settings",
      body: "The reported comparison may be sensitive to preprocessing details.",
      status: "disputed",
      authorUserId: reader.id
    }
  });

  await prisma.discussionReply.upsert({
    where: { id: "reply-attention-scale-answer" },
    update: {},
    create: {
      id: "reply-attention-scale-answer",
      discussionId: attentionDiscussion.id,
      kind: "answer",
      body: "The variance of unscaled dot products grows with dimension, so the normalizer keeps softmax gradients in a usable range.",
      authorUserId: reader.id
    }
  });

  await prisma.discussionReply.upsert({
    where: { id: "reply-attention-scale-author" },
    update: {},
    create: {
      id: "reply-attention-scale-author",
      discussionId: attentionDiscussion.id,
      kind: "author_response",
      body: "Verified author response: the scaling was chosen to stabilize logits across common model widths and matched early ablation behavior.",
      authorUserId: author.id,
      isAuthorResponse: true
    }
  });

  await prisma.paperAuthorClaim.upsert({
    where: { id: "claim-author-transformer" },
    update: {},
    create: {
      id: "claim-author-transformer",
      paperId: transformer.id,
      userId: author.id,
      claimedRole: "corresponding_author",
      evidenceType: "institutional_email",
      evidenceDetail: "author@example.test",
      status: "approved"
    }
  });

  await prisma.collectionItem.upsert({
    where: {
      userId_targetType_targetId: {
        userId: reader.id,
        targetType: "paper",
        targetId: transformer.id
      }
    },
    update: { note: "reading list" },
    create: {
      userId: reader.id,
      targetType: "paper",
      targetId: transformer.id,
      note: "reading list"
    }
  });

  await prisma.collectionItem.upsert({
    where: {
      userId_targetType_targetId: {
        userId: reader.id,
        targetType: "discussion",
        targetId: attentionDiscussion.id
      }
    },
    update: { note: "follow up after author clarification" },
    create: {
      userId: reader.id,
      targetType: "discussion",
      targetId: attentionDiscussion.id,
      note: "follow up after author clarification"
    }
  });

  await prisma.collectionItem.upsert({
    where: {
      userId_targetType_targetId: {
        userId: reader.id,
        targetType: "anchor",
        targetId: equationAnchor.id
      }
    },
    update: { note: "attention scaling anchor" },
    create: {
      userId: reader.id,
      targetType: "anchor",
      targetId: equationAnchor.id,
      note: "attention scaling anchor"
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
