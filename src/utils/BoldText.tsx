import { Fragment } from "react";

interface BoldTextProps {
  text: string;
  as?: "span" | "p" | "div";
}

export function BoldText({ text, as = "span" }: BoldTextProps) {
  const parts = (typeof text === "string" ? text : "").split(/(\*\*.*?\*\*)/g);
  const Tag = as;

  return (
    <Tag
      className="paragraph"
      data-aos="fade-right"
      data-aos-anchor-placement="center-bottom"
      data-aos-duration="1000"
      style={{ fontSize: 15, lineHeight: 1.6, color: "black", marginTop: as === "span" ? 0 : 10, marginBottom: as === "span" ? 0 : 15, textAlign: "justify" }}
    >
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={`bold:${i}`}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={`text:${i}`}>{part}</Fragment>
        )
      )}
    </Tag>
  );
}
