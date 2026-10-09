"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from 'sonner';
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2, RotateCw, Search, Upload, Users } from 'lucide-react';
import CsvUpload from "@/components/CsvUpload";
import { PaymentGateWrapper } from "@/components/PaymentGateWrapper";
import { PageHeader, PortalPage } from '@/components/portal/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Lead {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  notes?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  vapiCallId?: string;
  callResults?: {
    answered: boolean;
    duration?: number;
    summary?: string;
    transcript?: string;
    endReason?: string;
    cost?: number;
    evaluation?: 'positive' | 'neutral' | 'negative';
  };
  createdAt: string;
  calledAt?: string;
}

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

interface StatusCounts {
  pending: number;
  calling: number;
  completed: number;
  failed: number;
  total: number;
}

interface LeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statusCounts: StatusCounts;
}

const PAGE_SIZE = 20;

const STATUS: Record<Lead['status'], { label: string; dot: string; pulse?: boolean }> = {
  pending: { label: 'Queued', dot: 'bg-muted-foreground/50' },
  calling: { label: 'Calling', dot: 'bg-primary', pulse: true },
  completed: { label: 'Completed', dot: 'bg-green-500' },
  failed: { label: 'Failed', dot: 'bg-red-500' },
};

const FILTERS: { value: 'all' | Lead['status']; label: string; count: keyof StatusCounts }[] = [
  { value: 'all', label: 'All', count: 'total' },
  { value: 'pending', label: 'Queued', count: 'pending' },
  { value: 'calling', label: 'Calling', count: 'calling' },
  { value: 'completed', label: 'Completed', count: 'completed' },
  { value: 'failed', label: 'Failed', count: 'failed' },
];

const formatDuration = (seconds?: number) => {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const headCell = 'h-10 px-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    calling: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | Lead['status']>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [retryingLeads, setRetryingLeads] = useState<Set<string>>(new Set());

  // Search as you type, but only once typing pauses.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: String(PAGE_SIZE),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/leads?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leads');

      const data: LeadsResponse = await response.json();
      setLeads(data.leads);
      setStatusCounts(data.statusCounts);
      setPagination({ page: data.pagination.page, pages: Math.max(1, data.pagination.pages), total: data.pagination.total });
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Could not load leads');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleRetryCall = async (leadId: string) => {
    if (retryingLeads.has(leadId)) return;

    setRetryingLeads(prev => new Set(prev).add(leadId));

    try {
      const response = await fetch(`/api/leads/${leadId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Retry failed');
      }

      // Refresh leads to show updated status
      await fetchLeads();

      toast.success('Call retry started', {
        description: 'The lead is being called again.'
      });

    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Retry failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setRetryingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
    }
  };

  const canRetry = (lead: Lead) => {
    return lead.status === 'failed' || lead.status === 'completed' || lead.status === 'pending';
  };

  const filtered = statusFilter !== 'all' || searchQuery !== '';
  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <PaymentGateWrapper>
      <PortalPage>
        <PageHeader
          title="Leads"
          description="Everyone your agents have called or are about to call."
          actions={
            <Button onClick={() => setShowUpload(true)} className="h-9 gap-2 rounded-full px-4">
              <Upload className="size-4" />
              Upload CSV
            </Button>
          }
        />

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by status" className="flex gap-0.5 overflow-x-auto rounded-lg border border-border bg-card p-0.5">
            {FILTERS.map((f) => {
              const active = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => {
                    setStatusFilter(f.value);
                    setCurrentPage(1);
                  }}
                  aria-pressed={active}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.label}
                  <span className={cn('font-mono text-xs tabular-nums', active ? 'text-muted-foreground' : 'text-muted-foreground/60')}>
                    {statusCounts[f.count].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search leads"
              placeholder="Search name, phone, email or company"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 rounded-lg pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {loading ? (
            <div aria-busy="true" aria-label="Loading leads">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border px-5 py-4 last:border-b-0">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="ml-auto h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Users className="size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-foreground">
                {filtered ? 'No leads match these filters' : 'No leads yet'}
              </p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                {filtered
                  ? 'Try a different status or clear the search.'
                  : 'Upload a CSV and your assistant starts calling straight away.'}
              </p>
              {!filtered && (
                <Button onClick={() => setShowUpload(true)} variant="outline" className="mt-5 h-9 gap-2 rounded-full border-input bg-transparent px-4 text-foreground hover:bg-accent">
                  <Upload className="size-4" />
                  Upload CSV
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className={headCell}>Lead</TableHead>
                  <TableHead className={headCell}>Phone</TableHead>
                  <TableHead className={headCell}>Status</TableHead>
                  <TableHead className={headCell}>Call</TableHead>
                  <TableHead className={headCell}>Added</TableHead>
                  <TableHead className={cn(headCell, 'text-right')}>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const status = STATUS[lead.status] ?? STATUS.pending;
                  const retrying = retryingLeads.has(lead._id);
                  const duration = formatDuration(lead.callResults?.duration);
                  const secondary = [lead.company, lead.email].filter(Boolean).join(' · ');
                  return (
                    <TableRow key={lead._id} className="border-border hover:bg-muted/40">
                      <TableCell className="px-5 py-3.5">
                        <div className="font-medium text-foreground">{lead.name}</div>
                        {secondary && <div className="mt-0.5 max-w-[22rem] truncate text-xs text-muted-foreground">{secondary}</div>}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 font-mono text-xs tabular-nums text-muted-foreground">
                        {lead.phoneNumber}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <span className="flex items-center gap-2 text-[13px] text-foreground">
                          <span className="relative flex size-1.5">
                            {status.pulse && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-70', status.dot)} />}
                            <span className={cn('relative inline-flex size-1.5 rounded-full', status.dot)} />
                          </span>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-[13px]">
                        {lead.callResults ? (
                          <span className={lead.callResults.answered ? 'text-foreground' : 'text-muted-foreground'}>
                            {lead.callResults.answered ? 'Answered' : 'No answer'}
                            {duration && <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">{duration}</span>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-3.5 text-[13px] text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {canRetry(lead) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryCall(lead._id)}
                              disabled={retrying}
                              className="h-8 gap-1.5 rounded-lg px-2.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              {retrying ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCw className="size-3.5" />}
                              {retrying ? 'Retrying' : lead.status === 'pending' ? 'Call now' : 'Retry'}
                            </Button>
                          )}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 rounded-lg border-input bg-transparent px-2.5 text-foreground hover:bg-accent"
                          >
                            <Link href={`/call-summary/${lead._id}`}>
                              Details
                              <ArrowUpRight className="size-3.5 text-muted-foreground" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-mono tabular-nums text-foreground">{from}–{to}</span> of{' '}
              <span className="font-mono tabular-nums text-foreground">{pagination.total.toLocaleString()}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-xs tabular-nums sm:inline">
                Page {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="size-9 rounded-lg border-input bg-transparent text-foreground hover:bg-accent"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="size-9 rounded-lg border-input bg-transparent text-foreground hover:bg-accent"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </PortalPage>

      <Sheet open={showUpload} onOpenChange={setShowUpload}>
        <SheetContent className="dark w-full gap-0 overflow-y-auto border-border bg-background text-foreground sm:max-w-xl">
          <SheetHeader className="border-b border-border p-6">
            <SheetTitle className="text-lg tracking-[-0.01em]">Upload leads</SheetTitle>
            <SheetDescription>Calls start as soon as the file is processed.</SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <CsvUpload
              onUploaded={() => {
                setCurrentPage(1);
                fetchLeads();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </PaymentGateWrapper>
  );
}
