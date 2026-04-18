import * as React from "react";
import { Plus, Trash2, Download, FileArchive } from "lucide-react";
import { Button } from "./ui/button";

export function TopBar({
  projectName,
  rowCount,
  selectedCount,
  onAddRow,
  onDeleteSelected,
  onGenerate,
  onGenerateSeparate,
  isGenerating,
}) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-surface-200 shadow-sm sticky top-0 z-20">
      {/* Left: Project info */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-surface-800 tracking-tight">
          {projectName || "Select a Project"}
        </h2>
        <div className="h-5 w-px bg-surface-200" />
        <span className="text-xs font-medium text-surface-400">
          {rowCount} {rowCount === 1 ? "row" : "rows"}
        </span>
        {selectedCount > 0 && (
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
            {selectedCount} selected
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <Button variant="danger" size="sm" onClick={onDeleteSelected}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        )}

        <Button variant="secondary" size="sm" onClick={onAddRow}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Row
        </Button>

        <div className="h-5 w-px bg-surface-200 mx-1" />

        <Button
          variant="secondary"
          size="sm"
          onClick={onGenerateSeparate}
          disabled={selectedCount === 0 || isGenerating}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {isGenerating ? "Generating..." : "Download Each"}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onGenerate}
          disabled={selectedCount === 0 || isGenerating}
        >
          <FileArchive className="h-3.5 w-3.5 mr-1.5" />
          {isGenerating ? "Generating..." : "Download ZIP"}
        </Button>
      </div>
    </div>
  );
}
