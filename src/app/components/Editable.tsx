import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({ value, onChange, className = '', multiline = false, placeholder = "Click to edit..." }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (localValue.trim() !== value) {
      onChange(localValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="relative w-full group">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-full bg-white dark:bg-black/50 border-2 border-blue-500 rounded-lg p-2 outline-none resize-none min-h-[100px] ${className}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-full bg-white dark:bg-black/50 border-2 border-blue-500 rounded-lg px-2 py-1 outline-none ${className}`}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={`relative group cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 rounded-lg px-2 -mx-2 transition-colors duration-200 ${!value ? 'text-gray-400 italic' : ''} ${className}`}
    >
      {value || placeholder}
      <span className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 rounded-full p-1 shadow-sm">
        <Pencil size={12} className="text-gray-500 dark:text-gray-400" />
      </span>
    </div>
  );
};

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  className?: string;
  itemClassName?: string;
  placeholder?: string;
}

export const EditableList: React.FC<EditableListProps> = ({ items = [], onChange, className = '', itemClassName = '', placeholder = "New Item" }) => {
  
  const updateItem = (index: number, newVal: string) => {
    const newItems = [...items];
    newItems[index] = newVal;
    onChange(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, ""]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group relative">
          <div className="flex-grow">
             <EditableText 
               value={item} 
               onChange={(val) => updateItem(i, val)} 
               className={itemClassName}
               multiline
             />
          </div>
          <button 
            onClick={() => deleteItem(i)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
            title="Remove item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button 
        onClick={addItem}
        className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-blue-500 transition-colors mt-2 px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
      >
        <Plus size={16} />
        Add Item
      </button>
    </div>
  );
};
