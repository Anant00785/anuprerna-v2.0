import React, { useState } from 'react';

type SizeGuideMatrix = {
  columns: string[];
  rows: Record<string, string>[];
  unit: 'cm' | 'in';
};

interface SizeGuideMatrixInputProps {
  value?: SizeGuideMatrix;
  onChange: (value: SizeGuideMatrix) => void;
}

export default function SizeGuideMatrixInput({ value, onChange }: SizeGuideMatrixInputProps) {
  const [matrix, setMatrix] = useState<SizeGuideMatrix>(value || {
    columns: ['Size', 'Chest', 'Length'],
    rows: [
      { 'Size': 'S', 'Chest': '', 'Length': '' }
    ],
    unit: 'cm'
  });

  const handleUnitChange = (unit: 'cm' | 'in') => {
    const newMatrix = { ...matrix, unit };
    setMatrix(newMatrix);
    onChange(newMatrix);
  };

  const handleCellChange = (rowIndex: number, col: string, val: string) => {
    const newRows = [...matrix.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [col]: val };
    const newMatrix = { ...matrix, rows: newRows };
    setMatrix(newMatrix);
    onChange(newMatrix);
  };

  const addRow = () => {
    const newRow: Record<string, string> = {};
    matrix.columns.forEach(col => {
      newRow[col] = '';
    });
    const newMatrix = { ...matrix, rows: [...matrix.rows, newRow] };
    setMatrix(newMatrix);
    onChange(newMatrix);
  };

  const addColumn = () => {
    const newColName = prompt("Enter new column name (e.g. 'Shoulder'):");
    if (!newColName || matrix.columns.includes(newColName)) return;

    const newCols = [...matrix.columns, newColName];
    const newRows = matrix.rows.map(row => ({ ...row, [newColName]: '' }));
    
    const newMatrix = { ...matrix, columns: newCols, rows: newRows };
    setMatrix(newMatrix);
    onChange(newMatrix);
  };

  return (
    <div className="border border-gray-300 rounded-md p-4 bg-white font-sans max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-gray-800 m-0">Size Guide Matrix</h4>
        <div className="flex bg-gray-100 rounded-md p-1">
          <button 
            type="button"
            onClick={() => handleUnitChange('cm')}
            className={`px-3 py-1 text-xs rounded ${matrix.unit === 'cm' ? 'bg-white shadow' : ''}`}
          >cm</button>
          <button 
            type="button"
            onClick={() => handleUnitChange('in')}
            className={`px-3 py-1 text-xs rounded ${matrix.unit === 'in' ? 'bg-white shadow' : ''}`}
          >in</button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {matrix.columns.map((col, idx) => (
                <th key={idx} className="border border-gray-200 p-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {matrix.columns.map((col, cIdx) => (
                  <td key={cIdx} className="border border-gray-200 p-1">
                    <input 
                      type="text" 
                      value={row[col] || ''}
                      onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                      className="w-full border-none outline-none p-1 bg-transparent text-sm"
                      placeholder={`Enter ${col}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={addRow} className="text-sm text-blue-600 border border-blue-600 rounded px-3 py-1 hover:bg-blue-50">
          + Add Size Row
        </button>
        <button type="button" onClick={addColumn} className="text-sm text-green-600 border border-green-600 rounded px-3 py-1 hover:bg-green-50">
          + Add Measurement Column
        </button>
      </div>
    </div>
  );
}
