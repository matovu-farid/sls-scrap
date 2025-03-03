import * as fs from "fs";
import * as path from "path";

/**
 * Recursively prints the directory tree structure for the given folder.
 * @param dir - The directory to list.
 * @param indent - Indentation for pretty-printing.
 */
function printTreeStructure(dir: string, indent: string = ""): void {
  let items: fs.Dirent[];
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err: any) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
    return;
  }

  for (const item of items) {
    console.log(`${indent}- ${item.name}`);
    if (item.isDirectory()) {
      printTreeStructure(path.join(dir, item.name), indent + "  ");
    }
  }
}

export function printFoldersAndFilesInFolder(folderPath: string): void {
  const items = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const item of items) {
    console.log(`${item.name}`);
  }
}

/**
 * Checks each parent directory along a given path.
 * If a directory does not exist, prints the tree structure of its parent,
 * so you know what options exist.
 * @param fullPath - The complete path to check.
 */
export function checkPathAndPrintTree(fullPath: string): void {
  // Normalize the path for cross-platform compatibility.
  const normalizedPath = path.normalize(fullPath);
  // Split the path into its segments and filter out any empty strings.
  const parts = normalizedPath.split(path.sep).filter(Boolean);

  // Handle absolute paths (Unix '/' or Windows 'C:\').
  let currentPath = normalizedPath.startsWith(path.sep) ? path.sep : parts[0];

  // Iterate through each segment, constructing the path incrementally.
  for (let i = currentPath === path.sep ? 0 : 1; i < parts.length; i++) {
    currentPath = path.join(currentPath, parts[i]);
    if (!fs.existsSync(currentPath)) {
      console.log(
        `The folder "${parts[i]}" does not exist in the path "${path.dirname(
          currentPath
        )}".`
      );
      console.log(`Available options in "${path.dirname(currentPath)}":`);
      printTreeStructure(path.dirname(currentPath));
      return;
    }
  }
  console.log(`The full path "${fullPath}" exists.`);
}
export function recursiveSearch(startPath: string, targetName: string) {
  const results: string[] = [];

  function searchDirectory(currentPath: string) {
    let items: fs.Dirent[];
    try {
      items = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (err: any) {
      return;
    }

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      // If the current item matches the target name, add it to the results.
      if (item.name === targetName) {
        results.push(fullPath);
      }

      // If the current item is a directory, recursively search it.
      if (item.isDirectory()) {
        searchDirectory(fullPath);
      }
    }
  }

  // Start the recursive search from the initial path.
  searchDirectory(startPath);
  console.log(results);
  return results;
}
