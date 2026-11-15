import { randomUUID } from "node:crypto";

export const EVIDENCE_BUCKET = "collection-issue-evidence";
export const MAX_EVIDENCE_FILES = 5;
export const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;
export class EvidenceError extends Error {}

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

function matchesType(bytes: Uint8Array, mimeType: string) {
  const startsWith = (values: number[]) => values.every((value, index) => bytes[index] === value);
  const textAt = (offset: number, text: string) =>
    [...text].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
  switch (mimeType) {
    case "image/jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return textAt(0, "RIFF") && textAt(8, "WEBP");
    case "video/mp4":
    case "video/quicktime":
      return textAt(4, "ftyp");
    case "video/webm":
      return startsWith([0x1a, 0x45, 0xdf, 0xa3]);
    default:
      return false;
  }
}

export async function validateEvidence(files: File[]) {
  if (files.length > MAX_EVIDENCE_FILES) {
    throw new EvidenceError("You can upload at most 5 evidence files.");
  }
  const validated: { file: File; bytes: ArrayBuffer; extension: string }[] = [];
  for (const file of files) {
    const extension = extensions[file.type];
    if (!extension || file.size === 0 || file.size > MAX_EVIDENCE_SIZE) {
      throw new EvidenceError("Use JPG, PNG, WebP, MP4, MOV or WebM files of at most 10 MB each.");
    }
    const bytes = await file.arrayBuffer();
    if (!matchesType(new Uint8Array(bytes), file.type)) {
      throw new EvidenceError("An evidence file does not match its image or video type.");
    }
    validated.push({ file, bytes, extension });
  }
  return validated;
}

async function privateStorage() {
  const { supabaseAdmin } = await import("@/lib/supabase-admin");
  const { data, error } = await supabaseAdmin.storage.getBucket(EVIDENCE_BUCKET);
  if (error || !data || data.public) {
    throw new EvidenceError("The private collection issue evidence bucket is not configured.");
  }
  return supabaseAdmin.storage.from(EVIDENCE_BUCKET);
}

export async function uploadEvidence(
  rentalId: string,
  issueId: string,
  files: Awaited<ReturnType<typeof validateEvidence>>,
) {
  if (files.length === 0) return [];
  const storage = await privateStorage();
  const uploaded: { path: string; mimeType: string }[] = [];
  try {
    for (const { file, bytes, extension } of files) {
      const path = `${rentalId}/${issueId}/${randomUUID()}.${extension}`;
      const { error } = await storage.upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw new EvidenceError("Could not upload issue evidence.");
      uploaded.push({ path, mimeType: file.type });
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) {
      const cleanup = await storage.remove(uploaded.map((item) => item.path));
      if (cleanup.error) console.error("Could not clean up uploaded issue evidence.");
    }
    throw error;
  }
}

export async function removeEvidence(paths: string[]) {
  if (!paths.length) return;
  const storage = await privateStorage();
  const { error } = await storage.remove(paths);
  if (error) throw new Error("Could not clean up uploaded issue evidence.");
}

export async function signEvidence(items: { id: string; path: string; mimeType: string }[]) {
  if (!items.length) return [];
  const storage = await privateStorage();
  return Promise.all(items.map(async (item) => {
    const { data, error } = await storage.createSignedUrl(item.path, 600);
    if (error || !data) throw new Error("Could not open issue evidence.");
    return { id: item.id, mimeType: item.mimeType, url: data.signedUrl };
  }));
}
