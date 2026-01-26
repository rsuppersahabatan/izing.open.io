import path from "path";

const getPublicPath = () => {
  const publicFolder = __dirname.endsWith("/dist")
    ? path.resolve(__dirname, "..", "public")
    : path.resolve(__dirname, "..", "..", "public");

  return publicFolder;
};

export default getPublicPath;
