import React from 'react';

// Logotipo da aplicacao
// DUNE recebe o degrade de areia de Arrakis e SDAY o verde de Latveria
// O traco externo amarra as duas metades para nao parecerem palavras separadas

export default function DunesdayMark() {
  return (
    <svg
      className="mark"
      viewBox="0 0 760 78"
      role="img"
      aria-label="Agenda de Anotações"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="sandGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9bd" />
          <stop offset="45%" stopColor="#e8a854" />
          <stop offset="100%" stopColor="#a85f1c" />
        </linearGradient>

        <linearGradient id="doomGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bdf0ac" />
          <stop offset="45%" stopColor="#7ec46c" />
          <stop offset="100%" stopColor="#1f5b2c" />
        </linearGradient>

        {/* Faixa que escurece o encontro das duas metades */}
        <linearGradient id="seamGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e8a854" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff6e0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7ec46c" stopOpacity="0" />
        </linearGradient>

        <filter id="markGlow" x="-25%" y="-60%" width="150%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#markGlow)">
        <text
          x="230"
          y="54"
          textAnchor="middle"
          fontFamily="Cinzel, 'Times New Roman', serif"
          fontSize="54"
          fontWeight="700"
          letterSpacing="4"
          stroke="rgba(0,0,0,0.65)"
          strokeWidth="5"
          paintOrder="stroke fill"
        >
          <tspan fill="url(#sandGrad)">AGENDA DE</tspan>
          <tspan fill="url(#doomGrad)">ANOTAÇÕES</tspan>
        </text>
      </g>

      {/* Marca vertical no ponto exato onde um mundo encosta no outro */}
      <rect x="228" y="12" width="4" height="52" fill="url(#seamGrad)" opacity="0.55" />
    </svg>
  );
}
