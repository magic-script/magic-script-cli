export function makeLine(prism) {
  let node = prism.createLineNode();
  node.addPoints([0, 0, 0]);
  node.addPoints([1, 1, 1]);
  return node;
}
