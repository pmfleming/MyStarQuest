import { explorerUi } from '../../data/dayNightExplorer/dayNightExplorer.constants'
import type {
  ExplorerFocusId,
  ExplorerFocusOption,
} from '../../data/dayNightExplorer/dayNightExplorerOptions'

type ExplorerLocationSelectorProps = {
  options: ExplorerFocusOption[]
  activeFocusId: ExplorerFocusId
  onSelect: (focusId: ExplorerFocusId) => void
}

const ExplorerLocationSelector = ({
  options,
  activeFocusId,
  onSelect,
}: ExplorerLocationSelectorProps) => {
  return (
    <div className="dne-location-selector">
      <div className="dne-location-buttons">
        {options.map((option) => {
          const isActive = option.id === activeFocusId

          return (
            <button
              key={option.id}
              type="button"
              className="dne-location-button"
              aria-label={`Show ${option.label} view`}
              aria-pressed={isActive}
              onClick={() => onSelect(option.id)}
              style={{
                opacity: isActive ? 1 : 0.6,
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <img
                src={option.icon}
                alt=""
                aria-hidden="true"
                style={{
                  width: `${explorerUi.locationButtonSize}px`,
                  height: `${explorerUi.locationButtonSize}px`,
                  objectFit: 'contain',
                  filter: isActive
                    ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))'
                    : 'none',
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ExplorerLocationSelector
