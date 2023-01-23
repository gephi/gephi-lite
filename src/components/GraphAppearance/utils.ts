export function isColor(strColor: string): boolean {
  var s = new Option().style;
  s.color = strColor;
  return s.color !== "";
}
