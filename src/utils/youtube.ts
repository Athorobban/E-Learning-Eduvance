export function getYoutubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    // youtu.be/VIDEO_ID
    if (url.includes("youtu.be")) {
      const id = url.split("youtu.be/")[1].split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (url.includes("youtube.com/watch")) {
      const params = new URL(url).searchParams;
      const id = params.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // sudah embed
    if (url.includes("youtube.com/embed")) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}
