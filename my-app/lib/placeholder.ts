export function getPlaceholderImage(width: number, height: number, text?: string): string {
  // Get a deterministic color based on the text
  const getColorFromText = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate gradient colors
    const hue1 = hash % 360;
    const hue2 = (hash * 13) % 360;
    
    return {
      color1: `hsl(${hue1}, 70%, 80%)`,
      color2: `hsl(${hue2}, 70%, 60%)`
    };
  };

  const colors = text ? getColorFromText(text) : { color1: "#e2eeff", color2: "#c6d8f0" };
  const displayText = text || `${width}x${height}`;

  // For client-side rendering, we need to return a URL that works without Buffer
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors.color1}" />
        <stop offset="100%" stop-color="${colors.color2}" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad)" />
    <text 
      x="50%" 
      y="50%" 
      font-family="Arial, sans-serif" 
      font-size="${Math.floor(width / 20)}px" 
      fill="#ffffff" 
      text-anchor="middle" 
      dominant-baseline="middle"
      filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.3))"
      font-weight="bold"
    >
      ${displayText}
    </text>
  </svg>`;

  // Convert to base64 for client-side
  const encoded = typeof window === "undefined" ? Buffer.from(svg).toString("base64") : btoa(svg);

  return `data:image/svg+xml;base64,${encoded}`;
}
