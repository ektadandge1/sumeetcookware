export function SectionHeading({
  align = 'center',
  id,
  mobileTitle,
  title,
}: {
  align?: 'center' | 'left';
  id: string;
  mobileTitle?: string;
  title: string;
}) {
  return (
    <h2
      className={`home-section-heading home-section-heading-${align}`}
      id={id}
    >
      <span className={mobileTitle ? 'home-heading-desktop' : undefined}>
        {title}
      </span>
      {mobileTitle ? (
        <span className="home-heading-mobile">{mobileTitle}</span>
      ) : null}
    </h2>
  );
}
