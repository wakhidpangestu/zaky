/**
 * The workspace hides its navigation only when a page explicitly asks to be embedded
 * (`?embed=1`) and really runs inside a frame. Merely being framed is not enough:
 * device-preview tools ("mobile simulators") show the site in a same-origin iframe,
 * and those must get the full dashboard with its navbar.
 */
export function isEmbedded(): boolean {
  try {
    return (
      window.parent !== window &&
      new URLSearchParams(window.location.search).get('embed') === '1'
    );
  } catch {
    return false;
  }
}
