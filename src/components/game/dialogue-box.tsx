'use client'

interface DialogueBoxProps {
  text: string
  className?: string
}

export function DialogueBox({ text, className = '' }: DialogueBoxProps) {
  return (
    <div className={`dialogue-content ${className}`}>
      <p className="leading-relaxed">{text}</p>
    </div>
  )
}

// 预定义的法官台词
export const DIALOGUE_SCRIPTS = {
  // 夜晚流程
  guard: {
    start: "守卫请睁眼",
    action: "请选择你要守护的玩家",
    end: "守卫请闭眼"
  },
  werewolf: {
    start: "狼人请睁眼",
    confirm: "请互相确认身份",
    action: "请统一意见，选择要击杀的目标",
    end: "狼人请闭眼"
  },
  seer: {
    start: "预言家请睁眼",
    action: "你要查验的玩家是几号？",
    result: (target: number, result: string) => `${target}号玩家是${result === 'werewolf' ? '狼人' : '好人'}`,
    end: "预言家请闭眼"
  },
  witch: {
    start: "女巫请睁眼",
    death: (target?: number) => target ? `今晚${target}号玩家倒下了` : "今晚是平安夜",
    antidote: "你有一瓶解药，要使用吗？",
    antidoteFirstNight: "首夜不能自救",
    poison: "你有一瓶毒药，要使用吗？",
    end: "女巫请闭眼"
  },
  hunter: {
    start: "猎人请睁眼",
    status: "请猎人确认自己的开枪状态",
    canShoot: "你可以开枪（点头确认）",
    cannotShoot: "你不能开枪（摇头确认）",
    end: "猎人请闭眼"
  },
  
  // 白天流程
  dawn: {
    peaceful: "昨晚是平安夜，没有人死亡",
    deaths: (deaths: number[]) => `昨晚死亡的玩家是：${deaths.join('号、')}号`,
    lastWords: (player: number) => `请${player}号玩家发表遗言`
  },
  
  // 警长竞选
  police: {
    campaign: "现在开始警长竞选，请想要竞选警长的玩家上警",
    speech: (candidates: number[]) => `请${candidates.join('号、')}号玩家依次发表竞选宣言`,
    vote: "请大家为心目中的警长候选人投票",
    elected: (chief: number) => `恭喜${chief}号玩家当选为警长`,
    tie: "警长选举平票，将重新投票"
  },
  
  discussion: {
    start: "请大家依次发言讨论",
    order: (player: number) => `请${player}号玩家发言`,
    time: "发言时间到"
  },
  
  vote: {
    start: "现在开始投票",
    instruction: "请举手投票，选择要放逐的玩家",
    count: (votes: Record<number, number>) => {
      const voteTexts = Object.entries(votes).map(([target, count]) => `${target}号${count}票`)
      return `投票结果：${voteTexts.join('，')}`
    },
    tie: "票数相同，没有人被放逐",
    result: (target: number) => `${target}号玩家被投票放逐`
  },
  
  execution: {
    reveal: (player: number) => `请${player}号玩家亮明身份牌`,
    hunterShoot: "猎人可以选择开枪带走一名玩家",
    wolfKingShoot: "狼王可以开枪带走一名玩家",
    shootTarget: (shooter: number, target: number) => `${shooter}号选择带走${target}号玩家`,
    noShoot: (player: number) => `${player}号选择不开枪`
  },
  
  // 特殊技能
  bomb: {
    announce: (bomber: number) => `${bomber}号白狼王选择自爆`,
    target: (bomber: number, target: number) => `${bomber}号带走${target}号玩家`,
    skipDay: "跳过白天，直接进入夜晚"
  },
  
  duel: {
    announce: (knight: number, target: number) => `${knight}号骑士向${target}号发起决斗`,
    success: (target: number) => `${target}号是狼人，决斗成功`,
    failed: (knight: number) => `目标是好人，${knight}号骑士决斗失败`
  },
  
  // 游戏结束
  gameEnd: {
    werewolfWin: "游戏结束，狼人阵营获胜！",
    goodWin: "游戏结束，好人阵营获胜！",
    reason: (reason: string) => `获胜原因：${reason}`
  }
}