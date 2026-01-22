import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pl-bg)' }}>
      <header style={{ 
        backgroundColor: 'var(--pl-surface)', 
        borderBottom: '1px solid var(--pl-border)' 
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              to="/" 
              className="flex items-center gap-2 transition-colors hover:opacity-80"
              style={{ color: 'var(--pl-text)' }}
            >
              <h1 className="text-2xl font-bold">Prompt Library</h1>
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
