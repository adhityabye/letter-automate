import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const PROJECTS_PATH = path.join(process.cwd(), "data", "projects.json");

function getProjects() {
  if (!fs.existsSync(PROJECTS_PATH)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf-8"));
}

export async function GET() {
  try {
    const projects = getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to read projects:", error);
    return NextResponse.json({ error: "Failed to read projects" }, { status: 500 });
  }
}
