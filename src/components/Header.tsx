import type { ReactNode } from 'react'

interface HeaderProps {
  workspace: 'trainer' | 'score'
  disabled: boolean
  onWorkspaceChange: (workspace: 'trainer' | 'score') => void
  controls: ReactNode
}

function Header({ workspace, disabled, onWorkspaceChange, controls }: HeaderProps) {
  return (
    <header className="app-header">
      <h1>{workspace === 'trainer' ? 'Music Notation Studio' : 'Score Editor'}</h1>
      <div className="header-actions">
        {controls}
        <div className="workspace-tabs" role="tablist" aria-label="Workspace">
          {(['trainer', 'score'] as const).map(tab => (
            <button
              key={tab}
              id={`${tab}-tab`}
              type="button"
              role="tab"
              aria-selected={workspace === tab}
              aria-controls={`${tab}-panel`}
              disabled={disabled}
              title={disabled ? 'Please release the piano keys before switching workspace' : undefined}
              onClick={() => onWorkspaceChange(tab)}
            >
              {tab === 'trainer' ? 'Trainer' : 'Editor'}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

export default Header
