import Image from "next/image";
import { VscAccount } from "react-icons/vsc";

type ProfileImageProps = {
  src?: string | null;
  className?: string;
  small?: boolean;
};

export function ProfileImage({
  src,
  className = "",
  small = false,
}: ProfileImageProps) {
  const size = small ? "h-8 w-8" : "h-10 w-10";
  return (
    <div
      className={`relative ${size} overflow-hidden rounded-full ${className}`}
    >
      {src == null ? (
        <VscAccount className="h-full w-full" />
      ) : (
        <Image
          src={src}
          alt="Profile image"
          quality={100}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        ></Image>
      )}
    </div>
  );
}
