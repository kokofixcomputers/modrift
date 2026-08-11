import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { PlatformProvider } from './contexts/PlatformContext';
import { Header } from './components/Header';
import BrowsePage from './pages/BrowsePage';
import ModPage from './pages/ModPage';
import CFModPage from './pages/CFModPage';
import UserPage from './pages/UserPage';
import OrgPage from './pages/OrgPage';

export default function App() {
  return (
    <LanguageProvider>
      <PlatformProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <Routes>
            <Route path="/" element={<BrowsePage />} />
            <Route path="/mod/:slug" element={<ModPage />} />
            <Route path="/cf/:id" element={<CFModPage />} />
            <Route path="/user/:username" element={<UserPage />} />
            <Route path="/org/:id" element={<OrgPage />} />
          </Routes>
        </div>
      </PlatformProvider>
    </LanguageProvider>
  );
}
