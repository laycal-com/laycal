'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  uptime: string;
  responseTime: string;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  date: string;
  description: string;
}

export default function SystemStatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'AI Voice API',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '120ms'
    },
    {
      name: 'Call Processing',
      status: 'operational',
      uptime: '99.8%',
      responseTime: '85ms'
    },
    {
      name: 'Lead Management',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '45ms'
    },
    {
      name: 'Analytics Dashboard',
      status: 'operational',
      uptime: '99.7%',
      responseTime: '200ms'
    },
    {
      name: 'Payment Processing',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '150ms'
    }
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: '1',
      title: 'Scheduled maintenance for Call Processing upgrade',
      status: 'resolved',
      severity: 'minor',
      date: '2025-09-09 02:00 UTC',
      description: 'Routine maintenance to improve call quality and reduce latency. All services restored.'
    },
    {
      id: '2',
      title: 'Brief delay in Analytics Dashboard',
      status: 'resolved',
      severity: 'minor',
      date: '2025-09-08 14:30 UTC',
      description: 'Dashboard experienced slower load times for approximately 15 minutes. Issue resolved.'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-[#10b981]" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-[#f97316]" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-[#ef4444]" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-[#3b82f6]" />;
      default:
        return <CheckCircle className="h-5 w-5 text-[#10b981]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'degraded':
        return 'bg-[#fed7aa] text-[#9a3412] border-[#fdba74]';
      case 'outage':
        return 'bg-[#fecaca] text-[#991b1b] border-[#f87171]';
      case 'maintenance':
        return 'bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]';
      default:
        return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
    }
  };

  const getIncidentColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'bg-[#dbeafe] text-[#1e40af]';
      case 'major':
        return 'bg-[#fed7aa] text-[#9a3412]';
      case 'critical':
        return 'bg-[#fecaca] text-[#991b1b]';
      default:
        return 'bg-[#dbeafe] text-[#1e40af]';
    }
  };

  const overallStatus = services.every(service => service.status === 'operational') 
    ? 'All systems operational' 
    : 'Some systems experiencing issues';

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen bg-[#f8fafc]" style={{ paddingTop: '100px' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#1f2937] mb-4">System Status</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-[#10b981]" />
            <span className="text-xl font-semibold text-[#1f2937]">{overallStatus}</span>
          </div>
          <p className="text-[#64748b]">
            Real-time status of Laycal services and infrastructure
          </p>
        </div>

        {/* Services Status */}
        <Card className="mb-8 bg-white shadow-lg border border-[#e2e8f0]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#1f2937]">Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <span className="font-semibold text-[#1f2937]">{service.name}</span>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex gap-6 text-sm text-[#64748b]">
                    <span>Uptime: <strong className="text-[#1f2937]">{service.uptime}</strong></span>
                    <span>Response: <strong className="text-[#1f2937]">{service.responseTime}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card className="mb-8 bg-white shadow-lg border border-[#e2e8f0]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#1f2937]">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="p-4 border border-[#e2e8f0] rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-[#1f2937]">{incident.title}</h3>
                      <div className="flex gap-2">
                        <Badge className={getIncidentColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {incident.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-[#64748b] mb-2">{incident.description}</p>
                    <p className="text-xs text-[#64748b]">{incident.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-[#10b981] mx-auto mb-4" />
                <p className="text-[#64748b]">No recent incidents to report</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg border border-[#e2e8f0]">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#10b981] mb-2">99.9%</div>
              <div className="text-sm text-[#64748b]">30-day uptime</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border border-[#e2e8f0]">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#3b82f6] mb-2">120ms</div>
              <div className="text-sm text-[#64748b]">Avg response time</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border border-[#e2e8f0]">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#8b5cf6] mb-2">0</div>
              <div className="text-sm text-[#64748b]">Active incidents</div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card className="bg-white shadow-lg border border-[#e2e8f0]">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Need Help?</h3>
            <p className="text-[#64748b] mb-4">
              If you're experiencing issues not listed here, please contact our support team.
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="/contact" 
                className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] transition-colors"
              >
                Contact Support
              </a>
              <a 
                href="/support" 
                className="border border-[#3b82f6] text-[#3b82f6] px-6 py-2 rounded-lg hover:bg-[#3b82f6] hover:text-white transition-colors"
              >
                Support Center
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}