/**
 * Ambient floating ember particles overlay.
 * Renders small glowing particles that float upward from the bottom of the viewport.
 * All elements are pointer-events: none and purely decorative.
 * @component
 * @returns {JSX.Element} A fixed overlay with floating ember particles
 */
export default function AmbientEffects() {
  const embers = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => {
      const size = Math.random() * 3 + 2;
      return {
        key: i,
        style: {
          left: `${Math.random() * 100}%`,
          animation: `${i % 2 === 0 ? 'float-up' : 'float-up-sway'} ${Math.random() * 10 + 6}s ${Math.random() * 10}s ease-in-out infinite`,
          width: `${size}px`,
          height: `${size}px`,
          opacity: Math.random() * 0.5 + 0.4,
        },
      };
    });
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {embers.map((ember) => (
        <div
          key={ember.key}
          className="ember"
          style={{
            position: 'absolute',
            bottom: '-10px',
            borderRadius: '50%',
            ...ember.style,
          }}
        />
      ))}
    </div>
  );
}
