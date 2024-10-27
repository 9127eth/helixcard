import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { rgbToHex, hexToRgb } from '../lib/colorUtils';
import { DEFAULT_COLORS } from '../lib/constants';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
  const [hexValue, setHexValue] = useState(currentColor);
  const [rgbValues, setRgbValues] = useState(() => {
    const rgb = hexToRgb(currentColor);
    return rgb ? rgb : { r: 0, g: 0, b: 0 };
  });

  useEffect(() => {
    const rgb = hexToRgb(currentColor);
    if (rgb) {
      setRgbValues(rgb);
      setHexValue(currentColor);
    }
  }, [currentColor]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onColorChange(value);
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = parseInt(value) || 0;
    const validValue = Math.min(255, Math.max(0, numValue));
    
    const newRgb = { ...rgbValues, [channel]: validValue };
    setRgbValues(newRgb);
    
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    onColorChange(newHex);
  };

  return (
    <div className="p-3 w-56">
      <div className="flex justify-center gap-2 mb-4">
        {Object.entries(DEFAULT_COLORS).map(([name, color]) => (
          <button
            key={name}
            className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400"
            style={{ backgroundColor: rgbToHex(color.r, color.g, color.b) }}
            onClick={() => onColorChange(rgbToHex(color.r, color.g, color.b))}
          />
        ))}
      </div>
      
      <div className="mb-4 flex justify-center">
        <HexColorPicker color={currentColor} onChange={onColorChange} />
      </div>

      <div className="space-y-3 flex flex-col items-center">
        <div className="text-center">
          <label className="block text-sm font-medium mb-1">Hex:</label>
          <input
            type="text"
            value={hexValue}
            onChange={handleHexChange}
            className="w-24 px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm text-center"
            placeholder="#000000"
          />
        </div>

        <div className="text-center">
          <label className="block text-sm font-medium mb-1">RGB:</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={rgbValues.r}
              onChange={(e) => handleRgbChange('r', e.target.value)}
              min="0"
              max="255"
              className="w-16 px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm text-center"
              placeholder="R"
            />
            <input
              type="number"
              value={rgbValues.g}
              onChange={(e) => handleRgbChange('g', e.target.value)}
              min="0"
              max="255"
              className="w-16 px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm text-center"
              placeholder="G"
            />
            <input
              type="number"
              value={rgbValues.b}
              onChange={(e) => handleRgbChange('b', e.target.value)}
              min="0"
              max="255"
              className="w-16 px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm text-center"
              placeholder="B"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
