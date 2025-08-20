export type DisplayLinkImageData = {
	name: string;
	url: string;
	description?: string;
};

export type DisplayLinkData = {
	url: string;
	title: string;
	description: string;
	open_in_new_tab: boolean;
	image?: DisplayLinkImageData | null;
	auto_navigate: boolean;
};

export type DisplayLinkStructuredResult = {
	action: "display_link";
	data: DisplayLinkData;
};
