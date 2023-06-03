import type { ReactNode } from "react";

type ColorType = "red" | "green" | "blue";

type IconHoverEffectProps = {
  children: ReactNode;
  color?: ColorType;
};

export function IconHoverEffect({ children, color }: IconHoverEffectProps) {
  const appliedColor = color ? color : "gray";
  const colorClasses = `outline-${appliedColor}-400 hover:bg-${appliedColor}-200 group-hover:bg-${appliedColor}-200`;
  // Following is needed so that the Tailwind transpiler picks up the classes:
  // outline-red-400 hover:bg-red-200 group-hover:bg-red-200
  // outline-green-400 hover:bg-green-200 group-hover:bg-green-200
  // outline-blue-400 hover:bg-blue-200 group-hover:bg-blue-200
  // outline-gray-400 hover:bg-gray-200 group-hover:bg-gray-200
  return (
    <div
      className={`rounded-full p-2 transition-colors duration-200 ${colorClasses}`}
    >
      {children}
    </div>
  );
}
