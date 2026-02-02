import { Check, X, AlertCircle } from "lucide-react";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true,
  className 
}: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);
  
  const strengthColors = {
    weak: 'bg-red-500',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500'
  };
  
  const strengthLabels = {
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong'
  };
  
  const strengthWidth = {
    weak: '25%',
    fair: '50%',
    good: '75%',
    strong: '100%'
  };

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password Strength</span>
          <span className={cn(
            "font-medium",
            validation.strength === 'weak' && 'text-red-600',
            validation.strength === 'fair' && 'text-orange-600',
            validation.strength === 'good' && 'text-yellow-600',
            validation.strength === 'strong' && 'text-green-600'
          )}>
            {strengthLabels[validation.strength]}
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300 rounded-full", strengthColors[validation.strength])}
            style={{ width: strengthWidth[validation.strength] }}
          />
        </div>
      </div>
      
      {showRequirements && (
        <div className="grid grid-cols-1 gap-1 pt-1">
          <RequirementItem 
            met={validation.checks.minLength} 
            text={`At least ${PASSWORD_REQUIREMENTS.minLength} characters`} 
          />
          <RequirementItem 
            met={validation.checks.hasUppercase} 
            text="One uppercase letter (A-Z)" 
          />
          <RequirementItem 
            met={validation.checks.hasLowercase} 
            text="One lowercase letter (a-z)" 
          />
          <RequirementItem 
            met={validation.checks.hasNumber} 
            text="One number (0-9)" 
          />
          <RequirementItem 
            met={validation.checks.hasSpecialChar} 
            text="One special character (!@#$%...)" 
          />
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs transition-colors",
      met ? "text-green-600" : "text-muted-foreground"
    )}>
      {met ? (
        <Check className="w-3 h-3 flex-shrink-0" />
      ) : (
        <X className="w-3 h-3 flex-shrink-0 text-red-400" />
      )}
      <span>{text}</span>
    </div>
  );
}

interface PasswordPolicyBannerProps {
  className?: string;
}

export function PasswordPolicyBanner({ className }: PasswordPolicyBannerProps) {
  return (
    <div className={cn(
      "flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800",
      className
    )}>
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Password Requirements</p>
        <p className="text-blue-700 mt-0.5">
          Must be at least {PASSWORD_REQUIREMENTS.minLength} characters with uppercase, lowercase, number, and special character.
        </p>
      </div>
    </div>
  );
}
