import React from 'react';
import ColorPicker from './ColorPicker';

interface ColorPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ColorPickerDialog: React.FC<ColorPickerDialogProps> = ({
  isOpen,
  onClose,
  currentColor,
  onColorChange,
}) => {
  const [tempColor, setTempColor] = React.useState(currentColor);

  if (!isOpen) return null;

  const handleSave = () => {
    onColorChange(tempColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-[var(--card-grid-background)] rounded-lg p-4 w-auto m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Choose a Color</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <ColorPicker
            currentColor={tempColor}
            onColorChange={setTempColor}
          />
          <div className="flex justify-center space-x-3 mt-4">
            <button
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-1.5 rounded-full text-sm min-w-[100px] hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white dark:text-[var(--button-text-dark)] px-4 py-1.5 rounded-full text-sm min-w-[100px] hover:bg-[#40444b] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerDialog;
