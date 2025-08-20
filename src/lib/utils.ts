import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化时间
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化日期
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 生成随机ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// 延迟函数
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 获取游戏阶段的中文名称
export function getPhaseText(phase: 'night' | 'day', round: number): string {
  return phase === 'night' ? `第${round}晚` : `第${round}天`
}

// 获取步骤的中文名称
export function getStepText(step: string): string {
  const stepMap: Record<string, string> = {
    // 夜晚步骤
    guard: '守卫环节',
    werewolf: '狼人环节',
    seer: '预言家环节',
    witch: '女巫环节',
    hunter_status: '猎人确认',
    
    // 白天步骤
    dawn: '天亮环节',
    discussion: '讨论发言',
    vote: '投票放逐',
    execution: '执行结果'
  }
  
  return stepMap[step] || step
}

// 获取死亡原因的中文描述
export function getDeathReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    knife: '被狼人击杀',
    poison: '被女巫毒杀',
    vote: '被投票放逐',
    shoot: '被开枪带走',
    duel: '决斗失败',
    bomb: '被自爆带走'
  }
  
  return reasonMap[reason] || '未知原因'
}

// 计算投票结果
export function calculateVoteResult(votes: Array<{ voter: number; target: number; isPoliceVote?: boolean }>) {
  const voteCount: Record<number, number> = {}
  let abstainCount = 0
  
  votes.forEach(vote => {
    const weight = vote.isPoliceVote ? 1.5 : 1
    if (vote.target === 0) {
      // 弃票
      abstainCount += weight
    } else {
      voteCount[vote.target] = (voteCount[vote.target] || 0) + weight
    }
  })
  
  const validVotes = Object.values(voteCount)
  const maxVotes = validVotes.length > 0 ? Math.max(...validVotes) : 0
  const winners = Object.entries(voteCount)
    .filter(([_, count]) => count === maxVotes)
    .map(([target, _]) => parseInt(target))
  
  return {
    voteCount,
    maxVotes,
    winners,
    isTie: winners.length > 1,
    abstainCount
  }
}

// 检查技能是否可用
export function canUseAbility(
  player: any,
  abilityType: string,
  round: number,
  gameRules: any
): { canUse: boolean; reason?: string } {
  if (!player.isAlive) {
    return { canUse: false, reason: '玩家已死亡' }
  }

  switch (abilityType) {
    case 'antidote':
      if (player.hasUsedAbility?.antidote) {
        return { canUse: false, reason: '解药已使用' }
      }
      break
      
    case 'poison':
      if (player.hasUsedAbility?.poison) {
        return { canUse: false, reason: '毒药已使用' }
      }
      break
      
    case 'duel':
      if (player.hasUsedAbility?.duel) {
        return { canUse: false, reason: '决斗已使用' }
      }
      break
      
    case 'shoot':
      if (player.hasUsedAbility?.shoot) {
        return { canUse: false, reason: '已经开过枪' }
      }
      if (!player.canShoot) {
        return { canUse: false, reason: '当前无法开枪' }
      }
      break
      
    case 'bomb':
      if (player.hasUsedAbility?.bomb) {
        return { canUse: false, reason: '已经自爆过' }
      }
      break
  }

  return { canUse: true }
}

// 检查目标是否可选择
export function isValidTarget(
  actor: any,
  target: any,
  actionType: string,
  gameState: any
): { isValid: boolean; reason?: string } {
  // 基础检查
  if (actor.seatNumber === target.seatNumber && !['guard'].includes(actionType)) {
    return { isValid: false, reason: '不能选择自己' }
  }
  
  if (!target.isAlive && !['check'].includes(actionType)) {
    return { isValid: false, reason: '目标已死亡' }
  }

  // 特殊规则检查
  switch (actionType) {
    case 'guard':
      // 守卫不能连续守护同一人
      const lastTarget = gameState.nightState?.guardLastTarget
      if (lastTarget === target.seatNumber) {
        return { isValid: false, reason: '不能连续守护同一人' }
      }
      break
      
    case 'antidote':
      // 首夜不能自救
      if (gameState.round === 1 && actor.seatNumber === target.seatNumber) {
        return { isValid: false, reason: '首夜不能自救' }
      }
      break
  }

  return { isValid: true }
}

// 音效播放（如果启用）
export function playSound(soundType: 'click' | 'notification' | 'phase-change' | 'death') {
  // TODO: 实现音效播放
  if (typeof window !== 'undefined' && 'Audio' in window) {
    // const audio = new Audio(`/sounds/${soundType}.mp3`)
    // audio.play().catch(() => {}) // 忽略播放失败
  }
}

// 震动反馈（移动端）
export function vibrate(pattern: number | number[] = 100) {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}