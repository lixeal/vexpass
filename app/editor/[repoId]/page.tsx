'use client';
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useSearchParams } from 'next/navigation';

export default function EditorPage({ params }: { params: { repoId: string } }) {
  const searchParams = useSearchParams();
  const filePath = searchParams.get('file'); // Получаем путь к файлу из URL (?file=...)
  const [code, setCode] = useState<string>('// Loading code...');

  useEffect(() => {
    // Тут мы будем запрашивать контент файла через GitHub API
    // Пока просто имитация загрузки
    if (filePath) {
      console.log(`Loading file: ${filePath} from repo: ${params.repoId}`);
      // fetch(`/api/get-content?path=${filePath}`).then(...)
    }
  }, [filePath, params.repoId]);

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e]">
      {/* Шапка редактора */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-gray-300 border-b border-[#3c3c3c]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-blue-400">{params.repoId}</span>
          <span className="text-sm text-gray-500">/</span>
          <span className="text-sm font-medium">{filePath?.split('/').pop()}</span>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded transition"
          onClick={() => alert('Saving to GitHub...')}
        >
          Commit Changes
        </button>
      </div>

      {/* Сам Monaco Editor */}
      <div className="flex-grow">
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
