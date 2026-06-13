import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, BottomNav } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { useAppState } from './lib/store';

export type Page = 'landing' | 'onboarding' | 'dashboard' | 'profile';

export default function App() {
  const [state] = useAppState();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    if (state.profile) return 'dashboard';
    return 'landing';
  });

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':    return <Landing onStart={() => setCurrentPage('onboarding')} />;
      case 'onboarding': return <Onboarding onComplete={() => setCurrentPage('dashboard')} />;
      case 'dashboard':  return <Dashboard />;
      case 'profile':    return <Profile onReset={() => setCurrentPage('landing')} />;
      default:           return <Landing onStart={() => setCurrentPage('onboarding')} />;
    }
  };

  const showSidebar = currentPage !== 'landing' && currentPage !== 'onboarding';

  return (
    <div className="min-h-screen flex text-[#2D2D2D] font-sans selection:bg-[#FF8CAF]/30">
      {showSidebar && <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />}

      <main className={`flex-1 relative overflow-hidden ${showSidebar ? 'pb-20 md:pb-0' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showSidebar && <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />}
    </div>
  );
}
