import { useId } from 'react';
/** Code-native illustrations, deliberately without people, credentials or business results. */
export default function ServiceArt({ kind }: { kind: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 200 150" aria-hidden="true" className="zj-service-illustration">
      <defs>
        <linearGradient id={id + '-paper'} x2="0" y2="1">
          <stop stopColor="#fffdf5" />
          <stop offset="1" stopColor="#dfcdb9" />
        </linearGradient>
        <linearGradient id={id + '-orange'} x2=".8" y2="1">
          <stop stopColor="#ffb66d" />
          <stop offset="1" stopColor="#ed7421" />
        </linearGradient>
        <radialGradient id={id + '-shadow'}>
          <stop stopColor="#b89977" stopOpacity=".35" />
          <stop offset="1" stopColor="#b89977" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="106" cy="126" rx="73" ry="18" fill={'url(#' + id + '-shadow)'} />
      {kind === 0 ? (
        <g transform="rotate(-8 100 80)">
          <path d="m46 48 75-18 40 29-73 22Z" fill="#e0aa78" />
          <path d="m46 48 42 33v45l-42-29Z" fill="#c88c5e" />
          <path d="m88 81 73-22v44l-73 23Z" fill={'url(#' + id + '-orange)'} />
          <path d="m64 43 57-13 22 15-58 17Z" fill={'url(#' + id + '-paper)'} />
          <path d="m73 41 50-10 14 10-48 14Z" fill="#fdf7e9" />
          <path d="m119 80 39-11v18l-39 12-8-8Z" fill="#f7be82" />
          <circle cx="127" cy="87" r="4" fill="#a76434" />
          <ellipse cx="56" cy="101" rx="22" ry="10" fill="#b56b33" />
          <path d="M34 93v8c0 14 44 14 44 0v-8Z" fill="#ed9a42" />
          <ellipse cx="56" cy="93" rx="22" ry="10" fill="#ffd28c" />
          <ellipse cx="56" cy="92" rx="15" ry="6" fill="none" stroke="#edaa56" strokeWidth="2" />
        </g>
      ) : kind === 1 ? (
        <g>
          <path d="m50 65 49-25 52 24-50 27Z" fill="#f9cb98" />
          <path d="m50 65 51 26v43l-51-25Z" fill="#f1a762" />
          <path d="m101 91 50-27v44l-50 26Z" fill={'url(#' + id + '-orange)'} />
          <path d="m50 65-18-16 49-24 18 15Zm49-25 19-16 52 25-19 15Z" fill="#f8b978" />
          <path d="m50 65 51 26-19 18-50-27Zm51 26 50-27 18 17-50 28Z" fill="#ffd1a0" />
          <path d="m79 29 32-12 21 15-32 14v31L79 64Z" fill={'url(#' + id + '-paper)'} />
          <path d="m100 46 32-14v30l-32 15Z" fill="#fff8e9" />
          <path d="m106 51 18-8m-18 16 18-8" stroke="#bab1a0" strokeWidth="3" />
          <path d="m61 48 17-8 18 10-17 9v23L61 72Z" fill="#98b8a1" />
        </g>
      ) : kind === 2 ? (
        <g>
          <path d="m49 90 32-14 32 15-31 16Z" fill="#517463" />
          <path d="m49 90 33 17v21l-33-17Z" fill="#7a9e82" />
          <path d="m82 107 31-16v20l-31 17Z" fill="#456a5c" />
          <ellipse cx="78" cy="58" rx="20" ry="23" fill="#d5ad8a" />
          <path d="M59 51c0-28 43-28 40 0l-10-12-22 5Z" fill="#3f3830" />
          <path d="M55 87c1-25 42-27 47-2l-22 12Z" fill="#f7efdc" />
          <path d="m116 83 27-13 28 13-27 15Z" fill="#deac7e" />
          <path d="m116 83 28 15v24l-28-14Z" fill="#f2c399" />
          <path d="m144 98 27-15v24l-27 15Z" fill="#c9976e" />
          <ellipse cx="141" cy="46" rx="18" ry="22" fill="#ddba98" />
          <path d="M123 40c0-23 38-24 36 1l-12-11-21 8Z" fill="#3e3630" />
          <path d="M120 73c2-24 40-24 43 0l-21 13Z" fill="#234a5d" />
          <path d="m83 82 24-11 29 17-24 13Z" fill="#fffaf0" />
          <path d="m99 84 7 5 10-8" fill="none" stroke="#e59046" strokeWidth="3" />
        </g>
      ) : (
        <g>
          <path d="m56 32 78-12 24 12-79 15Z" fill="#fffaf1" />
          <path d="m56 32 23 15v85l-23-16Z" fill="#d9c5ae" />
          <path d="m79 47 79-15v86l-79 14Z" fill={'url(#' + id + '-paper)'} />
          <path d="m94 65 46-9m-46 20 46-9m-46 20 30-6" stroke="#b5b09f" strokeWidth="4" />
          <circle cx="139" cy="102" r="25" fill="#f7a156" />
          <circle cx="139" cy="102" r="17" fill="#fff7e7" />
          <path d="m151 120 14 16" stroke="#835e40" strokeWidth="8" strokeLinecap="round" />
          <path
            d="m130 101 6 6 12-13"
            fill="none"
            stroke="#db893f"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
