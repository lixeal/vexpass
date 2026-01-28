import { getRepoContent } from '@/lib/github';
import Link from 'next/link';

export default async function RepoPage({ params, searchParams }: any) {
  const repoName = params.name;
  const subPath = searchParams.path || '';
  const fullPath = `data/${repoName}${subPath ? '/' + subPath : ''}`;
  
  const files = await getRepoContent(fullPath);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a]">
      {/* Шапка (Header) */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold hover:bg-gray-800 transition">V</Link>
          <div className="flex items-center text-sm font-medium">
            <Link href="/" className="text-gray-600 hover:text-black">projects</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-black font-bold">{repoName}</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="text-sm bg-black text-white px-4 py-1.5 rounded-md hover:bg-gray-800 transition">Deploy</button>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto mt-8 px-6 pb-20">
        {/* Заголовок проекта */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{repoName}</h1>
            <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-bold">PUBLIC</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Files and assets for {repoName}</p>
        </div>

        {/* Проводник файлов */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Инфо-строка */}
          <div className="bg-[#fcfcfc] border-b border-gray-200 p-3 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <span className="font-semibold">VercelHub Bot</span>
              <span className="text-gray-500">Auto-fetch from GitHub</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium">Add file</button>
          </div>

          {/* Сама таблица файлов */}
          <div className="divide-y divide-gray-100">
            {Array.isArray(files) ? files.map((file: any) => (
              <div key={file.sha} className="flex items-center justify-between p-4 hover:bg-[#fbfbfb] transition group">
                <div className="w-1/3 flex items-center gap-3">
                  {/* Иконка */}
                  <span className="text-xl">
                    {file.type === 'dir' ? (
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    )}
                  </span>
                  
                  {/* Название со ссылкой */}
                  {file.type === 'dir' ? (
                    <Link href={`?path=${subPath}/${file.name}`} className="text-sm font-medium text-blue-600 group-hover:underline">
                      {file.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-800">{file.name}</span>
                  )}
                </div>

                {/* Правая часть (Кнопки) */}
                <div className="flex items-center gap-4">
                  {file.type !== 'dir' && (
                    <>
                      <Link 
                        href={`/editor/${repoName}?file=${file.path}`}
                        className="opacity-0 group-hover:opacity-100 transition text-xs text-gray-500 border border-gray-300 px-3 py-1 rounded-md hover:bg-white hover:text-black shadow-sm"
                      >
                        Edit
                      </Link>
                      <a href={file.download_url} className="text-gray-400 hover:text-blue-600 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      </a>
                    </>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-12 text-center flex flex-col items-center">
                <span className="text-4xl mb-2">📁</span>
                <p className="text-gray-400 text-sm">This folder is empty</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
