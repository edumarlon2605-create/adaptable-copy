export function ClienteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BBC Consórcios. Todos os direitos reservados.
      </div>
    </footer>
  );
}
