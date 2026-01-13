import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PromptDetail from './pages/PromptDetail';
import VersionComparison from './pages/VersionComparison';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prompts/:id" element={<PromptDetail />} />
          <Route path="/prompts/:id/compare/:v1/:v2" element={<VersionComparison />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
