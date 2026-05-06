// src/components/teams/BulkImportPlayers.tsx
'use client'

import { useState } from 'react'
import { createPlayersBulkAction } from '@/actions/players'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { Badge } from '@/components/ui/badge'

interface BulkImportPlayersProps {
    teamId: string
    teamSection: string
    onPlayersAdded: (count: number) => void
}

export function BulkImportPlayers({ teamId, teamSection, onPlayersAdded }: BulkImportPlayersProps) {
    const [loading, setLoading] = useState(false)
    const [textData, setTextData] = useState('')
    const [preview, setPreview] = useState<string[]>([])
    const [success, setSuccess] = useState<{ count: number } | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Parsear nombres para preview en tiempo real
    const parseNames = (text: string) => {
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && line.length > 2)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setTextData(value)
        setPreview(parseNames(value))
        setSuccess(null)
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        const playersData = parseNames(textData).map(fullName => ({
            team_id: teamId,
            full_name: fullName,
            section: teamSection,
        }))

        if (playersData.length === 0) {
            setError('⚠️ No hay jugadores válidos para importar')
            setLoading(false)
            return
        }

        const result = await createPlayersBulkAction(playersData)

        if (result.success) {
            setSuccess({ count: result.count || 0 })
            setTextData('')
            setPreview([])
            onPlayersAdded(result.count || 0)
        } else {
            setError(`❌ Error: ${result.error}`)
        }

        setLoading(false)
    }

    return (
        <AnimatedCard className="w-full" animation="slide-up" delay={0.4}>
            {/* Header con Gradiente */}
            <div 
                className="p-6 text-white relative overflow-hidden rounded-t-lg"
                style={{
                    background: 'linear-gradient(135deg, #003ec7 0%, #0052ff 100%)',
                }}
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-xl">
                        📄
                    </div>
                    <div className="flex-1">
                        <h3 className="font-heading text-headline-md text-white mb-1">
                            Importar Lista de Jugadores
                        </h3>
                        <p className="font-body text-body-md text-blue-100 flex items-center gap-2">
                            Sección: <Badge className="bg-white/20 text-white font-heading text-label-caps text-xs px-2 py-0.5">{teamSection}</Badge>
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* Textarea para lista de nombres */}
                <div className="space-y-2">
                    <Label 
                        htmlFor="players_list" 
                        className="font-heading text-label-caps text-on-surface-variant flex items-center gap-2"
                    >
                        <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">📋</span>
                        Lista de Nombres *
                    </Label>
                    
                    <textarea
                        id="players_list"
                        value={textData}
                        onChange={handleTextChange}
                        placeholder={`Ejemplo:
Juan Pérez García
María González López
Carlos Eduardo Martínez
Ana Sofía Rodríguez
...`}
                        rows={10}
                        required
                        disabled={loading}
                        className="
                            w-full min-h-[200px] p-4 rounded-xl 
                            border border-outline-variant/50 
                            bg-surface-container-lowest
                            font-body text-body-md text-on-surface
                            placeholder:text-on-surface-variant/50
                            focus:border-primary focus:ring-2 focus:ring-primary/20 
                            transition-all duration-200
                            disabled:bg-surface-container disabled:text-on-surface-variant
                            resize-y
                        "
                    />
                    
                    <div className="flex items-center justify-between text-xs font-body">
                        <span className="text-on-surface-variant">
                            Un nombre por línea • Sección: <strong className="text-on-surface">{teamSection}</strong>
                        </span>
                        {preview.length > 0 && (
                            <Badge className="bg-primary/10 text-primary font-heading text-label-caps">
                                {preview.length} jugadores detectados
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Preview de nombres detectados */}
                {preview.length > 0 && preview.length <= 10 && (
                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 animate-slide-up">
                        <p className="font-heading text-label-caps text-on-surface-variant mb-3">
                            👀 Vista previa:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {preview.slice(0, 10).map((name, index) => (
                                <Badge 
                                    key={index}
                                    className="bg-surface-container-high text-on-surface font-body text-body-sm px-3 py-1"
                                >
                                    {name}
                                </Badge>
                            ))}
                            {preview.length > 10 && (
                                <Badge variant="outline" className="font-body text-body-sm">
                                    +{preview.length - 10} más
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Mensaje de Éxito */}
                {success && (
                    <div 
                        className="p-4 rounded-xl bg-primary/10 border border-primary/30 animate-slide-up"
                        role="alert"
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-primary text-lg">✅</span>
                            <p className="font-body text-body-md text-primary font-medium">
                                ¡<strong>{success.count}</strong> jugadores importados exitosamente!
                            </p>
                        </div>
                    </div>
                )}

                {/* Mensaje de Error */}
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

                {/* Botón de Submit */}
                <div className="pt-4 border-t border-outline-variant/20">
                    <Button 
                        type="submit" 
                        disabled={loading || preview.length === 0}
                        className={`
                            w-full h-14 rounded-full font-heading text-label-caps text-white
                            bg-gradient-primary hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]
                            transition-all duration-300 
                            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
                            flex items-center justify-center gap-2
                        `}
                    >
                        {loading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Importando {preview.length} jugadores...</span>
                            </>
                        ) : (
                            <>
                                <span>📥</span>
                                <span>Importar {preview.length > 0 ? `(${preview.length})` : ''} Jugadores</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Tips de ayuda */}
                <div className="pt-4">
                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/20">
                        <p className="font-heading text-label-caps text-on-surface-variant mb-2">
                            💡 Consejos para importar:
                        </p>
                        <ul className="font-body text-body-sm text-on-surface-variant space-y-1 list-disc list-inside">
                            <li>Un nombre completo por línea</li>
                            <li>Evita números o códigos en los nombres</li>
                            <li>La sección <strong className="text-on-surface">{teamSection}</strong> se asignará automáticamente</li>
                            <li>Puedes copiar y pegar desde Excel o Google Sheets</li>
                        </ul>
                    </div>
                </div>
            </form>

            {/* Decorative Elements */}
            <div className="pointer-events-none absolute -top-5 -right-5 w-20 h-20 rounded-full bg-primary/5 blur-xl" />
            <div className="pointer-events-none absolute -bottom-5 -left-5 w-20 h-20 rounded-full bg-secondary-container/5 blur-xl" />
        </AnimatedCard>
    )
}