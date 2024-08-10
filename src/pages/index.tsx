import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to custom HTML file
    router.push('/index.html');
  }, [router]);

  return null; // This page will redirect to the HTML file
};

export default Home;