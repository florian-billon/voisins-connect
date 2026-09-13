import { I18nProvider } from "@/lib/i18n";
import { ChatProvider } from "@/components/providers/ChatProvider";
import { VoiceProvider } from "@/contexts/VoiceContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <VoiceProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </VoiceProvider>
    </I18nProvider>
  );
} 