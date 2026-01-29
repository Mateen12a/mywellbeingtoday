import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, MapPinOff, LayoutDashboard, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";

export default function NotFound() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center" data-testid="card-not-found">
        <CardContent className="pt-10 pb-8 px-6 space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <MapPinOff className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">?</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-not-found-title">
              Page Not Found
            </h1>
            <p className="text-muted-foreground text-base max-w-sm mx-auto" data-testid="text-not-found-description">
              Oops! The page you're looking for doesn't exist or may have been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              data-testid="button-go-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            <Link href="/">
              <Button variant="default" data-testid="button-go-home">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
          </div>

          {isAuthenticated && user && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Or go to your dashboard
              </p>
              <Link href={getDashboardPath(user.role)}>
                <Button variant="ghost" size="sm" data-testid="button-go-dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
