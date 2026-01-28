'use server';
import { revalidatePath } from 'next/cache';

export async function uploadToGithub(formData: FormData) {
  const file = formData.get('file') as File;
  const path = formData.get('path') as string; // Например "folder1/file.txt"
  
  const content = Buffer.from(await file.arrayBuffer()).toString('base64');

  const res = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload ${file.name}`,
        content: content,
      }),
    }
  );

  revalidatePath('/');
  return res.json();
}

export async function createFolder(folderName: string, currentPath: string) {
  // В Git нельзя создать пустую папку, создаем .gitkeep
  const path = currentPath ? `${currentPath}/${folderName}/.gitkeep` : `${folderName}/.gitkeep`;
  
  await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Create folder ${folderName}`,
        content: Buffer.from('').toString('base64'),
      }),
    }
  );
  revalidatePath('/');
}
