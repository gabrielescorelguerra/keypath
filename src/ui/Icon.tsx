import type { SVGProps } from 'react'

/** Ícones próprios, traço 1,5px em grade de 20px (docs/design.md §4). */
const PATHS = {
  home: 'M3.5 9 10 3.5 16.5 9v7a.5.5 0 0 1-.5.5h-3.5v-5h-5v5H4a.5.5 0 0 1-.5-.5Z',
  library: 'M4 3.5h3v13H4zM8.5 3.5h3v13h-3zM13 4.2l2.9-.8 3 12.6-2.9.8z',
  practice: 'M10 3v14M6 6v8M14 6v8M2.5 8.5v3M17.5 8.5v3',
  check: 'M4 10.5 8 14.5 16 5.5',
  checklist: 'M3.5 5.5l1.5 1.5 2.5-3M3.5 12.5 5 14l2.5-3M10 6h6.5M10 13h6.5',
  settings: 'M4 5h8M15 5h1M4 10h2M9 10h7M4 15h6M13 15h3M12.5 3.5v3M7.5 8.5v3M11.5 13.5v3',
  track: 'M3 15.5h3v-4H3zM8.5 15.5h3v-8h-3zM14 15.5h3v-12h-3z',
  play: 'M7 4.8v10.4a.5.5 0 0 0 .77.42l8-5.2a.5.5 0 0 0 0-.84l-8-5.2A.5.5 0 0 0 7 4.8Z',
  stop: 'M5.5 5.5h9v9h-9z',
  plus: 'M10 4v12M4 10h12',
  minus: 'M4 10h12',
  search: 'M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12.5 12.5 17 17',
  upload: 'M10 13V3.5M6 7.5l4-4 4 4M3.5 13v2.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V13',
  file: 'M5 2.5h6.5L15 6v11.5H5zM11.5 2.5V6H15',
  image: 'M3.5 4.5h13v11h-13zM3.5 13l4-4 3.5 3.5 2-2 3.5 3.5M12.5 8a1 1 0 1 0 0-.01',
  note: 'M8 15.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm0 0V4.5l8-1.5v10.5M16 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  video: 'M3 5h10v10H3zM13 8.5l4-2.5v8l-4-2.5',
  trash: 'M4 5.5h12M8 5.5V3.5h4v2M5.5 5.5l.7 11h7.6l.7-11',
  arrow: 'M4 10h11.5M11 5.5l4.5 4.5-4.5 4.5',
  back: 'M16 10H4.5M9 5.5 4.5 10 9 14.5',
  chevron: 'M8 5.5 12.5 10 8 14.5',
  clock: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM10 6v4l2.5 2.5',
  book: 'M3.5 4.5c2.5-1 4.5-1 6.5.5 2-1.5 4-1.5 6.5-.5v11c-2.5-1-4.5-1-6.5.5-2-1.5-4-1.5-6.5-.5zM10 5v11',
  spark: 'M10 3v4M10 13v4M3 10h4M13 10h4M5.5 5.5l2 2M12.5 12.5l2 2M14.5 5.5l-2 2M7.5 12.5l-2 2',
  lock: 'M5.5 9h9v7.5h-9zM7.5 9V6.5a2.5 2.5 0 0 1 5 0V9',
  download: 'M10 3.5V13M6 9l4 4 4-4M3.5 13v2.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V13',
  external: 'M11 3.5h5.5V9M16.5 3.5 9.5 10.5M14 12v4.5H3.5V6H8',
  metronome: 'M7.5 3h5l3 13.5h-11zM10 13.5 13.5 5.5M6 12h8',
  dot: 'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 18,
  ...props
}: { readonly name: IconName; readonly size?: number } & SVGProps<SVGSVGElement>) {
  const filled = name === 'play' || name === 'stop' || name === 'dot'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

/** Marca do KeyPath: um trecho de teclado. */
export function BrandMark({ size = 22 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="1" y="3" width="22" height="18" rx="4" fill="var(--color-accent)" />
      <g fill="#141519">
        <rect x="4" y="6" width="3.6" height="12" rx="0.8" opacity="0.92" />
        <rect x="8.4" y="6" width="3.6" height="12" rx="0.8" opacity="0.92" />
        <rect x="12.8" y="6" width="3.6" height="12" rx="0.8" opacity="0.92" />
        <rect x="17.2" y="6" width="2.8" height="12" rx="0.8" opacity="0.92" />
      </g>
      <g fill="var(--color-accent)">
        <rect x="6.6" y="6" width="2.8" height="7" rx="0.6" />
        <rect x="11" y="6" width="2.8" height="7" rx="0.6" />
        <rect x="15.4" y="6" width="2.8" height="7" rx="0.6" />
      </g>
    </svg>
  )
}
