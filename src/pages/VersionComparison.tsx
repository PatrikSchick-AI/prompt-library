import { useQuery } from 'convex/react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { PromptVersion } from '../types/prompt';

const VersionComparison = () => {
  const { id, v1, v2 } = useParams<{ id: string; v1: string; v2: string }>();

  const version1 = useQuery(api.versions.get, id && v1 ? { promptId: id, version: v1 } : 'skip');
  const version2 = useQuery(api.versions.get, id && v2 ? { promptId: id, version: v2 } : 'skip');

  const loading = version1 === undefined || version2 === undefined;
  const error = null; // Convex handles errors differently

  if (loading) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--pl-text-muted)' }}>Loading versions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded p-4" style={{ 
        backgroundColor: '#7f1d1d', 
        border: '1px solid #991b1b',
        color: '#fca5a5'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!version1 || !version2) {
    return (
      <div className="rounded p-4" style={{ 
        backgroundColor: '#713f12', 
        border: '1px solid #854d0e',
        color: '#fbbf24'
      }}>
        <p>Versions not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          to={`/prompts/${id}`}
          className="mb-4 inline-block transition-colors"
          style={{ color: 'var(--pl-accent)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pl-accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pl-accent)'}
        >
          ← Back to Prompt
        </Link>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--pl-text)' }}>
          Version Comparison
        </h1>
        <p className="mt-2" style={{ color: 'var(--pl-text-muted)' }}>
          Comparing {version1.version_number} vs {version2.version_number}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version 1 */}
        <div 
          className="rounded p-6"
          style={{ 
            backgroundColor: 'var(--pl-surface)', 
            border: '1px solid var(--pl-border)' 
          }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--pl-text)' }}>
              Version {version1.version_number}
            </h3>
            <p className="text-sm" style={{ color: 'var(--pl-text-muted)' }}>
              {new Date(version1.created_at).toLocaleString()}
            </p>
            {version1.author && (
              <p className="text-sm" style={{ color: 'var(--pl-text-muted)' }}>By {version1.author}</p>
            )}
            <p className="text-sm mt-2" style={{ color: 'var(--pl-text)' }}>
              {version1.change_description}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>Content</h4>
            <pre 
              className="p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: '1px solid var(--pl-border)',
                color: 'var(--pl-text)'
              }}
            >
              {version1.content}
            </pre>
          </div>

          {version1.system_prompt && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
                System Prompt
              </h4>
              <pre 
                className="p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap"
                style={{ 
                  backgroundColor: 'var(--pl-bg)',
                  border: '1px solid var(--pl-border)',
                  color: 'var(--pl-text)'
                }}
              >
                {version1.system_prompt}
              </pre>
            </div>
          )}

          {version1.models && version1.models.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>Models</h4>
              <div className="flex flex-wrap gap-2">
                {version1.models.map((model) => (
                  <span
                    key={model}
                    className="px-2 py-1 text-xs rounded bg-blue-900/40 text-blue-400"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Version 2 */}
        <div 
          className="rounded p-6"
          style={{ 
            backgroundColor: 'var(--pl-surface)', 
            border: '1px solid var(--pl-border)' 
          }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--pl-text)' }}>
              Version {version2.version_number}
            </h3>
            <p className="text-sm" style={{ color: 'var(--pl-text-muted)' }}>
              {new Date(version2.created_at).toLocaleString()}
            </p>
            {version2.author && (
              <p className="text-sm" style={{ color: 'var(--pl-text-muted)' }}>By {version2.author}</p>
            )}
            <p className="text-sm mt-2" style={{ color: 'var(--pl-text)' }}>
              {version2.change_description}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>Content</h4>
            <pre 
              className="p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: '1px solid var(--pl-border)',
                color: 'var(--pl-text)'
              }}
            >
              {version2.content}
            </pre>
          </div>

          {version2.system_prompt && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
                System Prompt
              </h4>
              <pre 
                className="p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap"
                style={{ 
                  backgroundColor: 'var(--pl-bg)',
                  border: '1px solid var(--pl-border)',
                  color: 'var(--pl-text)'
                }}
              >
                {version2.system_prompt}
              </pre>
            </div>
          )}

          {version2.models && version2.models.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>Models</h4>
              <div className="flex flex-wrap gap-2">
                {version2.models.map((model) => (
                  <span
                    key={model}
                    className="px-2 py-1 text-xs rounded bg-blue-900/40 text-blue-400"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionComparison;
