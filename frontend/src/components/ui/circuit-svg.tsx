export function CircuitSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Circuit traces */}
      <path d="M20 150 H80 V80 H160 V40 H240" stroke="rgba(228,77,40,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M240 40 H320 V80 H380" stroke="rgba(228,77,40,0.20)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M80 150 V220 H160 V260 H320 V220 H380" stroke="rgba(228,77,40,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M160 150 H240 V110 H300 V150 H380" stroke="rgba(228,77,40,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 80 V150" stroke="rgba(228,77,40,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M300 150 V220" stroke="rgba(228,77,40,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M160 80 V150" stroke="rgba(228,77,40,0.20)" strokeWidth="1" strokeLinecap="round"/>

      {/* Central chip */}
      <rect x="155" y="105" width="90" height="90" rx="6" fill="rgba(10,14,16,0.8)" stroke="rgba(228,77,40,0.60)" strokeWidth="1.5"/>
      <rect x="165" y="115" width="70" height="70" rx="4" fill="rgba(228,77,40,0.08)" stroke="rgba(228,77,40,0.30)" strokeWidth="1"/>
      {/* Chip pins top */}
      <rect x="175" y="102" width="6" height="8" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="191" y="102" width="6" height="8" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="207" y="102" width="6" height="8" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="223" y="102" width="6" height="8" rx="1" fill="rgba(228,77,40,0.5)"/>
      {/* Chip pins bottom */}
      <rect x="175" y="190" width="6" height="8" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="191" y="190" width="6" height="8" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="207" y="190" width="6" height="8" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="223" y="190" width="6" height="8" rx="1" fill="rgba(228,77,40,0.5)"/>
      {/* Chip pins left */}
      <rect x="148" y="123" width="8" height="6" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="148" y="139" width="8" height="6" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="148" y="155" width="8" height="6" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="148" y="171" width="8" height="6" rx="1" fill="rgba(228,77,40,0.5)"/>
      {/* Chip pins right */}
      <rect x="244" y="123" width="8" height="6" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="244" y="139" width="8" height="6" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="244" y="155" width="8" height="6" rx="1" fill="rgba(228,77,40,0.5)"/>
      <rect x="244" y="171" width="8" height="6" rx="1" fill="rgba(228,77,40,0.5)"/>
      {/* Chip label */}
      <text x="200" y="147" textAnchor="middle" fill="rgba(228,77,40,0.9)" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">F8</text>
      <text x="200" y="163" textAnchor="middle" fill="rgba(246,245,242,0.35)" fontSize="6.5" fontFamily="JetBrains Mono, monospace">MCU-2026</text>

      {/* Via holes */}
      {[[80,80],[80,220],[320,80],[320,220],[160,40],[240,40]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="rgba(10,14,16,1)" stroke="rgba(228,77,40,0.45)" strokeWidth="1.5"/>
      ))}
      {[[80,80],[80,220],[320,80],[320,220],[160,40],[240,40]].map(([x,y],i) => (
        <circle key={`i${i}`} cx={x} cy={y} r="1.5" fill="rgba(228,77,40,0.6)"/>
      ))}

      {/* Resistors */}
      <rect x="108" y="76" width="24" height="10" rx="2" fill="rgba(10,14,16,0.9)" stroke="rgba(228,77,40,0.35)" strokeWidth="1"/>
      <line x1="108" y1="81" x2="104" y2="81" stroke="rgba(228,77,40,0.35)" strokeWidth="1"/>
      <line x1="132" y1="81" x2="136" y2="81" stroke="rgba(228,77,40,0.35)" strokeWidth="1"/>

      <rect x="258" y="76" width="24" height="10" rx="2" fill="rgba(10,14,16,0.9)" stroke="rgba(228,77,40,0.25)" strokeWidth="1"/>
      <line x1="258" y1="81" x2="254" y2="81" stroke="rgba(228,77,40,0.25)" strokeWidth="1"/>
      <line x1="282" y1="81" x2="286" y2="81" stroke="rgba(228,77,40,0.25)" strokeWidth="1"/>

      {/* Capacitor */}
      <line x1="340" y1="144" x2="340" y2="156" stroke="rgba(228,77,40,0.30)" strokeWidth="2"/>
      <line x1="334" y1="144" x2="346" y2="144" stroke="rgba(228,77,40,0.30)" strokeWidth="1.5"/>
      <line x1="334" y1="156" x2="346" y2="156" stroke="rgba(228,77,40,0.30)" strokeWidth="1.5"/>

      {/* LED indicator */}
      <circle cx="50" cy="150" r="6" fill="rgba(228,77,40,0.15)" stroke="rgba(228,77,40,0.5)" strokeWidth="1.5"/>
      <circle cx="50" cy="150" r="2.5" fill="rgba(228,77,40,0.8)"/>

      {/* Signal dots animated */}
      <circle cx="120" cy="150" r="2" fill="rgba(228,77,40,0.7)">
        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="40" r="2" fill="rgba(228,77,40,0.7)">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

