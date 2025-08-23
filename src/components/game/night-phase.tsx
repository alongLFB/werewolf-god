"use client";

import { useState } from "react";
import { useGameStore } from "@/store/game-store";
import { PlayerCard } from "./player-card";
import { DialogueBox, DIALOGUE_SCRIPTS } from "./dialogue-box";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Player, NightStep } from "@/types";
import { cn } from "@/lib/utils";

export function NightPhase() {
  const {
    gameState,
    setGuardTarget,
    setWolfKillTarget,
    setSeerCheckTarget,
    setWitchAction,
    setHunterStatus,
    useBomb,
    nextStep,
    nextPhase,
    getPlayer,
  } = useGameStore();

  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [seerResult, setSeerResult] = useState<"good" | "werewolf" | null>(
    null
  );

  if (!gameState) return null;

  const { nightState, players } = gameState;
  const currentStep = nightState.currentStep;

  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayer(playerId);
  };

  const handleConfirmAction = () => {
    if (!selectedPlayer) return;

    switch (currentStep) {
      case "guard":
        setGuardTarget(selectedPlayer);
        // 自动进入下一步
        setTimeout(() => nextStep(), 1000);
        break;
      case "werewolf":
        setWolfKillTarget(selectedPlayer);
        // 自动进入下一步
        setTimeout(() => nextStep(), 1000);
        break;
      case "seer":
        const target = getPlayer(selectedPlayer);
        if (target) {
          const result = target.role.team === "werewolf" ? "werewolf" : "good";
          setSeerCheckTarget(selectedPlayer, result);
          setSeerResult(result);
          // 显示结果3秒后自动进入下一步
          setTimeout(() => nextStep(), 3000);
        }
        break;
    }
    setSelectedPlayer(null);
  };

  const handleWitchAction = (type: "antidote" | "poison", target?: number) => {
    if (target) {
      setWitchAction(type, target);
    } else {
      setWitchAction(type); // 不使用
    }
    setSelectedPlayer(null);
    // 自动进入下一步
    setTimeout(() => nextStep(), 1000);
  };

  const handleHunterStatus = (canShoot: boolean) => {
    setHunterStatus(canShoot);
    // 自动进入下一阶段
    setTimeout(() => nextStep(), 1000);
  };

  const handleBomb = (bomberId: number, targetId: number) => {
    // Change name to avoid React Hook naming convention conflict
    useGameStore.getState().useBomb(bomberId, targetId);
    // 自爆后直接进入下一轮夜晚
    setTimeout(() => nextPhase(), 2000);
  };

  const getTargetablePlayers = (): Player[] => {
    switch (currentStep) {
      case "guard":
        return players.filter((p) => p.isAlive);
      case "werewolf":
        return players.filter((p) => p.isAlive);
      case "seer":
        const seer = players.find((p) => p.role.type === "seer" && p.isAlive);
        return players.filter(
          (p) => p.isAlive && p.seatNumber !== seer?.seatNumber
        );
      case "witch":
        return players.filter((p) => p.isAlive);
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <NightStepRenderer
        step={currentStep}
        gameState={gameState}
        players={players}
        nightState={nightState}
        selectedPlayer={selectedPlayer}
        seerResult={seerResult}
        onPlayerSelect={handlePlayerSelect}
        onConfirmAction={handleConfirmAction}
        onWitchAction={handleWitchAction}
        onHunterStatus={handleHunterStatus}
        onBomb={handleBomb}
        onNextStep={nextStep}
        targetablePlayers={getTargetablePlayers()}
      />
    </div>
  );
}

interface NightStepRendererProps {
  step: NightStep;
  gameState: any;
  players: Player[];
  nightState: any;
  selectedPlayer: number | null;
  seerResult: "good" | "werewolf" | null;
  onPlayerSelect: (playerId: number) => void;
  onConfirmAction: () => void;
  onWitchAction: (type: "antidote" | "poison", target?: number) => void;
  onHunterStatus: (canShoot: boolean) => void;
  onBomb: (bomberId: number, targetId: number) => void;
  onNextStep: () => void;
  targetablePlayers: Player[];
}

