"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    totalProcessed: number;
    validLeads: number;
    savedLeads: number;
    csvErrors: string[];
    vapiErrors: Array<{ leadName: string; error: string; }>;
  };
  error?: string;
  details?: string;
}

export default function CsvUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadResult({
        success: false,
        error: 'Please upload a CSV file',
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
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
          disabled={isUploading}
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
              className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="text-lg font-medium text-gray-700">Upload CSV File</p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop your CSV file here, or click to browse
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
                  {uploadResult.data.vapiErrors.length > 0 && (
                    <p className="text-yellow-600">
                      • Vapi call errors: {uploadResult.data.vapiErrors.length}
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