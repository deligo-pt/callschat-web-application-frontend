# Agent Instructions: Safe UI Refactoring with Figma MCP

You are tasked with refactoring the user interface of the specified component/page to match the provided Figma design. The application's core functionality is fully operational. Your primary directive is to preserve all underlying logic while executing a pixel-perfect visual overhaul.

---

## 🚫 STRICT GUARDRAILS (Do Not Violate)

1. **DO NOT Alter Logic or State:** 
   - Keep all React hooks (`useState`, `useEffect`, `useContext`, `useReducer`, etc.) exactly as they are.
   - Do not rename, remove, or modify existing state variables.
   - Keep all function definitions, event handlers (e.g., `onSubmit`, `onClick` event logic), and helper functions intact.

2. **DO NOT Touch API Integrations:**
   - Do not alter `fetch` requests, Axios instances, GraphQL queries, or custom data-fetching hooks (e.g., TanStack Query/SWR).
   - Do not change how mock data is initialized or loaded.

3. **Preserve Component Props:**
   - Do not change the component's existing TypeScript interface or `PropTypes`.
   - Do not delete or rename props passed down from parent components.

4. **Do Not Touch Routing:**
   - Keep Next.js/React Router setups, link URLs, and routing logic exactly as they are.

---

## 🎨 UI Refactoring Workflow

1. **Inspect Figma via MCP:**
   - Fetch the styling nodes, colors, layout structures, spacing (padding/margin), typography, and asset variables from the provided Figma URL.
   - Extract the design tokens (colors, border radii, shadows) and map them to our existing CSS/Tailwind configuration if applicable.

2. **Re-structure Layout Safely:**
   - You may modify, add, or nesting HTML/JSX wrapper elements (`div`, `section`, `span`, `flex`, `grid`) to achieve the required visual structure.
   - Ensure the structural elements wrap the existing functional elements safely without breaking their event handlers.

3. **Apply Stylings:**
   - Update CSS classes, Tailwind utility classes, or styled-components.
   - Prioritize responsive design (mobile-first breakpoints) as depicted in the Figma file.

4. **Verify UI Changes:**
   - Use the Antigravity built-in browser to view the modified component at `localhost`.
   - Take screenshots of the rendered page and compare them against the Figma frame to verify visual alignment before finalizing.

---

## 📦 Expected Deliverables

Before writing code, provide a high-level **Implementation Plan** in Antigravity:
1. Outline which files will be modified.
2. List the styling elements (e.g., colors, typography, layout changes) you extracted from the Figma MCP server.
3. Confirm that you have identified and isolated the functional code block that must remain untouched.