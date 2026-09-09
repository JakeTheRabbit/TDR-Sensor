/* Dimensions are cm. Check the package label: nominal inches are not exact dimensions.
 * Grodan source: https://www.grodan101.com/siteassets/downloads/grow-guide/chapter-4---precision-irrigation.pdf
 * 1 m slab sizes are geometric examples, not a claim about every Prestige SKU.
 */
const SUBSTRATES = {
  blocks: [
    ["custom", "Custom measured block", 15, 15, 14.2],
    ["gr4", "Grodan GR4 / Delta: 7.5 × 7.5 × 6.5 cm", 7.5, 7.5, 6.5],
    ["gr56", "Grodan GR5.6: 7.5 × 7.5 × 10 cm", 7.5, 7.5, 10],
    ["gr65", "Grodan GR6.5: 10 × 10 × 6.5 cm", 10, 10, 6.5],
    ["gr75", "Grodan GR7.5: 10 × 10 × 7.5 cm", 10, 10, 7.5],
    ["gr10", "Grodan GR10: 10 × 10 × 10 cm", 10, 10, 10],
    ["jumbo", "Grodan Jumbo / GR22.5 (6 × 6 × 4 nominal)", 15, 15, 10],
    ["hugo", "Grodan Hugo / GR32 (6-inch nominal)", 15, 15, 14.2],
    ["uniblock", "Grodan Uniblock: 20 × 20 × 10 cm", 20, 20, 10],
    ["bigmama", "Grodan Big Mama: 20.3 × 20.3 × 20.3 cm", 20.3, 20.3, 20.3],
    ["unislab", "Grodan Uni-Slab: 24 × 19.5 × 10 cm", 24, 19.5, 10],
  ],
  slabs: [
    ["custom", "Custom measured slab", 100, 15, 7.5],
    ["s1001575", "1 m slab: 100 × 15 × 7.5 cm", 100, 15, 7.5],
    ["s1001510", "1 m slab: 100 × 15 × 10 cm", 100, 15, 10],
    ["s1002075", "1 m slab: 100 × 20 × 7.5 cm", 100, 20, 7.5],
    ["s1002010", "1 m slab: 100 × 20 × 10 cm", 100, 20, 10],
    ["s1003075", "1 m slab: 100 × 30 × 7.5 cm", 100, 30, 7.5],
    ["s1003010", "1 m slab: 100 × 30 × 10 cm", 100, 30, 10],
    ["s903", "Grodan guide: 90 × 15 × 7.5 cm", 90, 15, 7.5],
    ["s904", "Grodan guide: 90 × 15 × 10 cm", 90, 15, 10],
    ["s908", "Grodan guide: 90 × 19.5 × 7.5 cm", 90, 19.5, 7.5],
    ["s9012", "Grodan guide: 90 × 30 × 7.5 cm", 90, 30, 7.5],
  ],
};
if (typeof module === "object" && module.exports) module.exports = SUBSTRATES;
