"use client";

import { motion } from "framer-motion";
import type { ElementType, ReactNode } from "react";

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Reveal({ as = "div", children, className, id }: RevealProps) {
  const Component =
    as === "article" ? motion.article : as === "p" ? motion.p : as === "section" ? motion.section : motion.div;

  return (
    <Component
      className={className}
      id={id}
      initial={{ opacity: 0.55, y: 14 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.08, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}
