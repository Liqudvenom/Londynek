import type { ReactNode } from 'react';
import { Img } from '@/components/ui/Img';
import { Breadcrumbs } from '@/components/ui/primitives';
import type { ImageName } from '@/data/images.generated';
import { useParallax } from '@/hooks';

interface PageHeroProps {
  title: string;
  lead?: string;
  image: ImageName;
  imageAlt: string;
  crumbs?: { label: string; to?: string }[];
  children?: ReactNode;
  className?: string;
}

/** Photographic hero used by discovery/marketplace pages. Background uses subtle parallax. */
export function PageHero({ title, lead, image, imageAlt, crumbs, children, className = '' }: PageHeroProps) {
  const bgRef = useParallax<HTMLDivElement>(0.95);
  return (
    <section className={`page-hero ${className}`}>
      <div className="page-hero__bg" ref={bgRef}>
        <Img name={image} alt={imageAlt} sizes="100vw" priority />
      </div>
      <div className="container page-hero__inner">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <h1 className="page-hero__title">{title}</h1>
        {lead && <p className="page-hero__lead">{lead}</p>}
        {children && <div className="page-hero__content">{children}</div>}
      </div>
    </section>
  );
}

/** Calm, non-photographic page header for corporate and informational pages. */
export function PageIntro({ title, lead, crumbs, children }: { title: string; lead?: string; crumbs: { label: string; to?: string }[]; children?: ReactNode }) {
  return (
    <header className="page-intro">
      <div className="container">
        <Breadcrumbs items={crumbs} />
        <h1 className="page-intro__title">{title}</h1>
        {lead && <p className="page-intro__lead">{lead}</p>}
        {children}
      </div>
    </header>
  );
}
