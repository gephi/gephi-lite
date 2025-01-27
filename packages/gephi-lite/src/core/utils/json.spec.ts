import { parse, stringify } from "./json";

const CLASSIC_DATASET = {
  name: "John Doe",
  age: 42,
  isHuman: true,
  links: [{ url: "http://somewhere.com", label: "somewhere" }],
  favoriteMovie: null,
};
const CLASSIC_DATASET_STRING =
  '{"name":"John Doe","age":42,"isHuman":true,"links":[{"url":"http://somewhere.com","label":"somewhere"}],"favoriteMovie":null}';

const SETS_DATASET = {
  abc: {
    numbersSet: new Set([123, 456, 789]),
    stringsSet: new Set(["abc", "def", "ghi"]),
    objectsSet: new Set([{ abc: 123 }, [false, true]]),
  },
};
const SETS_DATASET_STRING =
  '{"abc":{"numbersSet":["<<SET","[123,456,789]","SET>>"],"stringsSet":["<<SET","[\\"abc\\",\\"def\\",\\"ghi\\"]","SET>>"],"objectsSet":["<<SET","[{\\"abc\\":123},[false,true]]","SET>>"]}}';

describe("JSON utilities", () => {
  describe("#parse and #stringify together", () => {
    it("should work with 'classic' data", () => {
      expect(parse(stringify(CLASSIC_DATASET))).toEqual(CLASSIC_DATASET);
    });

    it("should work with sets", () => {
      expect(parse(stringify(SETS_DATASET))).toEqual(SETS_DATASET);
    });
  });

  describe("#stringify", () => {
    it("should work with 'classic' data", () => {
      expect(stringify(CLASSIC_DATASET)).toBe(CLASSIC_DATASET_STRING);
    });

    it("should work with sets", () => {
      expect(stringify(SETS_DATASET)).toBe(SETS_DATASET_STRING);
    });
  });

  describe("#parse", () => {
    it("should work with 'classic' data", () => {
      expect(parse(CLASSIC_DATASET_STRING)).toEqual(CLASSIC_DATASET);
    });

    it("should work with sets", () => {
      expect(parse(SETS_DATASET_STRING)).toEqual(SETS_DATASET);
    });
  });
});
