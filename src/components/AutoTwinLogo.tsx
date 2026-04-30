interface AutoTwinLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  glow?: boolean;
}

export default function AutoTwinLogo({ size = 36, className, style, glow }: AutoTwinLogoProps) {
  return (
    <img
      src="/favicon.ico"
      alt="AutoTwin AI"
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        objectFit: "cover",
        borderRadius: "50%",
        boxShadow: glow ? "0 6px 32px rgba(124,58,237,0.45)" : undefined,
        ...style,
      }}
    />
  );
}
