import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const initialFormState = {
  titulo: '',
  categoria: 'anotar',
  urlInstagram: '',
  metaInstagram: 0,
  urlTiktok: '',
  metaTiktok: 0,
  urlFacebook: '',
  metaFacebook: 0,
  status: 'ativo',
  comentariosFeitos: 0
};

export default function AdModal({ ad, onSave, onClose }) {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (ad) {
      setFormData({
        ...initialFormState,
        ...ad
      });
    } else {
      setFormData(initialFormState);
    }
  }, [ad]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-800/95 backdrop-blur-xl border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {ad ? 'Editar Anúncio' : 'Novo Anúncio'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo" className="text-slate-300">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                required
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-slate-300">Categoria</Label>
              <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="anotar">Anotar</SelectItem>
                  <SelectItem value="genio-ia">Gênio IA</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-300">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instagram */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urlInstagram" className="text-slate-300">URL Instagram</Label>
              <Input
                id="urlInstagram"
                value={formData.urlInstagram}
                onChange={(e) => handleInputChange('urlInstagram', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
                placeholder="https://instagram.com/p/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaInstagram" className="text-slate-300">Meta Instagram</Label>
              <Input
                id="metaInstagram"
                type="number"
                value={formData.metaInstagram}
                onChange={(e) => handleInputChange('metaInstagram', parseInt(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* TikTok */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urlTiktok" className="text-slate-300">URL TikTok</Label>
              <Input
                id="urlTiktok"
                value={formData.urlTiktok}
                onChange={(e) => handleInputChange('urlTiktok', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
                placeholder="https://tiktok.com/@..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaTiktok" className="text-slate-300">Meta TikTok</Label>
              <Input
                id="metaTiktok"
                type="number"
                value={formData.metaTiktok}
                onChange={(e) => handleInputChange('metaTiktok', parseInt(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Facebook */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urlFacebook" className="text-slate-300">URL Facebook</Label>
              <Input
                id="urlFacebook"
                value={formData.urlFacebook}
                onChange={(e) => handleInputChange('urlFacebook', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaFacebook" className="text-slate-300">Meta Facebook</Label>
              <Input
                id="metaFacebook"
                type="number"
                value={formData.metaFacebook}
                onChange={(e) => handleInputChange('metaFacebook', parseInt(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 hover:bg-slate-700/50 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {ad ? 'Atualizar' : 'Criar'} Anúncio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}