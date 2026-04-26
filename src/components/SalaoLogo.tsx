export default function SalaoLogo({ url, nome }: { url?: string | null; nome?: string | null }) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt={nome ?? "Logo"}
      style={{ height: 32, maxWidth: 100, objectFit: "contain" }}
    />
  );
}
