class IntersectionObserverMock {
  constructor() {}

  observe() {}

  unobserve() {}

  disconnect() {}
}

global.IntersectionObserver = IntersectionObserverMock;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
