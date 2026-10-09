"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, Bot, CheckCircle2, Info, Loader2, Phone, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DARK_OVERLAY } from '@/components/portal/page';
import { cn } from '@/lib/utils';

interface UploadResult {
  success: boolean;
  message?: string;
  data?: {
    totalProcessed: number;
    validLeads: number;
    savedLeads: number;
    csvErrors: string[];
    callErrors: Array<{ leadName: string; error: string; }>;
  };
  error?: string;
  details?: string;
}

interface Assistant {
  _id: string;
  name: string;
  assistantId: string;
  voice: {
    gender: 'male' | 'female';
    provider: string;
    voiceId: string;
  };
  language: string;
  phoneNumbers: Array<{
    phoneNumber: string;
    phoneProviderId: {
      _id: string;
      displayName: string;
      phoneNumber: string;
    };
    isPrimary: boolean;
  }>;
  isActive: boolean;
}

export default function CsvUpload({ onUploaded }: { onUploaded?: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      const response = await fetch('/api/assistants');
      if (!response.ok) throw new Error('Failed to fetch assistants');
      
      const data = await response.json();
      const activeAssistants = data.assistants.filter((a: Assistant) => a.isActive);
      setAssistants(activeAssistants);
      
      // Auto-select first assistant if only one available
      if (activeAssistants.length === 1) {
        setSelectedAssistantId(activeAssistants[0]._id);
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
    } finally {
      setLoadingAssistants(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadResult({
        success: false,
        error: 'Please upload a CSV file',
      });
      return;
    }

    if (!selectedAssistantId) {
      setUploadResult({
        success: false,
        error: 'Please select an assistant before uploading',
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assistantId', selectedAssistantId);

      const response = await fetch('/api/leads/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);

      // Hand control back so the caller can refresh its list; fall back to
      // navigating there when this is used on its own.
      if (result.success) {
        if (onUploaded) onUploaded();
        else setTimeout(() => router.push('/leads'), 3000);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const selectedAssistant = assistants.find(a => a._id === selectedAssistantId);

  const blocked = !selectedAssistantId || assistants.length === 0;

  return (
    <div className="space-y-5">
      {/* Assistant */}
      <div className="space-y-2.5">
        <Label htmlFor="assistant-select" className="text-sm font-medium text-foreground">
          Assistant for these calls
        </Label>

        {loadingAssistants ? (
          <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading assistants…
          </div>
        ) : assistants.length === 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <Bot className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div className="text-sm">
              <p className="font-medium text-foreground">No assistants available</p>
              <p className="mt-0.5 text-muted-foreground">Create an assistant before uploading leads.</p>
            </div>
          </div>
        ) : (
          <>
            <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
              <SelectTrigger id="assistant-select" className="w-full">
                <SelectValue placeholder="Choose an assistant to handle the calls" />
              </SelectTrigger>
              <SelectContent className={DARK_OVERLAY}>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant._id} value={assistant._id}>
                    <span className="flex items-center gap-2">
                      <Bot className="size-4 text-muted-foreground" />
                      {assistant.name}
                      <span className="text-muted-foreground">
                        {assistant.voice.gender}, {assistant.language}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAssistant && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{selectedAssistant.name}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {selectedAssistant.voice.gender} voice · {selectedAssistant.language}
                  </span>
                </div>
                <p className="flex items-start gap-2 text-muted-foreground">
                  <Phone className="mt-0.5 size-3.5 shrink-0" />
                  Calls go out through your configured phone providers.
                </p>
                <p className="flex items-start gap-2 text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  US numbers (+1) use the shared number when no custom provider is set up.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          'rounded-xl border border-dashed p-8 text-center transition-colors duration-200',
          blocked
            ? 'border-border bg-muted/20'
            : dragActive
              ? 'border-primary bg-primary/10'
              : 'border-input hover:border-muted-foreground/60'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || !selectedAssistantId}
        />

        {isUploading ? (
          <div className="space-y-3" role="status">
            <Loader2 className="mx-auto size-8 animate-spin text-brand-soft" />
            <p className="text-sm font-medium text-foreground">Processing your CSV…</p>
            <p className="text-xs text-muted-foreground">Creating leads and starting calls. This can take a moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
              <Upload className="size-5" />
            </span>
            <div>
              <p className={cn('text-sm font-medium', blocked ? 'text-muted-foreground' : 'text-foreground')}>
                {!selectedAssistantId && assistants.length > 0 ? 'Select an assistant first' : 'Drop your CSV here'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">or choose a file from your computer</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={blocked}
              className="h-9 rounded-full border-input bg-transparent px-5 text-foreground hover:bg-accent"
            >
              Choose file
            </Button>
          </div>
        )}
      </div>

      {/* Result */}
      {uploadResult &&
        (uploadResult.success ? (
          <div role="status" className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <CheckCircle2 className="size-4 text-green-500" />
              Upload complete
            </p>
            <p className="mt-1 text-muted-foreground">{uploadResult.message}</p>
            {uploadResult.data && (
              <dl className="mt-3 grid grid-cols-3 gap-3 font-mono text-xs">
                {[
                  ['Rows', uploadResult.data.totalProcessed],
                  ['Valid', uploadResult.data.validLeads],
                  ['Saved', uploadResult.data.savedLeads],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="mt-1 text-base tabular-nums text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {uploadResult.data && uploadResult.data.callErrors.length > 0 && (
              <p className="mt-3 text-xs text-amber-500">
                {uploadResult.data.callErrors.length} call{uploadResult.data.callErrors.length === 1 ? '' : 's'} could
                not be started. Retry them from the leads list.
              </p>
            )}
          </div>
        ) : (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <AlertCircle className="size-4 text-red-500" />
              Upload failed
            </p>
            <p className="mt-1 text-muted-foreground">{uploadResult.error}</p>
            {uploadResult.details && <p className="mt-1 text-xs text-muted-foreground">{uploadResult.details}</p>}
          </div>
        ))}

      {/* Format */}
      <div className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">CSV format</h3>
        <p className="mt-1 text-xs text-muted-foreground">Column names are flexible. One lead per row.</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {[
            ['Name', 'required', 'Full name of the lead'],
            ['Phone', 'required', 'Phone number, US format preferred'],
            ['Email', 'optional', 'Email address'],
            ['Company', 'optional', 'Company name'],
            ['Notes', 'optional', 'Anything the agent should know'],
          ].map(([col, req, hint]) => (
            <li key={col} className="flex items-baseline gap-2">
              <span className="w-20 shrink-0 font-mono text-xs text-foreground">{col}</span>
              <span className={cn('w-16 shrink-0 text-xs', req === 'required' ? 'text-brand-soft' : 'text-muted-foreground')}>
                {req}
              </span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-xs text-muted-foreground">name,phone,email,company,notes</p>
      </div>
    </div>
  );
}
