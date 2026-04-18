import * as React from "react";
import { FileText, FolderOpen } from "lucide-react";

export function Sidebar({ projects, activeProjectId, onSelectProject }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <FileText className="h-5 w-5 text-brand-400 flex-shrink-0" />
        <h1>Letter Automate</h1>
      </div>

      <div className="sidebar-section-label">Projects</div>

      <nav className="flex flex-col gap-0.5 px-0 pb-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`sidebar-project-item ${activeProjectId === project.id ? "active" : ""}`}
            onClick={() => onSelectProject(project.id)}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-surface-500" />
              <span className="project-name">{project.name}</span>
            </div>
            <div className="project-meta pl-5.5">
              <span>{project.template}</span>
              <span className="project-meta-dot" />
              <span>{project.dataSource}</span>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="px-5 py-4 text-xs text-surface-500 italic">
            No projects configured.
          </div>
        )}
      </nav>
    </aside>
  );
}
