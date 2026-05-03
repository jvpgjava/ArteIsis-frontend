import { environment } from '../../environments/environment';

/** URLs guardadas como `/api/public/media/...` precisam do host da API para `<img src>`. */
export function resolvePublicMediaUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }
  const u = url.trim();
  if (u.startsWith('/api/')) {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    return base + u;
  }
  return u;
}
