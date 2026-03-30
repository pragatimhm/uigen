"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: unknown): string {
  if (typeof path !== "string" || !path) return "";
  return path.split("/").pop() ?? path;
}

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  const fileName = getFileName(args.path);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${fileName}`;
      case "str_replace":
      case "insert":
        return `Editing ${fileName}`;
      case "view":
        return `Viewing ${fileName}`;
      default:
        return fileName ? `Editing ${fileName}` : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename":
        return `Renaming ${fileName}`;
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return fileName ? `Managing ${fileName}` : "Managing file";
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isDone = toolInvocation.state === "result";
  const label = getToolLabel(
    toolInvocation.toolName,
    toolInvocation.args as Record<string, unknown>
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
