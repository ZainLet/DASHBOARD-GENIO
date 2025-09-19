import React, { useState } from "react";
import { FarmComment, FarmProfile } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WorkspaceTab({ profiles, ads, comments, onRefresh, user }) {
  const [selectedAd, setSelectedAd] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const activeAds = ads.filter(ad => ad.status === 'ativo');
  
  const getAvailableProfiles = () => {
    if (!selectedAd) return [];
    
    return profiles.filter(profile => {
      // Perfil deve estar ativo
      if (profile.status !== 'ativo') return false;
      
      // Verifica se não atingiu o limite diário
      if ((profile.comentariosHoje || 0) >= (profile.limiteComentarios || 10)) return false;
      
      // Verifica se já comentou neste anúncio
      const alreadyCommented = comments.some(comment => 
        comment.perfilId === profile.id && 
        comment.anuncioId === selectedAd
      );
      
      return !alreadyCommented;
    });
  };

  const getAvailablePlatforms = () => {
    if (!selectedAd) return [];
    
    const ad = ads.find(a => a.id === selectedAd);
    if (!ad) return [];
    
    const platforms = [];
    if (ad.urlInstagram && (ad.metaInstagram > (ad.comentariosFeitos || 0))) {
      platforms.push({ value: 'instagram', label: 'Instagram', available: true });
    }
    if (ad.urlTiktok && (ad.metaTiktok > (ad.comentariosFeitos || 0))) {
      platforms.push({ value: 'tiktok', label: 'TikTok', available: true });
    }
    if (ad.urlFacebook && (ad.metaFacebook > (ad.comentariosFeitos || 0))) {
      platforms.push({ value: 'facebook', label: 'Facebook', available: true });
    }
    
    return platforms;
  };

  const handleComment = async () => {
    if (!selectedAd || !selectedProfile || !selectedPlatform || !commentText.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Criar o comentário
      await FarmComment.create({
        perfilId: selectedProfile,
        anuncioId: selectedAd,
        texto: commentText,
        plataforma: selectedPlatform,
        data: new Date().toISOString()
      });

      // Atualizar último uso do perfil e contador de comentários
      const profile = profiles.find(p => p.id === selectedProfile);
      if (profile) {
        await FarmProfile.update(selectedProfile, {
          ...profile,
          ultimoUso: new Date().toISOString(),
          comentariosHoje: (profile.comentariosHoje || 0) + 1
        });
      }

      // Resetar formulário
      setSelectedProfile("");
      setSelectedPlatform("");
      setCommentText("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      onRefresh();
    } catch (error) {
      console.error("Erro ao registrar comentário:", error);
    }
    setLoading(false);
  };

  const availableProfiles = getAvailableProfiles();
  const availablePlatforms = getAvailablePlatforms();

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-emerald-400">
            Comentário registrado com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seleção de Anúncio */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-slate-200">1. Selecionar Anúncio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedAd} onValueChange={setSelectedAd}>
              <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
                <SelectValue placeholder="Escolha um anúncio ativo..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {activeAds.map((ad) => (
                  <SelectItem key={ad.id} value={ad.id} className="text-slate-200">
                    <div className="flex flex-col">
                      <span>{ad.titulo}</span>
                      <span className="text-xs text-slate-400">
                        {ad.categoria} • {(ad.comentariosFeitos || 0)} comentários
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeAds.length === 0 && (
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  Nenhum anúncio ativo disponível
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Seleção de Plataforma */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-slate-200">2. Selecionar Plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform} disabled={!selectedAd}>
              <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
                <SelectValue placeholder="Escolha a plataforma..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {availablePlatforms.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value} className="text-slate-200">
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAd && availablePlatforms.length === 0 && (
              <Alert className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  Este anúncio atingiu a meta em todas as plataformas
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seleção de Perfil */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">3. Selecionar Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedProfile} onValueChange={setSelectedProfile} disabled={!selectedAd}>
            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200">
              <SelectValue placeholder="Escolha um perfil disponível..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {availableProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id} className="text-slate-200">
                  <div className="flex items-center justify-between w-full">
                    <span>{profile.username}</span>
                    <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400">
                      {(profile.comentariosHoje || 0)}/{(profile.limiteComentarios || 10)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAd && availableProfiles.length === 0 && (
            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-400">
                Nenhum perfil disponível para este anúncio. Todos já comentaram ou atingiram o limite diário.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Escrever Comentário */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">4. Escrever Comentário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite o comentário aqui..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-slate-200 min-h-[100px]"
            disabled={!selectedProfile}
          />
          
          <Button
            onClick={handleComment}
            disabled={!selectedAd || !selectedProfile || !selectedPlatform || !commentText.trim() || loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            {loading ? (
              "Registrando..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Comentar e Registrar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}