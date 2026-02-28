export async function shareContent(title: string, text: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing content:', error);
      }
    }
  } else {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title}: ${url}`)}`;
    window.open(shareUrl, '_blank');
  }
}
