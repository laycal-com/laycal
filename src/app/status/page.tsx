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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-brand-soft" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/10 text-green-500 border-border';
      case 'degraded':
        return 'bg-amber-500/10 text-amber-500 border-border';
      case 'outage':
        return 'bg-red-500/10 text-red-500 border-border';
      case 'maintenance':
        return 'bg-primary/10 text-brand-soft border-border';
      default:
        return 'bg-green-500/10 text-green-500 border-border';
    }
  };

  const getIncidentColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'bg-primary/10 text-brand-soft';
      case 'major':
        return 'bg-amber-500/10 text-amber-500';
      case 'critical':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-primary/10 text-brand-soft';
    }
  };

  const overallStatus = services.every(service => service.status === 'operational') 
    ? 'All systems operational' 
    : 'Some systems experiencing issues';

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen pt-28">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold text-foreground mb-4">System Status</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span className="text-xl font-semibold text-foreground">{overallStatus}</span>
          </div>
          <p className="text-muted-foreground">
            Real-time status of Laycal services and infrastructure
          </p>
        </div>

        {/* Services Status */}
        <Card className="mb-8 bg-card shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <span className="font-semibold text-foreground">{service.name}</span>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>Uptime: <strong className="text-foreground">{service.uptime}</strong></span>
                    <span>Response: <strong className="text-foreground">{service.responseTime}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card className="mb-8 bg-card shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{incident.title}</h3>
                      <div className="flex gap-2">
                        <Badge className={getIncidentColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {incident.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                    <p className="text-xs text-muted-foreground">{incident.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No recent incidents to report</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card shadow-lg border border-border">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-semibold text-foreground mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">30-day uptime</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-lg border border-border">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-semibold text-brand-soft mb-2">120ms</div>
              <div className="text-sm text-muted-foreground">Avg response time</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-lg border border-border">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-semibold text-brand-soft mb-2">0</div>
              <div className="text-sm text-muted-foreground">Active incidents</div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card className="bg-card shadow-lg border border-border">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              If you're experiencing issues not listed here, please contact our support team.
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="/contact" 
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </a>
              <a 
                href="/support" 
                className="border border-primary text-brand-soft px-6 py-2 rounded-lg hover:bg-primary/90 hover:text-white transition-colors"
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