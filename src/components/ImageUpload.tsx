import { useEffect, useRef, useState } from "react";
import { VscDeviceCamera, VscTrash } from "react-icons/vsc";
import Image from "next/image";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import imageCompression, { type Options } from "browser-image-compression";

type ImageUploadProps = {
  onUrlReady: (url: string) => void;
  reset: number;
};

export function ImageUpload({ onUrlReady, reset }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File>();
  const [localImageUrl, setLocalImageUrl] = useState("");
  const [localImageAspectRatio, setLocalImageAspectRatio] = useState(16 / 9); // default to 16:9
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    handleImageDelete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const getPresignedUrl = api.aws.getPresignedPostUrl.useMutation({
    onSuccess: async ({ url, fields }) => {
      const formData = new FormData();
      Object.entries({ ...fields, file: selectedImage }).forEach(
        ([key, value]) => {
          formData.append(key, value as string);
        }
      );
      const upload = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (!upload.ok) {
        console.error("Upload to S3 bucket failed.");
      }
      const fileName = fields.key ? fields.key : "";
      onUrlReady(`${url}/${fileName}`);
    },
  });

  async function handleImageSelection(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const imageFile = e.target.files[0];
      const compressedFile = await compressImageFile(imageFile);
      setSelectedImage(compressedFile);
      setLocalImageUrl(URL.createObjectURL(compressedFile));
      getPresignedUrl.mutate({
        fileType: compressedFile.type,
      });
    }
  }

  function handleImageDelete() {
    setSelectedImage(undefined);
    setLocalImageUrl("");
    onUrlReady("");
  }

  async function compressImageFile(imageFile: File) {
    const options: Options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 300,
    };
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  }

  return (
    <>
      {selectedImage ? (
        <div className="relative ml-14 mt-2">
          <VscTrash
            onClick={() => handleImageDelete()}
            className="absolute -right-3 -top-3 h-6 w-6 cursor-pointer rounded-full bg-gray-300 p-1"
          />
          <Image
            src={localImageUrl}
            alt="Image preview"
            quality={100}
            width={150}
            height={150 / localImageAspectRatio}
            onLoadingComplete={({ naturalWidth, naturalHeight }) =>
              setLocalImageAspectRatio(naturalWidth / naturalHeight)
            }
            className="rounded-md border-2 border-solid border-blue-300"
          />
        </div>
      ) : (
        <div className="ml-12">
          <IconHoverEffect color={"blue"}>
            <VscDeviceCamera
              onClick={() => fileInputRef.current?.click()}
              className="h-7 w-7 cursor-pointer fill-gray-500 transition-colors duration-200 group-hover:fill-blue-700"
            />
          </IconHoverEffect>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            hidden
            onChange={(e) => void handleImageSelection(e)}
          />
        </div>
      )}
    </>
  );
}
