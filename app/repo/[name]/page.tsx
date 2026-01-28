import { getRepoContent } from '@/lib/github';
import Link from 'next/link';

export default async function RepoPage({ params, searchParams }: any) {
  const repoName = params.name;
  const subPath = searchParams.path || '';
  const fullPath = `data/${repoName}${subPath ? '/' + subPath : ''}`;
  
  const files = await getRepoContent(fullPath);

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Хлебные крошки (Breadcrumbs) */}
      <nav className="flex items-center text-sm text-slate-500 mb-6 space-x-2">
        <Link href="/" className="hover:text-blue-600">Projects</Link>
        <span>/</span>
        <span className="font-bold text-slate-900">{repoName}</span>
      </nav>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700">Files</span>
          <div className="space-x-2">
             <button className="text-xs bg-white border px-3 py-1 rounded hover:bg-slate-100">Upload</button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {Array.isArray(files) ? files.map((file: any) => (
            <div key={file.sha} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
              <div className="flex items-center">
                <span className="mr-3 text-lg">{file.type === 'dir' ? '📂' : '📄'}</span>
                {file.type === 'dir' ? (
                  <Link href={`?path=${subPath}/${file.name}`} className="text-blue-600 font-medium hover:underline">
                    {file.name}
                  </Link>
                ) : (
                  <span className="text-slate-700 font-medium">{file.name}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {file.type !== 'dir' && (
                  <>
                    <Link 
                      href={`/editor/${repoName}?file=${file.path}`}
                      className="text-xs text-slate-500 border px-2 py-1 rounded hover:bg-white"
                    >
                      Edit Code
                    </Link>
                    <a href={file.download_url} className="text-slate-400 hover:text-blue-600">
                      📥
                    </a>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-slate-400">Empty folder</div>
          )}
        </div>
      </div>
    </div>
  );
}
