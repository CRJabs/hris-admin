import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export default function DynamicGrid({ title, columns, data, onChange, emptyStateMessage = "No entries added yet." }) {
  const addRow = () => {
    const newRow = columns.reduce((acc, col) => {
      acc[col.key] = "";
      return acc;
    }, {});
    onChange([...data, newRow]);
  };

  const updateRow = (index, key, value) => {
    const updated = [...data];
    updated[index][key] = value;
    onChange(updated);
  };

  const removeRow = (index) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center bg-muted/30 p-3 rounded-md shadow-sm border border-muted">
        <Label className="font-bold text-base text-slate-800">{title}</Label>
        <Button type="button" variant="default" size="sm" onClick={addRow} className="gap-1 h-8">
          <Plus className="w-3.5 h-3.5" /> Add Row
        </Button>
      </div>
      
      <div className="space-y-3">
        {data.map((row, index) => (
          <div key={index} className="flex gap-2 items-start border bg-slate-50/50 p-4 rounded-md relative group hover:border-[#0C005F]/30 transition-colors">
            
            <div className="flex-1 grid grid-cols-12 gap-3">
              {columns.map((col) => (
                <div key={col.key} className="space-y-1.5" style={{ gridColumn: `span ${col.span || Math.max(1, Math.floor(12 / columns.length))}` }}>
                  <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider whitespace-nowrap overflow-hidden text-ellipsis block">{col.label}</Label>
                  <Input 
                    value={row[col.key] || ""} 
                    onChange={(e) => updateRow(index, col.key, e.target.value)} 
                    type={col.type || "text"}
                    placeholder={col.placeholder || ""}
                    className="h-8 text-sm focus-visible:ring-[#0C005F]/50"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-end justify-center pt-5">
              <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
          </div>
        ))}
      </div>
      
      {data.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-md bg-muted/10">
          <p>{emptyStateMessage}</p>
        </div>
      )}
    </div>
  );
}
