"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { salvarLogoUrl } from "@/app/(painel)/configuracoes/actions";

interface Props {
  salaoId: string;
  currentUrl?: string | null;
}

export default function LogoUpload({ salaoId, currentUrl }: Props) {
  const [baseUrl, setBaseUrl] = useState(() =>
    currentUrl ? currentUrl.split("?")[0] : ""
  );
  const [cacheBust, setCacheBust] = useState(Date.now());
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState("");

  const imgSrc = baseUrl ? `${baseUrl}?t=${cacheBust}` : "";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErro("");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${salaoId}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setErro("Erro ao enviar imagem.");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const newBaseUrl = data.publicUrl;

    // Salva via Server Action (usa owner_user_id no servidor — sem risco de RLS errado)
    const result = await salvarLogoUrl(newBaseUrl);
    if (result.error) {
      setErro("Upload feito, mas erro ao salvar: " + result.error);
      setUploading(false);
      return;
    }

    setBaseUrl(newBaseUrl);
    setCacheBust(Date.now());
    window.dispatchEvent(
      new CustomEvent("logo-updated", { detail: { url: newBaseUrl } })
    );
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      {imgSrc && (
        <img
          src={imgSrc}
          alt="Logo"
          style={{
            height: 56,
            maxWidth: 120,
            objectFit: "contain",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        />
      )}
      <div>
        <label
          className="btn btn-secondary"
          style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem", cursor: "pointer" }}
        >
          {uploading ? "Enviando..." : baseUrl ? "Alterar logo" : "Adicionar logo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
        {erro && (
          <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
            {erro}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          PNG, JPG ou SVG · recomendado 200×80px
        </p>
      </div>
      <input type="hidden" name="logo_url" value={baseUrl} />
    </div>
  );
}
