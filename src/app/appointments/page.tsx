'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Phone, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PaymentGateWrapper } from '@/components/PaymentGateWrapper';
import { toast } from 'sonner';

interface PendingAppointment {
  _id: string;
  vapiCallId: string;
  phoneNumberId: string;
  status: 'pending_confirmation' | 'confirmed' | 'rejected';
  appointmentData: {
    title: string;
    startTime: string;
    endTime: string;
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    notes?: string;
  };
  callData: {
    duration?: number;
    summary?: string;
    transcript?: string;
    endReason?: string;
  };
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<PendingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending_confirmation' | 'confirmed' | 'rejected'>('pending_confirmation');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments?status=${filter}`);
      const data = await response.json();
      
      if (response.ok) {
        setAppointments(data.appointments);
      } else {
        toast.error('Failed to fetch appointments');
      }
    } catch (error) {
      toast.error('Error fetching appointments');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const handleConfirm = async (appointmentId: string) => {
    setProcessingIds(prev => new Set(prev).add(appointmentId));
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Appointment confirmed and added to calendar!');
        fetchAppointments(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to confirm appointment');
      }
    } catch (error) {
      toast.error('Error confirming appointment');
      console.error('Confirm error:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleReject = async (appointmentId: string) => {
    setProcessingIds(prev => new Set(prev).add(appointmentId));
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/reject`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Appointment rejected');
        fetchAppointments(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to reject appointment');
      }
    } catch (error) {
      toast.error('Error rejecting appointment');
      console.error('Reject error:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PaymentGateWrapper>
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000' }}>
        <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600 mt-2">Manage your pending appointment confirmations</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        {[
          { key: 'pending_confirmation', label: 'Pending', icon: AlertCircle },
          { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
          { key: 'rejected', label: 'Rejected', icon: XCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <CardContent className="text-center py-12" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {filter.replace('_', ' ')} appointments</h3>
            <p className="text-gray-500">
              {filter === 'pending_confirmation' 
                ? 'New appointment confirmations will appear here when calls are completed.'
                : `No ${filter} appointments found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const startDateTime = formatDateTime(appointment.appointmentData.startTime);
            const endDateTime = formatDateTime(appointment.appointmentData.endTime);
            const isProcessing = processingIds.has(appointment._id);

            return (
              <Card key={appointment._id} className="overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                <CardHeader style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{appointment.appointmentData.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Call ID: {appointment.vapiCallId}
                      </CardDescription>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Appointment Details */}
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{startDateTime.date}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{startDateTime.time} - {endDateTime.time}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        <div>
                          <div>{appointment.appointmentData.customer.name}</div>
                          {appointment.appointmentData.customer.email && (
                            <div className="text-gray-500">{appointment.appointmentData.customer.email}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{appointment.appointmentData.customer.phone}</span>
                      </div>
                    </div>

                    {/* Call Details & Actions */}
                    <div className="space-y-3">
                      {appointment.callData.summary && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Call Summary</h4>
                          <p className="text-sm text-gray-600">{appointment.callData.summary}</p>
                        </div>
                      )}
                      
                      {appointment.appointmentData.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                          <p className="text-sm text-gray-600">{appointment.appointmentData.notes}</p>
                        </div>
                      )}

                      {appointment.callData.duration && (
                        <div className="text-sm text-gray-500">
                          Call duration: {Math.round(appointment.callData.duration)} seconds
                        </div>
                      )}
                      
                      {appointment.status === 'pending_confirmation' && (
                        <div className="flex space-x-3 pt-2">
                          <Button
                            onClick={() => handleConfirm(appointment._id)}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isProcessing ? 'Confirming...' : 'Confirm & Add to Calendar'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => handleReject(appointment._id)}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {isProcessing ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      )}

                      {appointment.confirmedAt && (
                        <div className="text-sm text-gray-500 pt-2">
                          {appointment.status === 'confirmed' ? 'Confirmed' : 'Rejected'} on{' '}
                          {new Date(appointment.confirmedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </PaymentGateWrapper>
  );
}