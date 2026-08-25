'use client';

import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdaptiveImage } from './adaptive-image';

export function ProductGallery({ images, name, color }: { images: string[]; name: string; color: string }) {
  const list = images.length ? images : ['/giftmitra-hero.png'];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const move = (direction: number) => setIndex((current) => (current + direction + list.length) % list.length);

  useEffect(() => {
    if (paused || expanded || list.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % list.length), 4200);
    return () => window.clearInterval(timer);
  }, [paused, expanded, list.length]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
      if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + list.length) % list.length);
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % list.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [expanded, list.length]);

  return <>
    <div className="media-gallery product-gallery-slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      <div className="media-main" style={{ background: color }}>
        <AdaptiveImage key={list[index]} src={list[index]} alt={`${name}, image ${index + 1}`} fill priority sizes="(max-width:800px) 100vw,50vw" />
        <button className="gallery-open" type="button" onClick={() => setExpanded(true)} aria-label={`Open image ${index + 1} in full screen`}><span className="media-label"><Expand /> View {index + 1} of {list.length}</span></button>
        {list.length > 1 && <div className="gallery-arrows"><button type="button" onClick={() => move(-1)} aria-label="Previous product image"><ArrowLeft /></button><button type="button" onClick={() => move(1)} aria-label="Next product image"><ArrowRight /></button></div>}
      </div>
      <div className="gallery-progress"><i key={index} className={paused ? 'paused' : ''} /></div>
      <div className="media-thumbs">{list.map((image, imageIndex) => <button type="button" key={`${image}-${imageIndex}`} className={imageIndex === index ? 'selected' : ''} onClick={() => setIndex(imageIndex)} aria-label={`Show image ${imageIndex + 1}`}><AdaptiveImage src={image} alt="" width={84} height={84} /></button>)}</div>
    </div>
    {expanded && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${name} image gallery`} onMouseDown={() => setExpanded(false)}>
      <button className="lightbox-close" type="button" onClick={() => setExpanded(false)} aria-label="Close full-screen gallery"><X /></button>
      <div className="lightbox-stage" onMouseDown={(event) => event.stopPropagation()}>
        <div className="lightbox-image"><AdaptiveImage key={`full-${list[index]}`} src={list[index]} alt={`${name}, full image ${index + 1}`} fill priority sizes="100vw" /></div>
        {list.length > 1 && <><button className="lightbox-arrow previous" type="button" onClick={() => move(-1)} aria-label="Previous image"><ArrowLeft /></button><button className="lightbox-arrow next" type="button" onClick={() => move(1)} aria-label="Next image"><ArrowRight /></button></>}
        <span className="lightbox-count">{index + 1} / {list.length}</span>
        <div className="lightbox-thumbs">{list.map((image, imageIndex) => <button type="button" key={`full-thumb-${image}-${imageIndex}`} className={imageIndex === index ? 'selected' : ''} onClick={() => setIndex(imageIndex)} aria-label={`View image ${imageIndex + 1}`}><AdaptiveImage src={image} alt="" width={72} height={72} /></button>)}</div>
      </div>
    </div>}
  </>;
}
