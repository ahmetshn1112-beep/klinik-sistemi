export default function HastaDetayModalPage({ open = false, children }) {
  if (!open) return null;
  return <div className="h-full min-h-0 overflow-hidden">{children}</div>;
}
