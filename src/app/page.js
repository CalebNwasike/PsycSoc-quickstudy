import { loadMCATData } from '@/lib/csvParser';
import ModeSwitcher from '@/app/components/ModeSwitcher';

export default function Home() {
  const terms = loadMCATData();
  
  return <ModeSwitcher terms={terms} />;
}