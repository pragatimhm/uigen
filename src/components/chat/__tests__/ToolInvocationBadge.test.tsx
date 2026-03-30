import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/components/Button.tsx" })).toBe("Creating Button.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/App.tsx" })).toBe("Editing App.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/App.tsx" })).toBe("Editing App.tsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "src/index.tsx" })).toBe("Viewing index.tsx");
});

test("getToolLabel: str_replace_editor unknown command falls back to Editing", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/App.tsx" })).toBe("Editing App.tsx");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "src/Old.tsx" })).toBe("Renaming Old.tsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "src/components/Unused.tsx" })).toBe("Deleting Unused.tsx");
});

test("getToolLabel: unknown tool falls back to tool name", () => {
  expect(getToolLabel("some_other_tool", { command: "foo", path: "file.ts" })).toBe("some_other_tool");
});

test("getToolLabel: extracts file name from nested path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "a/b/c/deep.tsx" })).toBe("Creating deep.tsx");
});

test("getToolLabel: handles missing path gracefully", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating ");
});

// --- ToolInvocationBadge component tests ---

test("shows spinner and label while in-progress", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/Button.tsx" },
    state: "call",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
  // Spinner should be present (animate-spin class)
  const badge = screen.getByText("Creating Button.tsx").closest("div");
  expect(badge?.parentElement?.querySelector(".animate-spin")).toBeDefined();
});

test("shows green dot and label when done", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/Button.tsx" },
    state: "result",
    result: "ok",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
  // Spinner should NOT be present
  expect(container.querySelector(".animate-spin")).toBeNull();
  // Green dot should be present
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("shows editing label for str_replace command", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "src/App.tsx" },
    state: "result",
    result: "ok",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("shows renaming label for file_manager rename", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "3",
    toolName: "file_manager",
    args: { command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" },
    state: "call",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming Old.tsx")).toBeDefined();
});

test("shows deleting label for file_manager delete", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "4",
    toolName: "file_manager",
    args: { command: "delete", path: "src/Dead.tsx" },
    state: "result",
    result: "ok",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Deleting Dead.tsx")).toBeDefined();
});
