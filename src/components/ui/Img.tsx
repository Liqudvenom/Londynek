import { IMAGES, type ImageName } from '@/data/images.generated';

interface ImgProps {
  name: ImageName;
  alt: string;
  /** `sizes` attribute; defaults to a typical card width */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/** Responsive, lazy-loaded local WebP image with intrinsic dimensions to prevent layout shift. */
export function Img({ name, alt, sizes = '(max-width: 640px) 100vw, 400px', priority = false, className }: ImgProps) {
  const meta = IMAGES[name];
  const [small, large] = meta.widths;
  const [rw, rh] = meta.ratio;
  return (
    <img
      className={className}
      src={`/img/${name}-${small}.webp`}
      srcSet={`/img/${name}-${small}.webp ${small}w, /img/${name}-${large}.webp ${large}w`}
      sizes={sizes}
      width={small}
      height={Math.round((small * rh) / rw)}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );
}
