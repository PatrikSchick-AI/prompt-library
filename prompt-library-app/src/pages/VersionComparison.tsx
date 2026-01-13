import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { versionsApi } from '../lib/api';
import type { PromptVersion } from '../types/prompt';

const VersionComparison = () => {
  const { id, v1, v2 } = useParams<{ id: string; v1: string; v2: string }>();
  const [version1, setVersion1] = useState<PromptVersion | null>(null);
  const [version2, setVersion2] = useState<PromptVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!id || !v1 || !v2) return;

      try {
        setLoading(true);
        setError(null);
        const [ver1, ver2] = await Promise.all([
          versionsApi.get(id, v1),
          versionsApi.get(id, v2),
        ]);
        setVersion1(ver1);
        setVersion2(ver2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch versions');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [id, v1, v2]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading versions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!version1 || !version2) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">Versions not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          to={`/prompts/${id}`}
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Prompt
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">
          Version Comparison
        </h1>
        <p className="text-slate-600 mt-2">
          Comparing {version1.version_number} vs {version2.version_number}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version 1 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Version {version1.version_number}
            </h3>
            <p className="text-sm text-slate-600">
              {new Date(version1.created_at).toLocaleString()}
            </p>
            {version1.author && (
              <p className="text-sm text-slate-600">By {version1.author}</p>
            )}
            <p className="text-sm text-slate-700 mt-2">
              {version1.change_description}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Content</h4>
            <pre className="bg-slate-50 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
              {version1.content}
            </pre>
          </div>

          {version1.system_prompt && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                System Prompt
              </h4>
              <pre className="bg-slate-50 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                {version1.system_prompt}
              </pre>
            </div>
          )}

          {version1.models && version1.models.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Models</h4>
              <div className="flex flex-wrap gap-2">
                {version1.models.map((model) => (
                  <span
                    key={model}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Version 2 */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Version {version2.version_number}
            </h3>
            <p className="text-sm text-slate-600">
              {new Date(version2.created_at).toLocaleString()}
            </p>
            {version2.author && (
              <p className="text-sm text-slate-600">By {version2.author}</p>
            )}
            <p className="text-sm text-slate-700 mt-2">
              {version2.change_description}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Content</h4>
            <pre className="bg-slate-50 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
              {version2.content}
            </pre>
          </div>

          {version2.system_prompt && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                System Prompt
              </h4>
              <pre className="bg-slate-50 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                {version2.system_prompt}
              </pre>
            </div>
          )}

          {version2.models && version2.models.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Models</h4>
              <div className="flex flex-wrap gap-2">
                {version2.models.map((model) => (
                  <span
                    key={model}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
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
