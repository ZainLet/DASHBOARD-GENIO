import React, { useState } from "react";
import { AssistantConfig, AssistantProgress, AssistantLog } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, Edit, Save, X, BarChart, Target, CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoutineTab({ config, progress, user, loading, onRefresh }) {
  const [editMode, setEditMode] = useState(false);
  const [editedConfig, setEditedConfig] = useState(null);
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (config) {
      setEditedConfig(config);
    }
    if (progress) {
      setNotes(progress.notas || "");
    }
  }, [config, progress]);

  const handleSaveConfig = async () => {
    if (!editedConfig) return;
    
    try {
      if (config?.id) {
        await AssistantConfig.update(config.id, editedConfig);
      } else {
        await AssistantConfig.create(editedConfig);
      }
      setEditMode(false);
      onRefresh();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
    }
  };

  const handleMetaChange = async (metaKey, increment) => {
    if (!progress) return;

    try {
      const currentValue = progress.metas?.[metaKey] || 0;
      const newValue = Math.max(0, currentValue + increment);
      
      const updatedProgress = {
        ...progress,
        metas: {
          ...progress.metas,
          [metaKey]: newValue
        },
        data: new Date().toISOString().split('T')[0]
      };

      if (progress.id) {
        await AssistantProgress.update(progress.id, updatedProgress);
      } else {
        await AssistantProgress.create(updatedProgress);
      }

      // Log da ação
      await AssistantLog.create({
        eventType: increment > 0 ? 'meta_incrementada' : 'meta_decrementada',
        details: `Meta ${metaKey} ${increment > 0 ? 'incrementada' : 'decrementada'} para ${newValue}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'unknown',
        userEmail: user?.email || 'unknown'
      });

      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
    }
  };

  const handleTaskToggle = async (taskId, checked) => {
    if (!progress) return;

    try {
      const updatedProgress = {
        ...progress,
        checklist: {
          ...progress.checklist,
          [taskId]: checked
        },
        data: new Date().toISOString().split('T')[0]
      };

      if (progress.id) {
        await AssistantProgress.update(progress.id, updatedProgress);
      } else {
        await AssistantProgress.create(updatedProgress);
      }

      // Log da ação
      await AssistantLog.create({
        eventType: checked ? 'tarefa_concluida' : 'tarefa_desfeita',
        details: `Tarefa ${taskId} ${checked ? 'concluída' : 'desmarcada'}`,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'unknown',
        userEmail: user?.email || 'unknown'
      });

      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

  const handleNotesUpdate = async () => {
    if (!progress) return;

    try {
      const updatedProgress = {
        ...progress,
        notas: notes,
        data: new Date().toISOString().split('T')[0]
      };

      if (progress.id) {
        await AssistantProgress.update(progress.id, updatedProgress);
      } else {
        await AssistantProgress.create(updatedProgress);
      }

      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar notas:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 bg-slate-700 mb-2" />
                <Skeleton className="h-8 w-16 bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metaConfig = config?.metaConfig || {};
  const progressMetas = progress?.metas || {};
  const checklist = progress?.checklist || {};
  const rotina = config?.rotina || [];

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-200">Dashboard de Produtividade</h2>
          <p className="text-slate-400">Acompanhe suas metas e rotina diária</p>
        </div>
        
        {user?.role === 'admin' && (
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button
                  onClick={handleSaveConfig}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setEditedConfig(config);
                  }}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-700/50 text-slate-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditMode(true)}
                variant="outline"
                className="border-slate-600 hover:bg-slate-700/50 text-slate-300"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Metas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.keys(metaConfig).map((metaKey, index) => {
          const meta = metaConfig[metaKey] || {};
          const currentValue = progressMetas[metaKey] || 0;
          const target = meta.alvo || 0;
          const percentage = target > 0 ? Math.min((currentValue / target) * 100, 100) : 0;
          
          const gradients = [
            'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
            'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
            'from-purple-500/20 to-pink-500/20 border-purple-500/30'
          ];

          return (
            <Card 
              key={metaKey} 
              className={`bg-gradient-to-br ${gradients[index]} backdrop-blur-xl border`}
            >
              <CardHeader>
                {editMode ? (
                  <div className="space-y-2">
                    <Input
                      value={editedConfig?.metaConfig?.[metaKey]?.titulo || ''}
                      onChange={(e) => setEditedConfig(prev => ({
                        ...prev,
                        metaConfig: {
                          ...prev.metaConfig,
                          [metaKey]: {
                            ...prev.metaConfig[metaKey],
                            titulo: e.target.value
                          }
                        }
                      }))}
                      className="bg-slate-900/50 border-slate-600 text-slate-200"
                    />
                    <Input
                      value={editedConfig?.metaConfig?.[metaKey]?.subtitulo || ''}
                      onChange={(e) => setEditedConfig(prev => ({
                        ...prev,
                        metaConfig: {
                          ...prev.metaConfig,
                          [metaKey]: {
                            ...prev.metaConfig[metaKey],
                            subtitulo: e.target.value
                          }
                        }
                      }))}
                      className="bg-slate-900/50 border-slate-600 text-slate-200"
                    />
                    <Input
                      type="number"
                      value={editedConfig?.metaConfig?.[metaKey]?.alvo || 0}
                      onChange={(e) => setEditedConfig(prev => ({
                        ...prev,
                        metaConfig: {
                          ...prev.metaConfig,
                          [metaKey]: {
                            ...prev.metaConfig[metaKey],
                            alvo: parseInt(e.target.value) || 0
                          }
                        }
                      }))}
                      className="bg-slate-900/50 border-slate-600 text-slate-200"
                    />
                  </div>
                ) : (
                  <div>
                    <CardTitle className="text-lg text-slate-200">{meta.titulo}</CardTitle>
                    <p className="text-sm text-slate-400">{meta.subtitulo}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-slate-200">
                    {currentValue}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Meta: {target}</div>
                    <div className="text-xs text-slate-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMetaChange(metaKey, -1)}
                    disabled={currentValue <= 0}
                    className="border-slate-600 hover:bg-slate-700/50 text-slate-300"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleMetaChange(metaKey, 1)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Incrementar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rotina e Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Rotina */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <CheckSquare className="w-5 h-5" />
              Rotina Diária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rotina.map((task, index) => (
              <div key={task.id || index} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <Checkbox
                  checked={checklist[task.id] || false}
                  onCheckedChange={(checked) => handleTaskToggle(task.id, checked)}
                />
                {editMode ? (
                  <Input
                    value={task.texto}
                    onChange={(e) => setEditedConfig(prev => ({
                      ...prev,
                      rotina: prev.rotina.map(t => 
                        t.id === task.id ? { ...t, texto: e.target.value } : t
                      )
                    }))}
                    className="bg-slate-900/50 border-slate-600 text-slate-200"
                  />
                ) : (
                  <span className={`flex-1 ${checklist[task.id] ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.texto}
                  </span>
                )}
              </div>
            ))}
            
            {rotina.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma tarefa na rotina</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notas do Dia */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Notas do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesUpdate}
              placeholder="Adicione suas anotações do dia..."
              className="bg-slate-900/50 border-slate-600 text-slate-200 min-h-[200px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}