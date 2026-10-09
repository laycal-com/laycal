'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { UpgradeModal } from './UpgradeModal';
import { SpeedToLeadWizard, type SpeedToLeadResult } from './SpeedToLeadWizard';
import { SPEED_TO_LEAD_SUMMARY_PROMPT } from '@/lib/speedToLead/tools';


interface AssistantFormProps {
  assistant?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

// Vapi's own voices lead the list — they are the lowest-latency option on a
// phone call, which is what speed-to-lead is optimised for.
const VOICE_OPTIONS = {
  female: [
    { id: 'Paige', name: 'Paige (recommended)', provider: 'vapi' },
    { id: 'Hana', name: 'Hana', provider: 'vapi' },
    { id: 'alloy', name: 'Alloy', provider: 'openai' },
    { id: 'nova', name: 'Nova', provider: 'openai' },
    { id: 'shimmer', name: 'Shimmer', provider: 'openai' },
  ],
  male: [
    { id: 'Elliot', name: 'Elliot (recommended)', provider: 'vapi' },
    { id: 'Rohan', name: 'Rohan', provider: 'vapi' },
    { id: 'onyx', name: 'Onyx', provider: 'openai' },
    { id: 'fable', name: 'Fable', provider: 'openai' },
    { id: 'echo', name: 'Echo', provider: 'openai' },
  ]
};

const LANGUAGE_OPTIONS = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Spanish (ES)' },
  { code: 'fr-FR', name: 'French (FR)' },
  { code: 'de-DE', name: 'German (DE)' },
];

export function AssistantForm({ assistant, onSuccess, onCancel }: AssistantFormProps) {
  const { user, isLoaded } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    voice: {
      gender: 'male' as 'male' | 'female',
      provider: 'vapi',
      voiceId: 'Elliot'
    },
    mainPrompt: '',
    language: 'en-US',
    firstMessage: 'Hi, is this {{customer.name}}?',
    summary: '',
    structuredData: '',
    serviceConfig: undefined as SpeedToLeadResult['serviceConfig'] | undefined
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWizard, setShowWizard] = useState(!assistant); // Show wizard for new assistants

  useEffect(() => {
    // Pre-populate form if editing
    if (assistant) {
      setFormData({
        name: assistant.name,
        voice: assistant.voice,
        mainPrompt: assistant.mainPrompt,
        language: assistant.language,
        firstMessage: assistant.firstMessage || 'Hi, is this {{customer.name}}?',
        summary: assistant.summary || '',
        structuredData: assistant.structuredData || '',
        serviceConfig: (assistant as any).serviceConfig
      });
    }
  }, [assistant]);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Assistant name is required';
    }

    if (!formData.mainPrompt.trim()) {
      newErrors.mainPrompt = 'Main prompt is required';
    } else if (formData.mainPrompt.length > 10000) {
      newErrors.mainPrompt = 'Main prompt must be less than 10000 characters';
    }

    // Phone numbers are optional for assistant creation
    // They can be associated later when making calls

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWizardComplete = (result: SpeedToLeadResult) => {
    setFormData(prev => ({
      ...prev,
      // Only name the assistant from the wizard if the user hasn't typed one.
      name: prev.name.trim() || result.suggestedName,
      mainPrompt: result.mainPrompt,
      firstMessage: result.firstMessage,
      // Summary and extraction are templated, not model-authored, so reporting
      // can rely on stable field names across every assistant.
      summary: SPEED_TO_LEAD_SUMMARY_PROMPT,
      structuredData: 'Extract the speed-to-lead service call fields from this conversation.',
      serviceConfig: result.serviceConfig
    }));
    setShowWizard(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const method = assistant ? 'PUT' : 'POST';
      const url = assistant ? `/api/assistants/${assistant._id}` : '/api/assistants';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle upgrade required error
        if (error.upgradeRequired) {
          toast.error(error.error);
          setShowUpgradeModal(true);
          return;
        }
        
        throw new Error(error.details || `Failed to ${assistant ? 'update' : 'create'} assistant`);
      }

      toast.success(`Assistant ${assistant ? 'updated' : 'created'} successfully!`);
      onSuccess();
    } catch (error) {
      console.error('Error saving assistant:', error);
      
      // Show more detailed error message
      let errorMessage = 'Failed to save assistant';
      if (error instanceof Error) {
        if (error.message.includes('Phone provider')) {
          errorMessage = 'Please configure phone providers in Settings first';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Please sign in to create assistants';
        } else if (error.message.includes('Vapi')) {
          errorMessage = 'Failed to create AI assistant: ' + error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const getAvailableVoices = () => {
    return VOICE_OPTIONS[formData.voice.gender] || [];
  };

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">Please sign in to create assistants.</p>
            <Button onClick={onCancel} className="bg-primary hover:bg-primary/90 text-white">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show wizard for new assistants
  if (showWizard) {
    return (
      <SpeedToLeadWizard
        onComplete={handleWizardComplete}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {assistant ? 'Edit Assistant' : 'Create New Assistant'}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="bg-card border-input text-muted-foreground hover:bg-accent border border-border"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Assistant Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Sales Assistant"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Voice Gender *</Label>
              <Select 
                value={formData.voice.gender} 
                onValueChange={(value) => {
                  const newGender = value as 'male' | 'female';
                  const defaultVoice = VOICE_OPTIONS[newGender][0];
                  setFormData(prev => ({
                    ...prev,
                    voice: {
                      ...prev.voice,
                      gender: newGender,
                      voiceId: defaultVoice.id,
                      provider: defaultVoice.provider
                    }
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="voice">Voice Type *</Label>
              <Select 
                value={formData.voice.voiceId}
                onValueChange={(value) => {
                  const voice = getAvailableVoices().find(v => v.id === value);
                  if (voice) {
                    setFormData(prev => ({
                      ...prev,
                      voice: {
                        ...prev.voice,
                        voiceId: value,
                        provider: voice.provider
                      }
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableVoices().map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="language">Language *</Label>
            <Select 
              value={formData.language}
              onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="firstMessage">First Message</Label>
            <Input
              id="firstMessage"
              value={formData.firstMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, firstMessage: e.target.value }))}
              placeholder="Hello! How can I help you today?"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="mainPrompt">Main Prompt *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowWizard(true)}
                className="bg-primary/10 border-primary/30 text-brand-soft hover:bg-primary/15"
              >
                🪄 Use Prompt Wizard
              </Button>
            </div>
            <Textarea
              id="mainPrompt"
              value={formData.mainPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, mainPrompt: e.target.value }))}
              placeholder="Click 'Use Prompt Wizard' to generate a professional prompt, or write your own..."
              className={`min-h-[120px] ${errors.mainPrompt ? 'border-red-500' : ''}`}
              maxLength={10000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.mainPrompt && <p className="text-sm text-red-500">{errors.mainPrompt}</p>}
              <span className="text-xs text-muted-foreground ml-auto">
                {formData.mainPrompt.length}/10000
              </span>
            </div>
          </div>


          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1 bg-card border-input text-muted-foreground hover:bg-accent border border-border"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white disabled:bg-muted disabled:text-muted-foreground"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {assistant ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                assistant ? 'Update Assistant' : 'Create Assistant'
              )}
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}