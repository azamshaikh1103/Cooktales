import { useCloudinaryUpload } from "./useCloudinaryUpload";

interface UploadResult {
	publicUrl: string;
	filename: string;
	publicId: string;
}

export const useGCSUpload = () => {
	const {
		uploadFile: uploadCloudinaryFile,
		uploading,
		error,
	} = useCloudinaryUpload();

	const uploadFile = async (file: File): Promise<UploadResult | null> => {
		const result = await uploadCloudinaryFile({
			file,
			context: "TEMP",
			resourceType: file.type.startsWith("video/") ? "video" : "image",
		});

		if (!result) return null;

		return {
			publicUrl: result.publicUrl,
			filename: result.publicId,
			publicId: result.publicId,
		};
	};

	const uploadMultiple = async (files: File[]): Promise<UploadResult[]> => {
		const results = await Promise.all(files.map((file) => uploadFile(file)));
		return results.filter((result): result is UploadResult => Boolean(result));
	};

	return {
		uploadFile,
		uploadMultiple,
		uploading,
		progress: uploading ? 50 : 0,
		error,
	};
};
