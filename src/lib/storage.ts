import { GameState, LocalGameData } from '@/types'

// 本地存储键名
const STORAGE_KEYS = {
  CURRENT_GAME: 'werewolf-current-game',
  GAME_HISTORY: 'werewolf-game-history',
  SETTINGS: 'werewolf-settings'
}

// 游戏状态存储
export class GameStorage {
  // 保存当前游戏
  static saveCurrentGame(gameState: GameState): void {
    try {
      const data: LocalGameData = {
        gameState,
        lastSaved: new Date()
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_GAME, JSON.stringify(data))
    } catch (error) {
      console.error('保存游戏失败:', error)
    }
  }

  // 加载当前游戏
  static loadCurrentGame(): GameState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME)
      if (!data) return null

      const parsed: LocalGameData = JSON.parse(data)
      
      // 恢复日期对象
      const gameState = {
        ...parsed.gameState,
        createdAt: new Date(parsed.gameState.createdAt),
        updatedAt: new Date(parsed.gameState.updatedAt),
        history: parsed.gameState.history.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }))
      }

      return gameState
    } catch (error) {
      console.error('加载游戏失败:', error)
      return null
    }
  }

  // 删除当前游戏
  static clearCurrentGame(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_GAME)
    } catch (error) {
      console.error('清除游戏失败:', error)
    }
  }

  // 保存游戏到历史记录
  static saveToHistory(gameState: GameState): void {
    try {
      const history = this.getGameHistory()
      const gameData: LocalGameData = {
        gameState,
        lastSaved: new Date()
      }
      
      history.unshift(gameData)
      
      // 只保留最近20场游戏
      const trimmedHistory = history.slice(0, 20)
      
      localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(trimmedHistory))
    } catch (error) {
      console.error('保存历史记录失败:', error)
    }
  }

  // 获取游戏历史
  static getGameHistory(): LocalGameData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY)
      if (!data) return []

      const history: LocalGameData[] = JSON.parse(data)
      
      // 恢复日期对象
      return history.map(item => ({
        ...item,
        lastSaved: new Date(item.lastSaved),
        gameState: {
          ...item.gameState,
          createdAt: new Date(item.gameState.createdAt),
          updatedAt: new Date(item.gameState.updatedAt),
          history: item.gameState.history.map((record: any) => ({
            ...record,
            timestamp: new Date(record.timestamp)
          }))
        }
      }))
    } catch (error) {
      console.error('加载历史记录失败:', error)
      return []
    }
  }

  // 删除历史记录
  static deleteFromHistory(gameId: string): void {
    try {
      const history = this.getGameHistory()
      const filtered = history.filter(item => item.gameState.id !== gameId)
      localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(filtered))
    } catch (error) {
      console.error('删除历史记录失败:', error)
    }
  }

  // 清空所有历史记录
  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY)
    } catch (error) {
      console.error('清空历史记录失败:', error)
    }
  }

  // 导出游戏数据
  static exportGame(gameState: GameState): string {
    try {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        gameState
      }
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('导出游戏失败:', error)
      throw new Error('导出失败')
    }
  }

  // 导入游戏数据
  static importGame(jsonData: string): GameState {
    try {
      const importData = JSON.parse(jsonData)
      
      if (!importData.gameState) {
        throw new Error('无效的游戏数据格式')
      }

      // 恢复日期对象
      const gameState: GameState = {
        ...importData.gameState,
        createdAt: new Date(importData.gameState.createdAt),
        updatedAt: new Date(importData.gameState.updatedAt),
        history: importData.gameState.history.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }))
      }

      return gameState
    } catch (error) {
      console.error('导入游戏失败:', error)
      throw new Error('导入失败：' + (error as Error).message)
    }
  }

  // 获取存储空间使用情况
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }

      // localStorage 通常限制为 5-10MB
      const available = 10 * 1024 * 1024 // 假设10MB
      const percentage = (used / available) * 100

      return { used, available, percentage }
    } catch (error) {
      console.error('获取存储信息失败:', error)
      return { used: 0, available: 0, percentage: 0 }
    }
  }
}

// 应用设置存储
export class SettingsStorage {
  static saveSettings(settings: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  static loadSettings(): any {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('加载设置失败:', error)
      return null
    }
  }

  static getDefaultSettings() {
    return {
      theme: 'light',
      soundEnabled: true,
      language: 'zh-CN',
      autoSave: true,
      showPlayerRoles: false
    }
  }
}

// 检查浏览器支持
export function checkStorageSupport(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}