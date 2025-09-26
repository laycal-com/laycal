'use client';

import { Card, CardContent } from '@/components/ui/card';
import PublicNavbar from '@/components/PublicNavbar';

export default function PrivacyPageClient() {
  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen bg-[#f8fafc]" style={{ paddingTop: '100px' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#1f2937] mb-4">Privacy Policy</h1>
          <p className="text-[#64748b]">
            Last updated: September 10, 2025
          </p>
        </div>

        <Card className="bg-white shadow-lg border border-[#e2e8f0]">
          <CardContent className="p-8 prose prose-lg max-w-none">
            <div className="space-y-8 text-[#1f2937]">
              
              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Introduction</h2>
                <p className="text-[#64748b] leading-relaxed">
                  Laycal ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered calling platform and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Personal Information</h3>
                    <ul className="list-disc pl-6 text-[#64748b] space-y-1">
                      <li>Name and email address</li>
                      <li>Phone numbers and contact information</li>
                      <li>Payment and billing information</li>
                      <li>Account credentials and authentication data</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Lead and Call Data</h3>
                    <ul className="list-disc pl-6 text-[#64748b] space-y-1">
                      <li>Contact information of leads you upload</li>
                      <li>Call recordings and transcripts</li>
                      <li>Call metadata (duration, timestamps, outcomes)</li>
                      <li>AI assistant configurations and prompts</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f2937] mb-2">Usage Data</h3>
                    <ul className="list-disc pl-6 text-[#64748b] space-y-1">
                      <li>Platform usage statistics and analytics</li>
                      <li>Feature usage and preferences</li>
                      <li>Technical logs and error reports</li>
                      <li>Device and browser information</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">How We Use Your Information</h2>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li>Provide and maintain our AI calling services</li>
                  <li>Process payments and manage your account</li>
                  <li>Improve our AI models and call quality</li>
                  <li>Provide customer support and technical assistance</li>
                  <li>Send important service updates and notifications</li>
                  <li>Comply with legal obligations and prevent fraud</li>
                  <li>Analyze usage patterns to enhance our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Data Security</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li>End-to-end encryption for all call data</li>
                  <li>SOC 2 Type II compliance and regular security audits</li>
                  <li>Secure data centers with 24/7 monitoring</li>
                  <li>Access controls and employee security training</li>
                  <li>Regular security updates and vulnerability assessments</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Data Sharing and Disclosure</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information. We may share your information only in these limited circumstances:
                </p>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li>With trusted service providers who assist in our operations</li>
                  <li>When required by law or to protect our legal rights</li>
                  <li>In connection with a business transfer or merger</li>
                  <li>With your explicit consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Third-Party Services</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  Our platform integrates with various third-party services:
                </p>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li><strong>Phone Providers:</strong> Twilio, Plivo, Vonage for call routing</li>
                  <li><strong>AI Services:</strong> OpenAI for voice processing</li>
                  <li><strong>Payment Processing:</strong> PayPal for secure transactions</li>
                  <li><strong>Calendar Integration:</strong> Google Calendar for appointments</li>
                </ul>
                <p className="text-[#64748b] leading-relaxed mt-4">
                  Each service has its own privacy policy governing the use of your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibent text-[#1f2937] mb-4">Data Retention</h2>
                <p className="text-[#64748b] leading-relaxed">
                  We retain your data for as long as necessary to provide our services and comply with legal obligations. Call recordings are retained for 12 months unless you request earlier deletion. Account data is retained until you close your account, after which it is securely deleted within 90 days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Your Rights</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 text-[#64748b] space-y-2">
                  <li>Access and review your personal data</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your data in a portable format</li>
                  <li>Opt-out of non-essential communications</li>
                  <li>Request restrictions on data processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Cookies and Tracking</h2>
                <p className="text-[#64748b] leading-relaxed">
                  We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content. You can manage cookie preferences through your browser settings, though some features may not function properly if cookies are disabled.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">International Data Transfers</h2>
                <p className="text-[#64748b] leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including standard contractual clauses and adequacy decisions, to protect your data during international transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Children's Privacy</h2>
                <p className="text-[#64748b] leading-relaxed">
                  Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover we have collected such information, we will delete it promptly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Changes to This Policy</h2>
                <p className="text-[#64748b] leading-relaxed">
                  We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of material changes via email or through our platform. Your continued use of our services after such changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#1f2937] mb-4">Contact Us</h2>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]">
                  <p className="text-[#64748b]">
                    <strong>Email:</strong> contact@laycal.com<br />
                    <strong>Support:</strong> <a href="/contact" className="text-[#3b82f6] hover:text-[#2563eb]">Contact Form</a><br />
                    <strong>Mail:</strong> Laycal Privacy Officer<br />
                    123 AI Technology Drive<br />
                    San Francisco, CA 94105
                  </p>
                </div>
              </section>

              <div className="border-t border-[#e2e8f0] pt-6 mt-8">
                <p className="text-sm text-[#64748b] text-center">
                  This Privacy Policy is effective as of September 10, 2025, and was last updated on September 10, 2025.
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