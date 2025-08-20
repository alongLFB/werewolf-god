export * from './game'
import { Player, GamePhase, GameState } from './game'

// UI相关类型
export interface DialogState {
  isOpen: boolean
  title?: string
  content?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

// 组件Props类型
export interface PlayerCardProps {
  player: Player
  isSelected?: boolean
  isTargetable?: boolean
  onClick?: () => void
  showRole?: boolean
  showStatus?: boolean
  className?: string
}

export interface PhaseIndicatorProps {
  phase: GamePhase
  round: number
  step: string
}

export interface ActionButtonProps {
  text: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

// 本地存储类型
export interface LocalGameData {
  gameState: GameState
  lastSaved: Date
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  soundEnabled: boolean
  language: 'zh-CN' | 'en-US'
  autoSave: boolean
}