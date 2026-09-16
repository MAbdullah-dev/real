const SPAN = 0.012;

/** OpenStreetMap embed — a real map with no API key and no client-side bundle. */
export function PropertyMap({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title: string;
}) {
  const bbox = [lng - SPAN, lat - SPAN / 2, lng + SPAN, lat + SPAN / 2].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-3xl border border-border">
        <iframe
          src={src}
          title={`Map showing ${title}`}
          loading="lazy"
          className="aspect-[16/9] w-full border-0 sm:aspect-[21/9]"
        />
      </div>
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
        target="_blank"
        rel="noreferrer noopener"
        className="text-xs font-medium text-primary hover:underline"
      >
        Open larger map
      </a>
    </div>
  );
}
