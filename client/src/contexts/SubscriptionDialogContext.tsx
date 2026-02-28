import { createContext, useContext, useState, type ReactNode } from "react";
import { SubscriptionDialog } from "@/components/subscription-dialog";

interface SubscriptionDialogContextType {
  openSubscriptionDialog: () => void;
  closeSubscriptionDialog: () => void;
  isOpen: boolean;
}

const SubscriptionDialogContext = createContext<SubscriptionDialogContextType>({
  openSubscriptionDialog: () => {},
  closeSubscriptionDialog: () => {},
  isOpen: false,
});

export function useSubscriptionDialog() {
  return useContext(SubscriptionDialogContext);
}

export function SubscriptionDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SubscriptionDialogContext.Provider
      value={{
        openSubscriptionDialog: () => setIsOpen(true),
        closeSubscriptionDialog: () => setIsOpen(false),
        isOpen,
      }}
    >
      {children}
      <SubscriptionDialog open={isOpen} onOpenChange={setIsOpen} />
    </SubscriptionDialogContext.Provider>
  );
}
