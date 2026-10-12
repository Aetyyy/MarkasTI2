"use client";

import { useState } from "react";
import { getDisplayImageUrl } from "@/libs/api/imageUrl";

type NavbarProfileAvatarProps = {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 text-xs rounded-full",
  md: "h-11 w-11 text-sm rounded-full",
  lg: "h-14 w-14 text-base rounded-full",
};

function getInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "U";

  return source
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isPrototypeImage(image?: string | null) {
  return !image || image.startsWith("prototype://");
}

export default function NavbarProfileAvatar({
  image,
  name,
  email,
  size = "md",
  className = "",
}: NavbarProfileAvatarProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageError = Boolean(image && failedImage === image);

  const usePrototype = isPrototypeImage(image) || imageError;

  return (
    <span
      className={`relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden align-middle font-black text-white transform-gpu [backface-visibility:hidden] ${usePrototype ? "bg-linear-to-br from-blue-600 via-sky-600 to-cyan-400" : "bg-transparent"} ${sizeClasses[size]} ${className}`}
      title={name || email || "Profile"}
    >
      {!usePrototype && image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getDisplayImageUrl(image)}
          alt={name || email || "Profile"}
          onError={() => setFailedImage(image)}
          decoding="async"
          className="absolute inset-0 block h-full w-full scale-[1.025] rounded-full object-cover object-center transform-gpu [backface-visibility:hidden]"
          draggable={false}
        />
      ) : (
        <span className="relative z-10 leading-none">
          {getInitial(name, email)}
        </span>
      )}
      <span className="pointer-events-none absolute inset-[0.5px] z-20 rounded-full ring-1 ring-inset ring-white/55" />
    </span>
  );
}
