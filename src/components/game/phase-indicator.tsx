"use client";

import { GamePhase } from "@/types";
import { getPhaseText, getStepText } from "@/lib/utils";
import { Moon, Sun, Clock } from "lucide-react";

interface PhaseIndicatorProps {
  phase: GamePhase;
  round: number;
  step: string;
  className?: string;
}

export function PhaseIndicator({
  phase,
  round,
  step,
  className = "",
}: PhaseIndicatorProps) {
  const Icon = phase === "night" ? Moon : Sun;

  return (
    <div className={`game-phase-indicator ${phase} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">{getPhaseText(phase, round)}</h2>
            <p className="text-sm opacity-90">{getStepText(step)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm opacity-75">
          <Clock className="w-4 h-4" />
          <span>
            {new Date().toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-3">
        <PhaseProgress phase={phase} step={step} />
      </div>
    </div>
  );
}

function PhaseProgress({ phase, step }: { phase: GamePhase; step: string }) {
  const nightSteps = ["guard", "werewolf", "seer", "witch", "hunter_status"];

  // 白天步骤需要根据实际情况动态确定，这里使用基础步骤
  // 实际的步骤顺序应该从游戏状态中获取，但为了简化进度条显示，使用固定的核心步骤
  const baseDaySteps = ["dawn", "discussion", "vote", "execution"];

  const steps = phase === "night" ? nightSteps : baseDaySteps;
  const currentIndex = steps.indexOf(step);

  // 如果当前步骤不在基础步骤中（如police_campaign, skill_activation等），
  // 根据步骤类型估算进度
  let progress = 0;
  if (currentIndex >= 0) {
    progress = ((currentIndex + 1) / steps.length) * 100;
  } else if (phase === "day") {
    // 处理额外的白天步骤
    if (["police_campaign", "police_vote"].includes(step)) {
      progress = 10; // 警长竞选阶段，设为10%
    } else if (step === "skill_activation") {
      progress = 30; // 技能发动阶段，设为30%（在dawn之后）
    } else if (step === "last_words") {
      progress = 40; // 遗言阶段，设为40%
    }
  }

  return (
    <div className="w-full bg-white/20 rounded-full h-2">
      <div
        className="bg-white h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.max(5, progress)}%` }}
      />
    </div>
  );
}
