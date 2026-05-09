export async function uploadPreview(
  _showId: string,
  _cueId: string,
  dataUrl: string,
): Promise<string> {
  return dataUrl
}

export async function deletePreview(_showId: string, _cueId: string): Promise<void> {}

export function getPreviewUrl(path: string): string {
  return path
}
