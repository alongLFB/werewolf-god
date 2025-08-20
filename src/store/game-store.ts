import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { 
  GameState, 
  Player, 
  ActionRecord, 
  NightStep, 
  DayStep, 
  GamePhase,
  NightPhaseState,
  DayPhaseState,
  CreateGameParams,
  VoteRecord
} from '@/types'
import { createGameConfig, shuffleRoles, checkWinCondition } from '@/lib/game-config'

interface GameStore {
  // 状态
  gameState: GameState | null
  isLoading: boolean
  error: string | null

  // 基础操作
  createGame: (params: CreateGameParams) => void
  loadGame: (gameId: string) => void
  saveGame: () => void
  resetGame: () => void

  // 游戏流程
  startGame: () => void
  nextPhase: () => void
  nextStep: () => void
  
  // 夜晚行动
  setGuardTarget: (playerId: number) => void
  setWolfKillTarget: (playerId: number) => void
  setSeerCheckTarget: (playerId: number, result: 'good' | 'werewolf') => void
  setWitchAction: (type: 'antidote' | 'poison', targetId?: number) => void
  setHunterStatus: (canShoot: boolean) => void

  // 白天行动
  addVote: (voterId: number, targetId: number) => void
  executePlayer: (playerId: number) => void
  useShoot: (shooterId: number, targetId: number) => void
  useBomb: (bomberId: number, targetId: number) => void
  useDuel: (knightId: number, targetId: number) => void
  
  // 警长竞选
  addPoliceCandidate: (playerId: number) => void
  removePoliceCandidate: (playerId: number) => void
  addPoliceVote: (voterId: number, targetId: number) => void
  electPoliceChief: () => void

  // 辅助功能
  addActionRecord: (record: Omit<ActionRecord, 'id' | 'timestamp'>) => void
  updatePlayer: (playerId: number, updates: Partial<Player>) => void
  getPlayer: (playerId: number) => Player | undefined
  checkGameEnd: () => void
  
  // UI状态
  selectedPlayer: number | null
  setSelectedPlayer: (playerId: number | null) => void
  showPlayerRoles: boolean
  toggleShowPlayerRoles: () => void
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        gameState: null,
        isLoading: false,
        error: null,
        selectedPlayer: null,
        showPlayerRoles: false,

        // 创建新游戏
        createGame: (params: CreateGameParams) => {
          try {
            const config = createGameConfig(params.mode, params.customRoles)
            const shuffledRoles = shuffleRoles(config.roles)
            
            const players: Player[] = Array.from({ length: config.playerCount }, (_, i) => ({
              seatNumber: i + 1,
              name: params.playerNames?.[i] || `玩家${i + 1}`,
              role: shuffledRoles[i],
              isAlive: true,
              canShoot: ['hunter', 'wolf_king'].includes(shuffledRoles[i].type),
              hasShot: false,
              hasUsedAbility: {
                poison: false,
                antidote: false,
                duel: false,
                shoot: false,
                bomb: false,
                guard: []
              }
            }))

            const gameState: GameState = {
              id: `game-${Date.now()}`,
              config,
              phase: 'night',
              round: 1,
              currentStep: 'guard',
              players,
              nightState: {
                currentStep: 'guard',
                hunterCanShoot: true,
                completed: false
              },
              dayState: {
                currentStep: 'dawn',
                deaths: [],
                speeches: [],
                votes: [],
                policeCandidates: [],
                policeVotes: [],
                completed: false
              },
              history: [],
              winner: null,
              gameEnded: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }

            set({ gameState, error: null })
          } catch (error) {
            set({ error: error instanceof Error ? error.message : '创建游戏失败' })
          }
        },

        // 开始游戏
        startGame: () => {
          const { gameState } = get()
          if (!gameState) return

          set({
            gameState: {
              ...gameState,
              phase: 'night',
              currentStep: 'guard',
              updatedAt: new Date()
            }
          })
        },

