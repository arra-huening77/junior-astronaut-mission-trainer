import { TeachersScreen } from '../screens/TeachersScreen';

/** Open /ui-preview.html?screen=teachers */
export function TeachersPreview() {
  return (
    <TeachersScreen
      onClose={() => {
        window.location.href = '/';
      }}
    />
  );
}
