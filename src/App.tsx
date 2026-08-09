import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/Header';
import BrowsePage from './pages/BrowsePage';
import ModPage from './pages/ModPage';

export default function App() {
  return (
    <LanguageProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Routes>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/mod/:slug" element={<ModPage />} />
        </Routes>
      </div>
    </LanguageProvider>
  );
}
