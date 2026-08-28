import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { matchesFileSignature, MAX_FILE_SIZE, validateUploadMetadata } from "./file-policy";

describe("file security policy", () => {
  it("accepts only supported metadata within 25 MB", () => {
    expect(() => validateUploadMetadata("application/pdf", MAX_FILE_SIZE)).not.toThrow();
    expect(() => validateUploadMetadata("image/png", 100)).toThrow(BadRequestException);
    expect(() => validateUploadMetadata("application/pdf", MAX_FILE_SIZE + 1)).toThrow(BadRequestException);
  });
  it("detects a spoofed PDF by signature", () => {
    expect(matchesFileSignature("application/pdf", Uint8Array.from([0x25, 0x50, 0x44, 0x46]))).toBe(true);
    expect(matchesFileSignature("application/pdf", Uint8Array.from([0x4d, 0x5a, 0x90, 0x00]))).toBe(false);
  });
});
