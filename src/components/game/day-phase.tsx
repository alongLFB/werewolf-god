"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/game-store";
import { PlayerCard } from "./player-card";
import { DialogueBox, DIALOGUE_SCRIPTS } from "./dialogue-box";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { Player, DayStep } from "@/types";
import { calculateVoteResult } from "@/lib/utils";

export function DayPhase() {
  const {
    gameState,
    addVote,
    executePlayer,
    useShoot,
    useBomb,
    useDuel,
    nextStep,
    nextPhase,
    getPlayer,
    updatePlayer,
    addPoliceCandidate,
    removePoliceCandidate,
    withdrawFromPolice,
    addPoliceVote,
    addPoliceAbstention,
    electPoliceChief,
  } = useGameStore();

  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [voteTarget, setVoteTarget] = useState<number | null>(null);
  const [showShootDialog, setShowShootDialog] = useState<{
    shooter: number;
    type: "hunter" | "wolf_king";
  } | null>(null);

  if (!gameState) return null;

  const { dayState, players, nightState } = gameState;
  const currentStep = dayState.currentStep;

  // 计算今晚死亡的玩家
  const calculateDeaths = () => {
    const deaths: number[] = [];
    const wolfKill = nightState.wolfKillTarget;
    const witchAntidote = nightState.witchAntidoteTarget;
    const witchPoison = nightState.witchPoisonTarget;
    const guardTarget = nightState.guardTarget;

    // 狼刀
    if (wolfKill) {
      // 检查是否被守护或解救
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

    return [...new Set(deaths)]; // 去重
  };

  // 在天亮阶段更新玩家死亡状态
  useEffect(() => {
    if (gameState && dayState.currentStep === "dawn") {
      const deaths = calculateDeaths();
      deaths.forEach((playerId) => {
        const player = getPlayer(playerId);
        if (player && player.isAlive) {
          updatePlayer(playerId, {
            isAlive: false,
            deathReason:
              nightState.witchPoisonTarget === playerId ? "poison" : "knife",
            deathRound: gameState.round,
            deathPhase: "night",
          });
        }
      });
    }
  }, [gameState?.dayState?.currentStep, gameState?.round]);

  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayer(playerId);
  };

  const handleVote = (voterId: number, targetId: number) => {
    addVote(voterId, targetId);
  };

  const handleExecute = (playerId: number) => {
    const player = getPlayer(playerId);
    if (!player) return;

    executePlayer(playerId);

    // 检查是否需要开枪
    if (player.role.type === "hunter" && player.canShoot && !player.hasShot) {
      setShowShootDialog({ shooter: playerId, type: "hunter" });
    } else if (player.role.type === "wolf_king" && !player.hasShot) {
      setShowShootDialog({ shooter: playerId, type: "wolf_king" });
    }
  };

  const handleShoot = (shooterId: number, targetId: number) => {
    useShoot(shooterId, targetId);
    setShowShootDialog(null);

    // 检查被开枪的目标是否也能开枪
    const target = getPlayer(targetId);
    if (
      target &&
      target.role.type === "hunter" &&
      target.canShoot &&
      !target.hasShot
    ) {
      setShowShootDialog({ shooter: targetId, type: "hunter" });
    }
  };

  const handlePoliceCandidate = (playerId: number, isCandidate: boolean) => {
    if (isCandidate) {
      addPoliceCandidate(playerId);
    } else {
      removePoliceCandidate(playerId);
    }
  };

  const handlePoliceWithdraw = (playerId: number) => {
    withdrawFromPolice(playerId);
  };

  const handlePoliceVote = (voterId: number, targetId: number) => {
    addPoliceVote(voterId, targetId);
  };

  const handlePoliceAbstain = (voterId: number) => {
    addPoliceAbstention(voterId);
  };

  return (
    <div className="space-y-6">
      <DayStepRenderer
        step={currentStep}
        players={players}
        dayState={dayState}
        deaths={calculateDeaths()}
        selectedPlayer={selectedPlayer}
        voteTarget={voteTarget}
        onPlayerSelect={handlePlayerSelect}
        onVote={handleVote}
        onExecute={handleExecute}
        onBomb={useBomb}
        onDuel={useDuel}
        onNextStep={nextStep}
        onNextPhase={nextPhase}
        onPoliceCandidate={handlePoliceCandidate}
        onPoliceWithdraw={handlePoliceWithdraw}
        onPoliceVote={handlePoliceVote}
        onElectPoliceChief={electPoliceChief}
        onPoliceAbstain={handlePoliceAbstain}
      />

      {/* 开枪对话框 */}
      {showShootDialog && (
        <ShootDialog
          shooter={showShootDialog.shooter}
          type={showShootDialog.type}
          players={players}
          onShoot={handleShoot}
          onCancel={() => setShowShootDialog(null)}
        />
      )}
    </div>
  );
}

