import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, Eye, Users, Mail, FileText, Server, Brain, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 26, 2026</p>
          </div>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <p className="text-foreground/90 leading-relaxed">
            Welcome to the mywellbeingtoday self-care webapp of Wellbeing@Fingertip Ltd ("we," "us," or "our"). 
            We understand that your health and wellbeing information is deeply personal. We are committed to 
            protecting your privacy and being transparent about how we handle your data. This Privacy Policy 
            explains what information we collect, how we use it, how we protect it, and the choices you have 
            regarding your personal data.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Information We Collect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Account Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account, we collect basic information such as your name, email address, 
              password (stored in encrypted form), and optional profile details like your phone number, 
              date of birth, and profile picture. This information helps us personalize your experience, 
              communicate with you, and keep your account secure.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Health and Wellness Self-Care Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              To provide you with meaningful insights and personalized recommendations, we collect the 
              information you choose to share with us, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Mood and emotional wellbeing entries</li>
              <li>Activity logs, exercise records, and lifestyle habits</li>
              <li>Sleep patterns and quality indicators</li>
              <li>Personal reflections, journal entries, and notes</li>
              <li>Goals, milestones, and progress tracking data</li>
              <li>Symptom tracking and health-related observations</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Communication Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We collect information from your communications with us, including support requests, 
              feedback, and any messages you send through our platform. This includes messages 
              exchanged with healthcare providers through our secure messaging system.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Appointment Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you book appointments with healthcare providers through our platform, we collect 
              appointment details including date, time, provider information, appointment type, 
              and any notes or preferences you provide for your visit.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Server className="h-5 w-5 text-primary" />
            Automatically Collected Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Device Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              We automatically collect certain information about your device, including device type, 
              operating system and version, unique device identifiers, browser type, and screen resolution. 
              This helps us optimize our platform for your device and troubleshoot technical issues.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Usage Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              We collect data about how you interact with our platform, including pages visited, 
              features used, time spent on different sections, click patterns, and navigation paths. 
              This information helps us improve our services and user experience.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Log Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our servers automatically record information when you access our platform, including 
              your IP address, access times, referring URLs, and general location information 
              (country or region). This data is used for security monitoring, analytics, and 
              service optimization.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Eye className="h-5 w-5 text-primary" />
            How We Use Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Personalization</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use your data to provide personalized insights, recommendations, and wellbeing scores 
              that are tailored to your unique patterns and goals. The more you share, the more helpful 
              our suggestions become.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Service Delivery</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use your information to provide, maintain, and improve our services, process 
              appointments, facilitate communication with healthcare providers, and respond to 
              your inquiries and support requests.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Improving Our Services</h3>
            <p className="text-muted-foreground leading-relaxed">
              We use aggregated, anonymized data to improve our platform, develop new features, and 
              conduct research that benefits the broader wellbeing community. Individual data is never 
              shared in identifiable form for these purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Brain className="h-5 w-5 text-primary" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Our platform uses artificial intelligence and machine learning technologies to analyze 
            your wellbeing data and provide personalized insights. Here's how our AI features work:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Our AI assistant analyzes patterns in your mood, activity, and sleep data to identify trends</li>
            <li>We generate personalized recommendations based on your unique wellbeing profile</li>
            <li>AI helps identify potential correlations between your lifestyle factors and wellbeing outcomes</li>
            <li>Natural language processing enables conversational interactions with our AI assistant</li>
          </ul>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
              <strong>Important:</strong> AI-generated insights are designed to support—not replace—professional 
              healthcare advice. Always consult qualified healthcare providers for medical decisions.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Lock className="h-5 w-5 text-primary" />
            Data Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            We take the security of your data seriously and implement industry-leading measures to protect it:
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Encryption</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                <li>All data in transit is encrypted using TLS 1.3 protocols</li>
                <li>Sensitive data at rest is encrypted using AES-256 encryption</li>
                <li>Passwords are hashed using industry-standard bcrypt algorithms</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Access Controls</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                <li>Role-based access control limits data access to authorized personnel only</li>
                <li>Multi-factor authentication is available for enhanced account security</li>
                <li>Regular access reviews ensure appropriate permissions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Audit Logging</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                <li>Comprehensive audit logs track all system access and data modifications</li>
                <li>Security events are monitored in real-time for anomaly detection</li>
                <li>Regular security audits and penetration testing are conducted</li>
              </ul>
            </div>
          </div>
          
          <p className="text-muted-foreground leading-relaxed mt-4">
            While we work hard to protect your information, no system is completely secure. 
            We encourage you to use a strong, unique password and keep your account credentials safe.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Users className="h-5 w-5 text-primary" />
            Data Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200 font-medium">
              We do not sell your personal data. Ever.
            </p>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            We only share your information in the following limited circumstances:
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Healthcare Providers</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                When you book appointments through our platform, healthcare providers can view 
                appointment-related information and any data you explicitly choose to share with them. 
                You control what information is visible to each provider.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Service Providers</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We work with trusted third-party services (such as cloud hosting, email providers, 
                and payment processors) who help us operate our platform. These providers are bound 
                by strict confidentiality agreements and can only use your data to provide services to us.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Legal Requirements</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We may disclose information if required by law, court order, or to protect the safety 
                of our users or the public.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-blue-700 dark:text-blue-400">
            <AlertTriangle className="h-5 w-5" />
            HIPAA Notice (For US Users)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 leading-relaxed text-sm">
              <strong>Important:</strong> While mywellbeingtoday implements strong security measures and 
              privacy protections, our self-care wellness platform is not intended to be used as a 
              covered entity under HIPAA (Health Insurance Portability and Accountability Act).
            </p>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            If you are a healthcare provider using our platform to communicate with patients, you are 
            responsible for ensuring your use complies with applicable healthcare privacy regulations. 
            We recommend:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
            <li>Not sharing Protected Health Information (PHI) through our platform unless you have appropriate safeguards in place</li>
            <li>Obtaining patient consent before discussing health matters through our messaging system</li>
            <li>Contacting us at <span className="text-primary">privacy@wellbeinghelp.com</span> if you require a Business Associate Agreement (BAA)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Your Rights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            You have control over your personal data. Here are your rights:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Access Your Data</h3>
              <p className="text-sm text-muted-foreground">
                You can view all the data we have about you through your account settings or by requesting a data export.
              </p>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Correct Your Data</h3>
              <p className="text-sm text-muted-foreground">
                If any information is inaccurate, you can update it directly in your profile or contact us for assistance.
              </p>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Delete Your Data</h3>
              <p className="text-sm text-muted-foreground">
                You can request deletion of your account and associated data at any time through your settings.
              </p>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Data Portability</h3>
              <p className="text-sm text-muted-foreground">
                You can export your data in a standard format to take with you or use with other services.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Mail className="h-5 w-5 text-primary" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this privacy policy or how we handle your data, 
            we're here to help. Please reach out to us:
          </p>
          
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <p className="text-foreground">
              <span className="font-medium">Privacy Inquiries:</span> privacy@wellbeinghelp.com
            </p>
            <p className="text-foreground">
              <span className="font-medium">Data Protection Officer:</span> dpo@wellbeinghelp.com
            </p>
            <p className="text-foreground">
              <span className="font-medium">Company:</span> Wellbeing@Fingertip Ltd, London, United Kingdom
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            We aim to respond to all privacy-related inquiries within 30 days. For data subject access 
            requests under GDPR, we will respond within one month of receiving your request.
          </p>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>
          By using mywellbeingtoday, you agree to this Privacy Policy.
          See also our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}
