import { Role, PresetConfig, GameConfig, GameRules, RoleType, Player, CampType } from '@/types'

// 角色定义
export const ROLES: Record<RoleType, Role> = {
  werewolf: {
    id: 'werewolf',
    type: 'werewolf',
    name: '狼人',
    camp: 'werewolf',
    team: 'werewolf',
    abilities: [
      {
        id: 'kill',
        name: '击杀',
        description: '每晚与同伴统一意见击杀一名玩家',
        canUseAtNight: true
      }
    ],
    description: '每晚与同伴统一意见击杀一名玩家，知道同伴身份'
  },
  wolf_king: {
    id: 'wolf_king',
    type: 'wolf_king',
    name: '狼王',
    camp: 'werewolf',
    team: 'werewolf',
    abilities: [
      {
        id: 'kill',
        name: '击杀',
        description: '每晚与同伴统一意见击杀一名玩家',
        canUseAtNight: true
      },
      {
        id: 'shoot',
        name: '开枪',
        description: '被投票放逐时可以开枪带走一名玩家',
        usageLimit: 1,
        canUseAtDay: true
      }
    ],
    description: '拥有普通狼人能力，被投票放逐时可以开枪，被毒杀时不能开枪'
  },
  white_wolf: {
    id: 'white_wolf',
    type: 'white_wolf',
    name: '白狼王',
    camp: 'werewolf',
    team: 'werewolf',
    abilities: [
      {
        id: 'kill',
        name: '击杀',
        description: '每晚与同伴统一意见击杀一名玩家',
        canUseAtNight: true
      },
      {
        id: 'bomb',
        name: '自爆',
        description: '白天发言阶段可以自爆并带走一名玩家',
        usageLimit: 1,
        canUseAtDay: true
      }
    ],
    description: '拥有普通狼人能力，白天可以自爆带走一名玩家'
  },
  seer: {
    id: 'seer',
    type: 'seer',
    name: '预言家',
    camp: 'gods',
    team: 'good',
    abilities: [
      {
        id: 'check',
        name: '查验',
        description: '每晚可以查验一名玩家的身份',
        canUseAtNight: true
      }
    ],
    description: '每晚可以查验一名玩家的身份，得知该玩家是"好人"或"狼人"'
  },
  witch: {
    id: 'witch',
    type: 'witch',
    name: '女巫',
    camp: 'gods',
    team: 'good',
    abilities: [
      {
        id: 'antidote',
        name: '解药',
        description: '可以救活当晚被狼人击杀的玩家',
        usageLimit: 1,
        canUseAtNight: true
      },
      {
        id: 'poison',
        name: '毒药',
        description: '可以毒杀一名玩家',
        usageLimit: 1,
        canUseAtNight: true
      }
    ],
    description: '拥有一瓶解药和一瓶毒药（整局游戏各一次），首夜不能自救'
  },
  hunter: {
    id: 'hunter',
    type: 'hunter',
    name: '猎人',
    camp: 'gods',
    team: 'good',
    abilities: [
      {
        id: 'shoot',
        name: '开枪',
        description: '出局时可以开枪带走一名玩家',
        usageLimit: 1,
        canUseAtDay: true
      }
    ],
    description: '出局时可以开枪带走一名玩家，被毒杀时不能开枪'
  },
  guard: {
    id: 'guard',
    type: 'guard',
    name: '守卫',
    camp: 'gods',
    team: 'good',
    abilities: [
      {
        id: 'guard',
        name: '守护',
        description: '每晚可以守护一名玩家（包括自己）',
        canUseAtNight: true
      }
    ],
    description: '每晚可以守护一名玩家，被守护的玩家当晚不会被狼人击杀，不能连续两晚守护同一人'
  },
  knight: {
    id: 'knight',
    type: 'knight',
    name: '骑士',
    camp: 'gods',
    team: 'good',
    abilities: [
      {
        id: 'duel',
        name: '决斗',
        description: '白天可以发动决斗',
        usageLimit: 1,
        canUseAtDay: true
      }
    ],
    description: '白天可以发动决斗，对方是狼人则对方出局，对方是好人则骑士出局'
  },
  villager: {
    id: 'villager',
    type: 'villager',
    name: '村民',
    camp: 'villager',
    team: 'good',
    abilities: [],
    description: '没有特殊技能，通过发言和投票参与游戏'
  }
}

