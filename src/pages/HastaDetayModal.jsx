export default function HastaDetayModalPage({ open = false, children }) {
  if (!open) return null;
  return <>{children}</>;
}
