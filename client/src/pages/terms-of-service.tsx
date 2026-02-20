import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, User, Shield, Scale, RefreshCw, CreditCard, Phone, Heart, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-4">
        <Link href="/">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 26, 2026</p>
          </div>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <p className="text-foreground/90 leading-relaxed">
            Welcome to mywellbeingtoday, a self-care webapp of Wellbeing@Fingertip Ltd. These terms explain 
            how you can use our platform and what we expect from each other. We've written them in plain 
            language because we believe you shouldn't need a law degree to understand how our service works.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <CheckCircle className="h-5 w-5 text-primary" />
            Acceptance of Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            By creating an account or using mywellbeingtoday, you agree to these terms. If you don't agree 
            with any part of these services, please provide us a feedack on your observation to help meet with the acceptable terms. We may update these terms from 
            time to time, and we'll notify you of significant changes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You must be at least 16 years old to use mywellbeingtoday. If you're under 18, please make sure 
            a parent or guardian has reviewed these terms with you.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Description of Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            mywellbeingtoday provides a comprehensive wellbeing platform designed to help you track, 
            understand, and improve your overall wellness. Our services include:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Wellbeing Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Log your mood, activities, sleep patterns, and other wellness indicators to build 
                a comprehensive picture of your health journey.
              </p>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-muted-foreground">
                Our AI assistant analyzes your data to provide personalized insights, identify 
                patterns, and offer supportive guidance.
              </p>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Provider Directory</h3>
              <p className="text-sm text-muted-foreground">
                Browse and connect with verified healthcare professionals, therapists, and 
                wellness practitioners in your area.
              </p>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Appointment Booking</h3>
              <p className="text-sm text-muted-foreground">
                Schedule appointments with healthcare providers directly through our platform 
                and manage your care journey.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <CreditCard className="h-5 w-5 text-primary" />
            Subscription Plans and Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            mywellbeingtoday offers the following subscription plans:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-secondary/30 rounded-lg p-4 border-2 border-transparent">
              <h3 className="font-semibold mb-2">Monthly Plan</h3>
              <p className="text-2xl font-bold text-primary mb-2">$19.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">
                Full access to all features, billed monthly. Cancel anytime.
              </p>
            </div>
            
            <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">Yearly Plan</h3>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Save 20%</span>
              </div>
              <p className="text-2xl font-bold text-primary mb-2">$191.88<span className="text-sm font-normal text-muted-foreground">/year</span></p>
              <p className="text-sm text-muted-foreground">
                Equivalent to $15.99/month. Full access to all features, billed annually.
              </p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">15-Day Free Trial</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Start with a 15-day free trial to explore all features. No credit card required to start. 
              You can cancel anytime during the trial period without being charged.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Automatic Renewal</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Subscriptions automatically renew at the end of each billing period (monthly or yearly) 
                unless cancelled before the renewal date. You will be charged the applicable subscription 
                fee to your registered payment method. We will send you a reminder email before each renewal.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Cancellation</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You may cancel your subscription at any time through your account settings. Cancellation 
                will take effect at the end of your current billing period. You will continue to have 
                access to premium features until the end of the period you've paid for. Refunds are not 
                provided for partial billing periods, except where required by applicable law.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Price Changes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We reserve the right to modify subscription prices. Any price changes will take effect 
                at your next billing cycle, and we will provide at least 30 days' advance notice of any 
                price increase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Important Medical Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
              mywellbeingtoday is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            Our platform is designed to support your wellbeing journey, but it should never replace 
            the care of qualified healthcare professionals. Please keep in mind:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Always consult a doctor or qualified healthcare provider for medical concerns</li>
            <li>Our AI insights are informational only and not medical diagnoses</li>
            <li>If you're experiencing a mental health crisis, please contact emergency services or a crisis helpline</li>
            <li>Don't delay seeking medical attention based on information from our platform</li>
            <li>Our app doesn't replace therapy, counseling, or other professional mental health treatment</li>
          </ul>
          
          <p className="text-muted-foreground leading-relaxed">
            We encourage you to share insights from the app with your healthcare providers—they can 
            be a valuable supplement to your care, not a replacement for it.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Heart className="h-5 w-5 text-primary" />
            Health and Social Care Provider Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            If you are a healthcare or social care provider using our platform, additional terms apply:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>You must maintain valid professional credentials and licenses for your jurisdiction</li>
            <li>You are responsible for verifying patient identities before providing care</li>
            <li>You must comply with all applicable healthcare regulations, including data protection and privacy laws</li>
            <li>You agree to maintain professional liability insurance appropriate for your practice</li>
            <li>All communications with patients through our platform should follow professional standards of care</li>
            <li>You must not use the platform to provide emergency medical services</li>
          </ul>

          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to verify provider credentials and may suspend or terminate provider 
            accounts that fail to meet our standards or comply with applicable regulations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Ban className="h-5 w-5 text-primary" />
            Acceptable Use Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            To maintain a safe and supportive environment for all users, you agree NOT to:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Use the platform for any unlawful purpose or in violation of any applicable laws</li>
            <li>Harass, abuse, threaten, or harm other users or staff</li>
            <li>Impersonate another person or misrepresent your identity or credentials</li>
            <li>Upload malicious software, viruses, or harmful code</li>
            <li>Attempt to gain unauthorized access to other accounts or our systems</li>
            <li>Use automated systems (bots, scrapers) to access the platform without permission</li>
            <li>Share false or misleading health information</li>
            <li>Promote self-harm, eating disorders, or other dangerous behaviors</li>
            <li>Sell, resell, or commercially exploit the platform without authorization</li>
          </ul>
          
          <p className="text-muted-foreground leading-relaxed">
            Violation of this policy may result in immediate account suspension or termination, 
            and we may report illegal activities to appropriate authorities.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <User className="h-5 w-5 text-primary" />
            User Accounts and Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            When you create an account with us, you're responsible for:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Providing accurate and truthful information</li>
            <li>Choosing a strong, unique password</li>
            <li>Keeping your password confidential</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately if you suspect unauthorized access</li>
          </ul>
          
          <p className="text-muted-foreground leading-relaxed">
            We recommend using a password manager and enabling any additional security features 
            we offer to protect your account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Intellectual Property
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            The mywellbeingtoday platform, including its design, features, content, and technology, 
            is owned by Wellbeing@Fingertip Ltd and protected by intellectual property laws.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">What We Own</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                All branding, logos, trademarks, software, algorithms, and original content on our 
                platform belongs to us or our licensors. You may not copy, modify, distribute, sell, 
                or lease any part of our platform without express written permission.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">What You Own</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You retain ownership of the personal content you create and share on our platform, 
                such as journal entries and activity logs. By using our service, you grant us a 
                limited, non-exclusive license to use this content solely to provide and improve 
                our services to you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Feedback</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                If you provide feedback, suggestions, or ideas about our platform, you grant us 
                the right to use this feedback without compensation or attribution to you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Scale className="h-5 w-5 text-primary" />
            Disclaimer of Warranties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by applicable law:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Our services are provided "AS IS" and "AS AVAILABLE" without warranties of any kind</li>
            <li>We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement</li>
            <li>We do not guarantee that our services will be uninterrupted, error-free, or completely secure</li>
            <li>We are not responsible for the accuracy or reliability of any information provided by healthcare providers on our platform</li>
            <li>AI-generated content and recommendations may contain errors and should not be solely relied upon</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Scale className="h-5 w-5 text-primary" />
            Limitation of Liability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by applicable law:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
            <li>We shall not be liable for loss of profits, data, use, goodwill, or other intangible losses</li>
            <li>Our total liability shall not exceed the amount you've paid us in the 12 months preceding the claim</li>
            <li>We are not liable for actions, advice, or services provided by healthcare providers you connect with through our platform</li>
            <li>We are not liable for any health decisions you make based on information from our platform</li>
          </ul>
          
          <p className="text-muted-foreground leading-relaxed">
            Some jurisdictions do not allow certain limitations of liability, so some of these limitations 
            may not apply to you. Nothing in these terms excludes or limits our liability for fraud, 
            death or personal injury caused by our negligence, or any other liability that cannot be 
            excluded by law.
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-red-700 dark:text-red-400">
            <Phone className="h-5 w-5" />
            Crisis Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 font-medium leading-relaxed">
              If you or someone you know is in immediate danger or experiencing a mental health emergency, 
              please contact emergency services (999/112/911) immediately.
            </p>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            The following crisis resources are available 24/7:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">National Suicide Prevention Lifeline (US)</h3>
              <p className="text-2xl font-bold text-primary">988</p>
              <p className="text-sm text-muted-foreground">Call or text 24/7</p>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Crisis Text Line</h3>
              <p className="text-2xl font-bold text-primary">Text HOME to 741741</p>
              <p className="text-sm text-muted-foreground">Free, 24/7 crisis support via text</p>
            </div>

            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Samaritans (UK)</h3>
              <p className="text-2xl font-bold text-primary">116 123</p>
              <p className="text-sm text-muted-foreground">Free to call, 24/7</p>
            </div>

            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">International Association for Suicide Prevention</h3>
              <p className="text-primary font-medium">https://www.iasp.info/resources/Crisis_Centres/</p>
              <p className="text-sm text-muted-foreground">Find a crisis center in your country</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <RefreshCw className="h-5 w-5 text-primary" />
            Changes to Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            We may update these terms as our service evolves or as required by law. When we make changes:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>We'll update the "Last updated" date at the top of this page</li>
            <li>For significant changes, we'll notify you via email or through the app at least 30 days in advance</li>
            <li>Continuing to use our services after changes means you accept the new terms</li>
            <li>If you disagree with changes, you may close your account at any time</li>
          </ul>
          
          <p className="text-muted-foreground leading-relaxed">
            We encourage you to review these terms periodically to stay informed about how we operate.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about these terms or need to reach us for any reason:
          </p>
          
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <p className="text-foreground">
              <span className="font-medium">Legal Inquiries:</span> legal@wellbeinghelp.com
            </p>
            <p className="text-foreground">
              <span className="font-medium">General Support:</span> support@wellbeinghelp.com
            </p>
            <p className="text-foreground">
              <span className="font-medium">Company:</span> Wellbeing@Fingertip Ltd, London, United Kingdom
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>
          By using mywellbeingtoday, you agree to these Terms of Service.
          See also our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
