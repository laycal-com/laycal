"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Phone, MessageSquare, Clock, MapPin, Send } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          subject: '',
          message: '',
          type: 'general'
        });
      } else {
        toast.error(data.error || 'Failed to submit contact form');
      }
    } catch (error) {
      toast.error('Failed to submit contact form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen bg-[#f8fafc]" style={{ paddingTop: '100px' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[#1f2937] mb-4">Contact Us</h1>
          <p className="text-xl text-[#64748b] max-w-2xl mx-auto">
            Have questions about Laycal? We're here to help you scale your sales calls with AI.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg border border-[#e2e8f0]">
              <CardHeader>
                <CardTitle className="text-2xl text-[#1f2937] flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-[#3b82f6]" />
                  Send us a message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-[#1f2937] mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[#1f2937] mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-[#1f2937] mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        placeholder="Your company name"
                      />
                    </div>
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-[#1f2937] mb-2">
                        Inquiry Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                      >
                        <option value="general">General Question</option>
                        <option value="demo">Demo Request</option>
                        <option value="enterprise">Enterprise Sales</option>
                        <option value="partnership">Partnership</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing Question</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-[#1f2937] mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-[#1f2937] mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                      placeholder="Tell us more about your needs, questions, or how we can help..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3 text-lg"
                  >
                    {submitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="bg-white shadow-lg border border-[#e2e8f0]">
              <CardHeader>
                <CardTitle className="text-xl text-[#1f2937]">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#3b82f6] mt-0.5" />
                  <div>
                    <div className="font-medium text-[#1f2937]">Email</div>
                    <div className="text-[#64748b] text-sm">support@laycal.com</div>
                    <div className="text-[#64748b] text-sm">sales@laycal.com</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#3b82f6] mt-0.5" />
                  <div>
                    <div className="font-medium text-[#1f2937]">Phone</div>
                    <div className="text-[#64748b] text-sm">+1 (555) 123-4567</div>
                    <div className="text-[#64748b] text-xs">Monday - Friday, 9 AM - 6 PM PST</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#3b82f6] mt-0.5" />
                  <div>
                    <div className="font-medium text-[#1f2937]">Office</div>
                    <div className="text-[#64748b] text-sm">
                      123 AI Technology Drive<br />
                      San Francisco, CA 94105<br />
                      United States
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border border-[#e2e8f0]">
              <CardHeader>
                <CardTitle className="text-xl text-[#1f2937] flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#3b82f6]" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[#e2e8f0]">
                  <span className="text-[#64748b] text-sm">Sales Inquiries</span>
                  <span className="text-[#1f2937] font-medium text-sm">2-4 hours</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#e2e8f0]">
                  <span className="text-[#64748b] text-sm">Technical Support</span>
                  <span className="text-[#1f2937] font-medium text-sm">4-12 hours</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#e2e8f0]">
                  <span className="text-[#64748b] text-sm">General Questions</span>
                  <span className="text-[#1f2937] font-medium text-sm">24 hours</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[#64748b] text-sm">Enterprise</span>
                  <span className="text-[#1f2937] font-medium text-sm">1-2 hours</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
      </div>
    </>
  );
}