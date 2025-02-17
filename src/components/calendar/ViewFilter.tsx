interface ViewFilterProps {
  currentView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  onViewChange: (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => void
}

export const ViewFilter = ({ currentView, onViewChange }: ViewFilterProps) => {
  return (
    <div className="flex gap-2">
      <button
        className={`px-4 py-2 rounded ${
          currentView === 'dayGridMonth'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => onViewChange('dayGridMonth')}
      >
        月
      </button>
      <button
        className={`px-4 py-2 rounded ${
          currentView === 'timeGridWeek'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => onViewChange('timeGridWeek')}
      >
        週
      </button>
      <button
        className={`px-4 py-2 rounded ${
          currentView === 'timeGridDay'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        onClick={() => onViewChange('timeGridDay')}
      >
        日
      </button>
    </div>
  )
} 