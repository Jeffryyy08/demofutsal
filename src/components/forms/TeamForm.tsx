// src/components/forms/TeamForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { createTeamAction, updateTeamAction } from '@/actions/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface TeamData {
  id: string
  name: string
  section: string | null
  subgroup: string | null
}

// Grados del técnico (6 años)
const GRADES = ['7', '8', '9', '10', '11', '12']

// Secciones por grado
const SECTIONS_PER_GRADE: Record<string, string[]> = {
  '7': ['1', '2', '3', '4', '5','6','7','8','9','10'],
  '8': ['1', '2', '3', '4', '5','6','7','8','9','10'],
  '9': ['1', '2', '3', '4', '5','6','7','8','9','10'],
  '10': ['1', '2', '3', '4', '5','6','7','8','9','10'],
  '11': ['1', '2', '3', '4', '5','6','7','8','9','10'],
  '12': ['1', '2', '3', '4', '5','6','7','8','9','10'],
}

// Subgrupos opcionales
const SUBGROUPS = ['A', 'B']

export function TeamForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null)
  
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [teamType, setTeamType] = useState<'general' | 'subgroup'>('general')
  const [selectedSubgroup, setSelectedSubgroup] = useState('')

  useEffect(() => {
    const handleLoadData = () => {
      const stored = localStorage.getItem('editingTeam')
      if (stored) {
        const team = JSON.parse(stored)
        setEditingTeam(team)
        
        if (team.section) {
          const [grade, section] = team.section.split('-')
          setSelectedGrade(grade || '')
          setSelectedSection(section || '')
        }
        
        if (team.subgroup) {
          setTeamType('subgroup')
          setSelectedSubgroup(team.subgroup)
        } else {
          setTeamType('general')
        }
      }
    }

    window.addEventListener('loadTeamData', handleLoadData)
    handleLoadData()

    return () => {
      window.removeEventListener('loadTeamData', handleLoadData)
    }
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const section = `${selectedGrade}-${selectedSection}`
      const subgroup = teamType === 'subgroup' ? selectedSubgroup : null
      
      const newFormData = new FormData()
      newFormData.set('name', section)
      newFormData.set('section', section)
      newFormData.set('subgroup', subgroup || '')

      const result = editingTeam
        ? await updateTeamAction(editingTeam.id, newFormData)
        : await createTeamAction(newFormData)

      if (result.success) {
        setSuccess(result.message || 'Operación exitosa')
        localStorage.removeItem('editingTeam')
        setEditingTeam(null)
        setSelectedGrade('')
        setSelectedSection('')
        setTeamType('general')
        setSelectedSubgroup('')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setError(result.error || 'Ocurrió un error')
      }
    } catch (err) {
      setError('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    localStorage.removeItem('editingTeam')
    setEditingTeam(null)
    setSelectedGrade('')
    setSelectedSection('')
    setTeamType('general')
    setSelectedSubgroup('')
    setError('')
    setSuccess('')
  }

  const isEditing = !!editingTeam

  const getDisplayName = () => {
    if (!selectedGrade || !selectedSection) return ''
    const base = `${selectedGrade}-${selectedSection}`
    return teamType === 'subgroup' && selectedSubgroup 
      ? `${base} ${selectedSubgroup}` 
      : base
  }

  return (
    <AnimatedCard 
      className="w-full overflow-hidden"
      animation="slide-up"
      delay={0.2}
    >

      <form action={handleSubmit} className="p-6 space-y-6">
        
        {/* Tipo de equipo */}
        <div className="space-y-3">
          <Label className="font-heading text-label-caps text-on-surface-variant flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">📋</span>
            Tipo de Equipo
          </Label>
          <RadioGroup 
            value={teamType} 
            onValueChange={(v) => setTeamType(v as 'general' | 'subgroup')}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <div className="relative">
              <RadioGroupItem 
                value="general" 
                id="general"
                className="peer sr-only"
              />
              <Label 
                htmlFor="general" 
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-outline-variant/30 bg-surface-container-low cursor-pointer transition-all duration-200 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-soft"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-xl peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white transition-colors">
                  📋
                </div>
                <div>
                  <p className="font-heading text-body-md text-on-surface font-semibold">General</p>
                  <p className="font-body text-body-sm text-on-surface-variant">Toda la sección</p>
                </div>
              </Label>
            </div>
            
            <div className="relative">
              <RadioGroupItem 
                value="subgroup" 
                id="subgroup"
                className="peer sr-only"
              />
              <Label 
                htmlFor="subgroup" 
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-outline-variant/30 bg-surface-container-low cursor-pointer transition-all duration-200 peer-data-[state=checked]:border-secondary-container peer-data-[state=checked]:bg-secondary-container/5 peer-data-[state=checked]:shadow-soft"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-xl peer-data-[state=checked]:bg-secondary-container peer-data-[state=checked]:text-white transition-colors">
                  🔤
                </div>
                <div>
                  <p className="font-heading text-body-md text-on-surface font-semibold">Con Subgrupo</p>
                  <p className="font-body text-body-sm text-on-surface-variant">División A - B</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Grado y Sección - Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Grado */}
          <div className="space-y-2">
            <Label htmlFor="grade" className="font-heading text-label-caps text-on-surface-variant">
              Grado *
            </Label>
            <Select 
              value={selectedGrade} 
              onValueChange={setSelectedGrade}
              required
            >
              <SelectTrigger className="h-12 rounded-xl border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Seleccionar grado" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}° Año
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sección */}
          <div className="space-y-2">
            <Label htmlFor="section" className="font-heading text-label-caps text-on-surface-variant">
              Sección *
            </Label>
            <Select 
              value={selectedSection} 
              onValueChange={setSelectedSection}
              disabled={!selectedGrade}
              required
            >
              <SelectTrigger className="h-12 rounded-xl border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface-container disabled:text-on-surface-variant">
                <SelectValue placeholder={selectedGrade ? "Seleccionar sección" : "Primero selecciona un grado"} />
              </SelectTrigger>
              <SelectContent>
                {selectedGrade && SECTIONS_PER_GRADE[selectedGrade]?.map((section) => (
                  <SelectItem key={section} value={section}>
                    Sección {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subgrupo (solo si es tipo subgrupo) */}
        {teamType === 'subgroup' && (
          <div className="space-y-2 animate-slide-up">
            <Label htmlFor="subgroup" className="font-heading text-label-caps text-on-surface-variant">
              Subgrupo *
            </Label>
            <Select 
              value={selectedSubgroup} 
              onValueChange={setSelectedSubgroup}
              required
            >
              <SelectTrigger className="h-12 rounded-xl border-outline-variant/50 focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20">
                <SelectValue placeholder="Seleccionar subgrupo" />
              </SelectTrigger>
              <SelectContent>
                {SUBGROUPS.map((subgroup) => (
                  <SelectItem key={subgroup} value={subgroup}>
                    Subgrupo {subgroup}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getDisplayName() && (
              <p className="text-xs text-on-surface-variant font-body">
                Ejemplo: <span className="font-semibold text-primary">{getDisplayName()}</span>
              </p>
            )}
          </div>
        )}

        {/* Nombre completo (preview) */}
        {getDisplayName() && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary-container/5 border border-primary/20 animate-scale-in">
            <Label className="font-heading text-label-caps text-on-surface-variant mb-2 block">
              Nombre del Equipo
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary text-white text-xl shadow-glow">
                👥
              </div>
              <p className="font-heading text-headline-md text-on-surface">
                {getDisplayName()}
              </p>
            </div>
          </div>
        )}

        {/* Mensajes de Error/Éxito */}
        {error && (
          <div 
            className="p-4 rounded-xl bg-error-container/20 border border-error/30 animate-slide-up"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span className="text-error text-lg">⚠️</span>
              <p className="font-body text-body-md text-error font-medium">
                {error}
              </p>
            </div>
          </div>
        )}
        
        {success && (
          <div 
            className="p-4 rounded-xl bg-primary/10 border border-primary/30 animate-slide-up"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span className="text-primary text-lg">✅</span>
              <p className="font-body text-body-md text-primary font-medium">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-outline-variant/20">
          {isEditing && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-heading text-label-caps border-2 border-outline-variant/50 hover:border-primary hover:bg-primary/5 transition-all duration-200"
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading || !selectedGrade || !selectedSection}
            className={`
              flex-1 h-12 rounded-full font-heading text-label-caps text-white
              bg-gradient-primary hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
              flex items-center justify-center gap-2
            `}
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isEditing ? 'Actualizando...' : 'Guardando...'}</span>
              </>
            ) : (
              <>
                <span>{isEditing ? '✏️' : '✅'}</span>
                <span>{isEditing ? 'Actualizar Equipo' : 'Crear Equipo'}</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-secondary-container/5 blur-2xl" />
    </AnimatedCard>
  )
}