import type { Prisma } from "@/lib/generated/prisma/client";

export const collectionIssueInclude = {
  evidence: true,
  device: { select: { name: true } },
  replacementDevice: { select: { id: true, name: true, condition: true } },
} satisfies Prisma.CollectionIssueInclude;

export type CollectionIssueDetails = Prisma.CollectionIssueGetPayload<{
  include: typeof collectionIssueInclude;
}>;
