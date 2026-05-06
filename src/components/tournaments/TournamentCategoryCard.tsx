// src/components/tournaments/TournamentCategoryCard.tsx
'use client'

import { useRouter } from 'next/navigation'
import { TournamentCategory } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TournamentCategoryCardProps {
  category: TournamentCategory
}

export function TournamentCategoryCard({ category }: TournamentCategoryCardProps) {
  const router = useRouter()

  const getIcon = () => {
    if (category.include_teachers) return '👨‍'
    if (category.max_grade <= 8) return '🎒'
    if (category.max_grade <= 10) return '📚'
    return '🎓'
  }

  const getGradesText = () => {
    const min = `${category.min_grade}°`
    const max = category.max_grade === category.min_grade 
      ? '' 
      : `-${category.max_grade}°`
    const teachers = category.include_teachers ? ' + Profes' : ''
    return `${min}${max} Año${teachers}`
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="text-3xl">{getIcon()}</span>
              {category.name}
            </CardTitle>
            <CardDescription className="mt-2">
              {category.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">
              {getGradesText()}
            </Badge>
            <Badge variant="outline">
              Mín. {category.min_teams_recommended} equipos
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Puntos por victoria</p>
              <p className="font-semibold">{category.points_win}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => router.push(`/admin/tournaments/${category.slug}`)}
        >
          Gestionar Torneo →
        </Button>
      </CardFooter>
    </Card>
  )
}