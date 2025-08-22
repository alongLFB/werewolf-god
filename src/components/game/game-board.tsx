'use client'

import { useGameStore } from '@/store/game-store'
import { PhaseIndicator } from './phase-indicator'
import { NightPhase } from './night-phase'
import { DayPhase } from './day-phase'
import { PlayerCard } from './player-card'
import { ActionLog } from './action-log'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, RotateCcw, Save } from 'lucide-react'

export function GameBoard() {
  const {
    gameState,
    showPlayerRoles,
    toggleShowPlayerRoles,
    resetGame,
    saveGame,
    checkGameEnd,
    error
  } = useGameStore()

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>没有进行中的游戏</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">请先创建一个新游戏</p>
            <Button onClick={() => window.location.href = '/game/new'} className="w-full">
              创建新游戏
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 检查游戏是否结束
  if (gameState.gameEnded) {
    return <GameEndScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 阶段指示器 */}
        <PhaseIndicator
          phase={gameState.phase}
          round={gameState.round}
          step={gameState.currentStep}
          className="mb-6"
        />

        {/* 工具栏 */}
        <div className="flex gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShowPlayerRoles}
            className="flex items-center gap-2"
          >
            {showPlayerRoles ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPlayerRoles ? '隐藏身份' : '显示身份'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={saveGame}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存游戏
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置游戏
          </Button>
        </div>

        {/* 错误/成功消息显示 */}
        {error && (
          <Card className={`mb-4 ${error.includes('✅') ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <CardContent className="p-3">
              <p className={`text-sm ${error.includes('✅') ? 'text-green-800' : 'text-red-800'}`}>
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 主要游戏区域 */}
        <div className="space-y-6">
          {/* 当前阶段内容 */}
          {gameState.phase === 'night' ? <NightPhase /> : <DayPhase />}
          
          {/* 玩家状态总览 */}
          <GameStatus />
        </div>
      </div>
    </div>
  )
}

function GameStatus() {
  const { gameState, showPlayerRoles } = useGameStore()
  
  if (!gameState) return null

  const alivePlayers = gameState.players.filter(p => p.isAlive)
  const aliveWerewolves = alivePlayers.filter(p => p.role.team === 'werewolf')
  const aliveGoodGuys = alivePlayers.filter(p => p.role.team === 'good')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          游戏状态
          <div className="text-sm font-normal text-gray-600">
            第{gameState.round}轮 - {gameState.phase === 'night' ? '夜晚' : '白天'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 阵营统计 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{aliveWerewolves.length}</div>
                <div className="text-sm text-gray-600">狼人存活</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{aliveGoodGuys.length}</div>
                <div className="text-sm text-gray-600">好人存活</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 玩家列表 */}
        <div className="space-y-3">
          <h3 className="font-medium">玩家状态</h3>
          <div className="player-grid">
            {gameState.players.map(player => (
              <PlayerCard
                key={player.seatNumber}
                player={player}
                showRole={showPlayerRoles}
                showStatus={true}
              />
            ))}
          </div>
        </div>

        {/* 使用新的行动日志组件 */}
        <div className="mt-6">
          <ActionLog />
        </div>
      </CardContent>
    </Card>
  )
}

function GameEndScreen() {
  const { gameState, resetGame } = useGameStore()
  
  if (!gameState) return null

  const winners = gameState.winner === 'werewolf' ? '狼人阵营' : '好人阵营'
  const survivors = gameState.players.filter(p => p.isAlive)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-4">
            🎉 游戏结束 🎉
          </CardTitle>
          <p className="text-xl font-semibold text-blue-600">
            {winners} 获胜！
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 获胜者信息 */}
          <div className="text-center">
            <h3 className="font-medium mb-3">存活玩家</h3>
            <div className="player-grid">
              {survivors.map(player => (
                <PlayerCard
                  key={player.seatNumber}
                  player={player}
                  showRole={true}
                  showStatus={true}
                />
              ))}
            </div>
          </div>

          {/* 游戏统计 */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{gameState.round}</div>
              <div className="text-sm text-gray-600">游戏轮数</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{gameState.history.length}</div>
              <div className="text-sm text-gray-600">总行动数</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button onClick={resetGame} className="flex-1">
              开始新游戏
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getActionDescription(record: any): string {
  const actionMap: Record<string, string> = {
    guard: `${record.actor}号守护了${record.target}号`,
    kill: `狼人击杀了${record.target}号`,
    check: `${record.actor}号查验了${record.target}号 (${record.result === 'werewolf' ? '狼人' : '好人'})`,
    poison: `${record.actor}号毒杀了${record.target}号`,
    antidote: `${record.actor}号救了${record.target}号`,
    shoot: `${record.actor}号开枪带走了${record.target}号`,
    bomb: `${record.actor}号自爆带走了${record.target}号`,
    duel: `${record.actor}号决斗了${record.target}号 (${record.result === 'success' ? '成功' : '失败'})`,
    vote: `${record.target}号被投票放逐`,
    hunter_status: `猎人确认开枪状态：${record.result ? '可以开枪' : '不能开枪'}`
  }
  
  return actionMap[record.action] || `未知行动：${record.action}`
}