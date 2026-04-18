"use client";

import * as React from "react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { DataTable } from "@/components/data-table/data-table";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function base64ToBlob(base64, mime) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function Page() {
  const [projects, setProjects] = React.useState([]);
  const [activeProjectId, setActiveProjectId] = React.useState(null);
  const [data, setData] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;
  const getSelectedRows = () => data.filter((_, i) => rowSelection[i]);

  // ── Data fetching ──

  const fetchProjectData = React.useCallback(async (projectId) => {
    if (!projectId) return;
    setIsLoading(true);
    setRowSelection({});
    try {
      const res = await fetch(`/api/data?projectId=${projectId}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Failed to load project data.");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/projects");
        const list = await res.json();
        setProjects(list);
        if (list.length > 0) setActiveProjectId(list[0].id);
      } catch {
        toast.error("Failed to load projects.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    fetchProjectData(activeProjectId);
  }, [activeProjectId, fetchProjectData]);

  // ── Cell editing (writes back to .xlsx) ──

  const handleUpdateData = async (rowIndex, columnName, value) => {
    setData((prev) =>
      prev.map((row) =>
        row.__rowIndex === rowIndex ? { ...row, [columnName]: value } : row
      )
    );

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId, action: "update_cell", rowIndex, columnName, value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to save. Reloading...");
      fetchProjectData(activeProjectId);
    }
  };

  // ── Row operations ──

  const handleAddRow = async () => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId, action: "add_row" }),
      });
      if (!res.ok) throw new Error();
      await fetchProjectData(activeProjectId);
      toast.success("Row added.");
    } catch {
      toast.error("Failed to add row.");
    }
  };

  const handleDeleteSelected = async () => {
    const indices = getSelectedRows().map((r) => r.__rowIndex);
    if (!indices.length || !confirm(`Delete ${indices.length} row(s)?`)) return;

    try {
      const res = await fetch("/api/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId, rowIndices: indices }),
      });
      if (!res.ok) throw new Error();
      await fetchProjectData(activeProjectId);
      toast.success("Rows deleted.");
    } catch {
      toast.error("Failed to delete rows.");
    }
  };

  // ── Document generation (unified handler) ──

  const handleGenerate = async (mode = "zip") => {
    const selected = getSelectedRows();
    if (!selected.length) return;

    setIsGenerating(true);
    toast.loading("Generating...", { id: "gen" });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: selected, projectId: activeProjectId, mode }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Generation failed");
      }

      if (mode === "separate") {
        const { files } = await res.json();
        files.forEach((f) => saveAs(base64ToBlob(f.data, DOCX_MIME), f.name));
        toast.success(`${files.length} document(s) downloaded!`, { id: "gen" });
      } else {
        const blob = await res.blob();
        const cd = res.headers.get("Content-Disposition");
        const filename = cd?.includes("filename=")
          ? cd.split("filename=")[1].replace(/"/g, "")
          : "documents.zip";
        saveAs(blob, filename);
        toast.success("Documents generated!", { id: "gen" });
      }

      setRowSelection({});
    } catch (err) {
      toast.error(err.message, { id: "gen" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Render ──

  if (isLoading && !projects.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-surface-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-screen">
      <Sidebar projects={projects} activeProjectId={activeProjectId} onSelectProject={setActiveProjectId} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          projectName={activeProject?.name}
          rowCount={data.length}
          selectedCount={selectedCount}
          onAddRow={handleAddRow}
          onDeleteSelected={handleDeleteSelected}
          onGenerate={() => handleGenerate("zip")}
          onGenerateSeparate={() => handleGenerate("separate")}
          isGenerating={isGenerating}
        />

        <main className="flex-1 p-5 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="spinner mx-auto mb-4" />
                <p className="text-sm text-surface-400">Loading data...</p>
              </div>
            </div>
          ) : (
            <DataTable
              data={data}
              visibleColumns={activeProject?.visibleColumns}
              updateData={handleUpdateData}
              onSelectionChange={setRowSelection}
            />
          )}
        </main>
      </div>
    </div>
  );
}
