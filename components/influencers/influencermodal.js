
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

const initialFormState = {
  nome: '',
  instagram: '',
  tiktok: '',
  seguidoresIG: 0,
  seguidoresTT: 0,
  engajamentoIG: 0,
  engajamentoTT: 0,
  whatsapp: '',
  email: '',
  nicho: '',
  status: 'prospeccao',
  tipoParceria: 'visualizacoes',
  valor: 0,
  ultimaPostagem: '',
  observacoes: '',
  conversoes: 0,
  postsIG: 0,
  postsTT: 0,
  premium: false
};

export default function InfluencerModal({ influencer, onSave, onClose }) {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (influencer) {
      setFormData({
        ...initialFormState, // Ensure all fields are present with default values first
        ...influencer,
        ultimaPostagem: influencer.ultimaPostagem ? influencer.ultimaPostagem.split('T')[0] : ''
      });
    } else {
      setFormData(initialFormState); // Reset to initial state when creating a new influencer
    }
  }, [influencer]);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800/95 backdrop-blur-xl border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {influencer ? 'Editar Influenciador' : 'Novo Influenciador'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-slate-300">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nicho" className="text-slate-300">Nicho</Label>
              <Input
                id="nicho"
                value={formData.nicho}
                onChange={(e) => handleInputChange('nicho', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-slate-300">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="@usuario"
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok" className="text-slate-300">TikTok</Label>
              <Input
                id="tiktok"
                value={formData.tiktok}
                onChange={(e) => handleInputChange('tiktok', e.target.value)}
                placeholder="@usuario"
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Seguidores e Engajamento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seguidoresIG" className="text-slate-300">Seguidores IG</Label>
              <Input
                id="seguidoresIG"
                type="number"
                value={formData.seguidoresIG}
                onChange={(e) => handleInputChange('seguidoresIG', parseInt(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engajamentoIG" className="text-slate-300">Engajamento IG (%)</Label>
              <Input
                id="engajamentoIG"
                type="number"
                step="0.1"
                value={formData.engajamentoIG}
                onChange={(e) => handleInputChange('engajamentoIG', parseFloat(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seguidoresTT" className="text-slate-300">Seguidores TT</Label>
              <Input
                id="seguidoresTT"
                type="number"
                value={formData.seguidoresTT}
                onChange={(e) => handleInputChange('seguidoresTT', parseInt(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engajamentoTT" className="text-slate-300">Engajamento TT (%)</Label>
              <Input
                id="engajamentoTT"
                type="number"
                step="0.1"
                value={formData.engajamentoTT}
                onChange={(e) => handleInputChange('engajamentoTT', parseFloat(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-slate-300">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Status e Parceria */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="prospeccao">Prospecção</SelectItem>
                  <SelectItem value="nao-fechou">Não Fechou</SelectItem>
                  <SelectItem value="negociacao">Negociação</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoParceria" className="text-slate-300">Tipo de Parceria</Label>
              <Select value={formData.tipoParceria} onValueChange={(value) => handleInputChange('tipoParceria', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="visualizacoes">Visualizações</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="afiliacao">Afiliação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-slate-300">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', parseFloat(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Premium e Última Postagem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="premium"
                checked={formData.premium}
                onCheckedChange={(checked) => handleInputChange('premium', checked)}
              />
              <Label htmlFor="premium" className="text-slate-300">Influenciador Premium</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ultimaPostagem" className="text-slate-300">Última Postagem</Label>
              <Input
                id="ultimaPostagem"
                type="date"
                value={formData.ultimaPostagem}
                onChange={(e) => handleInputChange('ultimaPostagem', e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-slate-300">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={3}
              className="bg-slate-900/50 border-slate-600 text-slate-200"
            />
          </div>

          {/* Botões */}
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
              {influencer ? 'Atualizar' : 'Criar'} Influenciador
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