function NightStepRenderer({
  step,
  gameState,
  players,
  nightState,
  selectedPlayer,
  seerResult,
  onPlayerSelect,
  onConfirmAction,
  onWitchAction,
  onHunterStatus,
  onBomb,
  onNextStep,
  targetablePlayers,
}: NightStepRendererProps) {
  switch (step) {
    case "guard":
      return (
        <GuardStep
          players={players}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect}
          onConfirm={onConfirmAction}
          onNext={onNextStep}
          targetablePlayers={targetablePlayers}
          lastTarget={nightState.guardLastTarget}
        />
      );

    case "werewolf":
      return (
        <WerewolfStep
          players={players}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect}
          onConfirm={onConfirmAction}
          onBomb={onBomb}
          onNext={onNextStep}
          targetablePlayers={targetablePlayers}
        />
      );

    case "seer":
      return (
        <SeerStep
          players={players}
          gameState={gameState}
          selectedPlayer={selectedPlayer}
          seerResult={seerResult}
          onPlayerSelect={onPlayerSelect}
          onConfirm={onConfirmAction}
          onNext={onNextStep}
          targetablePlayers={targetablePlayers}
        />
      );

    case "witch":
      return (
        <WitchStep
          players={players}
          nightState={nightState}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect}
          onWitchAction={onWitchAction}
          onNext={onNextStep}
          targetablePlayers={targetablePlayers}
        />
      );

    case "hunter_status":
      return (
        <HunterStatusStep
          players={players}
          nightState={nightState}
          onHunterStatus={onHunterStatus}
          onNext={onNextStep}
        />
      );

    default:
      return null;
  }
}

