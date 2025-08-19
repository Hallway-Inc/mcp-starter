import iataData from "../data/IATA.json";
import type { DisplayLinkStructuredResult } from "../types.js";

interface FlightSearchParams {
	originCode: string;
	originName?: string;
	destinationCode: string;
	destinationName?: string;
	departureDate: string;
	returnDate?: string;
	passengerCount: number;
	flightClass: string;
	dateBuffer?: boolean;
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function searchFlights(params: FlightSearchParams) {
	// Look up airport names from IATA codes if not provided
	const originName =
		params.originName ||
		iataData[params.originCode as keyof typeof iataData] ||
		params.originCode;
	const destinationName =
		params.destinationName ||
		iataData[params.destinationCode as keyof typeof iataData] ||
		params.destinationCode;

	const baseUrl = process.env.FLIGHT_SEARCH_BASE_URL ?? "https://www.pointhound.com/flights";

	const urlParams = new URLSearchParams();

	// Add all the search parameters in the order they appear in the example URL
	urlParams.append("dateBuffer", (params.dateBuffer ?? false).toString());
	urlParams.append("flightClass", params.flightClass);
	urlParams.append("originCode", params.originCode);
	urlParams.append("originName", originName);
	urlParams.append("destinationCode", params.destinationCode);
	urlParams.append("destinationName", destinationName);
	urlParams.append("passengerCount", params.passengerCount.toString());
	urlParams.append("departureDate", params.departureDate);
	if (params.returnDate) {
		urlParams.append("returnDate", params.returnDate);
	}

	const searchUrl = `${baseUrl}?${urlParams.toString()}`;

	// Create meaningful title and description
	const origin = originName;
	const destination = destinationName;
	const title = `Flights ${params.originCode} → ${params.destinationCode}`;
	const description = `Flight search: ${origin} to ${destination} on ${params.departureDate}${params.returnDate ? ` (returning ${params.returnDate})` : " (one-way)"}, ${params.passengerCount} passenger${params.passengerCount > 1 ? "s" : ""}, ${params.flightClass}`;

	const structuredResult = {
		action: "display_link",
		data: {
			url: searchUrl,
			title: title,
			description: description,
			// image: {
			// 	name: "Flight Search",
			// 	description: "PointHound Flight Search",
			// 	url: "https://www.pointhound.com/_next/image?url=%2Fassets%2Fpng%2FHomepageExploreCard.png&w=1920&q=75",
			// },
			open_in_new_tab: false,
			auto_navigate: true,
		},
	} satisfies DisplayLinkStructuredResult;

	return {
		content: [
			{
				type: "text",
				text: `Found flights from ${params.originCode} to ${params.destinationCode} on ${params.departureDate}.`,
			},
			// {
			// 	type: "text",
			// 	text: JSON.stringify(structuredResult),
			// },
		],
		structuredContent: structuredResult,
	};
}

export const searchFlightsToolDefinition = {
	name: "search-flights",
	title: "Flight Search",
	description:
		"Search for flights on PointHound and provide a clickable link to the search results",
	inputSchema: {
		type: "object",
		properties: {
			originCode: {
				type: "string",
				description:
					"IATA airport code for departure airport (e.g., MCI, LAX, JFK)",
			},
			destinationCode: {
				type: "string",
				description:
					"IATA airport code for destination airport (e.g., SFO, LAX, JFK)",
			},
			departureDate: {
				type: "string",
				description:
					"Departure date in YYYY-MM-DD format (e.g., 2025-08-17). If year is not specified, use current year, or next year if the month/day has already passed this year.",
			},
			returnDate: {
				type: "string",
				description:
					"Return date in YYYY-MM-DD format (optional, leave empty for one-way). If year is not specified, use current year, or next year if the month/day has already passed this year.",
			},
			passengerCount: {
				type: "number",
				description: "Number of passengers (1-9)",
				minimum: 1,
				maximum: 9,
			},
			flightClass: {
				type: "string",
				description: "Flight class preference",
				enum: ["Economy", "Premium Economy", "Business", "First"],
			},
			dateBuffer: {
				type: "boolean",
				description:
					"Whether to include flexible dates in search (default: false)",
				default: false,
			},
		},
		required: [
			"originCode",
			"destinationCode",
			"departureDate",
			"passengerCount",
			"flightClass",
		],
	},
	outputSchema: {
		type: "object",
		properties: {
			action: { type: "string" },
			data: {
				url: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				image_url: { type: "string" },
				open_in_new_tab: { type: "boolean" },
				auto_navigate: { type: "boolean" },
			},
		},
		required: ["action", "url", "title", "description", "openInNewTab"],
	},
};
