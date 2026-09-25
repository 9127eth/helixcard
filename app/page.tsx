import HomeClient from './components/home/HomeClient';
import { loadDemoCard } from './components/home/demoCard';

export default async function Home() {
  const demoCard = await loadDemoCard();
  return <HomeClient demoCard={demoCard} />;
}
