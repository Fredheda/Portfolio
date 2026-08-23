import { createContext, useContext } from 'react';

const ChatThreadContext = createContext(null);

export function ChatThreadProvider({ resetThread, children }) {
  return <ChatThreadContext.Provider value={{ resetThread }}>{children}</ChatThreadContext.Provider>;
}

export function useChatThread() {
  const ctx = useContext(ChatThreadContext);
  if (!ctx) {
    throw new Error('useChatThread must be used within a ChatThreadProvider');
  }
  return ctx;
}