interface DayStepRendererProps {
  step: DayStep;
  players: Player[];
  dayState: any;
  deaths: number[];
  selectedPlayer: number | null;
  voteTarget: number | null;
  onPlayerSelect: (playerId: number) => void;
  onVote: (voterId: number, targetId: number) => void;
  onExecute: (playerId: number) => void;
  onBomb: (bomberId: number, targetId: number) => void;
  onDuel: (knightId: number, targetId: number) => void;
  onNextStep: () => void;
  onNextPhase: () => void;
  onPoliceCandidate: (playerId: number, isCandidate: boolean) => void;
  onPoliceWithdraw: (playerId: number) => void;
  onPoliceVote: (voterId: number, targetId: number) => void;
  onElectPoliceChief: () => void;
  onPoliceAbstain: (voterId: number) => void;
}

function DayStepRenderer({
  step,
  players,
  dayState,
  deaths,
  selectedPlayer,
  voteTarget,
  onPlayerSelect,
  onVote,
  onExecute,
  onBomb,
  onDuel,
  onNextStep,
  onNextPhase,
  onPoliceCandidate,
  onPoliceWithdraw,
  onPoliceVote,
  onElectPoliceChief,
  onPoliceAbstain,
}: DayStepRendererProps) {
  switch (step) {
    case "police_campaign":
      return (
        <PoliceCampaignStep
          players={players}
          dayState={dayState}
          onPoliceCandidate={onPoliceCandidate}
          onPoliceWithdraw={onPoliceWithdraw}
          onNextStep={onNextStep}
        />
      );

    case "police_vote":
      return (
        <PoliceVoteStep
          players={players}
          dayState={dayState}
          onPoliceVote={onPoliceVote}
          // Removed incorrect usage of onPoliceAbstain outside JSX
          onElectPoliceChief={onElectPoliceChief}
          onNextStep={onNextStep}
        />
      );

    case "dawn":
      return (
        <DawnStep players={players} deaths={deaths} onNextStep={onNextStep} />
      );

    case "last_words":
      return (
        <LastWordsStep
          players={players}
          deaths={deaths}
          onNextStep={onNextStep}
        />
      );

    case "discussion":
      return (
        <DiscussionStep
          players={players}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect}
          onBomb={onBomb}
          onDuel={onDuel}
          onNextStep={onNextStep}
        />
      );

    case "vote":
      return (
        <VoteStep
          players={players}
          votes={dayState.votes}
          onVote={onVote}
          onNextStep={onNextStep}
          onBomb={onBomb}
        />
      );

    case "execution":
      return (
        <ExecutionStep
          players={players}
          votes={dayState.votes}
          onExecute={onExecute}
          onNextPhase={onNextPhase}
        />
      );

    default:
      return null;
  }
}

