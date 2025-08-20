'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Book, Settings, History, Github } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            🐺 狼人杀法官助手
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            让任何人都能轻松主持狼人杀游戏
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            通过标准化流程引导、自动记录和智能提醒，帮助新手玩家成为专业法官
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* 开始游戏 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Play className="w-6 h-6 text-blue-600" />
                开始新游戏
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                选择游戏模式，配置玩家信息，立即开始一局狼人杀游戏
              </p>
              <Link href="/game/new">
                <Button className="w-full">
                  创建游戏
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 游戏教程 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Book className="w-6 h-6 text-green-600" />
                游戏教程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                学习狼人杀规则，了解各角色技能和法官流程
              </p>
              <Link href="/tutorial">
                <Button variant="outline" className="w-full">
                  查看教程
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 游戏模板 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-purple-600" />
                游戏模板
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                管理和创建自定义游戏配置模板
              </p>
              <Link href="/templates">
                <Button variant="outline" className="w-full">
                  管理模板
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 游戏历史 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <History className="w-6 h-6 text-orange-600" />
                游戏历史
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                查看历史游戏记录和统计数据
              </p>
              <Link href="/history">
                <Button variant="outline" className="w-full">
                  查看历史
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 特色功能 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>核心特色</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-semibold mb-2">标准化流程</h3>
                <p className="text-sm text-gray-600">
                  严格按照游戏规则，提供标准化的夜晚和白天流程引导
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="font-semibold mb-2">自动记录</h3>
                <p className="text-sm text-gray-600">
                  自动记录所有玩家行动、投票结果和游戏状态变化
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🧠</span>
                </div>
                <h3 className="font-semibold mb-2">智能提醒</h3>
                <p className="text-sm text-gray-600">
                  智能检测规则冲突，提供开枪状态判定和胜负条件提醒
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 支持的游戏模式 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>支持的游戏模式</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">9人标准局</h3>
                <p className="text-sm text-gray-600 mb-2">3狼3民3神 - 适合新手</p>
                <div className="text-xs text-gray-500">
                  狼人×3, 村民×3, 预言家, 女巫, 猎人
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">10人局</h3>
                <p className="text-sm text-gray-600 mb-2">3狼4民3神 - 平衡配置</p>
                <div className="text-xs text-gray-500">
                  狼人×3, 村民×4, 预言家, 女巫, 猎人
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">12人狼王守卫局</h3>
                <p className="text-sm text-gray-600 mb-2">4狼4民4神 - 进阶模式</p>
                <div className="text-xs text-gray-500">
                  狼王, 狼人×3, 村民×4, 预言家, 女巫, 猎人, 守卫
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">12人白狼王骑士局</h3>
                <p className="text-sm text-gray-600 mb-2">4狼4民4神 - 高级模式</p>
                <div className="text-xs text-gray-500">
                  白狼王, 狼人×3, 村民×4, 预言家, 女巫, 猎人, 骑士
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 底部链接 */}
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            开源项目，欢迎贡献和反馈
          </p>
          <div className="flex justify-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}