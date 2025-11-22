import { useState, useEffect } from 'react';
import { AuthGate } from './components/AuthGate';
import { ChatInterface } from './components/ChatInterface';
import { Sidebar } from './components/Sidebar';
import { supabase } from './lib/supabase';
import { LandingPage } from './components/LandingPage';
import { getUsernameFromSession, initializeDailyUsernameRefresh, syncLocalIdentityToSupabase } from './lib/utils';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [college, setCollege] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [showLanding, setShowLanding] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        const userCollege = session.user.user_metadata?.college;
        if (userCollege) {
          setCollege(userCollege);
          setShowLanding(false);
        }
        // Initialize daily username refresh timer
        initializeDailyUsernameRefresh(session);
        // Sync local identity to Supabase if needed (fixes multi-device sync)
        syncLocalIdentityToSupabase(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        const userCollege = session.user.user_metadata?.college;
        if (userCollege) {
          setCollege(userCollege);
          setShowLanding(false);
        }
        // Initialize daily username refresh timer
        initializeDailyUsernameRefresh(session);
        // Sync local identity to Supabase if needed (fixes multi-device sync)
        syncLocalIdentityToSupabase(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCollege(null);
    setSession(null);
    setShowLanding(true);
  };

  if (showLanding && !session) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!session || !college) {
    return <AuthGate onAuthSuccess={() => { }} />;
  }

  const username = getUsernameFromSession(session);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar
        college={college}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        onSignOut={handleSignOut}
        username={username}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="flex-1 h-full relative">
        <ChatInterface
          college={college}
          currentUserId={session.user.id}
          filter={currentFilter}
          scrollToMessageId={null}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />
      </main>
    </div>
  );
}
