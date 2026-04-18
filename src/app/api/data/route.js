import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_PATH = path.join(DATA_DIR, "projects.json");
const SKIP_KEYS = new Set(["No.", "__rowIndex"]);

// ── Project helpers ──

function getProject(projectId) {
  if (!fs.existsSync(PROJECTS_PATH)) return null;
  const projects = JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf-8"));
  return projects.find((p) => p.id === projectId) || null;
}

function getFilePath(project) {
  return path.join(DATA_DIR, project.dataSource);
}

// ── Read (uses SheetJS — fast, read-only) ──

function readRows(project) {
  const filePath = getFilePath(project);
  if (!fs.existsSync(filePath)) return [];

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[project.sheetName || workbook.SheetNames[0]];
  if (!sheet) return [];

  return XLSX.utils
    .sheet_to_json(sheet, { defval: "" })
    .map((row, i) => {
      const out = { __rowIndex: i };
      for (const key of Object.keys(row)) out[key] = String(row[key]);
      return out;
    })
    .filter((row) => {
      // Keep rows that have a "No." value (includes newly added rows)
      const no = row["No."];
      if (no && String(no).trim() !== "") return true;
      // Otherwise keep if any data column has content
      return Object.entries(row).some(
        ([k, v]) => !SKIP_KEYS.has(k) && v && String(v).trim() !== ""
      );
    });
}

// ── Write (uses ExcelJS — preserves cell styles) ──

async function updateCell(project, rowIndex, columnName, value) {
  const filePath = getFilePath(project);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const ws = wb.getWorksheet(project.sheetName || wb.worksheets[0]?.name);
  if (!ws) throw new Error("Sheet not found");

  // Find column number by matching header (row 1)
  const headerRow = ws.getRow(1);
  let colNum = -1;
  headerRow.eachCell((cell, col) => {
    if (String(cell.value).trim() === columnName) colNum = col;
  });
  if (colNum === -1) throw new Error(`Column "${columnName}" not found`);

  // Update the specific cell (data starts at row 2)
  const cell = ws.getCell(rowIndex + 2, colNum);
  cell.value = value;
  // Style is preserved because we're modifying in-place

  await wb.xlsx.writeFile(filePath);
}

async function addRow(project) {
  const filePath = getFilePath(project);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const ws = wb.getWorksheet(project.sheetName || wb.worksheets[0]?.name);
  if (!ws) throw new Error("Sheet not found");

  // Collect header names
  const headerRow = ws.getRow(1);
  const headers = [];
  headerRow.eachCell((cell, colNum) => {
    headers.push({ col: colNum, name: String(cell.value || "") });
  });

  // Find the true last row that has any value and the highest "No."
  let lastDataRow = 1;
  let lastNo = 0;
  const noHeaderCol = headers.find((h) => h.name === "No.")?.col;

  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && row.hasValues) {
      lastDataRow = Math.max(lastDataRow, rowNumber);
      if (noHeaderCol) {
        const val = row.getCell(noHeaderCol).value;
        if (val != null && val !== "" && !isNaN(Number(val))) {
          lastNo = Math.max(lastNo, Number(val));
        }
      }
    }
  });

  // Add new row with "No." set so the empty-row filter doesn't strip it
  const newRowNum = lastDataRow + 1;
  const newRow = ws.getRow(newRowNum);
  for (const { col, name } of headers) {
    newRow.getCell(col).value = name === "No." ? lastNo + 1 : null;
  }
  newRow.commit();

  await wb.xlsx.writeFile(filePath);
}

async function deleteRows(project, rowIndices) {
  const filePath = getFilePath(project);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const ws = wb.getWorksheet(project.sheetName || wb.worksheets[0]?.name);
  if (!ws) throw new Error("Sheet not found");

  // Convert data row indices to actual Excel row numbers (data starts at row 2)
  // Delete from bottom to top so indices don't shift
  const excelRows = rowIndices.map((i) => i + 2).sort((a, b) => b - a);
  for (const rowNum of excelRows) {
    ws.spliceRows(rowNum, 1);
  }

  await wb.xlsx.writeFile(filePath);
}

// ── API Routes ──

export async function GET(request) {
  try {
    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const project = getProject(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json(readRows(project));
  } catch (error) {
    console.error("GET /api/data:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { projectId, action, ...params } = await request.json();
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const project = getProject(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (action === "update_cell") {
      await updateCell(project, params.rowIndex, params.columnName, params.value);
      return NextResponse.json({ success: true });
    }

    if (action === "add_row") {
      await addRow(project);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/data:", error);
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { projectId, rowIndices } = await request.json();
    if (!projectId || !Array.isArray(rowIndices)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const project = getProject(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await deleteRows(project, rowIndices);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/data:", error);
    return NextResponse.json({ error: "Failed to delete rows" }, { status: 500 });
  }
}
