'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CarouselViewProps {
  onResetToSplash: () => void;
}

interface Item {
  title: string;
  image: string;
  type: 'modal' | 'link';
  href?: string;
}

export default function CarouselView({ onResetToSplash }: CarouselViewProps) {
  const router = useRouter();

  const items: Item[] = [
    { title: 'Conveyance, Solved', image: 'conveyance.jpg', type: 'modal' },
    { title: 'No More Tool Sticking', image: 'sticking.jpg', type: 'modal' },
    { title: 'Engineering Excellence', image: 'catalog.png', type: 'link', href: '/catalog?from=carousel' },
    { title: 'Global Deployment', image: 'trackrecord.png', type: 'link', href: '/dashboard?from=carousel' },
    { title: 'Precise Tool Orientation', image: 'orientation.jpg', type: 'modal' },
    { title: 'Enhanced Sampling & Imaging', image: 'sampling.jpg', type: 'modal' },
    { title: 'Navigating Ledges & Washouts', image: 'ledges.jpg', type: 'modal' },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const centerIndex = Math.floor(items.length / 2);
  const [visibleCenterIndex, setVisibleCenterIndex] = useState(centerIndex);
  const [modalItem, setModalItem] = useState<Item | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT = 60000;

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (!modalItem) {
      inactivityTimer.current = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onResetToSplash(), 1000);
      }, IDLE_TIMEOUT);
    }
  }, [modalItem, onResetToSplash]);

  const scroll = useCallback(
    (dir: 'left' | 'right') => {
      resetInactivityTimer();
      const container = scrollRef.current;
      if (!container) return;

      setVisibleCenterIndex((prevIndex) => {
        const offset = dir === 'left' ? -1 : 1;
        const nextIndex = Math.max(0, Math.min(items.length - 1, prevIndex + offset));
        const card = cardRefs.current[nextIndex];
        if (!card) return prevIndex;

        const scrollTo = card.offsetLeft + card.offsetWidth / 2 - container.offsetWidth / 2;
        container.scrollTo({ left: scrollTo, behavior: 'smooth' });
        return nextIndex;
      });
    },
    [resetInactivityTimer, items.length]
  );

  useEffect(() => {
    const container = scrollRef.current;
    const card = cardRefs.current[centerIndex];
    if (container && card) {
      const scrollTo = card.offsetLeft + card.offsetWidth / 2 - container.offsetWidth / 2;
      container.scrollTo({ left: scrollTo, behavior: 'auto' });
    }
  }, [centerIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalItem(null);
      else if (e.key === 'ArrowLeft') scroll('left');
      else if (e.key === 'ArrowRight') scroll('right');
      resetInactivityTimer();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [scroll, resetInactivityTimer]);

  useEffect(() => {
    resetInactivityTimer();
    const events = ['mousemove', 'click', 'keydown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let startX = 0;
    let isSwiping = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isSwiping = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > 60) {
        scroll(dx > 0 ? 'left' : 'right');
        isSwiping = false;
      }
    };

    const handleTouchEnd = () => {
      isSwiping = false;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scroll]);

  return (
    <div
      className={`relative w-full h-screen bg-blue-800 flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Image
        src="/images/tv-bg.png"
        alt="Background"
        fill
        priority
        className="absolute inset-0 object-cover z-0"
      />

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
            <Image
              src={`/images/${modalItem.image}`}
              alt={modalItem.title}
              width={800}
              height={600}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-blue-800 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-blue-800 to-transparent z-10 pointer-events-none" />

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

      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar scroll-snap-x mandatory gap-8 px-[20vw]"
        style={{ perspective: '2000px' }}
      >
        {items.map((item, index) => {
          const offset = index - visibleCenterIndex;
          const absOffset = Math.abs(offset);
          const isCenter = offset === 0;

          const rotateY = offset * -45;
          const scale = 1 - absOffset * 0.1;
          const translateX = offset * 60;
          const translateZ = -absOffset * 100;
          const opacity = 1 - absOffset * 0.3;

          const transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;

          return (
            <div
              key={index}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              onClick={() => {
                resetInactivityTimer();
                if (isCenter) {
                  if (item.type === 'link' && item.href) {
                    router.push(item.href);
                  } else {
                    setModalItem(item);
                  }
                }
              }}
              className={`flex-shrink-0 w-52 h-52 rounded-xl overflow-hidden scroll-snap-align-center transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${
                isCenter ? 'cursor-pointer hover:scale-110 shadow-2xl' : 'pointer-events-none'
              }`}
              style={{
                transform,
                opacity,
                transformStyle: 'preserve-3d',
                WebkitBoxReflect: 'below 0.5em linear-gradient(transparent, rgba(0, 0, 0, 0.25))',
              }}
            >
              <Image
                src={`/images/${item.image}`}
                alt={item.title}
                width={208}
                height={208}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
