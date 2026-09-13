"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";

type SmartImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  src: string;
  alt: string;
  fallbackSrc?: string;
};

/**
 * Img robuste: tente `src`, puis bascule sur `fallbackSrc` si le chargement échoue.
 * Utile pendant une transition (ex: WebP → PNG fallback).
 */
export default function SmartImg({ src, alt, fallbackSrc, onError, ...props }: SmartImgProps) {
  const [prevSrc, setPrevSrc] = React.useState(src);
  const [currentSrc, setCurrentSrc] = React.useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setCurrentSrc(src);
  }

  console.log("SmartImg props:", { src, alt, fallbackSrc, currentSrc });

  return (
    <img
      {...props}
      alt={alt}
      src={currentSrc}
      onError={(e) => {
        console.error("SmartImg error:", e);
        console.error("Failed to load image:", currentSrc);
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          console.log("Switching to fallback:", fallbackSrc);
          setCurrentSrc(fallbackSrc);
        }
        onError?.(e);
      }}
      onLoad={() => {
        console.log("SmartImg loaded successfully:", currentSrc);
      }}
    />
  );
}


