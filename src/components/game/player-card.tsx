'use client'

import { Player } from '@/types'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getRoleIcon, getCampColor } from '@/lib/game-config'

interface PlayerCardProps {
  player: Player
  isSelected?: boolean
  isTargetable?: boolean
  showRole?: boolean
  showStatus?: boolean
  onClick?: () => void
  className?: string
}

export function PlayerCard({
  player,
  isSelected = false,
  isTargetable = false,
  showRole = false,
  showStatus = true,
  onClick,
  className
}: PlayerCardProps) {
  return (
    <Card
      className={cn(
        'player-card relative transition-all duration-200',
        player.isAlive ? 'alive' : 'dead',
        isSelected && 'selected',
        isTargetable && 'targetable cursor-pointer hover:shadow-md',
        player.role.camp,
        className
      )}
      onClick={isTargetable ? onClick : undefined}
    >
      <div className="p-3">
        {/* 玩家编号和名称 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-800">
              {player.seatNumber}号
            </span>
            {player.name && (
              <span className="text-sm text-gray-600 truncate">
                {player.name}
              </span>
            )}
          </div>
          
          {/* 状态指示器 */}
          <div className="flex items-center space-x-1">
            {player.isAlive ? (
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            ) : (
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </div>
        </div>

        {/* 角色信息 */}
        {showRole && (
          <div className="flex items-center space-x-2 mb-2">
            <span className="role-icon">{getRoleIcon(player.role.type)}</span>
            <span className={cn("text-sm font-medium", getCampColor(player.role.camp))}>
              {player.role.name}
            </span>
          </div>
        )}

        {/* 状态信息 */}
        {showStatus && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">状态</span>
              <span className={player.isAlive ? 'text-green-600' : 'text-red-600'}>
                {player.isAlive ? '存活' : '已死亡'}
              </span>
            </div>
            
            {!player.isAlive && player.deathReason && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">死因</span>
                <span className="text-red-600">
                  {getDeathReasonText(player.deathReason)}
                </span>
              </div>
            )}

            {/* 技能状态 */}
            {player.isAlive && showRole && (
              <div className="space-y-1">
                {player.role.type === 'witch' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">药品</span>
                    <div className="flex space-x-1">
                      <span className={player.hasUsedAbility?.antidote ? 'text-gray-400' : 'text-blue-600'}>
                        💙{player.hasUsedAbility?.antidote ? '✗' : '✓'}
                      </span>
                      <span className={player.hasUsedAbility?.poison ? 'text-gray-400' : 'text-purple-600'}>
                        💜{player.hasUsedAbility?.poison ? '✗' : '✓'}
                      </span>
                    </div>
                  </div>
                )}
                
                {(player.role.type === 'hunter' || player.role.type === 'wolf_king') && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">开枪</span>
                    <span className={player.canShoot ? 'text-orange-600' : 'text-gray-400'}>
                      {player.hasUsedAbility?.shoot ? '已使用' : player.canShoot ? '可用' : '不可用'}
                    </span>
                  </div>
                )}
                
                {player.role.type === 'knight' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">决斗</span>
                    <span className={player.hasUsedAbility?.duel ? 'text-gray-400' : 'text-blue-600'}>
                      {player.hasUsedAbility?.duel ? '已使用' : '可用'}
                    </span>
                  </div>
                )}

                {player.role.type === 'white_wolf' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">自爆</span>
                    <span className={player.hasUsedAbility?.bomb ? 'text-gray-400' : 'text-red-600'}>
                      {player.hasUsedAbility?.bomb ? '已使用' : '可用'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 选中指示器 */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function getDeathReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    knife: '刀杀',
    poison: '毒杀',
    vote: '票杀',
    shoot: '枪杀',
    duel: '决斗',
    bomb: '自爆'
  }
  return reasonMap[reason] || '未知'
}