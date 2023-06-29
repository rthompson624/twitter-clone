import Link from "next/link";
import type { RefObject } from "react";
import { type MiniProfile } from "~/server/api/routers/profile";
import { ProfileImage } from "./ProfileImage";

type ProfilesModalProps = {
  modalRef: RefObject<HTMLInputElement>;
  modalId: string;
  title: string;
  profiles: MiniProfile[] | undefined;
};

export function ProfilesModal({
  modalRef,
  modalId,
  title,
  profiles,
}: ProfilesModalProps) {
  return (
    <>
      <input
        ref={modalRef}
        type="checkbox"
        id={`profiles-modal-${modalId}`}
        className="modal-toggle"
      />
      <div className="modal">
        <div className="modal-box relative">
          <label
            htmlFor={`profiles-modal-${modalId}`}
            className="btn-sm btn-circle btn absolute right-2 top-2"
          >
            ✕
          </label>
          <h3 className="text-lg font-bold">{title}</h3>
          <div className="flex max-h-[32rem] flex-col gap-4 overflow-y-auto pt-4">
            {profiles?.map((profile) => (
              <div key={profile.id} className="flex gap-4 pr-3">
                <Link
                  href={`/profiles/${profile.id}`}
                  onClick={() => modalRef.current?.click()}
                >
                  <ProfileImage src={profile.image} />
                </Link>
                <div className="flex-grow">
                  <Link
                    href={`/profiles/${profile.id}`}
                    onClick={() => modalRef.current?.click()}
                  >
                    <div className="text-lg font-bold">{profile.name}</div>
                    <div className="text-sm">{profile.email}</div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
