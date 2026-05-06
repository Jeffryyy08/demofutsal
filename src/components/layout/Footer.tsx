// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          © 2024 Torneo Futsal Escolar. Todos los derechos reservados.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Desarrollado para el Departamento de Física
        </p>
      </div>
    </footer>
  )
}