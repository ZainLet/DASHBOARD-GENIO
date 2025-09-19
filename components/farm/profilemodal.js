import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const initialFormState = {
  username: '',
  email: '',
  senha: '',
  status: 'ativo',
  seguidores: 0,
  limiteComentarios: 10
};

export default function ProfileModal({ profile, onSave, onClose }) {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (profile) {
      setFormData({
        ...initialFormState,
        ...profile
      });
    } else {
      setFormData(initialFormState);
    }
  }, [profile]);

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
      <DialogContent className="max-w-md bg-slate-800/95 backdrop-blur-xl border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {profile ? 'Editar Perfil' : 'Novo Perfil'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-300">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              required
              className="bg-slate-900/50 border-slate-600 text-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email ADS Power *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="bg-slate-900/50 border-slate-600 text-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-slate-300">Senha *</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => handleInputChange('senha', e.target.value)}
              required
              className="bg-slate-900/50 border-slate-600 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="banido">Banido</SelectItem>
                  <SelectItem value="verificando">Verificando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seguidores" className="text-slate-300">Seguidores</Label>
              <Input
                id="seguidores"
                type="number"
                value={formData.seguidores}
                onChange={(e) => handleInputChange('seguidores', parseInt(e.target.value) || 0)}
                className="bg-slate-900/50 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limiteComentarios" className="text-slate-300">Limite de Comentários/Dia</Label>
            <Input
              id="limiteComentarios"
              type="number"
              value={formData.limiteComentarios}
              onChange={(e) => handleInputChange('limiteComentarios', parseInt(e.target.value) || 10)}
              className="bg-slate-900/50 border-slate-600 text-slate-200"
            />
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
              {profile ? 'Atualizar' : 'Criar'} Perfil
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}