export function ChipSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="25" width="70" height="70" rx="8" fill="rgba(10,14,16,0.95)" stroke="rgba(228,77,40,0.6)" strokeWidth="2"/>
      <rect x="33" y="33" width="54" height="54" rx="5" fill="rgba(228,77,40,0.06)" stroke="rgba(228,77,40,0.25)" strokeWidth="1"/>
      {[35,50,65,80].map((y,i) => (
        <g key={i}>
          <rect x="15" y={y} width="12" height="6" rx="1.5" fill="rgba(228,77,40,0.45)"/>
          <rect x="93" y={y} width="12" height="6" rx="1.5" fill="rgba(228,77,40,0.45)"/>
        </g>
      ))}
      {[35,50,65,80].map((x,i) => (
        <g key={i}>
          <rect x={x} y="15" width="6" height="12" rx="1.5" fill="rgba(228,77,40,0.45)"/>
          <rect x={x} y="93" width="6" height="12" rx="1.5" fill="rgba(228,77,40,0.45)"/>
        </g>
      ))}
      <text x="60" y="56" textAnchor="middle" fill="rgba(228,77,40,1)" fontSize="14" fontFamily="JetBrains Mono, monospace" fontWeight="900">F8</text>
      <text x="60" y="70" textAnchor="middle" fill="rgba(246,245,242,0.4)" fontSize="6" fontFamily="JetBrains Mono, monospace">FUSION8</text>
    </svg>
  );
}

export function ArduinoSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Board */}
      <rect x="2" y="2" width="196" height="116" rx="8" fill="rgba(10,14,16,0.95)" stroke="rgba(228,77,40,0.4)" strokeWidth="1.5"/>
      {/* Header pins left */}
      {[15,25,35,45,55,65].map((y,i) => (
        <rect key={i} x="8" y={y} width="8" height="5" rx="1" fill="rgba(228,77,40,0.45)"/>
      ))}
      {/* Header pins right */}
      {[15,25,35,45,55,65,75,85,95].map((y,i) => (
        <rect key={i} x="184" y={y} width="8" height="5" rx="1" fill="rgba(228,77,40,0.35)"/>
      ))}
      {/* USB port */}
      <rect x="6" y="80" width="18" height="28" rx="3" fill="rgba(228,77,40,0.15)" stroke="rgba(228,77,40,0.4)" strokeWidth="1"/>
      <rect x="9" y="84" width="12" height="20" rx="2" fill="rgba(228,77,40,0.08)" stroke="rgba(228,77,40,0.25)" strokeWidth="0.5"/>
      {/* Main chip */}
      <rect x="70" y="30" width="60" height="60" rx="4" fill="rgba(15,20,28,1)" stroke="rgba(228,77,40,0.55)" strokeWidth="1.5"/>
      <text x="100" y="58" textAnchor="middle" fill="rgba(228,77,40,0.9)" fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="700">ATMEGA</text>
      <text x="100" y="70" textAnchor="middle" fill="rgba(228,77,40,0.6)" fontSize="8" fontFamily="JetBrains Mono, monospace">328P</text>
      {/* LED */}
      <circle cx="155" cy="25" r="5" fill="rgba(228,77,40,0.15)" stroke="rgba(228,77,40,0.6)" strokeWidth="1.5"/>
      <circle cx="155" cy="25" r="2.5" fill="rgba(228,77,40,0.9)">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      {/* Crystal */}
      <rect x="148" y="45" width="14" height="8" rx="3" fill="rgba(246,245,242,0.08)" stroke="rgba(228,77,40,0.3)" strokeWidth="1"/>
      {/* Traces */}
      <path d="M30 17 H65 V60" stroke="rgba(228,77,40,0.2)" strokeWidth="1"/>
      <path d="M30 35 H65 V75" stroke="rgba(228,77,40,0.15)" strokeWidth="1"/>
      <path d="M135 60 H168" stroke="rgba(228,77,40,0.2)" strokeWidth="1"/>
    </svg>
  );
}
