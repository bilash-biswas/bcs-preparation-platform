# Antigravity Rules: React Native, React Navigation & NativeWind Guidelines

To prevent layout crashes, bundle reload loops, and navigation context loss in this repository, follow these rules:

## 1. Dynamic Styling in NativeWind v4
- **Do NOT** toggle classNames dynamically on frequently interactive components (e.g. tabs, category chip selectors, buttons). Toggling colors (such as background or border classes) causes NativeWind to compile new styles on-the-fly and write to `global.css`, triggering Metro to re-bundle and crash the active navigation context.
- **Rule**: Keep layout classNames static (e.g., `className="px-5 py-2.5 rounded-full border border-slate-200"`) and change colors or highlight states using inline `style` overrides:
  ```tsx
  style={{
    backgroundColor: isSelected ? '#7c3aed' : '#ffffff',
    borderColor: isSelected ? '#7c3aed' : '#e2e8f0',
  }}
  ```

## 2. Icon Components & Custom Renderers
- **Do NOT** pass `className` properties directly to `<Icon>` (from `@expo/vector-icons`) or other third-party UI components unless they are pre-registered in `cssInterop`.
- **Rule**: Style icons using the standard inline `style` prop (e.g. `style={{ marginBottom: 12 }}`) or wrap them inside a styled `<View className="mb-3">` container.

## 3. Standardize Shadow and Border Opacity
- Avoid opacity divisions on shadow colors (e.g. `shadow-primary-500/10`) and dynamic border colors as the native React Native layout engine does not support shadow opacity in that style format.

## 4. Root Navigation Architecture (App.tsx)
- Keep `<NavigationContainer>` and `<SafeAreaProvider>` at the absolute root of the React component tree.
- **Rule**: Keep them **above and outside** `<PersistGate>` or any other conditional loading states. This ensures the React Navigation context is always mounted and never torn down when state is hydrating/re-hydrating.

## 5. Component Hoisting
- Never declare custom components (like item cards or skeletons) inside the scope of another component function. Always hoist subcomponents to the file scope and pass state handlers down as props to avoid costly unmounts/remounts during state updates.
