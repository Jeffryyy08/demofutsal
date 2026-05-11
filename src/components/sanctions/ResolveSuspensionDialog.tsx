// src/components/sanctions/ResolveSuspensionDialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ResolveSuspensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolve: () => void
  playerName: string
  loading: boolean
}

export function ResolveSuspensionDialog({
  open,
  onOpenChange,
  onResolve,
  playerName,
  loading
}: ResolveSuspensionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-0 shadow-large bg-surface-container-lowest max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-4">
            ✅
          </div>
          <DialogTitle className="font-heading text-headline-md text-on-surface">
            Resolver Suspensión
          </DialogTitle>
          <DialogDescription className="font-body text-body-md text-on-surface-variant pt-2">
            ¿Estás seguro de resolver la suspensión de{' '}
            <span className="font-semibold text-on-surface">{playerName}</span>?
            <br /><br />
            <span className="font-heading text-label-caps text-primary">
              El jugador podrá jugar en el próximo partido.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-outline-variant/20">
          <Button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            variant="outline"
            className="w-full sm:w-auto rounded-full font-heading text-label-caps border-2 border-outline-variant/50 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={onResolve}
            disabled={loading}
            className="w-full sm:w-auto rounded-full font-heading text-label-caps bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              '✅ Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}