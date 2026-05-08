// src/app/page.tsx
import { MusicaList } from '@/components/MusicaList';

export default function Home() {
  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto">
        <MusicaList />
      </div>
    </main>
  );
}
