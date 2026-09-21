export function SectionHeading({
  align = 'center',
  id,
  title,
}: {
  align?: 'center' | 'left';
  id: string;
  title: string;
}) {
  return (
    <h2 className={`home-section-heading home-section-heading-${align}`} id={id}>
      {title}
    </h2>
  );
}