        // 下一阶段
        nextPhase: () => {
          const { gameState } = get()
          if (!gameState) return

          const newPhase: GamePhase = gameState.phase === 'night' ? 'day' : 'night'
          const newRound = newPhase === 'night' ? gameState.round + 1 : gameState.round
          
          let newStep: NightStep | DayStep
          let newNightState: NightPhaseState
          let newDayState: DayPhaseState

          if (newPhase === 'night') {
            // 确定夜晚的第一个可用步骤
            const allSteps: NightStep[] = ['guard', 'werewolf', 'seer', 'witch', 'hunter_status']
            const availableSteps = allSteps.filter(step => {
              switch (step) {
                case 'guard':
                  return gameState.players.some(p => p.role.type === 'guard' && p.isAlive)
                case 'werewolf':
                  return gameState.players.some(p => p.role.team === 'werewolf' && p.isAlive)
                case 'seer':
                  return gameState.players.some(p => p.role.type === 'seer' && p.isAlive)
                case 'witch':
                  return gameState.players.some(p => p.role.type === 'witch' && p.isAlive)
                case 'hunter_status':
                  return gameState.players.some(p => p.role.type === 'hunter' && p.isAlive)
                default:
                  return true
              }
            })
            
            newStep = availableSteps[0] || 'guard' // 回退到guard如果没有可用步骤
            newNightState = {
              currentStep: newStep,
              hunterCanShoot: true,
              completed: false
            }
            newDayState = gameState.dayState
          } else {
            // For first round, start with police campaign, otherwise start with dawn
            newStep = gameState.round === 1 ? 'police_campaign' : 'dawn'
            newNightState = gameState.nightState
            newDayState = {
              currentStep: gameState.round === 1 ? 'police_campaign' : 'dawn',
              deaths: [],
              speeches: [],
              votes: [],
              policeCandidates: [],
              policeVotes: [],
              completed: false
            }
          }

          set({
            gameState: {
              ...gameState,
              phase: newPhase,
              round: newRound,
              currentStep: newStep,
              nightState: newNightState,
              dayState: newDayState,
              updatedAt: new Date()
            }
          })
        },

        // 下一步骤
        nextStep: () => {
          const { gameState } = get()
          if (!gameState) return

          if (gameState.phase === 'night') {
            const allSteps: NightStep[] = ['guard', 'werewolf', 'seer', 'witch', 'hunter_status']
            
            // 动态过滤出有效的步骤（对应角色存活）
            const availableSteps = allSteps.filter(step => {
              switch (step) {
                case 'guard':
                  return gameState.players.some(p => p.role.type === 'guard' && p.isAlive)
                case 'werewolf':
                  return gameState.players.some(p => p.role.team === 'werewolf' && p.isAlive)
                case 'seer':
                  return gameState.players.some(p => p.role.type === 'seer' && p.isAlive)
                case 'witch':
                  return gameState.players.some(p => p.role.type === 'witch' && p.isAlive)
                case 'hunter_status':
                  return gameState.players.some(p => p.role.type === 'hunter' && p.isAlive)
                default:
                  return true
              }
            })
            
            const currentIndex = availableSteps.indexOf(gameState.nightState.currentStep)
            
            if (currentIndex < availableSteps.length - 1) {
              const nextStep = availableSteps[currentIndex + 1]
              set({
                gameState: {
                  ...gameState,
                  currentStep: nextStep,
                  nightState: {
                    ...gameState.nightState,
                    currentStep: nextStep
                  },
                  updatedAt: new Date()
                }
              })
            } else {
              // 夜晚结束，进入白天
              get().nextPhase()
            }
          } else {
            // First round includes police campaign and vote, other rounds skip them
            const steps: DayStep[] = gameState.round === 1 
              ? ['police_campaign', 'police_vote', 'dawn', 'discussion', 'vote', 'execution']
              : ['dawn', 'discussion', 'vote', 'execution']
            const currentIndex = steps.indexOf(gameState.dayState.currentStep)
            
            if (currentIndex < steps.length - 1) {
              const nextStep = steps[currentIndex + 1]
              set({
                gameState: {
                  ...gameState,
                  currentStep: nextStep,
                  dayState: {
                    ...gameState.dayState,
                    currentStep: nextStep
                  },
                  updatedAt: new Date()
                }
              })
            } else {
              // 白天结束，进入夜晚
              get().nextPhase()
            }
          }
        },

