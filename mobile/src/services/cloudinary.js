export const uploadCV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "cv_uploads2026");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/diaeq8qup/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url;
};