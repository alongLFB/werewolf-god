'use client'

import { useGameStore } from '@/store/game-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionRecord } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ActionLog() {
  const { gameState } = useGameStore()
  
  if (!gameState || gameState.history.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          最近行动
          <Badge variant="outline">{gameState.history.length} 条记录</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-2">
            {gameState.history.map(record => (
              <ActionLogItem key={record.id} record={record} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function ActionLogItem({ record }: { record: ActionRecord }) {
  const isImportant = ['kill', 'poison', 'shoot', 'bomb', 'duel', 'vote', 'check'].includes(record.action)
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-colors",
        isImportant 
          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" 
          : "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <Badge variant={record.phase === 'night' ? 'secondary' : 'default'} className="text-xs">
            第{record.round}轮 {record.phase === 'night' ? '夜晚' : '白天'}
          </Badge>
          {record.step && (
            <Badge variant="outline" className="text-xs">
              {getStepName(record.step)}
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {new Date(record.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div className={cn("text-sm", isImportant && "font-medium")}>
        {getActionDescription(record)}
      </div>
      
      {record.result !== undefined && (
        <div className="mt-1 text-xs text-gray-600">
          结果: {formatResult(record.action, record.result)}
        </div>
      )}
    </div>
  )
}

function getStepName(step: string): string {
  const stepNames: Record<string, string> = {
    guard: '守卫',
    werewolf: '狼人',
    seer: '预言家',
    witch: '女巫',
    hunter_status: '猎人状态',
    dawn: '天亮',
    police_campaign: '警长竞选',
    police_vote: '警长投票',
    last_words: '遗言',
    skill_activation: '技能发动',
    discussion: '讨论',
    vote: '投票',
    execution: '放逐'
  }
  return stepNames[step] || step
}

function getActionDescription(record: ActionRecord): string {
  const actionDescriptions: Record<string, string> = {
    guard: `🛡️ ${record.actor}号守卫守护了${record.target}号玩家`,
    kill: `🗡️ 狼人击杀了${record.target}号玩家`,
    check: `🔮 ${record.actor}号预言家查验了${record.target}号玩家`,
    poison: `☠️ ${record.actor}号女巫毒杀了${record.target}号玩家`,
    antidote: `💊 ${record.actor}号女巫解救了${record.target}号玩家`,
    shoot: `🔫 ${record.actor}号开枪带走了${record.target}号玩家`,
    bomb: `💣 ${record.actor}号自爆带走了${record.target}号玩家`,
    duel: `⚔️ ${record.actor}号骑士决斗了${record.target}号玩家`,
    vote: `🗳️ ${record.target}号玩家被投票放逐`,
    hunter_status: `🎯 猎人收到开枪状态通知`,
    self_destruct: `💥 ${record.actor}号狼人自爆`,
    police_abstain: `🚫 ${record.actor}号玩家弃票`,
    police_transfer: `👮 ${record.actor}号将警徽移交给${record.target}号`,
    police_destroy: `🔥 ${record.actor}号撕毁警徽`
  }
  
  return actionDescriptions[record.action] || `${record.action}: ${record.actor}号 -> ${record.target}号`
}

function formatResult(action: string, result: any): string {
  switch (action) {
    case 'check':
      return result === 'werewolf' ? '❌ 狼人' : '✅ 好人'
    case 'duel':
      return result === 'success' ? '✅ 成功击杀狼人' : '❌ 失败，骑士阵亡'
    case 'hunter_status':
      return result ? '✅ 可以开枪' : '❌ 不能开枪'
    default:
      return String(result)
  }
}