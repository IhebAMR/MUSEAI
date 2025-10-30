export type Track = {
	title: string;
	artist: string;
	url?: string; // direct URL for file/preview
	albumArt?: string;
	provider?: 'file' | 'youtube';
	videoId?: string; // for YouTube playback
	externalUrl?: string; // optional external link
};
