/**
 * Render Index
 * 
 * Exports render pipeline and SVG utilities.
 */

export { render, renderQuick } from "./pipeline";
export {
  escapeXml,
  composeSvg,
  wrapSvg,
  createGroup,
  createDefs,
  createGlowFilter,
  createLinearGradient,
  createRadialGradient,
  normalizeSvg,
} from "./svg";