        // 守卫行动
        setGuardTarget: (playerId: number) => {
          const { gameState, addActionRecord, updatePlayer } = get()
          if (!gameState) return

          // 检查是否可以守护（不能连续守护同一人）
          const guard = gameState.players.find(p => p.role.type === 'guard' && p.isAlive)
          if (!guard) return

          const lastGuardTarget = gameState.nightState.guardLastTarget
          if (lastGuardTarget === playerId) {
            set({ error: '不能连续两晚守护同一人' })
            return
          }

          set({
            gameState: {
              ...gameState,
              nightState: {
                ...gameState.nightState,
                guardTarget: playerId,
                guardLastTarget: playerId
              },
              updatedAt: new Date()
            },
            error: null
          })

          addActionRecord({
            round: gameState.round,
            phase: 'night',
            step: 'guard',
            actor: guard.seatNumber,
            action: 'guard',
            target: playerId
          })

          // 更新守卫守护历史
          updatePlayer(guard.seatNumber, {
            hasUsedAbility: {
              ...guard.hasUsedAbility,
              guard: [...(guard.hasUsedAbility?.guard || []), playerId]
            }
          })
        },

        // 狼人击杀
        setWolfKillTarget: (playerId: number) => {
          const { gameState, addActionRecord } = get()
          if (!gameState) return

          set({
            gameState: {
              ...gameState,
              nightState: {
                ...gameState.nightState,
                wolfKillTarget: playerId
              },
              updatedAt: new Date()
            }
          })

          addActionRecord({
            round: gameState.round,
            phase: 'night',
            step: 'werewolf',
            actor: 0, // 狼人团队行动
            action: 'kill',
            target: playerId
          })
        },

        // 预言家查验
        setSeerCheckTarget: (playerId: number, result: 'good' | 'werewolf') => {
          const { gameState, addActionRecord } = get()
          if (!gameState) return

          const seer = gameState.players.find(p => p.role.type === 'seer' && p.isAlive)
          if (!seer) return

          set({
            gameState: {
              ...gameState,
              nightState: {
                ...gameState.nightState,
                seerCheckTarget: playerId,
                seerCheckResult: result
              },
              updatedAt: new Date()
            }
          })

          addActionRecord({
            round: gameState.round,
            phase: 'night',
            step: 'seer',
            actor: seer.seatNumber,
            action: 'check',
            target: playerId,
            result
          })
        },

        // 女巫行动
        setWitchAction: (type: 'antidote' | 'poison', targetId?: number) => {
          const { gameState, addActionRecord, updatePlayer } = get()
          if (!gameState) return

          const witch = gameState.players.find(p => p.role.type === 'witch' && p.isAlive)
          if (!witch) return

          // 检查是否已使用过该药
          if (type === 'antidote' && witch.hasUsedAbility?.antidote) {
            set({ error: '解药已使用' })
            return
          }
          if (type === 'poison' && witch.hasUsedAbility?.poison) {
            set({ error: '毒药已使用' })
            return
          }

          // 首夜不能自救检查
          if (type === 'antidote' && gameState.round === 1 && targetId === witch.seatNumber) {
            set({ error: '首夜不能自救' })
            return
          }

          const updates = {
            nightState: {
              ...gameState.nightState,
              [type === 'antidote' ? 'witchAntidoteTarget' : 'witchPoisonTarget']: targetId,
              [type === 'antidote' ? 'witchAntidoteUsed' : 'witchPoisonUsed']: !!targetId
            }
          }

          set({
            gameState: {
              ...gameState,
              ...updates,
              updatedAt: new Date()
            },
            error: null
          })

          if (targetId) {
            addActionRecord({
              round: gameState.round,
              phase: 'night',
              step: 'witch',
              actor: witch.seatNumber,
              action: type,
              target: targetId
            })

            updatePlayer(witch.seatNumber, {
              hasUsedAbility: {
                ...witch.hasUsedAbility,
                [type]: true
              }
            })
          }
        },

