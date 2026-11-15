type BannerProps = {
  message: string;
  tone?: 'info' | 'hint' | 'warning';
};

export function Banner({ message, tone = 'info' }: BannerProps) {
  return (
    <div className={`ui-banner ui-banner--${tone}`} role="status">
      {message}
    </div>
  );
}
