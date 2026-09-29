import { describe, expect, it } from "vitest";
import {
  iconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/button-styles";

function expectPressable(className: string) {
  expect(className).toContain("cursor-pointer");
  expect(className).toContain("hover:");
  expect(className).toContain("active:");
  expect(className).toContain("focus-visible:outline");
  expect(className).toContain("disabled:cursor-not-allowed");
  expect(className).toContain("disabled:hover:");
}

describe("button styles", () => {
  it("gives primary, secondary, and icon buttons a visible press and a disabled rest state", () => {
    expectPressable(primaryButtonClass);
    expectPressable(secondaryButtonClass);
    expectPressable(iconButtonClass);
    expect(primaryButtonClass).toContain("hover:bg-[#3730a3]");
    expect(primaryButtonClass).toContain("active:bg-[#312e81]");
    expect(primaryButtonClass).toContain("disabled:hover:bg-[#e4e3f8]");
    expect(secondaryButtonClass).toContain("hover:bg-slate-100");
    expect(iconButtonClass).toContain("disabled:bg-slate-100");
    expect(iconButtonClass).toContain("disabled:text-slate-300");
  });
});
