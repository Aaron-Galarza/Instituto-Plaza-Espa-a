import Image from 'next/image';

type BrandVariant = 'horizontal' | 'vertical' | 'isotipo' | 'circular';

const assets = {
  horizontal: { src: '/brand/logo-horizontal.png', width: 1001, height: 246 },
  vertical: { src: '/brand/logo-vertical.png', width: 822, height: 603 },
  isotipo: { src: '/brand/isotipo.png', width: 349, height: 388 },
  circular: { src: '/brand/submarca-circular.png', width: 508, height: 521 },
} as const;

export function BrandLogo({
  variant,
  className,
  priority = false,
}: {
  variant: BrandVariant;
  className?: string;
  priority?: boolean;
}) {
  const asset = assets[variant];
  return (
    <Image
      {...asset}
      className={className}
      alt="Instituto de Rehabilitación Plaza España"
      priority={priority}
      sizes="(max-width: 820px) 180px, 300px"
    />
  );
}
