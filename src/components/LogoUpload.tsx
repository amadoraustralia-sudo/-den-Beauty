"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  salaoId: string;
  currentUrl?: string | null;
}

export default function LogoUpload({ salaoId, currentUrl }: Props) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErro("");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${salaoId}/logo.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { setErro("Erro ao enviar imagem."); setUploading(false); return; }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    setUrl(data.publicUrl + "?t=" + Date.now());
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      {url && <img src={url} alt="Logo" style={{ height: 56, maxWidth: 120, objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)" }} />}
      <div>
        <label className="btn btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem", cursor: "pointer" }}>
          {uploading ? "Enviando..." : url ? "Alterar logo" : "Adicionar logo"}
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
        </label>
        {erro && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{erro}</p>}
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PNG, JPG ou SVG · recomendado 200×80px</p>
      </div>
      <input type="hidden" name="logo_url" value={url} />
    </div>
  );
}
