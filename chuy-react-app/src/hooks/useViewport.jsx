import { useEffect, useState } from 'react';

const getSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

const useViewport = () => {
  const [size, setSize] = useState(getSize());

  useEffect(() => {
    const handleResize = () => setSize(getSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = size.width < 768;
  const isTabletOrDesktop = size.width >= 768;

  return { ...size, isMobile, isTabletOrDesktop };
};

export default useViewport;

