import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_PATH = path.join(DATA_DIR, "projects.json");

function getProject(projectId) {
  if (!fs.existsSync(PROJECTS_PATH)) return null;
  const projects = JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf-8"));
  return projects.find((p) => p.id === projectId) || null;
}

function renderDocument(templateContent, row, mapping) {
  const zip = new PizZip(templateContent);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  // Build mapped data from project config
  const data = { ...row };
  for (const [tag, col] of Object.entries(mapping)) {
    data[tag] = row[col] || "";
  }

  doc.render(data);

  return {
    buffer: doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }),
    name: `${(data.nama_wp || data.Nama || "document").replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`,
  };
}

export async function POST(request) {
  try {
    const { rows, projectId, mode = "zip" } = await request.json();

    if (!rows?.length) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const templatePath = path.join(DATA_DIR, project.template);
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const templateContent = fs.readFileSync(templatePath, "binary");
    const mapping = project.mapping || {};
    const docs = [];

    for (const row of rows) {
      if (!row) continue;
      try {
        docs.push(renderDocument(templateContent, row, mapping));
      } catch (err) {
        console.error("Error rendering document:", err.message);
      }
    }

    if (docs.length === 0) {
      return NextResponse.json({ error: "No documents generated" }, { status: 400 });
    }

    // Mode: separate — return JSON with base64 files
    if (mode === "separate") {
      return NextResponse.json({
        files: docs.map((d) => ({ name: d.name, data: d.buffer.toString("base64") })),
      });
    }

    // Single doc — return .docx directly
    if (docs.length === 1) {
      return new NextResponse(docs[0].buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${docs[0].name}"`,
        },
      });
    }

    // Multiple docs — return .zip
    const zip = new JSZip();
    for (const doc of docs) zip.file(doc.name, doc.buffer);

    return new NextResponse(await zip.generateAsync({ type: "nodebuffer" }), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="documents.zip"',
      },
    });
  } catch (error) {
    console.error("POST /api/generate:", error);
    return NextResponse.json({ error: "Failed to generate documents" }, { status: 500 });
  }
}
