import * as React from "react";

export function EditableCell({ getValue, row, column, table }) {
  const initialValue = getValue();
  const [value, setValue] = React.useState(initialValue);
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      table.options.meta?.updateData(row.original.__rowIndex, column.id, value);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="cell-input"
      />
    );
  }

  return (
    <div
      className="cell-view"
      onClick={() => setIsEditing(true)}
      title={value}
    >
      {value || "\u00A0"}
    </div>
  );
}
