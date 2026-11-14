import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Las siete caras de Llavecita. */
export type Animo = 'feliz' | 'contenta' | 'pensativa' | 'sorprendida' | 'preocupada' | 'dormida' | 'guino';

const T = '#0F3D4A'; // tinta del contorno

const trazo = { fill: 'none', stroke: T, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Ojo({ cx, cy = 96, r = 17, px = 2, py = 2, pr = 9 }: { cx: number; cy?: number; r?: number; px?: number; py?: number; pr?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke={T} strokeWidth={4} />
      <circle cx={cx + px} cy={cy + py} r={pr} fill={T} />
      <circle cx={cx + px + 4} cy={cy + py - 5} r={pr * 0.38} fill="#FFFFFF" />
    </>
  );
}

function Mejillas({ cy = 114, rx = 10, ry = 7 }: { cy?: number; rx?: number; ry?: number }) {
  return (
    <>
      <ellipse cx={58} cy={cy} rx={rx} ry={ry} fill="#FF9E8F" />
      <ellipse cx={142} cy={cy} rx={rx} ry={ry} fill="#FF9E8F" />
    </>
  );
}

/** Rasgos de la cara (van dentro del grupo inclinado). */
const CARAS: Record<Animo, ReactNode> = {
  feliz: (
    <>
      <Mejillas />
      <Ojo cx={78} />
      <Ojo cx={122} />
      <path d="M86 122 Q100 136 114 122" {...trazo} strokeWidth={5} />
    </>
  ),
  contenta: (
    <>
      <Mejillas rx={11} ry={8} />
      <path d="M63 101 Q78 82 93 101" {...trazo} strokeWidth={6} />
      <path d="M107 101 Q122 82 137 101" {...trazo} strokeWidth={6} />
      <path d="M84 117 Q100 146 116 117 Z" fill={T} stroke={T} strokeWidth={4} strokeLinejoin="round" />
      <path d="M93 131 Q100 125 107 131 Q100 138 93 131 Z" fill="#FF6B5E" />
    </>
  ),
  pensativa: (
    <>
      <Mejillas cy={116} />
      <Ojo cx={78} cy={98} px={6} py={-7} pr={8} />
      <Ojo cx={122} cy={98} px={6} py={-7} pr={8} />
      <path d="M126 74 Q136 68 146 76" {...trazo} strokeWidth={5} />
      <path d="M90 127 Q100 122 111 129" {...trazo} strokeWidth={5} />
    </>
  ),
  sorprendida: (
    <>
      <Mejillas cy={118} rx={9} ry={6} />
      <circle cx={77} cy={97} r={19} fill="#FFFFFF" stroke={T} strokeWidth={4} />
      <circle cx={123} cy={97} r={19} fill="#FFFFFF" stroke={T} strokeWidth={4} />
      <circle cx={77} cy={97} r={6} fill={T} />
      <circle cx={123} cy={97} r={6} fill={T} />
      <ellipse cx={100} cy={130} rx={8} ry={10} fill={T} />
    </>
  ),
  preocupada: (
    <>
      <Mejillas cy={120} rx={9} ry={6} />
      <Ojo cx={78} cy={102} r={15} px={2} py={3} pr={8} />
      <Ojo cx={122} cy={102} r={15} px={-2} py={3} pr={8} />
      <path d="M60 84 L88 74" {...trazo} strokeWidth={5} />
      <path d="M112 74 L140 84" {...trazo} strokeWidth={5} />
      <path d="M86 132 Q93 124 100 130 Q107 136 114 128" {...trazo} strokeWidth={5} />
    </>
  ),
  dormida: (
    <>
      <Mejillas />
      <path d="M63 96 Q78 110 93 96" {...trazo} strokeWidth={6} />
      <path d="M107 96 Q122 110 137 96" {...trazo} strokeWidth={6} />
      <ellipse cx={100} cy={127} rx={6} ry={5} fill={T} />
    </>
  ),
  guino: (
    <>
      <Mejillas />
      <Ojo cx={78} />
      <path d="M108 90 L134 98 L108 106" {...trazo} strokeWidth={6} />
      <path d="M84 119 Q100 140 116 119" {...trazo} strokeWidth={5} />
    </>
  ),
};

/** Adornos alrededor de la cabeza (van fuera del grupo inclinado). */
const ADORNOS: Partial<Record<Animo, ReactNode>> = {
  contenta: (
    <>
      <circle cx={170} cy={44} r={16} fill="#3CCFA0" stroke={T} strokeWidth={4} />
      <path d="M175 38 Q170 34 165 38 Q162 43 170 44 Q178 45 175 50 Q170 54 165 50 M170 32 V56" {...trazo} strokeWidth={3} />
      <path d="M28 50 V66 M20 58 H36" fill="none" stroke="#FF8A1F" strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  pensativa: (
    <>
      <circle cx={160} cy={46} r={5} fill={T} />
      <circle cx={174} cy={30} r={8} fill={T} />
      <circle cx={184} cy={10} r={6} fill="#FF8A1F" />
    </>
  ),
  sorprendida: (
    <>
      <path d="M172 18 L169 42" fill="none" stroke="#FF6B5E" strokeWidth={7} strokeLinecap="round" />
      <circle cx={167} cy={56} r={4.5} fill="#FF6B5E" />
      <path d="M30 26 L32 46" fill="none" stroke="#FF6B5E" strokeWidth={6} strokeLinecap="round" />
      <circle cx={33} cy={58} r={4} fill="#FF6B5E" />
    </>
  ),
  preocupada: (
    <path d="M174 52 Q186 72 174 80 Q162 72 174 52 Z" fill="#8FDCF5" stroke={T} strokeWidth={4} strokeLinejoin="round" />
  ),
  dormida: (
    <>
      <path d="M150 50 H164 L150 66 H164" {...trazo} strokeWidth={4} />
      <path d="M170 20 H190 L170 42 H190" {...trazo} strokeWidth={5} />
    </>
  ),
  guino: (
    <path
      d="M172 52 L176 64 L188 68 L176 72 L172 84 L168 72 L156 68 L168 64 Z"
      fill="#FF8A1F"
      stroke={T}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  ),
};

const NOMBRES: Record<Animo, string> = {
  feliz: 'feliz',
  contenta: 'contenta',
  pensativa: 'pensativa',
  sorprendida: 'sorprendida',
  preocupada: 'preocupada',
  dormida: 'dormida',
  guino: 'guiñando',
};

interface Props {
  animo?: Animo;
  /** Ancho en píxeles */
  size?: number;
  /** Mostrar solo la cabeza (para el encabezado y espacios chicos) */
  soloCabeza?: boolean;
  /** Mostrar los adornos (moneda, gota, zzz…) */
  adornos?: boolean;
  className?: string;
}

/**
 * Llavecita: una llave de tuercas con pañuelo naranja, la ayudante del taller.
 * Dibujo original en SVG.
 */
export function Llavecita({ animo = 'feliz', size = 120, soloCabeza = false, adornos = true, className }: Props) {
  const viewBox = soloCabeza ? '14 4 180 164' : '0 0 200 240';
  const alto = soloCabeza ? (size * 164) / 180 : (size * 240) / 200;
  const giro = animo === 'dormida' ? 8 : -6;

  return (
    <svg
      role="img"
      aria-label={`Llavecita ${NOMBRES[animo]}`}
      width={size}
      height={alto}
      viewBox={viewBox}
      className={className}
    >
      <g transform={`rotate(${giro} 100 120)`}>
        {!soloCabeza && (
          <>
            <rect x={80} y={130} width={40} height={100} rx={20} fill="#DCE6EC" stroke={T} strokeWidth={6} />
            <circle cx={100} cy={208} r={8} fill="#B9C8D1" stroke={T} strokeWidth={5} />
          </>
        )}
        <path
          d="M78 32 A62 62 0 1 0 122 32 L122 56 Q122 66 112 66 L88 66 Q78 66 78 56 Z"
          fill="#EEF3F6"
          stroke={T}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <path d="M50 78 Q56 56 70 46" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
        {!soloCabeza && (
          <>
            <path
              d="M74 148 Q100 162 126 148 L126 161 Q100 175 74 161 Z"
              fill="#FF8A1F"
              stroke={T}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            <path d="M120 160 L138 176 L122 178 Z" fill="#FF8A1F" stroke={T} strokeWidth={5} strokeLinejoin="round" />
          </>
        )}
        {/* La cara "salta" un poquito cada vez que cambia de ánimo */}
        <motion.g
          key={animo}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16 }}
          style={{ transformOrigin: '100px 100px' }}
        >
          {CARAS[animo]}
        </motion.g>
      </g>
      {adornos && ADORNOS[animo]}
    </svg>
  );
}