// 守卫环节
function GuardStep({
  players,
  selectedPlayer,
  onPlayerSelect,
  onConfirm,
  onNext,
  targetablePlayers,
  lastTarget,
}: any) {
  const guard = players.find(
    (p: Player) => p.role.type === "guard" && p.isAlive
  );

  if (!guard) {
    return (
      <div className="space-y-4">
        <DialogueBox text="守卫已死亡，跳过守卫环节" />
        <Button onClick={onNext} className="w-full">
          下一步
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.guard.start} />

      {lastTarget && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              上轮守护了{lastTarget}号，本轮不能再守护
            </p>
          </CardContent>
        </Card>
      )}

      <DialogueBox text={DIALOGUE_SCRIPTS.guard.action} />

      <div className="player-grid">
        {targetablePlayers.map((player: Player) => (
          <PlayerCard
            key={player.seatNumber}
            player={player}
            isSelected={selectedPlayer === player.seatNumber}
            isTargetable={player.seatNumber !== lastTarget}
            onClick={() => onPlayerSelect(player.seatNumber)}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onConfirm}
          disabled={!selectedPlayer}
          className="flex-1"
        >
          确认守护
        </Button>
        <Button variant="outline" onClick={onNext}>
          跳过守护
        </Button>
      </div>

      <DialogueBox text={DIALOGUE_SCRIPTS.guard.end} />
    </div>
  );
}

// 狼人环节
function WerewolfStep({
  players,
  selectedPlayer,
  onPlayerSelect,
  onConfirm,
  onNext,
  targetablePlayers,
  onBomb,
}: any) {
  const [showBombAction, setShowBombAction] = useState(false);
  const wolves = players.filter(
    (p: Player) => p.role.team === "werewolf" && p.isAlive
  );
  const whiteWolf = wolves.find(
    (p: Player) => p.role.type === "white_wolf" && !p.hasUsedAbility?.bomb
  );

  if (wolves.length === 0) {
    return (
      <div className="space-y-4">
        <DialogueBox text="所有狼人已死亡，跳过狼人环节" />
        <Button onClick={onNext} className="w-full">
          下一步
        </Button>
      </div>
    );
  }

  const handleBomb = () => {
    if (whiteWolf && selectedPlayer) {
      onBomb(whiteWolf.seatNumber, selectedPlayer);
      // 自爆后直接进入下一轮夜晚
    }
  };

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.werewolf.start} />

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">狼人身份：</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {wolves.map((wolf: Player) => (
              <span
                key={wolf.seatNumber}
                className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
              >
                {wolf.seatNumber}号 {wolf.role.name}
              </span>
            ))}
          </div>

          {/* 白狼王自爆按钮 */}
          {whiteWolf && (
            <div className="border-t pt-3">
              <Button
                onClick={() => setShowBombAction(!showBombAction)}
                variant="destructive"
                size="sm"
              >
                白狼王自爆
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 自爆目标选择 */}
      {showBombAction && whiteWolf && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">白狼王自爆 - 选择带走的玩家</h3>
            <div className="player-grid mb-3">
              {players
                .filter(
                  (p: Player) =>
                    p.isAlive && p.seatNumber !== whiteWolf.seatNumber
                )
                .map((player: Player) => (
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
                onClick={handleBomb}
                disabled={!selectedPlayer}
                variant="destructive"
              >
                确认自爆
              </Button>
              <Button
                onClick={() => setShowBombAction(false)}
                variant="outline"
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 普通击杀 */}
      {!showBombAction && (
        <>
          <DialogueBox text={DIALOGUE_SCRIPTS.werewolf.confirm} />
          <DialogueBox text={DIALOGUE_SCRIPTS.werewolf.action} />

          <div className="player-grid">
            {targetablePlayers.map((player: Player) => (
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
              onClick={onConfirm}
              disabled={!selectedPlayer}
              className="flex-1"
            >
              确认击杀
            </Button>
            <Button
              onClick={() => {
                // 不击杀，直接进入下一步
                onNext();
              }}
              variant="outline"
              className="flex-1"
            >
              不击杀
            </Button>
          </div>
        </>
      )}

      <DialogueBox text={DIALOGUE_SCRIPTS.werewolf.end} />
    </div>
  );
}

// 预言家环节
function SeerStep({
  players,
  gameState,
  selectedPlayer,
  seerResult,
  onPlayerSelect,
  onConfirm,
  onNext,
  targetablePlayers,
}: any) {
  const seer = players.find((p: Player) => p.role.type === "seer" && p.isAlive);

  if (!seer) {
    return (
      <div className="space-y-4">
        <DialogueBox text="预言家已死亡，跳过预言家环节" />
        <Button onClick={onNext} className="w-full">
          下一步
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.seer.start} />
      <DialogueBox text={DIALOGUE_SCRIPTS.seer.action} />

      <div className="player-grid">
        {targetablePlayers.map((player: Player) => {
          // 如果预言家已经查验过这个玩家，显示查验结果
          const hasBeenChecked = gameState?.history.some(
            (record: any) =>
              record.action === "check" &&
              record.target === player.seatNumber &&
              record.actor === seer?.seatNumber
          );
          const checkResult = gameState?.history.find(
            (record: any) =>
              record.action === "check" &&
              record.target === player.seatNumber &&
              record.actor === seer?.seatNumber
          )?.result;

          return (
            <div key={player.seatNumber} className="relative">
              <PlayerCard
                player={player}
                isSelected={selectedPlayer === player.seatNumber}
                isTargetable={true}
                onClick={() => onPlayerSelect(player.seatNumber)}
              />
              {hasBeenChecked && (
                <div
                  className={cn(
                    "absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold",
                    checkResult === "werewolf"
                      ? "bg-red-500 text-white"
                      : "bg-green-500 text-white"
                  )}
                >
                  {checkResult === "werewolf" ? "狼" : "好"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {seerResult && selectedPlayer && (
        <Card className="border-2 border-amber-400 bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold mb-2">🔮 查验结果</p>
            <p className="text-lg">
              {selectedPlayer}号玩家是
              <span
                className={
                  seerResult === "werewolf"
                    ? "text-red-600 font-bold"
                    : "text-green-600 font-bold"
                }
              >
                {seerResult === "werewolf" ? " ✖ 狼人" : " ✔ 好人"}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              请记住此结果，注意为玩家比手势
            </p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => {
          if (selectedPlayer && !seerResult) {
            onConfirm();
          } else if (seerResult) {
            onNext();
          }
        }}
        disabled={!selectedPlayer}
        className="w-full"
      >
        {seerResult ? "继续下一环节" : "确认查验"}
      </Button>

      {!seerResult && (
        <div className="text-center text-sm text-gray-500 mt-2">
          预言家每个回合必须查验一个玩家
        </div>
      )}

      <DialogueBox text={DIALOGUE_SCRIPTS.seer.end} />
    </div>
  );
}

// 女巫环节
function WitchStep({
  players,
  nightState,
  selectedPlayer,
  onPlayerSelect,
  onWitchAction,
  onNext,
  targetablePlayers,
}: any) {
  const witch = players.find(
    (p: Player) => p.role.type === "witch" && p.isAlive
  );
  const [currentStep, setCurrentStep] = useState<
    "choice" | "antidote" | "poison" | "confirm"
  >("choice");
  const [selectedAction, setSelectedAction] = useState<
    "antidote" | "poison" | null
  >(null);
  const [actionCompleted, setActionCompleted] = useState(false);

  if (!witch) {
    return (
      <div className="space-y-4">
        <DialogueBox text="女巫已死亡，跳过女巫环节" />
        <Button onClick={onNext} className="w-full">
          下一步
        </Button>
      </div>
    );
  }

  const wolfKillTarget = nightState.wolfKillTarget;
  const canUseAntidote =
    !witch.hasUsedAbility?.antidote &&
    wolfKillTarget &&
    wolfKillTarget !== witch.seatNumber;
  const canUsePoison = !witch.hasUsedAbility?.poison;

  const handleActionSelect = (action: "antidote" | "poison") => {
    setSelectedAction(action);
    setCurrentStep(action);
  };

  const handleSkip = () => {
    setActionCompleted(true);
  };

  const handleConfirmAction = () => {
    if (selectedAction === "antidote" && wolfKillTarget) {
      onWitchAction("antidote", wolfKillTarget);
      setActionCompleted(true);
    } else if (selectedAction === "poison" && selectedPlayer) {
      onWitchAction("poison", selectedPlayer);
      setActionCompleted(true);
    }
  };

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.witch.start} />

      <DialogueBox text={DIALOGUE_SCRIPTS.witch.death(wolfKillTarget)} />

      {/* 选择药品阶段 */}
      {currentStep === "choice" && !actionCompleted && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">
              选择要使用的药品（今晚只能使用一种）
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleActionSelect("antidote")}
                  disabled={!canUseAntidote}
                  className="flex-1"
                >
                  解药 {!canUseAntidote && "(不可用)"}
                </Button>
                <Button
                  onClick={() => handleActionSelect("poison")}
                  disabled={!canUsePoison}
                  className="flex-1"
                >
                  毒药 {!canUsePoison && "(已使用)"}
                </Button>
              </div>
              <Button onClick={handleSkip} variant="outline" className="w-full">
                跳过，不使用任何药品
              </Button>
            </div>

            {!canUseAntidote && wolfKillTarget && (
              <p className="text-xs text-gray-500 mt-2">
                * 解药不可用原因：
                {wolfKillTarget === witch.seatNumber
                  ? "不能对自己使用"
                  : witch.hasUsedAbility?.antidote
                  ? "已使用过"
                  : "无人被击杀"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 解药使用阶段 */}
      {currentStep === "antidote" &&
        selectedAction === "antidote" &&
        !actionCompleted && (
          <div className="space-y-4">
            <DialogueBox text={DIALOGUE_SCRIPTS.witch.death(wolfKillTarget)} />
            <Card>
              <CardContent className="p-4">
                <DialogueBox text={DIALOGUE_SCRIPTS.witch.antidote} />
                <p className="text-sm text-gray-600 mb-3">
                  确认使用解药救治{wolfKillTarget}号玩家？
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleConfirmAction} className="flex-1">
                    确认使用解药
                  </Button>
                  <Button
                    onClick={() => setCurrentStep("choice")}
                    variant="outline"
                  >
                    返回选择
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* 毒药使用阶段 */}
      {currentStep === "poison" &&
        selectedAction === "poison" &&
        !actionCompleted && (
          <div className="space-y-4">
            <DialogueBox text={DIALOGUE_SCRIPTS.witch.death(wolfKillTarget)} />
            <Card>
              <CardContent className="p-4">
                <DialogueBox text={DIALOGUE_SCRIPTS.witch.poison} />
                <p className="text-sm text-gray-600 mb-3">选择要毒杀的玩家：</p>
                <div className="player-grid mb-3">
                  {targetablePlayers.map((player: Player) => (
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
                    onClick={handleConfirmAction}
                    disabled={!selectedPlayer}
                    className="flex-1"
                  >
                    确认毒杀{selectedPlayer ? `${selectedPlayer}号` : ""}
                  </Button>
                  <Button
                    onClick={() => setCurrentStep("choice")}
                    variant="outline"
                  >
                    返回选择
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* 完成状态 */}
      {actionCompleted && (
        <div className="text-center space-y-4">
          <DialogueBox text="女巫环节完成" />
          <Button onClick={onNext} className="w-full">
            进入下一环节
          </Button>
        </div>
      )}

      <DialogueBox text={DIALOGUE_SCRIPTS.witch.end} />
    </div>
  );
}

// 猎人状态确认环节
function HunterStatusStep({
  players,
  nightState,
  onHunterStatus,
  onNext,
}: any) {
  const hunter = players.find(
    (p: Player) => p.role.type === "hunter" && p.isAlive
  );

  if (!hunter) {
    return (
      <div className="space-y-4">
        <DialogueBox text="猎人已死亡，跳过猎人确认环节" />
        <Button onClick={onNext} className="w-full">
          下一步
        </Button>
      </div>
    );
  }

  // 判断猎人是否能开枪（是否被毒杀）
  const willBePoisoned = nightState.witchPoisonTarget === hunter.seatNumber;
  const canShoot = !willBePoisoned;

  return (
    <div className="space-y-4">
      <DialogueBox text={DIALOGUE_SCRIPTS.hunter.start} />
      <DialogueBox text={DIALOGUE_SCRIPTS.hunter.status} />

      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-lg font-medium mb-4">
            {canShoot
              ? DIALOGUE_SCRIPTS.hunter.canShoot
              : DIALOGUE_SCRIPTS.hunter.cannotShoot}
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                onHunterStatus(canShoot);
                onNext();
              }}
              className="w-32"
            >
              确认状态
            </Button>
          </div>
        </CardContent>
      </Card>

      <DialogueBox text={DIALOGUE_SCRIPTS.hunter.end} />
    </div>
  );
}
