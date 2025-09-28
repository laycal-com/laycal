"use client";

import { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";

interface CallSummary {
  _id: string;
  vapiCallId: string;
  phoneNumberId: string;
  leadId?: string;
  callData: {
    duration?: number;
    endReason?: string;
    status: 'completed' | 'failed' | 'no-answer' | 'busy';
    cost?: number;
    startTime?: string;
    endTime?: string;
  };
  transcript?: string;
  summary?: string;
  evaluation?: 'positive' | 'negative' | 'neutral';
  stereoRecordingUrl?: string;
  structuredData?: {[key: string]: any};
  extractedInfo: {[key: string]: any};
  appointmentCreated?: boolean;
  appointmentData?: {
    title?: string;
    startTime?: string;
    endTime?: string;
    confirmed?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const formatTranscript = (transcript: string) => {
  return transcript.split('\n').map((line, index) => {
    const [speaker, ...text] = line.split(':');
    const isUser = speaker.toLowerCase().includes('user');
    return {
      speaker: isUser ? 'User' : 'Assistant',
      text: text.join(':').trim(),
      isUser,
      id: `line-${index}`
    };
  });
};

export default function CallSummaryPage({ params }: { params: { leadId: string } }) {
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/call-summaries?leadId=${params.leadId}`);
        if (!response.ok) throw new Error('Failed to fetch call summary');
        const data = await response.json();
        if (data.success && data.summaries && data.summaries.length > 0) {
          setSummary(data.summaries[0]);
        } else {
          setSummary(null);
        }
      } catch (error) {
        console.error('Error fetching call summary:', error);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [params.leadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!summary) {
    notFound();
  }

  const formattedTranscript = summary.transcript ? formatTranscript(summary.transcript) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            &larr; Back to Leads
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Call Summary</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Conversation Transcript</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 border rounded-lg bg-gray-50">
              {formattedTranscript.map(line => (
                <div key={line.id} className={`flex items-start gap-3 ${line.isUser ? 'justify-end' : ''}`}>
                  {!line.isUser && <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">A</div>}
                  <div className={`p-3 rounded-lg max-w-md ${line.isUser ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    <p className="text-sm">{line.text}</p>
                  </div>
                  {line.isUser && <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold">U</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Call Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Call Recording</h3>
                {summary.stereoRecordingUrl ? (
                  <div className="mt-2">
                    <audio controls src={summary.stereoRecordingUrl} className="w-full"></audio>
                    <p className="text-xs text-gray-500 mt-1">Recording is available for 15 days.</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">No recording available.</p>
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Call Summary</h3>
                <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded">{summary.summary || 'No summary available.'}</p>
              </div>

              {summary.evaluation && (
                <div>
                  <h3 className="font-medium text-gray-700">Evaluation</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ 
                      summary.evaluation === 'positive' 
                        ? 'bg-green-100 text-green-800' 
                        : summary.evaluation === 'negative'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {summary.evaluation}
                    </span>
                  </p>
                </div>
              )}

              {summary.extractedInfo && Object.keys(summary.extractedInfo).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700">Extracted Information</h3>
                  <div className="mt-2 p-3 bg-blue-50 rounded text-sm space-y-1">
                    {Object.entries(summary.extractedInfo).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {summary.appointmentCreated && summary.appointmentData && (
                <div>
                  <h3 className="font-medium text-gray-700">Appointment</h3>
                  <div className="mt-2 p-3 bg-green-50 rounded text-sm space-y-1">
                    {summary.appointmentData.title && (
                      <p><strong>Title:</strong> {summary.appointmentData.title}</p>
                    )}
                    {summary.appointmentData.startTime && (
                      <p><strong>Start:</strong> {new Date(summary.appointmentData.startTime).toLocaleString()}</p>
                    )}
                    {summary.appointmentData.endTime && (
                      <p><strong>End:</strong> {new Date(summary.appointmentData.endTime).toLocaleString()}</p>
                    )}
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${ 
                        summary.appointmentData.confirmed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {summary.appointmentData.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}