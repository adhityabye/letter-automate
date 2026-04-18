import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { EditableCell } from "./editable-cell";
import { FileSpreadsheet } from "lucide-react";

// Column width hints by name pattern
function getColumnWidth(key) {
  const lower = key.toLowerCase();
  if (lower === "no.") return 60;
  if (lower.includes("npwp")) return 180;
  if (lower.includes("nama") && lower.includes("tim")) return 200;
  if (lower.includes("nama")) return 220;
  if (lower.includes("alamat")) return 300;
  if (lower.includes("pangkat")) return 200;
  if (lower.includes("nip")) return 180;
  if (lower.includes("tahun")) return 100;
  if (lower.includes("masa")) return 150;
  return 160;
}

export function DataTable({ data, visibleColumns, updateData, onSelectionChange }) {
  const [rowSelection, setRowSelection] = React.useState({});

  React.useEffect(() => {
    onSelectionChange(rowSelection);
  }, [rowSelection, onSelectionChange]);

  const columns = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    const allKeys = Object.keys(firstRow).filter((k) => k !== "__rowIndex");
    
    // Filter to visible columns if specified, otherwise show all
    const keys = visibleColumns && visibleColumns.length > 0
      ? allKeys.filter((k) => visibleColumns.includes(k))
      : allKeys;

    const selectColumn = {
      id: "select",
      size: 44,
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    };

    const dataColumns = keys.map((key) => ({
      accessorKey: key,
      header: key,
      size: getColumnWidth(key),
      cell: EditableCell,
    }));

    return [selectColumn, ...dataColumns];
  }, [data, visibleColumns]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    meta: { updateData },
  });

  return (
    <div className="table-wrapper">
      <div className="table-scroll">
        <table style={{ minWidth: "100%" }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="table-header-cell"
                    style={{ width: header.getSize(), minWidth: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="table-body-row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="table-body-cell"
                      style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <FileSpreadsheet className="empty-state-icon" />
                    <p className="text-sm font-medium text-surface-500">No data loaded</p>
                    <p className="text-xs text-surface-400 mt-1">Select a project from the sidebar to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
