export const isWebGLSupported = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const hasContext =
      !!window.WebGL2RenderingContext ||
      !!window.WebGLRenderingContext;

    if (!hasContext) {
      return false;
    }

    return Boolean(
      canvas.getContext('webgl2', { antialias: false }) ||
      canvas.getContext('webgl', { antialias: false }) ||
      canvas.getContext('experimental-webgl', { antialias: false }),
    );
  } catch {
    return false;
  }
};
