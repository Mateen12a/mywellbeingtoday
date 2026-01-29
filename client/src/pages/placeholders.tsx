import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const PlaceholderPage = ({ title, description }: { title: string, description: string }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex items-center gap-4">
      <Link href="/dashboard">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <h1 className="text-3xl font-serif font-bold text-foreground">{title}</h1>
    </div>
    <Card className="border-dashed border-2 bg-secondary/10 min-h-[400px] flex items-center justify-center">
      <CardContent className="text-center space-y-4 max-w-md">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary text-2xl font-bold">
          {title[0]}
        </div>
        <CardTitle className="text-xl">Coming Soon</CardTitle>
        <p className="text-muted-foreground">{description}</p>
        <Button variant="outline" className="mt-4">Notify Me When Ready</Button>
      </CardContent>
    </Card>
  </div>
);

export const ActivityLog = () => <PlaceholderPage title="Daily Activity" description="Track your daily habits, exercise, and routines here." />;
export const MoodTracker = () => <PlaceholderPage title="Mood & Symptoms" description="Monitor your emotional wellbeing and physical symptoms over time." />;
export const History = () => <PlaceholderPage title="Wellbeing History" description="View charts and trends of your wellbeing journey." />;
export const Directory = () => <PlaceholderPage title="Health Directory" description="Find professionals and emergency contacts near you." />;
export const Certificates = () => <PlaceholderPage title="Certificates" description="View and download your earned certificates." />;
export const Settings = () => <PlaceholderPage title="Settings" description="Manage your profile, notifications, and privacy preferences." />;
export const Admin = () => <PlaceholderPage title="Admin Dashboard" description="Manage users, content, and system settings." />;
