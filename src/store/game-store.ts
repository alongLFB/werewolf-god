import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
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
  VoteRecord,
} from "@/types";
import {
  createGameConfig,
  shuffleRoles,
  checkWinCondition,
} from "@/lib/game-config";
import { GameStorage } from "@/lib/storage";

interface GameStore {
  // 状态
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;

  // 基础操作
  createGame: (params: CreateGameParams) => void;
  loadGame: (gameId?: string) => void;
  saveGame: () => void;
  resetGame: () => void;

  // 游戏流程
  startGame: () => void;
  nextPhase: () => void;
  nextStep: () => void;

  // 夜晚行动
  setGuardTarget: (playerId: number) => void;
  setWolfKillTarget: (playerId: number) => void;
  setSeerCheckTarget: (playerId: number, result: "good" | "werewolf") => void;
  setWitchAction: (type: "antidote" | "poison", targetId?: number) => void;
  setHunterStatus: (canShoot: boolean) => void;

  // 白天行动
  addVote: (voterId: number, targetId: number) => void;
  completeVoting: () => void; // 完成投票并记录票数
  executePlayer: (playerId: number) => void;
  shootPlayer: (shooterId: number, targetId: number) => void;
  useBomb: (bomberId: number, targetId: number) => void;
  useDuel: (knightId: number, targetId: number) => void;

  // 警长竞选
  addPoliceCandidate: (playerId: number) => void;
  removePoliceCandidate: (playerId: number) => void;
  withdrawFromPolice: (playerId: number) => void;
  generatePoliceSpeechOrder: () => void;
  advancePoliceSpeech: () => void;
  addPoliceVote: (voterId: number, targetId: number) => void;
  addPoliceAbstention: (voterId: number) => void;
  electPoliceChief: () => void;
  startPoliceTieBreaker: (tiedCandidates: number[]) => void;
  transferPoliceChief: (targetId: number | null) => void;

  // 自爆
  useSelfDestruct: (wolfId: number) => void;

  // 辅助功能
  addActionRecord: (record: Omit<ActionRecord, "id" | "timestamp">) => void;
  updatePlayer: (playerId: number, updates: Partial<Player>) => void;
  getPlayer: (playerId: number) => Player | undefined;
  checkGameEnd: () => void;

  // UI状态
  selectedPlayer: number | null;
  setSelectedPlayer: (playerId: number | null) => void;
  showPlayerRoles: boolean;
  toggleShowPlayerRoles: () => void;
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
            const config = createGameConfig(params.mode, params.customRoles);
            const shuffledRoles = shuffleRoles(config.roles);

            const players: Player[] = Array.from(
              { length: config.playerCount },
              (_, i) => ({
                seatNumber: i + 1,
                name: params.playerNames?.[i] || `玩家${i + 1}`,
                role: shuffledRoles[i],
                isAlive: true,
                canShoot: ["hunter", "wolf_king"].includes(
                  shuffledRoles[i].type
                ),
                hasShot: false,
                hasUsedAbility: {
                  poison: false,
                  antidote: false,
                  duel: false,
                  shoot: false,
                  bomb: false,
                  guard: [],
                },
              })
            );

            // 确定夜晚的第一个可用步骤
            const allSteps: NightStep[] = [
              "guard",
              "werewolf",
              "seer",
              "witch",
              "hunter_status",
            ];
            const availableSteps = allSteps.filter((step) => {
              switch (step) {
                case "guard":
                  return players.some(
                    (p) => p.role.type === "guard" && p.isAlive
                  );
                case "werewolf":
                  return players.some(
                    (p) => p.role.team === "werewolf" && p.isAlive
                  );
                case "seer":
                  return players.some(
                    (p) => p.role.type === "seer" && p.isAlive
                  );
                case "witch":
                  return players.some(
                    (p) => p.role.type === "witch" && p.isAlive
                  );
                case "hunter_status":
                  return players.some(
                    (p) => p.role.type === "hunter" && p.isAlive
                  );
                default:
                  return true;
              }
            });

            const initialStep = availableSteps[0] || "werewolf"; // 如果没有可用步骤，默认从狼人开始

