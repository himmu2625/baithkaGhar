import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths with export errors
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

const appDir = path.join(__dirname, "my-app", "app");

// Create a minimal page template
const createPageTemplate = (routeName) => {
  const componentName =
    routeName
      .split("/")
      .pop()
      .replace(/^./, (match) => match.toUpperCase()) + "Page";

  return `export default function ${componentName}() {
  return (
    <div>
      <h1>${componentName}</h1>
      <p>This page is under construction.</p>
    </div>
  );
}
`;
};

// Process each problem route
problemRoutes.forEach((route) => {
  const fullPath = path.join(appDir, route + ".tsx");
  const dirPath = path.dirname(fullPath);

  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Check if file exists
  const fileExists = fs.existsSync(fullPath);

  if (fileExists) {
    try {
      // Read the file content
      const content = fs.readFileSync(fullPath, "utf8");

      // Check if the file has a default export
      if (
        !content.includes("export default") &&
        !content.includes("export default function")
      ) {
        console.log(`Fixing export in: ${fullPath}`);

        // Extract component name if possible
        const match = content.match(/function\s+([A-Z][a-zA-Z0-9]*)/);
        let componentName = match ? match[1] : null;

        if (componentName) {
          // Replace the function declaration with export default function
          const newContent = content.replace(
            `function ${componentName}`,
            `export default function ${componentName}`
          );
          fs.writeFileSync(fullPath, newContent);
          console.log(
            `Added default export to ${componentName} in ${fullPath}`
          );
        } else {
          console.log(`Could not identify component name in ${fullPath}`);
        }
      } else {
        console.log(`File already has default export: ${fullPath}`);
      }
    } catch (error) {
      console.error(`Error processing ${fullPath}:`, error);
    }
  } else {
    // Create a new page file
    console.log(`Creating new page: ${fullPath}`);
    fs.writeFileSync(fullPath, createPageTemplate(route));
    console.log(`Created template page at ${fullPath}`);
  }
});

console.log("Route fixing process completed");
