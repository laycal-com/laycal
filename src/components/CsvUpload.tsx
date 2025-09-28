"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Phone } from 'lucide-react';

interface UploadResult {
  success: boolean;
  message: string;
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

export default function CsvUpload() {
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

      // Redirect to leads page after successful upload
      if (result.success) {
        setTimeout(() => {
          router.push('/leads');
        }, 3000);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Assistant Selection */}
      <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
        <CardContent className="pt-6" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
          <div className="space-y-4">
            <Label htmlFor="assistant-select" className="text-base font-medium">
              Select Assistant for Calls *
            </Label>
            
            {loadingAssistants ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading assistants...</span>
              </div>
            ) : assistants.length === 0 ? (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Bot className="w-5 h-5 text-amber-600 mr-2" />
                  <div>
                    <p className="text-amber-800 font-medium">No assistants available</p>
                    <p className="text-amber-600 text-sm">
                      You need to create an assistant first before uploading leads.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an assistant to handle the calls" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant._id} value={assistant._id}>
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4" />
                          <span>{assistant.name}</span>
                          <span className="text-gray-500">
                            ({assistant.voice.gender}, {assistant.language})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAssistant && (
                  <Card className="bg-blue-50 border-blue-200" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                    <CardContent className="pt-4" style={{ backgroundColor: '#f0f9ff', color: '#1e40af' }}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">{selectedAssistant.name}</span>
                          <span className="text-sm text-blue-700 capitalize">
                            {selectedAssistant.voice.gender} voice
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-blue-800">
                          <Phone className="w-4 h-4" />
                          <span>Will use your configured phone providers for outbound calls</span>
                        </div>

                        <div className="bg-blue-100 border border-blue-200 rounded-md p-2 mt-2">
                          <div className="flex items-center space-x-2 text-xs text-blue-800">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              <strong>US numbers (+1):</strong> Will use default provider if no custom provider is set up
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-blue-700">
                          Language: {selectedAssistant.language}
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          !selectedAssistantId && assistants.length > 0
            ? 'border-gray-200 bg-gray-100'
            : dragActive
            ? 'border-blue-500 bg-blue-50'
            : isUploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
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
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-lg font-medium text-gray-700">Processing your CSV...</p>
            <p className="text-sm text-gray-500">
              This may take a few moments as we create leads and initiate calls.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg
              className={`mx-auto h-12 w-12 ${!selectedAssistantId && assistants.length > 0 ? 'text-gray-300' : 'text-gray-400'}`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <p className={`text-lg font-medium ${!selectedAssistantId && assistants.length > 0 ? 'text-gray-500' : 'text-gray-700'}`}>
                Upload CSV File
              </p>
              <p className={`text-sm mt-1 ${!selectedAssistantId && assistants.length > 0 ? 'text-gray-400' : 'text-gray-500'}`}>
                {!selectedAssistantId && assistants.length > 0 
                  ? 'Please select an assistant first'
                  : 'Drag and drop your CSV file here, or click to browse'
                }
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedAssistantId || assistants.length === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                !selectedAssistantId || assistants.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Choose File
            </button>
          </div>
        )}
      </div>

      {/* CSV Format Guide */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">CSV Format Requirements</h3>
        <p className="text-sm text-gray-600 mb-3">
          Your CSV should include these columns (column names are flexible):
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Name</strong> (required): Full name of the lead</li>
          <li>• <strong>Phone</strong> (required): Phone number (US format preferred)</li>
          <li>• <strong>Email</strong> (optional): Email address</li>
          <li>• <strong>Company</strong> (optional): Company name</li>
          <li>• <strong>Notes</strong> (optional): Additional information</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Example: name,phone,email,company,notes
        </p>
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <div className="mt-6">
          {uploadResult.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <h3 className="text-green-800 font-medium">Upload Successful!</h3>
              </div>
              <p className="text-green-700 mt-1">{uploadResult.message}</p>
              
              {uploadResult.data && (
                <div className="mt-3 text-sm text-green-600">
                  <p>• Total rows processed: {uploadResult.data.totalProcessed}</p>
                  <p>• Valid leads: {uploadResult.data.validLeads}</p>
                  <p>• Leads saved: {uploadResult.data.savedLeads}</p>
                  {uploadResult.data.callErrors.length > 0 && (
                    <p className="text-yellow-600">
                      • Call errors: {uploadResult.data.callErrors.length}
                    </p>
                  )}
                </div>
              )}
              
              <p className="text-green-600 text-sm mt-3 font-medium">
                Redirecting to leads dashboard in 3 seconds...
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-red-800 font-medium">Upload Failed</h3>
              </div>
              <p className="text-red-700 mt-1">{uploadResult.error}</p>
              {uploadResult.details && (
                <p className="text-red-600 text-sm mt-2">{uploadResult.details}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}