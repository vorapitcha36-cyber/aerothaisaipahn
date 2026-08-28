import { BadRequestException } from "@nestjs/common";

export const ALLOWED_FILE_TYPES: ReadonlyMap<string, readonly number[]> = new Map([
  ["application/pdf", [0x25, 0x50, 0x44, 0x46]],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", [0x50, 0x4b, 0x03, 0x04]],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [0x50, 0x4b, 0x03, 0x04]]
] as const);

export const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function validateUploadMetadata(mimeType: string, sizeBytes: number) {
  if (!ALLOWED_FILE_TYPES.has(mimeType)) throw new BadRequestException("รองรับเฉพาะ PDF, DOCX และ XLSX");
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE) throw new BadRequestException("ไฟล์ต้องมีขนาดไม่เกิน 25 MB");
}

export function matchesFileSignature(mimeType: string, firstBytes: Uint8Array): boolean {
  const signature = ALLOWED_FILE_TYPES.get(mimeType);
  return Boolean(signature?.every((value, index) => firstBytes[index] === value));
}
