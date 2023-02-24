import { readdir, stat } from "fs/promises";
import { join } from "path";
import { pathToFileURL } from "url";
const isDirectory = async (fullPath: string): Promise<boolean> => {
  return (await stat(fullPath)).isDirectory();
};

async function asyncFilter<T>(
  arr: T[],
  predicate: (value: T) => Promise<boolean>
): Promise<T[]> {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_, index) => results[index]);
}

const getAllFilesRecursively = async (
  basePath: string,
  folderName: string,
  isRecursive: boolean
): Promise<string[]> => {
  const directoryPath = join(basePath, folderName);
  console.log(isRecursive);
  console.log(`directoryPath: ${directoryPath}`);
  const fileNames = await readdir(directoryPath);
  console.log(`fileNames: ${fileNames}`);
  console.log(`sadsad`)
  const directories = await asyncFilter(fileNames, async (fileName) =>
    isDirectory(join(directoryPath, fileName))
  );
  const files = fileNames
    .filter((fileName) => !directories.includes(fileName))
    .map((file) => join(directoryPath, file));

  const filesInDirectories = (
    await Promise.all(
      directories.map((directory) =>
        getAllFilesRecursively(directoryPath, directory, true)
      )
    )
  ).flat();

  return [...filesInDirectories, ...files];
};

const importFilteredFiles = (filePaths: string[]): Promise<unknown>[] => {
  return filePaths.reduce((accumulator: Promise<unknown>[], filePath) => {
    if (
      filePath.endsWith(".d.ts.map") ||
      filePath.endsWith(".d.ts") ||
      filePath.endsWith(".js.map")
    )
      return accumulator;

    accumulator.push(import(filePath));
    return accumulator;
  }, []);
};

export const importAllFiles = async (basePath: string, folderName: string) => {
  const URLPath = pathToFileURL(basePath).href;
  return getAllFilesRecursively(URLPath, folderName, false)
    .then((files) => Promise.all(importFilteredFiles(files)))
    .catch(console.error);
};
