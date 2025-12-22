export const getOptimizedImageUrl = (url: string, width: number = 600) => {
  if (!url.includes('cloudinary.com')) return url;
  
  // 이미 transformation 파라미터가 있는지 확인
    if (url.includes('/upload/f_auto,q_auto')) {
        // 기존의 w_숫자 부분을 찾아서 새로운 w_width로 교체해줍니다.
        return url.replace(/w_\d+/, `w_${width}`);
    }

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  return `${parts[0]}/upload/f_auto,q_auto,w_${width}/${parts[1]}`;
};

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error('Missing Cloudinary configuration:', { cloudName, uploadPreset });
    throw new Error('Cloudinary configuration is missing. Check your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload error details:', errorData);
      throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload exception:', error);
    throw error;
  }
};
