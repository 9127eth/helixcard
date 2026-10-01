import { auth } from './firebase-admin';

/**
 * Set the `isPro` custom claim while keeping the account's other claims.
 *
 * `setCustomUserClaims` replaces the whole claims object, so writing `{ isPro }`
 * on its own removed `admin` from any administrator whose plan changed.
 */
export async function setProClaim(uid: string, isPro: boolean): Promise<void> {
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), isPro });
}
