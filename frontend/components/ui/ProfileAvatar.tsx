import Image from "next/image";

type ProfileAvatarProps = {
  name: string;
  profileImage?: string | null;
  className?: string;
  imageClassName?: string;
};

function initialsFor(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default function ProfileAvatar({
  name,
  profileImage,
  className = "h-10 w-10 text-sm",
  imageClassName = "object-cover",
}: ProfileAvatarProps) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#B45A2A] font-serif font-medium text-white ${className}`}
      aria-label={`${name || "User"} profile photo`}
    >
      {profileImage ? (
        <Image
          src={profileImage}
          alt={`${name || "User"} profile photo`}
          fill
          sizes="96px"
          className={imageClassName}
          unoptimized={profileImage.startsWith("blob:")}
        />
      ) : (
        <span aria-hidden="true">{initialsFor(name)}</span>
      )}
    </div>
  );
}
