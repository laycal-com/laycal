'use client';

import { Card, CardContent } from '@/components/ui/card';
import PublicNavbar from '@/components/PublicNavbar';

export default function TermsOfServicePage() {
  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen bg-[#f8fafc]" style={{ paddingTop: '100px' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#1f2937] mb-4">Terms of Service</h1>
          <p className="text-[#64748b]">
            Last updated: September 10, 2025
          </p>
        </div>

        <Card className="bg-white shadow-lg border border-[#e2e8f0]">
          <CardContent className="p-8 prose prose-lg max-w-none">
            <div className="space-y-8 text-[#1f2937]">
              
              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Agreement to Terms</h2>
                <p className="text-[#64748b] leading-relaxed">
                  By accessing and using Laycal (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Description of Service</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  Laycal provides AI-powered calling and lead management services, including:
                </p>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li>Automated AI voice calling for lead outreach</li>
                  <li>Lead management and CRM functionality</li>
                  <li>Call analytics and reporting</li>
                  <li>Integration with third-party services</li>
                  <li>Dashboard and user management tools</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">User Accounts</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Registration</h3>
                    <p className="text-[#64748b] leading-relaxed">
                      You must create an account to use our Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Eligibility</h3>
                    <p className="text-[#64748b] leading-relaxed">
                      You must be at least 18 years old and have the legal capacity to enter into these Terms. By using our Service, you represent and warrant that you meet these requirements.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Acceptable Use</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  You agree to use our Service only for lawful purposes and in accordance with these Terms. You may not:
                </p>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li>Use the Service for any unlawful or fraudulent activity</li>
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Make unsolicited calls to individuals on Do Not Call lists</li>
                  <li>Use the Service to harass, abuse, or harm others</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Distribute malware, viruses, or other harmful code</li>
                  <li>Interfere with or disrupt the Service or our servers</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Payment Terms</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Pricing</h3>
                    <p className="text-[#64748b] leading-relaxed">
                      Our pricing is based on per-minute usage for calls, as displayed on our pricing page. Pricing may change with 30 days' notice. You will be charged only for successful call connections.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Payment Processing</h3>
                    <p className="text-[#64748b] leading-relaxed">
                      Payments are processed through secure third-party payment processors. You agree to provide accurate billing information and authorize us to charge your payment method.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Refunds</h3>
                    <p className="text-[#64748b] leading-relaxed">
                      Refunds may be provided at our discretion for unused credits due to technical issues. No refunds will be provided for completed calls or violations of these Terms.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Data and Privacy</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  Your privacy is important to us. Our collection and use of your information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li>You retain ownership of your data and lead information</li>
                  <li>We may use aggregated, anonymized data for service improvement</li>
                  <li>You are responsible for ensuring you have consent to call your leads</li>
                  <li>Call recordings may be stored for quality and training purposes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Intellectual Property</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  The Service and its original content, features, and functionality are owned by Laycal and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-[#64748b] leading-relaxed">
                  You may not copy, modify, distribute, sell, or lease any part of our Service without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Service Availability</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  We strive to maintain high service availability but cannot guarantee uninterrupted access. We may:
                </p>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li>Perform scheduled maintenance with advance notice</li>
                  <li>Temporarily suspend service for security or technical reasons</li>
                  <li>Update or modify the Service to improve functionality</li>
                  <li>Discontinue features with reasonable notice</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Disclaimer of Warranties</h2>
                <p className="text-[#64748b] leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Limitation of Liability</h2>
                <p className="text-[#64748b] leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, LAYCAL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Termination</h2>
                <div className="space-y-4">
                  <p className="text-[#64748b] leading-relaxed">
                    Either party may terminate these Terms at any time. We may suspend or terminate your access immediately for violations of these Terms or applicable law.
                  </p>
                  <p className="text-[#64748b] leading-relaxed">
                    Upon termination, your right to use the Service will cease immediately. You may download your data for 30 days after termination, after which it may be deleted.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Governing Law</h2>
                <p className="text-[#64748b] leading-relaxed">
                  These Terms are governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles. Any disputes will be resolved in the courts of San Francisco County, California.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Changes to Terms</h2>
                <p className="text-[#64748b] leading-relaxed">
                  We may update these Terms from time to time. We will notify you of material changes via email or through the Service. Your continued use after such changes constitutes acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Contact Information</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  If you have questions about these Terms, please contact us:
                </p>
                <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]">
                  <p className="text-[#64748b]">
                    <strong>Email:</strong> legal@laycal.com<br />
                    <strong>Support:</strong> <a href="/contact" className="text-[#3b82f6] hover:text-[#2563eb]">Contact Form</a><br />
                    <strong>Mail:</strong> Laycal Legal Department<br />
                    123 AI Technology Drive<br />
                    San Francisco, CA 94105
                  </p>
                </div>
              </section>

              <div className="border-t border-[#e2e8f0] pt-6 mt-8">
                <p className="text-sm text-[#64748b] text-center">
                  These Terms of Service are effective as of September 10, 2025, and were last updated on September 10, 2025.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}