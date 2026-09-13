const isFinitePositive = (value) => Number.isFinite(value) && value > 0;

const overlap = (first, second) => (
  first.x < second.x + second.width
  && first.x + first.width > second.x
  && first.y < second.y + second.height
  && first.y + first.height > second.y
);

const fail = (label, reason) => {
  throw new Error(`${label} is ${reason}`);
};

/**
 * Assert geometry that matters to a user of a public control or region.
 * The helper intentionally accepts plain boxes so mutation cases can prove
 * the checks fail without relying on screenshots or browser internals.
 */
export function assertVisualLayout({
  label,
  box,
  viewport,
  containedBy,
  avoid = [],
  minWidth = 1,
  minHeight = 1,
  visible = true,
  withinViewport = { horizontal: true, vertical: true },
  tolerance = 1,
}) {
  if (visible !== true || !box || !isFinitePositive(box.width) || !isFinitePositive(box.height)
    || box.width < minWidth || box.height < minHeight) {
    fail(label, 'hidden or too small');
  }

  if (viewport && withinViewport.horizontal
    && (box.x < viewport.x - tolerance || box.x + box.width > viewport.x + viewport.width + tolerance)) {
    fail(label, 'clipped by the viewport horizontally');
  }
  if (viewport && withinViewport.vertical
    && (box.y < viewport.y - tolerance || box.y + box.height > viewport.y + viewport.height + tolerance)) {
    fail(label, 'clipped by the viewport vertically');
  }

  if (containedBy && (
    box.x < containedBy.x - tolerance
    || box.y < containedBy.y - tolerance
    || box.x + box.width > containedBy.x + containedBy.width + tolerance
    || box.y + box.height > containedBy.y + containedBy.height + tolerance
  )) {
    fail(label, 'clipped by its containing region');
  }

  for (const other of avoid) {
    if (other.box && overlap(box, other.box)) {
      fail(label, `overlapping ${other.label}`);
    }
  }

  return box;
}
