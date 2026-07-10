import { Redirect } from 'expo-router';

/** Legacy route — restaurant settings now include expiry threshold (FR-056). */
export default function InventorySettingsRedirect() {
  return <Redirect href="/(admin)/restaurant-settings" />;
}