// 天亮环节 - 只公布死讯，不处理遗言
function DawnStep({
  players,
  deaths,
  onNextStep,
}: {
  players: Player[];
  deaths: number[];
  onNextStep: () => void;
}) {
  if (deaths.length === 0) {
    return (
      <div className="space-y-4">
        <DialogueBox text={DIALOGUE_SCRIPTS.dawn.peaceful} />
        <Button onClick={onNextStep} className="w-full">
          继续游戏
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.dawn.deaths(deaths)} />

      {/* 显示死亡玩家 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {deaths.map((deathId) => {
          const player = players.find((p) => p.seatNumber === deathId);
          return player ? (
            <PlayerCard
              key={player.seatNumber}
              player={player}
              showRole={true}
              showStatus={true}
            />
          ) : null;
        })}
      </div>

      <Button onClick={onNextStep} className="w-full">
        继续
      </Button>
    </div>
  );
}

// 讨论发言环节
function DiscussionStep({
  players,
  selectedPlayer,
  onPlayerSelect,
  onBomb,
  onDuel,
  onNextStep,
}: any) {
  const [currentSpeaker, setCurrentSpeaker] = useState(1);
  const [showSpecialAction, setShowSpecialAction] = useState<
    "bomb" | "duel" | null
  >(null);

  const alivePlayers = players.filter((p: Player) => p.isAlive);
  const whiteWolf = players.find(
    (p: Player) =>
      p.role.type === "white_wolf" && p.isAlive && !p.hasUsedAbility?.bomb
  );
  const knight = players.find(
    (p: Player) =>
      p.role.type === "knight" && p.isAlive && !p.hasUsedAbility?.duel
  );

  const handleNextSpeaker = () => {
    const nextSpeaker =
      alivePlayers.find((p: Player) => p.seatNumber > currentSpeaker)
        ?.seatNumber || alivePlayers[0]?.seatNumber;
    if (nextSpeaker) {
      setCurrentSpeaker(nextSpeaker);
    }
  };

  const handleSpecialAction = (type: "bomb" | "duel") => {
    if (!selectedPlayer) return;

    if (type === "bomb" && whiteWolf) {
      onBomb(whiteWolf.seatNumber, selectedPlayer);
    } else if (type === "duel" && knight) {
      onDuel(knight.seatNumber, selectedPlayer);
    }

    setShowSpecialAction(null);
    onPlayerSelect(null);
  };

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.discussion.start} />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <DialogueBox
              text={DIALOGUE_SCRIPTS.discussion.order(currentSpeaker)}
            />
            <CountdownTimer
              initialSeconds={90} // 1分30秒
              onTimeUp={() => {
                // 时间到后可以自动进入下一位或结束
              }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleNextSpeaker}>下一位发言</Button>
            <Button variant="outline" onClick={onNextStep}>
              结束讨论
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 特殊技能按钮 */}
      {(whiteWolf || knight) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">特殊技能</h3>
            <div className="flex gap-2">
              {whiteWolf && (
                <Button
                  variant="destructive"
                  onClick={() => setShowSpecialAction("bomb")}
                >
                  白狼王自爆
                </Button>
              )}
              {knight && (
                <Button
                  variant="outline"
                  onClick={() => setShowSpecialAction("duel")}
                >
                  骑士决斗
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 特殊技能目标选择 */}
      {showSpecialAction && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">
              选择{showSpecialAction === "bomb" ? "自爆" : "决斗"}目标
            </h3>
            <div className="player-grid mb-3">
              {alivePlayers.map((player: Player) => (
                <PlayerCard
                  key={player.seatNumber}
                  player={player}
                  isSelected={selectedPlayer === player.seatNumber}
                  isTargetable={true}
                  onClick={() => onPlayerSelect(player.seatNumber)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSpecialAction(showSpecialAction)}
                disabled={!selectedPlayer}
              >
                确认
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSpecialAction(null)}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 存活玩家列表 */}
      <div className="player-grid">
        {alivePlayers.map((player: Player) => (
          <PlayerCard
            key={player.seatNumber}
            player={player}
            showStatus={true}
            className={
              currentSpeaker === player.seatNumber ? "ring-2 ring-blue-500" : ""
            }
          />
        ))}
      </div>
    </div>
  );
}

// 投票环节
function VoteStep({ players, votes, onVote, onNextStep, onBomb }: any) {
  const [currentVoter, setCurrentVoter] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [showBombDialog, setShowBombDialog] = useState<{
    bomber: number;
  } | null>(null);
  const [selectedBombTarget, setSelectedBombTarget] = useState<number | null>(
    null
  );

  const alivePlayers = players.filter((p: Player) => p.isAlive);
  const remainingVoters = alivePlayers.filter(
    (p: Player) => !votes.some((v: any) => v.voter === p.seatNumber)
  );

  // 找到可以自爆的狼人
  const canBombWolves = alivePlayers.filter(
    (p: Player) => p.role.team === "werewolf" && !p.hasUsedAbility?.bomb
  );

  const handleVote = () => {
    if (currentVoter && selectedTarget) {
      onVote(currentVoter, selectedTarget);
      setCurrentVoter(null);
      setSelectedTarget(null);
    }
  };

  const handleAbstain = () => {
    if (currentVoter) {
      onVote(currentVoter, 0); // 使用0表示弃票
      setCurrentVoter(null);
      setSelectedTarget(null);
    }
  };

  const handleBombClick = (bomberId: number) => {
    setShowBombDialog({ bomber: bomberId });
  };

  const handleConfirmBomb = () => {
    if (showBombDialog && selectedBombTarget) {
      onBomb(showBombDialog.bomber, selectedBombTarget);
      setShowBombDialog(null);
      setSelectedBombTarget(null);
    }
  };

  const voteResult = calculateVoteResult(votes);

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.vote.start} />
      <DialogueBox text={DIALOGUE_SCRIPTS.vote.instruction} />

      {/* 当前投票者选择 */}
      {remainingVoters.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">选择投票玩家</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {remainingVoters.map((player: Player) => (
                <Button
                  key={player.seatNumber}
                  variant={
                    currentVoter === player.seatNumber ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setCurrentVoter(player.seatNumber)}
                >
                  {player.seatNumber}号
                </Button>
              ))}
            </div>

            {currentVoter && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {currentVoter}号投票给：
                </h4>
                <div className="player-grid mb-3">
                  {alivePlayers.map((player: Player) => (
                    <PlayerCard
                      key={player.seatNumber}
                      player={player}
                      isSelected={selectedTarget === player.seatNumber}
                      isTargetable={true}
                      onClick={() => setSelectedTarget(player.seatNumber)}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleVote} disabled={!selectedTarget}>
                    确认投票
                  </Button>
                  <Button onClick={handleAbstain} variant="outline">
                    弃票
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 投票结果显示 */}
      {votes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">当前投票情况</h3>
            
            {/* 显示警长信息 */}
            {dayState.policeChief && (
              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <span className="text-yellow-800">
                  👮‍♂️ {dayState.policeChief}号是警长，投票权重为1.5票
                </span>
              </div>
            )}
            
            {Object.entries(voteResult.voteCount).map(([target, count]) => (
              <div key={target} className="flex justify-between py-1">
                <span>{target}号</span>
                <span>{count}票</span>
              </div>
            ))}
            {voteResult.abstainCount > 0 && (
              <div className="flex justify-between py-1 text-gray-600">
                <span>弃票</span>
                <span>{voteResult.abstainCount}票</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={onNextStep}
        disabled={remainingVoters.length > 0}
        className="w-full"
      >
        投票完成
      </Button>

      {/* 狼人自爆选项 */}
      {canBombWolves.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 text-red-600">狼人自爆</h3>
            <p className="text-sm text-gray-600 mb-3">
              投票期间，狼人可以选择自爆
            </p>
            <div className="flex flex-wrap gap-2">
              {canBombWolves.map((wolf: Player) => (
                <Button
                  key={wolf.seatNumber}
                  onClick={() => handleBombClick(wolf.seatNumber)}
                  variant="destructive"
                  size="sm"
                >
                  {wolf.seatNumber}号{wolf.role.name}自爆
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 自爆目标选择对话框 */}
      {showBombDialog && (
        <Card className="border-red-500">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 text-red-600">
              {showBombDialog.bomber}号狼人自爆 - 选择带走的玩家
            </h3>
            <div className="player-grid mb-3">
              {alivePlayers
                .filter((p: Player) => p.seatNumber !== showBombDialog.bomber)
                .map((player: Player) => (
                  <PlayerCard
                    key={player.seatNumber}
                    player={player}
                    isSelected={selectedBombTarget === player.seatNumber}
                    isTargetable={true}
                    onClick={() => setSelectedBombTarget(player.seatNumber)}
                  />
                ))}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmBomb}
                disabled={!selectedBombTarget}
                variant="destructive"
              >
                确认自爆
              </Button>
              <Button onClick={() => setShowBombDialog(null)} variant="outline">
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 执行结果环节
function ExecutionStep({ players, votes, onExecute, onNextPhase }: any) {
  const [skillPhase, setSkillPhase] = useState<
    "waiting" | "last_words" | "countdown" | "completed"
  >("waiting");
  const [playerExecuted, setPlayerExecuted] = useState(false);

  const voteResult = calculateVoteResult(votes);

  if (voteResult.isTie || voteResult.maxVotes === 0) {
    return (
      <div className="space-y-4">
        <DialogueBox text={DIALOGUE_SCRIPTS.vote.tie} />
        <Button onClick={onNextPhase} className="w-full">
          进入夜晚
        </Button>
      </div>
    );
  }

  const executedPlayer = voteResult.winners[0];
  const player = players.find((p: Player) => p.seatNumber === executedPlayer);

  const handleExecute = () => {
    setPlayerExecuted(true);
    onExecute(executedPlayer);
    setSkillPhase("last_words");
  };

  const handleLastWordsComplete = () => {
    setSkillPhase("countdown");
  };

  const handleSkillTimeout = () => {
    setSkillPhase("completed");
    // 3秒后自动进入下一轮夜晚
    setTimeout(() => {
      onNextPhase();
    }, 3000);
  };

  const handleSkillUsed = () => {
    setSkillPhase("completed");
    // 技能使用后等待下一轮
  };

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.vote.result(executedPlayer)} />

      {!playerExecuted ? (
        <>
          {player && (
            <div className="flex justify-center">
              <PlayerCard
                player={player}
                showRole={false} // 不显示身份
                showStatus={true}
              />
            </div>
          )}

          <Button onClick={handleExecute} className="w-full">
            执行放逐
          </Button>
        </>
      ) : (
        <>
          {/* 遗言阶段 */}
          {skillPhase === "last_words" && (
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="font-medium mb-3">遗言时间</h3>
                <DialogueBox
                  text={DIALOGUE_SCRIPTS.dawn.lastWords(executedPlayer)}
                />
                {player && (
                  <div className="mt-3">
                    <PlayerCard
                      player={player}
                      showRole={true}
                      showStatus={true}
                    />
                  </div>
                )}
                <Button onClick={handleLastWordsComplete} className="mt-4">
                  遗言完毕
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 技能选择倒计时阶段 */}
          {skillPhase === "countdown" && (
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="font-medium mb-3">技能发动时间</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {executedPlayer}号玩家，你有10秒时间决定是否发动技能
                </p>
                <CountdownTimer
                  initialSeconds={10}
                  autoStart={true}
                  onTimeUp={handleSkillTimeout}
                />
                <div className="flex gap-2 mt-4 justify-center">
                  <Button onClick={handleSkillUsed} variant="destructive">
                    发动技能
                  </Button>
                  <Button onClick={handleSkillTimeout} variant="outline">
                    不发动技能
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 完成阶段 */}
          {skillPhase === "completed" && (
            <div className="text-center space-y-4">
              <DialogueBox text="放逐完成，准备进入夜晚" />
              <Button onClick={onNextPhase} className="w-full">
                进入夜晚
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 开枪对话框
function ShootDialog({
  shooter,
  type,
  players,
  onShoot,
  onCancel,
}: {
  shooter: number;
  type: "hunter" | "wolf_king";
  players: Player[];
  onShoot: (shooterId: number, targetId: number) => void;
  onCancel: () => void;
}) {
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const alivePlayers = players.filter(
    (p) => p.isAlive && p.seatNumber !== shooter
  );

  return (
    <Card className="fixed inset-4 z-50 bg-white shadow-lg">
      <CardContent className="p-6">
        <h2 className="text-lg font-bold mb-4">
          {type === "hunter" ? "猎人开枪" : "狼王开枪"}
        </h2>

        <DialogueBox
          text={
            type === "hunter"
              ? DIALOGUE_SCRIPTS.execution.hunterShoot
              : DIALOGUE_SCRIPTS.execution.wolfKingShoot
          }
        />

        <div className="player-grid my-4">
          {alivePlayers.map((player) => (
            <PlayerCard
              key={player.seatNumber}
              player={player}
              isSelected={selectedTarget === player.seatNumber}
              isTargetable={true}
              onClick={() => setSelectedTarget(player.seatNumber)}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => selectedTarget && onShoot(shooter, selectedTarget)}
            disabled={!selectedTarget}
          >
            确认开枪
          </Button>
          <Button variant="outline" onClick={onCancel}>
            不开枪
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 警长竞选环节
function PoliceCampaignStep({
  players,
  dayState,
  onPoliceCandidate,
  onPoliceWithdraw,
  onNextStep,
}: any) {
  const alivePlayers = players.filter((p: Player) => p.isAlive);
  const candidates = dayState.policeCandidates || [];
  const withdrawnPlayers = dayState.policeWithdrawn || [];

  const handleToggleCandidate = (playerId: number) => {
    const isCandidate = candidates.includes(playerId);
    const isWithdrawn = withdrawnPlayers.includes(playerId);
    
    // 如果已经退水，不能再上警
    if (isWithdrawn) {
      return;
    }
    
    onPoliceCandidate(playerId, !isCandidate);
  };

  const handleWithdraw = (playerId: number) => {
    onPoliceWithdraw(playerId);
  };

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.police.campaign} />
      <DialogueBox text="请选择要上警的玩家，上警玩家需要发表竞选宣言。已上警的玩家可以选择退水。" />

      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">
            上警候选人 ({candidates.length}人)
          </h3>
          <div className="player-grid mb-3">
            {alivePlayers.map((player: Player) => {
              const isCandidate = candidates.includes(player.seatNumber);
              const isWithdrawn = withdrawnPlayers.includes(player.seatNumber);
              return (
                <div key={player.seatNumber} className="relative">
                  <PlayerCard
                    player={player}
                    isSelected={isCandidate}
                    isTargetable={!isWithdrawn}
                    onClick={() => handleToggleCandidate(player.seatNumber)}
                    className={`${isCandidate ? "ring-2 ring-blue-500" : ""} ${
                      isWithdrawn ? "opacity-50" : ""
                    }`}
                  />
                  {isCandidate && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 text-xs px-2 py-1"
                      onClick={() => handleWithdraw(player.seatNumber)}
                    >
                      退水
                    </Button>
                  )}
                  {isWithdrawn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xs font-bold rounded">
                      已退水
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {candidates.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">当前上警玩家：</p>
              <div className="flex flex-wrap gap-1">
                {candidates.map((candidateId: number) => (
                  <span
                    key={candidateId}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {candidateId}号
                  </span>
                ))}
              </div>
            </div>
          )}

          {withdrawnPlayers.length > 0 && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                ⚠️ 已退水玩家：{withdrawnPlayers.join("、")}号
              </p>
              <p className="text-xs text-amber-600 mt-1">
                退水玩家不能投票，也不能被投票
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={onNextStep}
        className="w-full"
        disabled={candidates.length === 0}
      >
        确认上警名单，进入投票
      </Button>
    </div>
  );
}

// 警长投票环节
function PoliceVoteStep({
  players,
  dayState,
  onPoliceVote,
  onPoliceAbstain,
  onElectPoliceChief,
  onNextStep,
}: any) {
  const [currentVoter, setCurrentVoter] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);

  const alivePlayers = players.filter((p: Player) => p.isAlive);
  const candidates = dayState.policeCandidates || [];
  const withdrawnPlayers = dayState.policeWithdrawn || [];
  const policeVotes = dayState.policeVotes || [];
  const policeAbstentions = dayState.policeAbstentions || [];

  // 在平票加投时，所有人都可以投票（除了候选人和退水玩家）
  const isTieBreaker = dayState.policeTieBreaker || false;
  const remainingVoters = isTieBreaker
    ? alivePlayers.filter(
        (p: Player) =>
          !policeVotes.some((v: any) => v.voter === p.seatNumber) &&
          !policeAbstentions.includes(p.seatNumber) &&
          !candidates.includes(p.seatNumber) &&
          !withdrawnPlayers.includes(p.seatNumber)
      )
    : alivePlayers.filter(
        (p: Player) =>
          !policeVotes.some((v: any) => v.voter === p.seatNumber) &&
          !policeAbstentions.includes(p.seatNumber) &&
          !candidates.includes(p.seatNumber) && // 首轮投票，候选人不能投票
          !withdrawnPlayers.includes(p.seatNumber) // 退水玩家不能投票
      );

  const handleVote = () => {
    if (currentVoter && selectedTarget) {
      onPoliceVote(currentVoter, selectedTarget);
      setCurrentVoter(null);
      setSelectedTarget(null);
    }
  };

  const handleAbstain = () => {
    if (currentVoter) {
      onPoliceAbstain(currentVoter);
      setCurrentVoter(null);
      setSelectedTarget(null);
    }
  };

  const handleFinishVoting = () => {
    // 先选举警长，如果有平票会自动设置 policeTieBreaker
    onElectPoliceChief();
    
    // 检查是否发生平票，如果没有平票才进入下一步
    if (!dayState.policeTieBreaker) {
      onNextStep();
    }
  };

  // 计算投票结果
  const voteCount: Record<number, number> = {};
  policeVotes.forEach((vote: any) => {
    voteCount[vote.target] = (voteCount[vote.target] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      <DialogueBox
        text={
          isTieBreaker
            ? DIALOGUE_SCRIPTS.police.tie
            : DIALOGUE_SCRIPTS.police.vote
        }
      />
      <DialogueBox
        text={
          isTieBreaker
            ? "平票加投：只有平票候选人参与竞选，所有非候选人都可以投票，也可以选择弃票"
            : "警长竞选投票：只有非候选人可以投票，也可以选择弃票"
        }
      />
      
      {isTieBreaker && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <h3 className="font-medium text-yellow-800 mb-2">⚡ 平票加投</h3>
            <p className="text-sm text-yellow-700">
              上轮投票出现平票，需要重新投票。只有平票的候选人可以继续竞选。
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">警长候选人</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {candidates.map((candidateId: number) => {
              const player = players.find(
                (p: Player) => p.seatNumber === candidateId
              );
              return player ? (
                <span
                  key={candidateId}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded"
                >
                  {candidateId}号 {player.role.name}
                </span>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      {/* 投票进行中 */}
      {remainingVoters.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">选择投票玩家</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {remainingVoters.map((player: Player) => (
                <Button
                  key={player.seatNumber}
                  variant={
                    currentVoter === player.seatNumber ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setCurrentVoter(player.seatNumber)}
                >
                  {player.seatNumber}号
                </Button>
              ))}
            </div>

            {currentVoter && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {currentVoter}号投票给：
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {candidates.map((candidateId: number) => (
                    <Button
                      key={candidateId}
                      variant={
                        selectedTarget === candidateId ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedTarget(candidateId)}
                    >
                      {candidateId}号
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleVote} disabled={!selectedTarget}>
                    确认投票
                  </Button>
                  <Button onClick={handleAbstain} variant="outline">
                    弃票
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 投票结果 */}
      {policeVotes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">当前投票结果</h3>
            {Object.entries(voteCount).map(([candidateId, count]) => (
              <div key={candidateId} className="flex justify-between py-1">
                <span>{candidateId}号</span>
                <span>{count}票</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleFinishVoting}
        disabled={remainingVoters.length > 0}
        className="w-full"
      >
        {isTieBreaker ? "完成平票加投" : "完成警长选举"}
      </Button>
    </div>
  );
}

// 遗言环节
function LastWordsStep({
  players,
  deaths,
  onNextStep,
}: {
  players: Player[];
  deaths: number[];
  onNextStep: () => void;
}) {
  const [currentDeathIndex, setCurrentDeathIndex] = useState(0);

  const handleNext = () => {
    if (currentDeathIndex < deaths.length - 1) {
      setCurrentDeathIndex(currentDeathIndex + 1);
    } else {
      onNextStep();
    }
  };

  // 如果没有死亡玩家，直接跳过
  if (deaths.length === 0) {
    return (
      <div className="space-y-4">
        <DialogueBox text="没有玩家需要发表遗言" />
        <Button onClick={onNextStep} className="w-full">
          继续游戏
        </Button>
      </div>
    );
  }

  const currentDeadPlayer = players.find(
    (p) => p.seatNumber === deaths[currentDeathIndex]
  );

  return (
    <div className="space-y-4">
      <DialogueBox text="遗言环节" />

      {currentDeadPlayer && (
        <>
          <Card>
            <CardContent className="p-4 text-center">
              <DialogueBox
                text={DIALOGUE_SCRIPTS.dawn.lastWords(
                  deaths[currentDeathIndex]
                )}
              />
              <div className="mt-3">
                <PlayerCard
                  player={currentDeadPlayer}
                  showRole={true}
                  showStatus={true}
                />
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-600">
            遗言进度：{currentDeathIndex + 1} / {deaths.length}
          </div>
        </>
      )}

      <Button onClick={handleNext} className="w-full">
        {currentDeathIndex < deaths.length - 1
          ? "下一位遗言"
          : "结束遗言，进入讨论"}
      </Button>
    </div>
  );
}
