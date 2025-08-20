'use client'

import Link from 'next/link'
import { GameConfigForm } from '@/components/game/game-config-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewGamePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* 页头 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">创建新游戏</h1>
            <p className="text-gray-600">配置游戏参数并开始新的狼人杀游戏</p>
          </div>
        </div>

        {/* 游戏配置表单 */}
        <GameConfigForm />
      </div>
    </div>
  )
}