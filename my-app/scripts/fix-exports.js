const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

const problemRoutes = [
  "about/page",
  "admin/bookings/page",
  "admin/dashboard/page",
  "admin/login/page",
  "admin/properties/page",
  "admin/reports/page",
  "admin/users/page",
  "booking/confirmation/page",
  "bookings/page",
  "checkout/test/page",
  "complete-profile/page",
  "contact/page",
  "dashboard/page",
  "faq/page",
  "favorites/page",
  "forgot-password/page",
  "host/dashboard/page",
  "list-property/page",
  "login/page",
  "page",
  "profile/page",
  "refunds/page",
  "reviews/page",
  "search/page",
  "signup/page",
  "terms/page",
  "user/reports/page",
];

async function fileExists(filePath) {
  try {
    await access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fixExports() {
  const appDir = path.resolve(__dirname, "../app");

  for (const route of problemRoutes) {
    const filePath = path.join(appDir, `${route}.tsx`);

    if (await fileExists(filePath)) {
      try {
        console.log(`Checking file: ${filePath}`);
        let content = await readFile(filePath, "utf8");

        // Check if file has proper default export
        const hasDefaultExport = /export\s+default\s+function/i.test(content);

        if (!hasDefaultExport) {
          // Find a named function or component that could be the main export
          const funcNameMatch = content.match(
            /function\s+([A-Z][a-zA-Z0-9_]*Page?)\s*\(/
          );
          const constNameMatch = content.match(
            /const\s+([A-Z][a-zA-Z0-9_]*Page?)\s*=/
          );

          const componentName = funcNameMatch?.[1] || constNameMatch?.[1];

          if (componentName) {
            if (
              funcNameMatch &&
              !content.includes(`export default ${componentName}`)
            ) {
              // Add export default before the function
              content = content.replace(
                `function ${componentName}`,
                `export default function ${componentName}`
              );
              console.log(`Added default export to function ${componentName}`);
            } else if (
              constNameMatch &&
              !content.includes(`export default ${componentName}`)
            ) {
              // Add export default after the component declaration
              const constDeclarationRegex = new RegExp(
                `const\\s+${componentName}\\s*=.*?(?=;|\\n\\n|$)`,
                "s"
              );
              const match = content.match(constDeclarationRegex);

              if (match) {
                const declaration = match[0];
                content = content.replace(
                  declaration,
                  `${declaration}\n\nexport default ${componentName}`
                );
                console.log(`Added default export for const ${componentName}`);
              }
            }

            await writeFile(filePath, content, "utf8");
            console.log(`Fixed export in ${filePath}`);
          } else {
            console.log(`Could not find component name in ${filePath}`);
          }
        } else {
          console.log(`File already has default export: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    } else {
      console.log(`File not found: ${filePath}`);
    }
  }
}

fixExports()
  .then(() => {
    console.log("Export fixing process completed");
  })
  .catch((err) => {
    console.error("Error fixing exports:", err);
  });
