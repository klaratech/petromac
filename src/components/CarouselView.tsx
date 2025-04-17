'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CarouselView() {
  const router = useRouter();

  const items = [
    { title: 'Global Deployment', image: 'global.jpg', type: 'link', href: '/dashboard' },
    { title: 'Conveyance, Solved', image: 'conveyance.jpg', type: 'modal' },
    { title: 'No More Tool Sticking', image: 'sticking.jpg', type: 'modal' },
    { title: 'Precise Tool Orientation', image: 'orientation.jpg', type: 'modal' },
    { title: 'Enhanced Sampling & Imaging', image: 'sampling.jpg', type: 'modal' },
    { title: 'Navigating Ledges & Washouts', image: 'ledges.jpg', type: 'modal' },
    { title: 'Modular Devices', image: 'devices.jpg', type: 'link', href: '/devices' },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const centerIndex = Math.floor(items.length / 2);
  const [visibleCenterIndex, setVisibleCenterIndex] = useState(centerIndex);
  const [modalItem, setModalItem] = useState<{ title: string; image: string } | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  const IDLE_TIMEOUT = 60000; // 60 seconds
  let inactivityTimer: ReturnType<typeof setTimeout>;

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);

    if (!modalItem) {
      inactivityTimer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          router.push('/');
        }, 1000); // match fade duration
      }, IDLE_TIMEOUT);
    }
  };

  const scroll = (dir: 'left' | 'right') => {
    resetInactivityTimer();
    const container = scrollRef.current;
    if (!container) return;

    const offset = dir === 'left' ? -1 : 1;
    const nextIndex = Math.max(0, Math.min(items.length - 1, visibleCenterIndex + offset));
    const card = cardRefs.current[nextIndex];
    if (!card) return;

    const scrollTo = card.offsetLeft + card.offsetWidth / 2 - container.offsetWidth / 2;
    container.scrollTo({ left: scrollTo, behavior: 'smooth' });
    setVisibleCenterIndex(nextIndex);
  };

  useEffect(() => {
    const container = scrollRef.current;
    const card = cardRefs.current[centerIndex];
    if (!container || !card) return;

    const scrollTo = card.offsetLeft + card.offsetWidth / 2 - container.offsetWidth / 2;
    container.scrollTo({ left: scrollTo, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalItem(null);
      resetInactivityTimer();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalItem]);

  useEffect(() => {
    resetInactivityTimer();
    const events = ['mousemove', 'click', 'keydown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [modalItem]);

  return (
    <div
      className={`relative w-full h-screen bg-blue-800 flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Modal */}
      {modalItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-40 flex items-center justify-center"
          onClick={() => setModalItem(null)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalItem(null)}
              className="absolute top-4 right-4 text-black text-2xl font-bold hover:text-red-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-4">{modalItem.title}</h2>
            <img
              src={`/images/${modalItem.image}`}
              alt={modalItem.title}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Fades */}
      <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-blue-800 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-blue-800 to-transparent z-10 pointer-events-none" />

      {/* Arrows */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white text-black p-3 rounded-full shadow hover:bg-gray-200"
      >
        ◀
      </button>
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white text-black p-3 rounded-full shadow hover:bg-gray-200"
      >
        ▶
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar scroll-snap-x mandatory gap-8 px-[20vw]"
        style={{ perspective: '2000px' }}
      >
        {items.map((item, index) => {
          const offset = index - visibleCenterIndex;
          let transform = 'rotateY(0deg) scale(1)';
          let opacity = 1;

          if (offset === 0) {
            transform = 'rotateY(0deg) scale(1.2)';
          } else if (offset === -1) {
            transform = 'rotateY(30deg) scale(0.9)';
            opacity = 0.6;
          } else if (offset === 1) {
            transform = 'rotateY(-30deg) scale(0.9)';
            opacity = 0.6;
          } else {
            transform = `translateZ(-200px) scale(0.6)`;
            opacity = 0.3;
          }

          return (
            <div
              key={index}
              ref={(el) => (cardRefs.current[index] = el)}
              onClick={() => {
                resetInactivityTimer();
                if (item.type === 'link' && item.href) {
                  router.push(item.href);
                } else {
                  setModalItem(item);
                }
              }}
              className="flex-shrink-0 w-52 h-52 rounded-xl overflow-hidden shadow-2xl bg-white scroll-snap-align-center transition-all duration-500 cursor-pointer"
              style={{
                transform,
                opacity,
                transformStyle: 'preserve-3d',
                WebkitBoxReflect:
                  'below 0.5em linear-gradient(transparent, rgba(0, 0, 0, 0.25))',
              }}
            >
              <img
                src={`/images/${item.image}`}
                alt={item.title}
                className="w-full h-full object-cover rounded-xl"
                style={{ backgroundColor: '#ccc' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}