        // 设置猎人状态
        setHunterStatus: (canShoot: boolean) => {
          const { gameState, addActionRecord, updatePlayer } = get()
          if (!gameState) return

          const hunter = gameState.players.find(p => p.role.type === 'hunter' && p.isAlive)
          if (!hunter) return

          set({
            gameState: {
              ...gameState,
              nightState: {
                ...gameState.nightState,
                hunterCanShoot: canShoot
              },
              updatedAt: new Date()
            }
          })

          addActionRecord({
            round: gameState.round,
            phase: 'night',
            step: 'hunter_status',
            actor: hunter.seatNumber,
            action: 'hunter_status',
            result: canShoot
          })

          updatePlayer(hunter.seatNumber, { canShoot })
        },

        // 投票
        addVote: (voterId: number, targetId: number) => {
          const { gameState } = get()
          if (!gameState) return

          const newVote: VoteRecord = {
            round: gameState.round,
            voter: voterId,
            target: targetId
          }

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                votes: [...gameState.dayState.votes, newVote]
              },
              updatedAt: new Date()
            }
          })
        },

        // 处决玩家
        executePlayer: (playerId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd } = get()
          
          updatePlayer(playerId, {
            isAlive: false,
            deathReason: 'vote',
            deathRound: get().gameState?.round,
            deathPhase: 'day'
          })

          addActionRecord({
            round: get().gameState?.round || 0,
            phase: 'day',
            step: 'execution',
            actor: 0,
            action: 'vote',
            target: playerId
          })

          checkGameEnd()
        },

        // 开枪
        useShoot: (shooterId: number, targetId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd } = get()
          
          updatePlayer(shooterId, {
            hasShot: true,
            hasUsedAbility: {
              ...get().getPlayer(shooterId)?.hasUsedAbility,
              shoot: true
            }
          })

          updatePlayer(targetId, {
            isAlive: false,
            deathReason: 'shoot',
            deathRound: get().gameState?.round,
            deathPhase: get().gameState?.phase
          })

          addActionRecord({
            round: get().gameState?.round || 0,
            phase: get().gameState?.phase || 'day',
            actor: shooterId,
            action: 'shoot',
            target: targetId
          })

          checkGameEnd()
        },

        // 自爆
        useBomb: (bomberId: number, targetId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd } = get()
          
          updatePlayer(bomberId, {
            isAlive: false,
            deathReason: 'bomb',
            hasUsedAbility: {
              ...get().getPlayer(bomberId)?.hasUsedAbility,
              bomb: true
            }
          })

          updatePlayer(targetId, {
            isAlive: false,
            deathReason: 'bomb',
            deathRound: get().gameState?.round,
            deathPhase: 'day'
          })

          addActionRecord({
            round: get().gameState?.round || 0,
            phase: 'day',
            actor: bomberId,
            action: 'bomb',
            target: targetId
          })

          checkGameEnd()
        },

        // 决斗
        useDuel: (knightId: number, targetId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd, getPlayer } = get()
          
          const target = getPlayer(targetId)
          if (!target) return

          const isTargetWerewolf = target.role.team === 'werewolf'
          
          if (isTargetWerewolf) {
            // 目标是狼人，目标死亡
            updatePlayer(targetId, {
              isAlive: false,
              deathReason: 'duel',
              deathRound: get().gameState?.round,
              deathPhase: 'day'
            })
          } else {
            // 目标是好人，骑士死亡
            updatePlayer(knightId, {
              isAlive: false,
              deathReason: 'duel',
              deathRound: get().gameState?.round,
              deathPhase: 'day'
            })
          }

          updatePlayer(knightId, {
            hasUsedAbility: {
              ...getPlayer(knightId)?.hasUsedAbility,
              duel: true
            }
          })

          addActionRecord({
            round: get().gameState?.round || 0,
            phase: 'day',
            actor: knightId,
            action: 'duel',
            target: targetId,
            result: isTargetWerewolf ? 'success' : 'failed'
          })

          checkGameEnd()
        },

        // 添加行动记录
        addActionRecord: (record: Omit<ActionRecord, 'id' | 'timestamp'>) => {
          const { gameState } = get()
          if (!gameState) return

          const newRecord: ActionRecord = {
            ...record,
            id: `action-${Date.now()}-${Math.random()}`,
            timestamp: new Date()
          }

          set({
            gameState: {
              ...gameState,
              history: [...gameState.history, newRecord],
              updatedAt: new Date()
            }
          })
        },

        // 更新玩家
        updatePlayer: (playerId: number, updates: Partial<Player>) => {
          const { gameState } = get()
          if (!gameState) return

          const updatedPlayers = gameState.players.map(player =>
            player.seatNumber === playerId ? { ...player, ...updates } : player
          )

          set({
            gameState: {
              ...gameState,
              players: updatedPlayers,
              updatedAt: new Date()
            }
          })
        },

        // 获取玩家
        getPlayer: (playerId: number) => {
          const { gameState } = get()
          return gameState?.players.find(p => p.seatNumber === playerId)
        },

        // 检查游戏结束
        checkGameEnd: () => {
          const { gameState } = get()
          if (!gameState) return

          const result = checkWinCondition(gameState.players)
          if (result.winner) {
            set({
              gameState: {
                ...gameState,
                winner: result.winner,
                gameEnded: true,
                updatedAt: new Date()
              }
            })
          }
        },

        // 警长竞选相关
        addPoliceCandidate: (playerId: number) => {
          const { gameState } = get()
          if (!gameState) return

          const candidates = gameState.dayState.policeCandidates
          if (!candidates.includes(playerId)) {
            set({
              gameState: {
                ...gameState,
                dayState: {
                  ...gameState.dayState,
                  policeCandidates: [...candidates, playerId]
                },
                updatedAt: new Date()
              }
            })
          }
        },

        removePoliceCandidate: (playerId: number) => {
          const { gameState } = get()
          if (!gameState) return

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                policeCandidates: gameState.dayState.policeCandidates.filter(id => id !== playerId)
              },
              updatedAt: new Date()
            }
          })
        },

        addPoliceVote: (voterId: number, targetId: number) => {
          const { gameState, addActionRecord } = get()
          if (!gameState) return

          const policeVote: VoteRecord = {
            round: gameState.round,
            voter: voterId,
            target: targetId,
            isPoliceVote: true
          }

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                policeVotes: [...gameState.dayState.policeVotes, policeVote]
              },
              updatedAt: new Date()
            }
          })

          addActionRecord({
            round: gameState.round,
            phase: 'day',
            step: 'police_vote',
            actor: voterId,
            action: 'vote',
            target: targetId
          })
        },

        electPoliceChief: () => {
          const { gameState } = get()
          if (!gameState) return

          const policeVotes = gameState.dayState.policeVotes
          const voteCount: Record<number, number> = {}
          
          policeVotes.forEach(vote => {
            voteCount[vote.target] = (voteCount[vote.target] || 0) + 1
          })

          const maxVotes = Math.max(...Object.values(voteCount))
          const winners = Object.entries(voteCount)
            .filter(([_, count]) => count === maxVotes)
            .map(([target, _]) => parseInt(target))

          // If there's a clear winner, elect them as police chief
          if (winners.length === 1) {
            set({
              gameState: {
                ...gameState,
                dayState: {
                  ...gameState.dayState,
                  policeChief: winners[0]
                },
                updatedAt: new Date()
              }
            })
          }
        },

        // UI状态管理
        setSelectedPlayer: (playerId: number | null) => {
          set({ selectedPlayer: playerId })
        },

        toggleShowPlayerRoles: () => {
          set(state => ({ showPlayerRoles: !state.showPlayerRoles }))
        },

        // 其他操作
        loadGame: (gameId: string) => {
          // TODO: 实现从存储加载游戏
          set({ isLoading: true })
        },

        saveGame: () => {
          // TODO: 实现保存游戏到存储
          const { gameState } = get()
          if (gameState) {
            localStorage.setItem(`werewolf-game-${gameState.id}`, JSON.stringify(gameState))
          }
        },

        resetGame: () => {
          set({
            gameState: null,
            selectedPlayer: null,
            showPlayerRoles: false,
            error: null
          })
        }
      }),
      {
        name: 'werewolf-game-store',
        partialize: (state) => ({ 
          gameState: state.gameState,
          showPlayerRoles: state.showPlayerRoles 
        })
      }
    ),
    { name: 'werewolf-game-store' }
  )
)