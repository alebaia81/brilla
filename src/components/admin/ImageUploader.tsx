import React, { useState, useRef } from 'react';
import { compressAndConvertToAvif, type CompressionResult } from '../../lib/image-utils';
import { supabase } from '../../lib/supabase';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
}

export default function ImageUploader({ currentImageUrl, onImageUploaded }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setCompressing(true);

    try {
      // 1. Compressione e conversione client-side in AVIF
      const result = await compressAndConvertToAvif(file, 1000, 1000, 0.82);
      setCompressionInfo(result);

      // Crea preview locale temporanea
      const localPreviewUrl = URL.createObjectURL(result.blob);
      setPreview(localPreviewUrl);

      // 2. Upload su Supabase Storage bucket 'product-images'
      setCompressing(false);
      setUploading(true);

      const filePath = `products/${result.filename}`;
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, result.blob, {
          contentType: result.format,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // 3. Ottieni Public URL
      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const finalUrl = publicData.publicUrl;
      onImageUploaded(finalUrl);
    } catch (err: any) {
      console.error('Errore durante upload/compressione immagine:', err);
      // Se fallisce l'upload su Supabase (es. Storage non configurato in test), usiamo la preview locale
      setError('Caricamento su Supabase Storage fallito. Verifica la policy del bucket.');
      if (preview) {
        onImageUploaded(preview);
      }
    } finally {
      setCompressing(false);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
        Foto Prodotto (Compressione AVIF Automatica)
      </label>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        
        {/* Box Preview */}
        <div className="w-24 h-24 rounded-2xl bg-brand-cream border-2 border-dashed border-brand-dark/20 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
          {preview ? (
            <img src={preview} alt="Anteprima prodotto" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-brand-dark/30" />
          )}

          {(compressing || uploading) && (
            <div className="absolute inset-0 bg-brand-dark/60 flex items-center justify-center text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </div>

        {/* Pulsante Upload & Info */}
        <div className="flex-1 space-y-1.5 text-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, image/avif"
            className="hidden"
          />

          <button
            type="button"
            disabled={compressing || uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-brand-dark hover:bg-brand-amber text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-2xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{preview ? 'Sostituisci Immagine' : 'Carica Immagine'}</span>
          </button>

          <p className="text-[10px] text-brand-dark/50 leading-tight">
            Verrà ridimensionata e compressa in formato <strong>AVIF</strong> lato client prima dell'upload per la massima velocità.
          </p>

          {compressionInfo && (
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Convertita in {compressionInfo.format.toUpperCase()} (-{compressionInfo.compressionRatio}% di peso)
              </span>
            </div>
          )}

          {error && (
            <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
