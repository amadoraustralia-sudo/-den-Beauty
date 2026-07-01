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
    <div className="space-y-3">
      {/* Preview simulando o sidebar */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: "var(--brand-800)", width: "fit-content", minWidth: 220 }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Logo"
            style={{ height: 56, maxWidth: 170, objectFit: "contain", borderRadius: 4 }}
          />
        ) : (
          <p className="text-xs" style={{ color: "rgb(255 255 255 / 0.4)" }}>Prévia do logo no menu</p>
        )}
      </div>

      <div className="flex items-center gap-3">
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
        {baseUrl && (
          <span className="text-xs" style={{ color: "var(--success, #16a34a)" }}>✓ Logo salvo</span>
        )}
      </div>

      {erro && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>{erro}</p>
      )}
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        PNG, JPG ou SVG com fundo transparente · recomendado 400×120px (horizontal)
      </p>

      <input type="hidden" name="logo_url" value={baseUrl} />
    </div>
  );
}
