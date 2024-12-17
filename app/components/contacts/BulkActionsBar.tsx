interface BulkActionsBarProps {
  selectedCount: number
  onDelete: () => void
  onExport: () => void
  onAddTag: () => void
}

export default function BulkActionsBar({
  selectedCount,
  onDelete,
  onExport,
  onAddTag
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-4">
          <button
            onClick={onAddTag}
            className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Add Tag
          </button>
          <button
            onClick={onExport}
            className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Export
          </button>
          <button
            onClick={onDelete}
            className="text-sm px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
} 