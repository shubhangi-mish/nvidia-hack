import { describe, expect, it } from "vitest";
import { hasSafePublicLocation, statusLabel } from "./incident";

describe("public incident display safety", () => {
  it("formats a status without converting it into a verification claim", () => {
    expect(statusLabel("community_reported")).toBe("community reported");
  });

  it("recognizes the required withheld-location label", () => {
    expect(hasSafePublicLocation("Location withheld pending verification")).toBe(true);
  });
});