            const gameState: GameState = {
              id: `game-${Date.now()}`,
              config,
              phase: "night",
              round: 1,
              currentStep: initialStep,
              players,
              nightState: {
                currentStep: initialStep,
                hunterCanShoot: true,
                completed: false,
              },
              dayState: {
                currentStep: "dawn",
                deaths: [],
                speeches: [],
                votes: [],
                policeCandidates: [],
                policeWithdrawn: [],
                policeSpeechOrder: [],
                policeSpeechIndex: 0,
                policeVotes: [],
                policeAbstentions: [],
                policeTieBreaker: false,
                allowSelfDestruct: false,
                completed: false,
              },
              history: [],
              explosionCount: 0,
              selfDestructCount: 0,
              winner: null,
              gameEnded: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            set({ gameState, error: null });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "创建游戏失败",
            });
          }
        },

        // 开始游戏
        startGame: () => {
          const { gameState } = get();
          if (!gameState) return;

          // 确定夜晚的第一个可用步骤
          const allSteps: NightStep[] = [
            "guard",
            "werewolf",
            "seer",
            "witch",
            "hunter_status",
          ];
          const availableSteps = allSteps.filter((step) => {
            switch (step) {
              case "guard":
                return gameState.players.some(
                  (p) => p.role.type === "guard" && p.isAlive
                );
              case "werewolf":
                return gameState.players.some(
                  (p) => p.role.team === "werewolf" && p.isAlive
                );
              case "seer":
                return gameState.players.some(
                  (p) => p.role.type === "seer" && p.isAlive
                );
              case "witch":
                return gameState.players.some(
                  (p) => p.role.type === "witch" && p.isAlive
                );
              case "hunter_status":
                return gameState.players.some(
                  (p) => p.role.type === "hunter" && p.isAlive
                );
              default:
                return true;
            }
          });

          const firstStep = availableSteps[0] || "werewolf"; // 如果没有可用步骤，默认从狼人开始

          set({
            gameState: {
              ...gameState,
              phase: "night",
              currentStep: firstStep,
              nightState: {
                ...gameState.nightState,
                currentStep: firstStep,
              },
              updatedAt: new Date(),
            },
          });
        },

        // 下一阶段
        nextPhase: () => {
          const { gameState } = get();
          if (!gameState) return;

          const newPhase: GamePhase =
            gameState.phase === "night" ? "day" : "night";
          const newRound =
            newPhase === "night" ? gameState.round + 1 : gameState.round;

          let newStep: NightStep | DayStep;
          let newNightState: NightPhaseState;
          let newDayState: DayPhaseState;

          if (newPhase === "night") {
            // 确定夜晚的第一个可用步骤
            const allSteps: NightStep[] = [
              "guard",
              "werewolf",
              "seer",
              "witch",
              "hunter_status",
            ];
            const availableSteps = allSteps.filter((step) => {
              switch (step) {
                case "guard":
                  return gameState.players.some(
                    (p) => p.role.type === "guard" && p.isAlive
                  );
                case "werewolf":
                  return gameState.players.some(
                    (p) => p.role.team === "werewolf" && p.isAlive
                  );
                case "seer":
                  return gameState.players.some(
                    (p) => p.role.type === "seer" && p.isAlive
                  );
                case "witch":
                  return gameState.players.some(
                    (p) => p.role.type === "witch" && p.isAlive
                  );
                case "hunter_status":
                  return gameState.players.some(
                    (p) => p.role.type === "hunter" && p.isAlive
                  );
                default:
                  return true;
              }
            });

            newStep = availableSteps[0] || "werewolf"; // 如果没有可用步骤，默认从狼人开始
            newNightState = {
              currentStep: newStep,
              hunterCanShoot: true,
              completed: false,
            };
            newDayState = gameState.dayState;
          } else {
            // 判断是否需要警长竞选
            const shouldStartWithPolice =
              (gameState.round === 1 && !gameState.dayState.policeChief) ||
              (gameState.round === 2 &&
                !gameState.dayState.policeChief &&
                (gameState.config.playerCount === 12 ||
                  gameState.config.playerCount === 15) &&
                gameState.selfDestructCount > 0);

            newStep = shouldStartWithPolice ? "police_campaign" : "dawn";
            newNightState = gameState.nightState;
            newDayState = {
              currentStep: shouldStartWithPolice ? "police_campaign" : "dawn",
              deaths: [],
              speeches: [],
              votes: [],
              policeCandidates: [],
              policeWithdrawn: [],
              policeSpeechOrder: [],
              policeSpeechIndex: 0,
              policeVotes: [],
              policeAbstentions: [],
              policeTieBreaker: false,
              allowSelfDestruct: shouldStartWithPolice,
              completed: false,
            };
          }

          set({
            gameState: {
              ...gameState,
              phase: newPhase,
              round: newRound,
              currentStep: newStep,
              nightState: newNightState,
              dayState: newDayState,
              updatedAt: new Date(),
            },
          });
        },

        // 下一步骤
        nextStep: () => {
          const { gameState } = get();
          if (!gameState) return;

          if (gameState.phase === "night") {
            const allSteps: NightStep[] = [
              "guard",
              "werewolf",
              "seer",
              "witch",
              "hunter_status",
            ];

            // 动态过滤出有效的步骤（对应角色存活）
            const availableSteps = allSteps.filter((step) => {
              switch (step) {
                case "guard":
                  return gameState.players.some(
                    (p) => p.role.type === "guard" && p.isAlive
                  );
                case "werewolf":
                  return gameState.players.some(
                    (p) => p.role.team === "werewolf" && p.isAlive
                  );
                case "seer":
                  return gameState.players.some(
                    (p) => p.role.type === "seer" && p.isAlive
                  );
                case "witch":
                  return gameState.players.some(
                    (p) => p.role.type === "witch" && p.isAlive
                  );
                case "hunter_status":
                  return gameState.players.some(
                    (p) => p.role.type === "hunter" && p.isAlive
                  );
                default:
                  return true;
              }
            });

            const currentIndex = availableSteps.indexOf(
              gameState.nightState.currentStep
            );

            if (currentIndex < availableSteps.length - 1) {
              const nextStep = availableSteps[currentIndex + 1];
              set({
                gameState: {
                  ...gameState,
                  currentStep: nextStep,
                  nightState: {
                    ...gameState.nightState,
                    currentStep: nextStep,
                  },
                  updatedAt: new Date(),
                },
              });
            } else {
              // 夜晚结束，进入白天
              get().nextPhase();
            }
          } else {
            // 判断是否需要警长竞选
            const shouldIncludePolice =
              (gameState.round === 1 && !gameState.dayState.policeChief) ||
              (gameState.round === 2 &&
                !gameState.dayState.policeChief &&
                (gameState.config.playerCount === 12 ||
                  gameState.config.playerCount === 15) &&
                gameState.selfDestructCount > 0);

            // 判断是否需要技能发动阶段
            const shouldIncludeSkillActivation = () => {
              // 计算夜晚死亡的玩家
              const wolfKill = gameState.nightState.wolfKillTarget;
              const witchAntidote = gameState.nightState.witchAntidoteTarget;
              const witchPoison = gameState.nightState.witchPoisonTarget;
              const guardTarget = gameState.nightState.guardTarget;

              const deaths: number[] = [];

              // 狼刀死亡判定
              if (wolfKill) {
                const isGuarded = guardTarget === wolfKill;
                const isSaved = witchAntidote === wolfKill;
                // 同守同救规则：如果同时被守护和解救，玩家死亡
                if (isGuarded && isSaved) {
                  deaths.push(wolfKill);
                } else if (!isGuarded && !isSaved) {
                  deaths.push(wolfKill);
                }
              }

              // 女巫毒药
              if (witchPoison) {
                deaths.push(witchPoison);
              }

              // 检查死亡的玩家中是否有可以发动技能的
              return deaths.some((deathId) => {
                const player = gameState.players.find(
                  (p) => p.seatNumber === deathId
                );
                if (!player) return false;

                // 猎人：没被毒杀且可以开枪
                if (
                  player.role.type === "hunter" &&
                  player.canShoot &&
                  witchPoison !== deathId
                ) {
                  return true;
                }

                // 狼王：可以开枪
                if (player.role.type === "wolf_king" && !player.hasShot) {
                  return true;
                }

                return false;
              });
            };

            // 动态构建步骤数组
            const baseSteps: DayStep[] = shouldIncludePolice
              ? [
                  "police_campaign",
                  "police_speech",
                  "police_withdraw",
                  "police_vote",
                  "dawn",
                ]
              : ["dawn"];

            const middleSteps: DayStep[] = [];
            if (shouldIncludeSkillActivation()) {
              middleSteps.push("skill_activation");
            }
            middleSteps.push("last_words", "discussion", "vote", "execution");

            const steps: DayStep[] = [...baseSteps, ...middleSteps];

            // 设置是否允许自爆
            const allowSelfDestruct = [
              "police_campaign",
              "police_speech",
              "police_withdraw",
              "discussion",
            ].includes(gameState.dayState.currentStep);
            const currentIndex = steps.indexOf(gameState.dayState.currentStep);

            if (currentIndex < steps.length - 1) {
              const nextStep = steps[currentIndex + 1];
              const newAllowSelfDestruct = [
                "police_campaign",
                "police_speech",
                "police_withdraw",
                "discussion",
              ].includes(nextStep);
              set({
                gameState: {
                  ...gameState,
                  currentStep: nextStep,
                  dayState: {
                    ...gameState.dayState,
                    currentStep: nextStep,
                    allowSelfDestruct: newAllowSelfDestruct,
                  },
                  updatedAt: new Date(),
                },
              });
            } else {
              // 白天结束，进入夜晚
              get().nextPhase();
            }
          }
        },

        // 守卫行动
        setGuardTarget: (playerId: number) => {
          const { gameState, addActionRecord, updatePlayer } = get();
          if (!gameState) return;

          // 检查是否可以守护（不能连续守护同一人）
          const guard = gameState.players.find(
            (p) => p.role.type === "guard" && p.isAlive
          );
          if (!guard) return;

          const lastGuardTarget = gameState.nightState.guardLastTarget;
          if (lastGuardTarget === playerId) {
            set({ error: "不能连续两晚守护同一人" });
            return;
          }

          set({
            gameState: {
              ...gameState,
              nightState: {
                ...gameState.nightState,
                guardTarget: playerId,
                guardLastTarget: playerId,
              },
              updatedAt: new Date(),
            },
            error: null,
          });

          addActionRecord({
            round: gameState.round,
            phase: "night",
            step: "guard",
            actor: guard.seatNumber,
            action: "guard",
            target: playerId,
          });

          // 更新守卫守护历史
          updatePlayer(guard.seatNumber, {
            hasUsedAbility: {
              ...guard.hasUsedAbility,
              guard: [...(guard.hasUsedAbility?.guard || []), playerId],
            },
          });
        },

        // 狼人击杀
        setWolfKillTarget: (playerId: number) => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          set({
            gameState: {
              ...gameState,
              nightState: {
                ...gameState.nightState,
                wolfKillTarget: playerId,
              },
              updatedAt: new Date(),
            },
          });

          addActionRecord({
            round: gameState.round,
            phase: "night",
            step: "werewolf",
            actor: 0, // 狼人团队行动
            action: "kill",
            target: playerId,
          });
        },

        // 预言家查验
        setSeerCheckTarget: (playerId: number, result: "good" | "werewolf") => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          const seer = gameState.players.find(
            (p) => p.role.type === "seer" && p.isAlive
          );
          if (!seer) return;

          set({
            gameState: {
              ...gameState,
              nightState: {
                ...gameState.nightState,
                seerCheckTarget: playerId,
                seerCheckResult: result,
              },
              updatedAt: new Date(),
            },
          });

          addActionRecord({
            round: gameState.round,
            phase: "night",
            step: "seer",
            actor: seer.seatNumber,
            action: "check",
            target: playerId,
            result,
          });
        },

        // 女巫行动
        setWitchAction: (type: "antidote" | "poison", targetId?: number) => {
          const { gameState, addActionRecord, updatePlayer } = get();
          if (!gameState) return;

          const witch = gameState.players.find(
            (p) => p.role.type === "witch" && p.isAlive
          );
          if (!witch) return;

          // 检查是否已使用过该药
          if (type === "antidote" && witch.hasUsedAbility?.antidote) {
            set({ error: "解药已使用" });
            return;
          }
          if (type === "poison" && witch.hasUsedAbility?.poison) {
            set({ error: "毒药已使用" });
            return;
          }

          // 首夜不能自救检查
          if (
            type === "antidote" &&
            gameState.round === 1 &&
            targetId === witch.seatNumber
          ) {
            set({ error: "首夜不能自救" });
            return;
          }

          const updates = {
            nightState: {
              ...gameState.nightState,
              [type === "antidote"
                ? "witchAntidoteTarget"
                : "witchPoisonTarget"]: targetId,
              [type === "antidote" ? "witchAntidoteUsed" : "witchPoisonUsed"]:
                !!targetId,
            },
          };

          set({
            gameState: {
              ...gameState,
              ...updates,
              updatedAt: new Date(),
            },
            error: null,
          });

          if (targetId) {
            addActionRecord({
              round: gameState.round,
              phase: "night",
              step: "witch",
              actor: witch.seatNumber,
              action: type,
              target: targetId,
            });

            updatePlayer(witch.seatNumber, {
              hasUsedAbility: {
                ...witch.hasUsedAbility,
                [type]: true,
              },
            });
          }
        },

        // 设置猎人状态
        setHunterStatus: (canShoot: boolean) => {
          const { gameState, addActionRecord, updatePlayer } = get();
          if (!gameState) return;

          const hunter = gameState.players.find(
            (p) => p.role.type === "hunter" && p.isAlive
          );
          if (!hunter) return;

          set({
            gameState: {
              ...gameState,
              nightState: {
                ...gameState.nightState,
                hunterCanShoot: canShoot,
              },
              updatedAt: new Date(),
            },
          });

          addActionRecord({
            round: gameState.round,
            phase: "night",
            step: "hunter_status",
            actor: hunter.seatNumber,
            action: "hunter_status",
            result: canShoot,
          });

          updatePlayer(hunter.seatNumber, { canShoot });
        },

        // 投票
        addVote: (voterId: number, targetId: number) => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          const isPoliceChief = gameState.dayState.policeChief === voterId;
          const newVote: VoteRecord = {
            round: gameState.round,
            voter: voterId,
            target: targetId,
            isPoliceVote: isPoliceChief,
          };

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                votes: [...gameState.dayState.votes, newVote],
              },
              updatedAt: new Date(),
            },
          });

          // 添加行动记录
          addActionRecord({
            round: gameState.round,
            phase: "day",
            step: "vote",
            actor: voterId,
            action: "vote",
            target: targetId,
          });
        },

        // 完成投票并记录票数统计
        completeVoting: () => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          const votes = gameState.dayState.votes;
          const voteCount: Record<number, number> = {};
          let abstainCount = 0;

          votes.forEach((vote) => {
            if (vote.target === 0) {
              abstainCount++;
            } else {
              voteCount[vote.target] = (voteCount[vote.target] || 0) + 1;
            }
          });

          // 生成票数统计描述
          const voteResults: string[] = [];
          Object.entries(voteCount).forEach(([target, count]) => {
            voteResults.push(`${target}号(${count}票)`);
          });
          if (abstainCount > 0) {
            voteResults.push(`弃票(${abstainCount}票)`);
          }

          const voteResultText =
            voteResults.length > 0 ? voteResults.join(", ") : "无投票";

          addActionRecord({
            round: gameState.round,
            phase: "day",
            step: "vote",
            actor: 0, // 系统记录
            action: "vote",
            target: 0,
            description: `投票结果: ${voteResultText}`,
          });
        },

        // 处决玩家
        executePlayer: (playerId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd } = get();

          updatePlayer(playerId, {
            isAlive: false,
            deathReason: "vote",
            deathRound: get().gameState?.round,
            deathPhase: "day",
          });

          addActionRecord({
            round: get().gameState?.round || 0,
            phase: "day",
            step: "execution",
            actor: 0,
            action: "vote",
            target: playerId,
          });

          checkGameEnd();
        },

        // 开枪
        shootPlayer: (shooterId: number, targetId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd } = get();

          updatePlayer(shooterId, {
            hasShot: true,
            hasUsedAbility: {
              ...get().getPlayer(shooterId)?.hasUsedAbility,
              shoot: true,
            },
          });

          updatePlayer(targetId, {
            isAlive: false,
            deathReason: "shoot",
            deathRound: get().gameState?.round,
            deathPhase: get().gameState?.phase,
          });

          addActionRecord({
            round: get().gameState?.round || 0,
            phase: get().gameState?.phase || "day",
            actor: shooterId,
            action: "shoot",
            target: targetId,
          });

          checkGameEnd();
        },

        // 自爆
        useBomb: (bomberId: number, targetId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd, gameState } =
            get();
          if (!gameState) return;

          const bomber = gameState.players.find(
            (p) => p.seatNumber === bomberId
          );
          const isWhiteWolfKing = bomber?.role.type === "wolf_king";

          // 自爆者死亡
          updatePlayer(bomberId, {
            isAlive: false,
            deathReason: "bomb",
            hasUsedAbility: {
              ...get().getPlayer(bomberId)?.hasUsedAbility,
              bomb: true,
            },
          });

          // 如果是白狼王自爆且选择了目标，目标也死亡
          if (isWhiteWolfKing && targetId !== bomberId) {
            updatePlayer(targetId, {
              isAlive: false,
              deathReason: "bomb",
              deathRound: gameState.round,
              deathPhase: "day",
            });

            addActionRecord({
              round: gameState.round,
              phase: "day",
              actor: bomberId,
              action: "bomb",
              target: targetId,
              description: `${bomberId}号白狼王自爆并带走${targetId}号`,
            });
          } else {
            // 普通狼人自爆或白狼王选择不带人
            addActionRecord({
              round: gameState.round,
              phase: "day",
              actor: bomberId,
              action: "bomb",
              target: bomberId,
              description: `${bomberId}号${bomber?.role.name}自爆`,
            });
          }

          // 增加爆破计数
          set({
            gameState: {
              ...gameState,
              explosionCount: gameState.explosionCount + 1,
              updatedAt: new Date(),
            },
          });

          checkGameEnd();
        },

        // 决斗
        useDuel: (knightId: number, targetId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd, getPlayer } =
            get();

          const target = getPlayer(targetId);
          if (!target) return;

          const isTargetWerewolf = target.role.team === "werewolf";

          if (isTargetWerewolf) {
            // 目标是狼人，目标死亡
            updatePlayer(targetId, {
              isAlive: false,
              deathReason: "duel",
              deathRound: get().gameState?.round,
              deathPhase: "day",
            });
          } else {
            // 目标是好人，骑士死亡
            updatePlayer(knightId, {
              isAlive: false,
              deathReason: "duel",
              deathRound: get().gameState?.round,
              deathPhase: "day",
            });
          }

          updatePlayer(knightId, {
            hasUsedAbility: {
              ...getPlayer(knightId)?.hasUsedAbility,
              duel: true,
            },
          });

          addActionRecord({
            round: get().gameState?.round || 0,
            phase: "day",
            actor: knightId,
            action: "duel",
            target: targetId,
            result: isTargetWerewolf ? "success" : "failed",
          });

          checkGameEnd();
        },

        // 添加行动记录
        addActionRecord: (record: Omit<ActionRecord, "id" | "timestamp">) => {
          const { gameState } = get();
          if (!gameState) return;

          const newRecord: ActionRecord = {
            ...record,
            id: `action-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
          };

          set({
            gameState: {
              ...gameState,
              history: [...gameState.history, newRecord],
              updatedAt: new Date(),
            },
          });
        },

        // 更新玩家
        updatePlayer: (playerId: number, updates: Partial<Player>) => {
          const { gameState } = get();
          if (!gameState) return;

          const updatedPlayers = gameState.players.map((player) =>
            player.seatNumber === playerId ? { ...player, ...updates } : player
          );

          set({
            gameState: {
              ...gameState,
              players: updatedPlayers,
              updatedAt: new Date(),
            },
          });
        },

        // 获取玩家
        getPlayer: (playerId: number) => {
          const { gameState } = get();
          return gameState?.players.find((p) => p.seatNumber === playerId);
        },

        // 检查游戏结束
        checkGameEnd: () => {
          const { gameState } = get();
          if (!gameState) return;

          const result = checkWinCondition(gameState.players);
          if (result.winner) {
            set({
              gameState: {
                ...gameState,
                winner: result.winner,
                gameEnded: true,
                updatedAt: new Date(),
              },
            });
          }
        },

        // 警长竞选相关
        addPoliceCandidate: (playerId: number) => {
          const { gameState } = get();
          if (!gameState) return;

          const candidates = gameState.dayState.policeCandidates;
          if (!candidates.includes(playerId)) {
            set({
              gameState: {
                ...gameState,
                dayState: {
                  ...gameState.dayState,
                  policeCandidates: [...candidates, playerId],
                },
                updatedAt: new Date(),
              },
            });
          }
        },

        removePoliceCandidate: (playerId: number) => {
          const { gameState } = get();
          if (!gameState) return;

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                policeCandidates: gameState.dayState.policeCandidates.filter(
                  (id) => id !== playerId
                ),
              },
              updatedAt: new Date(),
            },
          });
        },

        withdrawFromPolice: (playerId: number) => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          // 检查玩家是否是候选人
          if (!gameState.dayState.policeCandidates.includes(playerId)) {
            set({ error: "该玩家未上警，无法退水" });
            return;
          }

          // 从候选人列表中移除，并添加到退水列表
          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                policeCandidates: gameState.dayState.policeCandidates.filter(
                  (id) => id !== playerId
                ),
                policeWithdrawn: [
                  ...gameState.dayState.policeWithdrawn,
                  playerId,
                ],
              },
              updatedAt: new Date(),
            },
            error: null,
          });

          addActionRecord({
            round: gameState.round,
            phase: "day",
            step: "police_campaign",
            actor: playerId,
            action: "police_withdraw",
          });
        },

        // 生成警上发言顺序
        generatePoliceSpeechOrder: () => {
          const { gameState } = get();
          if (!gameState) return;

          const candidates = gameState.dayState.policeCandidates;
          if (candidates.length === 0) return;

          // 根据当前时间生成起始位置
          const now = new Date();
          const minutes = now.getMinutes();
          const startIndex = minutes % candidates.length;
          const startPlayer = candidates[startIndex];

          // 根据"奇顺偶逆"规则确定发言顺序
          let speechOrder: number[] = [];

          if (startPlayer % 2 === 1) {
            // 奇数号位顺时针：按座位号升序排列候选人，从起始位置开始
            const sortedCandidates = [...candidates].sort((a, b) => a - b);
            const startIndexInSorted = sortedCandidates.indexOf(startPlayer);
            speechOrder = [
              ...sortedCandidates.slice(startIndexInSorted),
              ...sortedCandidates.slice(0, startIndexInSorted),
            ];
          } else {
            // 偶数号位逆时针：按座位号降序排列候选人，从起始位置开始
            const sortedCandidates = [...candidates].sort((a, b) => b - a);
            const startIndexInSorted = sortedCandidates.indexOf(startPlayer);
            speechOrder = [
              ...sortedCandidates.slice(startIndexInSorted),
              ...sortedCandidates.slice(0, startIndexInSorted),
            ];
          }

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                policeSpeechOrder: speechOrder,
                policeSpeechIndex: 0,
              },
              updatedAt: new Date(),
            },
          });
        },

        // 推进警上发言
        advancePoliceSpeech: () => {
          const { gameState } = get();
          if (!gameState) return;

          const nextIndex = gameState.dayState.policeSpeechIndex + 1;

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                policeSpeechIndex: nextIndex,
              },
              updatedAt: new Date(),
            },
          });
        },

        addPoliceVote: (voterId: number, targetId: number) => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          const policeVote: VoteRecord = {
            round: gameState.round,
            voter: voterId,
            target: targetId,
            isPoliceVote: true,
          };

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                policeVotes: [...gameState.dayState.policeVotes, policeVote],
              },
              updatedAt: new Date(),
            },
          });

          addActionRecord({
            round: gameState.round,
            phase: "day",
            step: "police_vote",
            actor: voterId,
            action: "police_elect", // 改为更明确的警长选举行动
            target: targetId,
          });
        },

        electPoliceChief: () => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          const policeVotes = gameState.dayState.policeVotes;
          const voteCount: Record<number, number> = {};

          policeVotes.forEach((vote) => {
            voteCount[vote.target] = (voteCount[vote.target] || 0) + 1;
          });

          // 添加票数统计记录
          if (Object.keys(voteCount).length > 0) {
            const voteResult = Object.entries(voteCount)
              .map(([target, count]) => `${target}号(${count}票)`)
              .join(", ");

            addActionRecord({
              round: gameState.round,
              phase: "day",
              step: "police_vote",
              actor: 0, // 系统记录
              action: "police_elect",
              target: 0,
              description: `警长选举票数统计: ${voteResult}`,
            });
          }

          // 如果没有投票，直接返回，不选举警长
          if (Object.keys(voteCount).length === 0) {
            return;
          }

          const maxVotes = Math.max(...Object.values(voteCount));
          const winners = Object.entries(voteCount)
            .filter(([_, count]) => count === maxVotes)
            .map(([target, _]) => parseInt(target));

          // If there's a clear winner, elect them as police chief
          if (winners.length === 1) {
            addActionRecord({
              round: gameState.round,
              phase: "day",
              step: "police_vote",
              actor: 0, // 系统记录
              action: "police_elect",
              target: winners[0],
              description: `${winners[0]}号当选警长`,
            });

            set({
              gameState: {
                ...gameState,
                dayState: {
                  ...gameState.dayState,
                  policeChief: winners[0],
                  policeTieBreaker: false,
                },
                updatedAt: new Date(),
              },
            });
          } else if (winners.length > 1) {
            // Handle tie - start tiebreaker with only tied candidates
            addActionRecord({
              round: gameState.round,
              phase: "day",
              step: "police_vote",
              actor: 0, // 系统记录
              action: "police_elect",
              target: 0,
              description: `警长选举平票，进入PK: ${winners.join("号、")}号`,
            });

            get().startPoliceTieBreaker(winners);
          }
        },

        startPoliceTieBreaker: (tiedCandidates: number[]) => {
          const { gameState } = get();
          if (!gameState) return;

          set({
            gameState: {
              ...gameState,
              dayState: {
                ...gameState.dayState,
                policeCandidates: tiedCandidates, // Only tied candidates remain
                policeVotes: [], // Clear previous votes
                policeAbstentions: [], // Clear abstentions
                policeTieBreaker: true,
              },
              updatedAt: new Date(),
            },
          });
        },

        addPoliceAbstention: (voterId: number) => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          const abstentions = gameState.dayState.policeAbstentions;
          if (!abstentions.includes(voterId)) {
            set({
              gameState: {
                ...gameState,
                dayState: {
                  ...gameState.dayState,
                  policeAbstentions: [...abstentions, voterId],
                },
                updatedAt: new Date(),
              },
            });

            addActionRecord({
              round: gameState.round,
              phase: "day",
              step: "police_vote",
              actor: voterId,
              action: "police_abstain",
            });
          }
        },

        transferPoliceChief: (targetId: number | null) => {
          const { gameState, addActionRecord } = get();
          if (!gameState) return;

          const previousChief = gameState.dayState.policeChief;
          if (!previousChief) return;

          if (targetId) {
            // Transfer badge to another player
            set({
              gameState: {
                ...gameState,
                dayState: {
                  ...gameState.dayState,
                  policeChief: targetId,
                },
                updatedAt: new Date(),
              },
            });

            addActionRecord({
              round: gameState.round,
              phase: gameState.phase,
              actor: previousChief,
              action: "police_transfer",
              target: targetId,
            });
          } else {
            // Destroy the badge
            set({
              gameState: {
                ...gameState,
                dayState: {
                  ...gameState.dayState,
                  policeChief: undefined,
                },
                updatedAt: new Date(),
              },
            });

            addActionRecord({
              round: gameState.round,
              phase: gameState.phase,
              actor: previousChief,
              action: "police_destroy",
            });
          }
        },

        useSelfDestruct: (wolfId: number) => {
          const { updatePlayer, addActionRecord, checkGameEnd, gameState } =
            get();
          if (!gameState) return;

          const wolf = gameState.players.find((p) => p.seatNumber === wolfId);
          if (!wolf || wolf.role.team !== "werewolf" || !wolf.isAlive) return;

          // Check if self-destruct is allowed in current phase
          if (!gameState.dayState.allowSelfDestruct) {
            set({ error: "当前阶段不允许自爆" });
            return;
          }

          updatePlayer(wolfId, {
            isAlive: false,
            deathReason: "bomb",
            deathRound: gameState.round,
            deathPhase: "day",
          });

          // Increment self-destruct count
          set({
            gameState: {
              ...gameState,
              selfDestructCount: gameState.selfDestructCount + 1,
              updatedAt: new Date(),
            },
          });

          addActionRecord({
            round: gameState.round,
            phase: "day",
            step: gameState.dayState.currentStep,
            actor: wolfId,
            action: "self_destruct",
          });

          checkGameEnd();
        },

        // UI状态管理
        setSelectedPlayer: (playerId: number | null) => {
          set({ selectedPlayer: playerId });
        },

        toggleShowPlayerRoles: () => {
          set((state) => ({ showPlayerRoles: !state.showPlayerRoles }));
        },

        // 其他操作
        loadGame: (gameId?: string) => {
          set({ isLoading: true, error: null });

          try {
            let gameState: GameState | null = null;

            if (gameId) {
              // 加载特定游戏（从历史记录）
              const history = GameStorage.getGameHistory();
              const gameData = history.find(
                (item) => item.gameState.id === gameId
              );
              gameState = gameData?.gameState || null;
            } else {
              // 加载当前游戏
              gameState = GameStorage.loadCurrentGame();
            }

            if (gameState) {
              set({
                gameState,
                isLoading: false,
                error: null,
              });
            } else {
              set({
                isLoading: false,
                error: gameId ? "未找到指定的游戏记录" : "没有可加载的游戏",
              });
            }
          } catch (error) {
            console.error("加载游戏失败:", error);
            set({
              isLoading: false,
              error: "加载游戏失败，请重试",
            });
          }
        },

        saveGame: () => {
          const { gameState } = get();
          if (!gameState) {
            set({ error: "没有可保存的游戏状态" });
            return;
          }

          try {
            // 更新保存时间
            const updatedGameState = {
              ...gameState,
              updatedAt: new Date(),
            };

            // 使用GameStorage保存
            GameStorage.saveCurrentGame(updatedGameState);

            // 如果游戏已结束，也保存到历史记录
            if (updatedGameState.gameEnded) {
              GameStorage.saveToHistory(updatedGameState);
            }

            // 更新状态并清除错误
            set({
              gameState: updatedGameState,
              error: null,
            });

            // 显示成功提示（通过临时设置error为成功消息）
            setTimeout(() => {
              set({ error: "✅ 游戏已保存" });
              setTimeout(() => {
                set({ error: null });
              }, 2000);
            }, 100);
          } catch (error) {
            console.error("保存游戏失败:", error);
            set({ error: "保存游戏失败，请重试" });
          }
        },

        resetGame: () => {
          set({
            gameState: null,
            selectedPlayer: null,
            showPlayerRoles: false,
            error: null,
          });
        },
      }),
      {
        name: "werewolf-game-store",
        partialize: (state) => ({
          gameState: state.gameState,
          showPlayerRoles: state.showPlayerRoles,
        }),
      }
    ),
    { name: "werewolf-game-store" }
  )
);