// 默认游戏规则
export const DEFAULT_RULES: GameRules = {
  witchFirstNightSelfSave: false, // 女巫首夜不能自救
  guardConsecutiveProtection: false, // 守卫不能连续守护
  guardSelfProtection: true, // 守卫可以守护自己
  sameGuardSameSave: true, // 同守同救玩家死亡
  firstNightGuard: true // 首夜有守卫参与
}

// 预设板子配置
export const PRESET_CONFIGS: PresetConfig[] = [
  {
    mode: '9人局',
    playerCount: 9,
    roles: [
      'werewolf', 'werewolf', 'werewolf', // 3狼
      'villager', 'villager', 'villager', // 3民
      'seer', 'witch', 'hunter' // 3神
    ],
    description: '3狼3民3神，标准入门配置'
  },
  {
    mode: '10人局',
    playerCount: 10,
    roles: [
      'werewolf', 'werewolf', 'werewolf', // 3狼
      'villager', 'villager', 'villager', 'villager', // 4民
      'seer', 'witch', 'hunter' // 3神
    ],
    description: '3狼4民3神，平衡配置'
  },
  {
    mode: '12人狼王守卫',
    playerCount: 12,
    roles: [
      'wolf_king', 'werewolf', 'werewolf', 'werewolf', // 4狼（1狼王）
      'villager', 'villager', 'villager', 'villager', // 4民
      'seer', 'witch', 'hunter', 'guard' // 4神
    ],
    description: '4狼4民4神，包含狼王和守卫'
  },
  {
    mode: '12人白狼王骑士',
    playerCount: 12,
    roles: [
      'white_wolf', 'werewolf', 'werewolf', 'werewolf', // 4狼（1白狼王）
      'villager', 'villager', 'villager', 'villager', // 4民
      'seer', 'witch', 'hunter', 'knight' // 4神
    ],
    description: '4狼4民4神，包含白狼王和骑士'
  }
]

// 创建游戏配置
export function createGameConfig(mode: GameConfig['mode'], customRoles?: RoleType[]): GameConfig {
  let preset = PRESET_CONFIGS.find(p => p.mode === mode)
  
  if (!preset && mode === '自定义' && customRoles) {
    preset = {
      mode: '自定义',
      playerCount: customRoles.length,
      roles: customRoles,
      description: '自定义配置'
    }
  }
  
  if (!preset) {
    throw new Error(`未找到游戏模式: ${mode}`)
  }

  const roles = preset.roles.map(roleType => ROLES[roleType])
  
  return {
    mode: preset.mode,
    playerCount: preset.playerCount,
    roles,
    rules: { ...DEFAULT_RULES },
    createdAt: new Date()
  }
}

// 随机分配角色给玩家
export function shuffleRoles(roles: Role[]): Role[] {
  const shuffled = [...roles]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 检查游戏结束条件
export function checkWinCondition(players: Player[]): { winner: 'werewolf' | 'good' | null; reason: string } {
  const alivePlayers = players.filter(p => p.isAlive)
  const aliveWerewolves = alivePlayers.filter(p => p.role.team === 'werewolf')
  const aliveGoodGuys = alivePlayers.filter(p => p.role.team === 'good')
  const aliveGods = alivePlayers.filter(p => p.role.camp === 'gods')
  const aliveVillagers = alivePlayers.filter(p => p.role.camp === 'villager')

  // 狼人获胜条件
  if (aliveWerewolves.length === 0) {
    return { winner: 'good', reason: '所有狼人已被淘汰' }
  }
  
  // 好人获胜条件
  if (aliveGods.length === 0) {
    return { winner: 'werewolf', reason: '所有神职已被淘汰（屠神）' }
  }
  
  if (aliveVillagers.length === 0 && aliveGods.length > 0) {
    return { winner: 'werewolf', reason: '所有村民已被淘汰（屠民）' }
  }
  
  // 狼人数量大于等于好人数量
  if (aliveWerewolves.length >= aliveGoodGuys.length) {
    return { winner: 'werewolf', reason: '狼人数量已达到或超过好人数量' }
  }

  return { winner: null, reason: '' }
}

// 获取角色的中文名称
export function getRoleName(roleType: RoleType): string {
  return ROLES[roleType].name
}

// 获取阵营颜色
export function getCampColor(camp: CampType): string {
  switch (camp) {
    case 'werewolf': return 'text-red-600'
    case 'gods': return 'text-blue-600'
    case 'villager': return 'text-green-600'
    default: return 'text-gray-600'
  }
}

// 获取角色图标
export function getRoleIcon(roleType: RoleType): string {
  const icons: Record<RoleType, string> = {
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
  return icons[roleType] || '❓'
}