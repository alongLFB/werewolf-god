'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/game-store'
import { PRESET_CONFIGS } from '@/lib/game-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GameMode, CreateGameParams } from '@/types'
import { Users, Settings, Play } from 'lucide-react'

export function GameConfigForm() {
  const { createGame } = useGameStore()
  const [selectedMode, setSelectedMode] = useState<GameMode>('9人局')
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [showNameInput, setShowNameInput] = useState(false)

  const selectedConfig = PRESET_CONFIGS.find(config => config.mode === selectedMode)

  const handleCreateGame = () => {
    const params: CreateGameParams = {
      mode: selectedMode,
      playerNames: playerNames.length > 0 ? playerNames : undefined
    }
    
    createGame(params)
    // 导航到游戏页面
    window.location.href = '/game'
  }

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames]
    newNames[index] = name
    setPlayerNames(newNames)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 游戏模式选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            选择游戏模式
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_CONFIGS.map(config => (
              <Card
                key={config.mode}
                className={`cursor-pointer transition-all ${
                  selectedMode === config.mode 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedMode(config.mode)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{config.mode}</h3>
                    <span className="text-sm text-gray-500">
                      {config.playerCount}人
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {config.description}
                  </p>
                  <div className="text-xs space-y-1">
                    <RoleComposition roles={config.roles} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 玩家设置 */}
      {selectedConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              玩家设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>玩家数量：{selectedConfig.playerCount}人</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNameInput(!showNameInput)}
                >
                  {showNameInput ? '使用默认名称' : '自定义玩家名称'}
                </Button>
              </div>

              {showNameInput && (
                <div className="space-y-3">
                  <h4 className="font-medium">输入玩家名称</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: selectedConfig.playerCount }, (_, i) => (
                      <div key={i} className="space-y-1">
                        <label className="text-sm text-gray-600">
                          {i + 1}号玩家
                        </label>
                        <input
                          type="text"
                          placeholder={`玩家${i + 1}`}
                          value={playerNames[i] || ''}
                          onChange={(e) => handlePlayerNameChange(i, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 游戏预览 */}
      {selectedConfig && (
        <Card>
          <CardHeader>
            <CardTitle>游戏预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedConfig.roles.filter(role => role === 'werewolf' || role === 'wolf_king' || role === 'white_wolf').length}
                  </div>
                  <div className="text-sm text-gray-600">狼人</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedConfig.roles.filter(role => ['seer', 'witch', 'hunter', 'guard', 'knight'].includes(role)).length}
                  </div>
                  <div className="text-sm text-gray-600">神职</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedConfig.roles.filter(role => role === 'villager').length}
                  </div>
                  <div className="text-sm text-gray-600">村民</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {selectedConfig.playerCount}
                  </div>
                  <div className="text-sm text-gray-600">总人数</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">角色详情</h4>
                <RoleDetails roles={selectedConfig.roles} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 开始游戏按钮 */}
      <div className="flex justify-center">
        <Button
          onClick={handleCreateGame}
          size="lg"
          className="px-8 py-3 text-lg"
        >
          <Play className="w-5 h-5 mr-2" />
          开始游戏
        </Button>
      </div>
    </div>
  )
}

function RoleComposition({ roles }: { roles: string[] }) {
  const roleCounts: Record<string, number> = {}
  roles.forEach(role => {
    roleCounts[role] = (roleCounts[role] || 0) + 1
  })

  const roleNames: Record<string, string> = {
    werewolf: '狼人',
    wolf_king: '狼王', 
    white_wolf: '白狼王',
    seer: '预言家',
    witch: '女巫',
    hunter: '猎人',
    guard: '守卫',
    knight: '骑士',
    villager: '村民'
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(roleCounts).map(([role, count]) => (
        <span
          key={role}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
        >
          {roleNames[role] || role} ×{count}
        </span>
      ))}
    </div>
  )
}

function RoleDetails({ roles }: { roles: string[] }) {
  const roleCounts: Record<string, number> = {}
  roles.forEach(role => {
    roleCounts[role] = (roleCounts[role] || 0) + 1
  })

  const roleDescriptions: Record<string, string> = {
    werewolf: '每晚击杀一名玩家',
    wolf_king: '被投票时可开枪',
    white_wolf: '白天可自爆带人',
    seer: '每晚查验身份',
    witch: '拥有解药和毒药',
    hunter: '死亡时可开枪',
    guard: '每晚守护一人',
    knight: '白天可决斗',
    villager: '无特殊能力'
  }

  const roleIcons: Record<string, string> = {
    werewolf: '🐺',
    wolf_king: '👑',
    white_wolf: '⚪',
    seer: '🔮',
    witch: '🧙‍♀️',
    hunter: '🏹',
    guard: '🛡️',
    knight: '⚔️',
    villager: '👨‍🌾'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Object.entries(roleCounts).map(([role, count]) => (
        <div
          key={role}
          className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
        >
          <span className="text-xl">{roleIcons[role] || '❓'}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{role}</span>
              <span className="text-sm text-gray-500">×{count}</span>
            </div>
            <div className="text-xs text-gray-600">
              {roleDescriptions[role] || ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}