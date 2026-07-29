// groups.js — how topics are gathered into parent categories in the sidebar.
// This is the ONLY file to edit to change the subtopic tree.
// Rules:
//   * List each parent category once, in the order it should appear. 
//   * Under "topics", list the child topic labels exactly as they appear.
//   * Matching ignores leading/trailing spaces, so a stray space in the CSV
//     won't drop a topic out of its group.

window.GROUPS = [
  {
    name: "Algebra",
    topics: [
      "Solving Equations",
      "Multi-variable Algebraic Manipulation"
    ]
  },
  {
    name: "Exponents & Scientific Notation",
    topics: [
      "Exponents/Scientific Notation"
    ]
  },
  {
    name: "Unit Conversion",
    topics: [
      "Unit Conversion"
    ]
  },
  {
    name: "Linear Graphs",
    topics: [
      "Linear Graphs"
    ]
  },
  {
    name: "Trigonometry",
    topics: [
      "Trigonometric Identities(Trig Ratios)",
      "Trigonometric Identities",
      "Trigonometric Identities(Applied Trig)",
      "Trig Identities/Geometric Angles",
      "Pythagorean Theorem",
      "Inverse Trig Functions/ Pythagorean",
      "Inverse Trig Functions"
    ]
  },
  {
    name: "Vectors",
    topics: [
      "Vector Arithmetic & Decomposition"
    ]
  },
  {
    name: "Ratios & Proportion",
    topics: [
      "Ratios and Proportion"
    ]
  }
];
