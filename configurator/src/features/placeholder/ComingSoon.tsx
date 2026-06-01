export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="max-w-sm text-sm text-muted">
        This section is out of scope for the UI-first milestone (see DESIGN.md → Non-goals).
      </p>
    </div>
  );
}
