export default function PublicCarousel() {
  return (
    <div className="carousel-tv-root carousel-tv-disabled">
      <p>Tela do carrossel temporariamente desativada.</p>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
        }
        .carousel-tv-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          width: 100%;
          height: 100%;
          height: 100dvh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .carousel-tv-disabled {
          color: #ccc;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 1.25rem;
          text-align: center;
          padding: 1.5rem;
        }
      `}</style>
    </div>
  )
}
