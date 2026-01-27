import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreatePrompt from './pages/CreatePrompt';
import PromptDetail from './pages/PromptDetail';
import VersionComparison from './pages/VersionComparison';
import { ToastProvider } from './components/ui';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/prompts/new" element={<CreatePrompt />} />
            <Route path="/prompts/:id" element={<PromptDetail />} />
            <Route path="/prompts/:id/compare/:v1/:v2" element={<VersionComparison />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
