import React from 'react';

// Brasao da aplicacao: une o falcao de Atreides com o chifre de Latveria
// A asa esquerda vem do brasao da Casa Atreides e recebe o degrade de areia
// A lanca direita vem do simbolo de Latveria e recebe o verde de Destino
// As duas se encontram no mesmo vertice, formando um V unico

export default function HouseSigil() {
  return (
    <svg
      className="sigil"
      viewBox="0 0 120 112"
      role="img"
      aria-label="Brasão de Arrakis e Latveria"
    >
      <defs>
        <linearGradient id="sigilSand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9bd" />
          <stop offset="48%" stopColor="#e8a854" />
          <stop offset="100%" stopColor="#9c5516" />
        </linearGradient>

        <linearGradient id="sigilDoom" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdf5bd" />
          <stop offset="48%" stopColor="#7ec46c" />
          <stop offset="100%" stopColor="#1b5227" />
        </linearGradient>

        <filter id="sigilGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#sigilGlow)">
        {/* Asa de Atreides: banda externa longa e banda interna curta */}
        <g fill="url(#sigilSand)">
          <path d="M4 4 L22 4 L60 46 L60 70 L48 58 Z" />
          <path d="M14 36 L28 36 L56 68 L56 90 L46 80 L14 50 Z" />
        </g>

        {/* Chifre de Latveria partindo do mesmo vertice */}
        <g fill="url(#sigilDoom)">
          <path d="M60 70 L72 36 L90 6 L106 0 L96 34 L80 68 L69 94 Z" />
          <path d="M62 94 L68 76 L76 96 L68 104 Z" />
        </g>
      </g>
    </svg>
  );
}
