export const keywordRegExp = (keywords: string) => {
  return new RegExp(`^(?:${keywords.split(" ").join("|")})$`);
};
