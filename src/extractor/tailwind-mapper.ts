/**
 * tailwind-mapper.ts — Maps computed CSS properties to canonical Tailwind CSS utility classes.
 */

const SPACING_MAP: Record<string, string> = {
  "0px": "0",
  "1px": "px",
  "2px": "0.5",
  "4px": "1",
  "6px": "1.5",
  "8px": "2",
  "10px": "2.5",
  "12px": "3",
  "14px": "3.5",
  "16px": "4",
  "20px": "5",
  "24px": "6",
  "28px": "7",
  "32px": "8",
  "36px": "9",
  "40px": "10",
  "44px": "11",
  "48px": "12",
  "56px": "14",
  "64px": "16",
  "80px": "20",
  "96px": "24"
};

const FONT_SIZE_MAP: Record<string, string> = {
  "12px": "text-xs",
  "14px": "text-sm",
  "16px": "text-base",
  "18px": "text-lg",
  "20px": "text-xl",
  "24px": "text-2xl",
  "30px": "text-3xl",
  "36px": "text-4xl",
  "48px": "text-5xl"
};

const FONT_WEIGHT_MAP: Record<string, string> = {
  "100": "font-thin",
  "200": "font-extralight",
  "300": "font-light",
  "400": "font-normal",
  "500": "font-medium",
  "600": "font-semibold",
  "700": "font-bold",
  "800": "font-extrabold",
  "900": "font-black"
};

const BORDER_RADIUS_MAP: Record<string, string> = {
  "0px": "rounded-none",
  "2px": "rounded-sm",
  "4px": "rounded",
  "6px": "rounded-md",
  "8px": "rounded-lg",
  "12px": "rounded-xl",
  "16px": "rounded-2xl",
  "24px": "rounded-3xl",
  "9999px": "rounded-full"
};

export function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
  const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
  const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function mapStylesToTailwind(styles: Record<string, string>): string[] {
  const classes: string[] = [];

  // Display
  if (styles.display === "flex") classes.push("flex");
  else if (styles.display === "inline-flex") classes.push("inline-flex");
  else if (styles.display === "grid") classes.push("grid");
  else if (styles.display === "inline-grid") classes.push("inline-grid");
  else if (styles.display === "inline-block") classes.push("inline-block");
  else if (styles.display === "block") classes.push("block");
  else if (styles.display === "hidden") classes.push("hidden");

  // Flexbox direction & alignment
  if (styles.display?.includes("flex")) {
    if (styles.flexDirection === "column") classes.push("flex-col");
    if (styles.flexDirection === "row-reverse") classes.push("flex-row-reverse");
    if (styles.flexDirection === "column-reverse") classes.push("flex-col-reverse");
    if (styles.flexWrap === "wrap") classes.push("flex-wrap");

    if (styles.alignItems === "center") classes.push("items-center");
    else if (styles.alignItems === "flex-start") classes.push("items-start");
    else if (styles.alignItems === "flex-end") classes.push("items-end");
    else if (styles.alignItems === "stretch") classes.push("items-stretch");

    if (styles.justifyContent === "center") classes.push("justify-center");
    else if (styles.justifyContent === "space-between") classes.push("justify-between");
    else if (styles.justifyContent === "flex-end") classes.push("justify-end");
    else if (styles.justifyContent === "space-around") classes.push("justify-around");
    else if (styles.justifyContent === "space-evenly") classes.push("justify-evenly");
  }

  // Grid
  if (styles.display?.includes("grid")) {
    if (styles.gridTemplateColumns) {
      const cols = styles.gridTemplateColumns.trim().split(/\s+/).length;
      if (cols > 0 && cols <= 12) classes.push(`grid-cols-${cols}`);
    }
  }

  // Gap
  if (styles.gap && styles.gap !== "0px" && styles.gap !== "normal") {
    const mapped = SPACING_MAP[styles.gap];
    classes.push(mapped ? `gap-${mapped}` : `gap-[${styles.gap}]`);
  }

  // Padding
  if (styles.padding && styles.padding !== "0px") {
    const parts = styles.padding.split(/\s+/);
    if (parts.length === 1) {
      const m = SPACING_MAP[parts[0]];
      classes.push(m ? `p-${m}` : `p-[${parts[0]}]`);
    } else if (parts.length === 2) {
      const my = SPACING_MAP[parts[0]];
      const mx = SPACING_MAP[parts[1]];
      classes.push(my ? `py-${my}` : `py-[${parts[0]}]`);
      classes.push(mx ? `px-${mx}` : `px-[${parts[1]}]`);
    }
  }

  // Margin
  if (styles.margin && styles.margin !== "0px") {
    if (styles.margin.includes("auto")) {
      classes.push("mx-auto");
    }
  }

  // Typography
  if (styles.fontSize && FONT_SIZE_MAP[styles.fontSize]) {
    classes.push(FONT_SIZE_MAP[styles.fontSize]);
  }
  if (styles.fontWeight && FONT_WEIGHT_MAP[styles.fontWeight]) {
    classes.push(FONT_WEIGHT_MAP[styles.fontWeight]);
  }
  if (styles.textAlign && styles.textAlign !== "start" && styles.textAlign !== "left") {
    classes.push(`text-${styles.textAlign}`);
  }

  // Text Color
  if (styles.color && styles.color !== "rgba(0, 0, 0, 0)") {
    const hex = rgbToHex(styles.color);
    if (hex === "#ffffff") classes.push("text-white");
    else if (hex === "#000000") classes.push("text-black");
    else classes.push(`text-[${hex}]`);
  }

  // Background Color
  if (styles.backgroundColor && styles.backgroundColor !== "rgba(0, 0, 0, 0)") {
    const hex = rgbToHex(styles.backgroundColor);
    if (hex === "#ffffff") classes.push("bg-white");
    else if (hex === "#000000") classes.push("bg-black");
    else classes.push(`bg-[${hex}]`);
  }

  // Border Radius
  if (styles.borderRadius && styles.borderRadius !== "0px") {
    const mapped = BORDER_RADIUS_MAP[styles.borderRadius];
    classes.push(mapped || `rounded-[${styles.borderRadius}]`);
  }

  // Position
  if (styles.position === "relative") classes.push("relative");
  else if (styles.position === "absolute") classes.push("absolute");
  else if (styles.position === "fixed") classes.push("fixed");
  else if (styles.position === "sticky") classes.push("sticky");

  // Box Shadow
  if (styles.boxShadow && styles.boxShadow !== "none") {
    classes.push("shadow-sm");
  }

  return classes;
}
