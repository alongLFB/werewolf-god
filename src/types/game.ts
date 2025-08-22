// 角色类型枚举
export type RoleType = 
  | 'werewolf'      // 普通狼人
  | 'wolf_king'     // 狼王
  | 'white_wolf'    // 白狼王
  | 'seer'          // 预言家
  | 'witch'         // 女巫
  | 'hunter'        // 猎人
  | 'guard'         // 守卫
  | 'knight'        // 骑士
  | 'villager'      // 村民

// 阵营类型
export type CampType = 'werewolf' | 'villager' | 'gods'

// 队伍类型（胜负判定用）
export type TeamType = 'werewolf' | 'good'

// 游戏模式
export type GameMode = '9人局' | '10人局' | '12人狼王守卫' | '12人白狼王骑士' | '自定义'

// 死亡原因
export type DeathReason = 'knife' | 'poison' | 'vote' | 'shoot' | 'duel' | 'bomb'

// 游戏阶段
export type GamePhase = 'night' | 'day'

// 夜晚步骤
export type NightStep = 'guard' | 'werewolf' | 'seer' | 'witch' | 'hunter_status'

// 白天步骤
export type DayStep = 'dawn' | 'police_campaign' | 'police_vote' | 'last_words' | 'skill_activation' | 'discussion' | 'vote' | 'execution'

// 行动类型
export type ActionType = 
  | 'guard' | 'kill' | 'check' | 'poison' | 'antidote' 
  | 'shoot' | 'bomb' | 'duel' | 'vote' | 'hunter_status'
  | 'self_destruct' | 'police_abstain' | 'police_transfer' | 'police_destroy'
  | 'police_withdraw'

// 角色能力定义
export interface Ability {
  id: string
  name: string
  description: string
  usageLimit?: number // 使用次数限制
  canUseAtNight?: boolean
  canUseAtDay?: boolean
}

// 角色定义
export interface Role {
  id: string
  type: RoleType
  name: string
  camp: CampType
  team: TeamType
  abilities: Ability[]
  description: string
}

// 玩家状态
export interface Player {
  seatNumber: number
  name?: string
  role: Role
  isAlive: boolean
  deathReason?: DeathReason
  deathRound?: number
  deathPhase?: GamePhase
  protectedLastNight?: boolean
  canShoot?: boolean // 是否能开枪（猎人/狼王）
  hasShot?: boolean  // 是否已开枪
  hasUsedAbility?: {
    poison?: boolean
    antidote?: boolean
    duel?: boolean
    shoot?: boolean
    bomb?: boolean // 白狼王自爆
    guard?: number[] // 守卫历史记录
  }
}

// 游戏规则
export interface GameRules {
  witchFirstNightSelfSave: boolean // 女巫首夜自救
  guardConsecutiveProtection: boolean // 守卫连续守护
  guardSelfProtection: boolean // 守卫自救
  sameGuardSameSave: boolean // 同守同救
  firstNightGuard: boolean // 首夜守卫
}

// 游戏配置
export interface GameConfig {
  mode: GameMode
  playerCount: number
  roles: Role[]
  rules: GameRules
  createdAt: Date
}

// 行动记录
export interface ActionRecord {
  id: string
  round: number
  phase: GamePhase
  step?: NightStep | DayStep
  actor: number // 座位号
  action: ActionType
  target?: number
  result?: any // 查验结果、开枪状态等
  timestamp: Date
  description?: string
}

// 投票记录
export interface VoteRecord {
  round: number
  voter: number
  target: number
  isPoliceVote?: boolean // 是否是警长票（1.5票）
}

// 夜晚阶段状态
export interface NightPhaseState {
  currentStep: NightStep
  guardTarget?: number
  guardLastTarget?: number // 上一轮守护目标
  wolfKillTarget?: number
  seerCheckTarget?: number
  seerCheckResult?: 'good' | 'werewolf'
  witchAntidoteTarget?: number
  witchPoisonTarget?: number
  witchAntidoteUsed?: boolean
  witchPoisonUsed?: boolean
  hunterCanShoot: boolean // 猎人开枪状态
  completed: boolean
}

// 白天阶段状态
export interface DayPhaseState {
  currentStep: DayStep
  deaths: number[] // 当天死亡玩家
  speeches: SpeechRecord[]
  votes: VoteRecord[]
  policeChief?: number
  policeCandidates: number[] // 上警候选人
  policeWithdrawn: number[] // 退水玩家列表
  policeVotes: VoteRecord[] // 警长投票
  policeAbstentions: number[] // 弃票玩家列表
  policeTieBreaker?: boolean // 是否处于警长平票加投状态
  policeTransferTarget?: number // 警长移交目标
  allowSelfDestruct?: boolean // 当前步骤是否允许自爆
  completed: boolean
}

// 发言记录
export interface SpeechRecord {
  player: number
  content?: string
  timestamp: Date
  isLastWords?: boolean // 遗言
}

// 游戏状态
export interface GameState {
  id: string
  config: GameConfig
  phase: GamePhase
  round: number
  currentStep: NightStep | DayStep
  players: Player[]
  nightState: NightPhaseState
  dayState: DayPhaseState
  history: ActionRecord[]
  explosionCount: number // 爆破次数统计
  selfDestructCount: number // 自爆次数统计(用于判断警长竞选)
  winner?: TeamType | null
  gameEnded: boolean
  createdAt: Date
  updatedAt: Date
}

// 游戏创建参数
export interface CreateGameParams {
  mode: GameMode
  playerCount?: number
  customRoles?: RoleType[]
  playerNames?: string[]
}

// 预设板子配置
export interface PresetConfig {
  mode: GameMode
  playerCount: number
  roles: RoleType[]
  description: string
}

// 游戏结果
export interface GameResult {
  winner: TeamType
  reason: string
  survivors: Player[]
  gameLength: number // 游戏轮数
  mvp?: number // MVP玩家座位号
}

// 本地存储游戏数据
export interface LocalGameData {
  gameState: GameState
  lastSaved: Date
}