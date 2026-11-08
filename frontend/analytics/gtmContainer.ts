import {
	ANALYTICS_EVENT_NAMES,
	ANALYTICS_PARAM_KEYS,
} from "../src/lib/analytics/catalog";

export const GTM_ACCOUNT_ID = "6401663462";
export const GTM_CONTAINER_ID = "284668080";
export const GTM_PUBLIC_ID = "GTM-N774P8VR";
export const GA4_MEASUREMENT_ID = "G-WW9DP3T4V4";

const ALL_PAGES_TRIGGER_ID = "2147479553";
const base = { accountId: GTM_ACCOUNT_ID, containerId: GTM_CONTAINER_ID };

/** Every event parameter, plus the persistent logged_in context. */
const EVENT_PARAMS = [...ANALYTICS_PARAM_KEYS, "logged_in"] as string[];

const dlvName = (key: string) => `DLV - ${key}`;
const dataLayerPath = (key: string) =>
	key === "logged_in" ? "logged_in" : `ct_params.${key}`;

export function buildGtmContainer() {
	const variables = [...EVENT_PARAMS, "traffic_type"].map((key, index) => ({
		...base,
		variableId: String(index + 1),
		name: dlvName(key),
		type: "v",
		parameter: [
			{ type: "INTEGER", key: "dataLayerVersion", value: "2" },
			{ type: "BOOLEAN", key: "setDefaultValue", value: "false" },
			{
				type: "TEMPLATE",
				key: "name",
				value: key === "traffic_type" ? "traffic_type" : dataLayerPath(key),
			},
		],
		fingerprint: "0",
		formatValue: {},
	}));

	const trigger = {
		...base,
		triggerId: "1",
		name: "CE - CookTale analytics events",
		type: "CUSTOM_EVENT",
		customEventFilter: [
			{
				type: "MATCH_REGEX",
				parameter: [
					{ type: "TEMPLATE", key: "arg0", value: "{{_event}}" },
					{
						type: "TEMPLATE",
						key: "arg1",
						value: `^(${ANALYTICS_EVENT_NAMES.join("|")})$`,
					},
				],
			},
		],
		fingerprint: "0",
	};

	const googleTag = {
		...base,
		tagId: "1",
		name: "Google tag - GA4 CookTale",
		type: "googtag",
		parameter: [
			{ type: "TEMPLATE", key: "tagId", value: GA4_MEASUREMENT_ID },
			{
				type: "LIST",
				key: "configSettingsTable",
				list: [
					{
						type: "MAP",
						map: [
							{ type: "TEMPLATE", key: "parameter", value: "traffic_type" },
							{
								type: "TEMPLATE",
								key: "parameterValue",
								value: `{{${dlvName("traffic_type")}}}`,
							},
						],
					},
				],
			},
		],
		fingerprint: "0",
		firingTriggerId: [ALL_PAGES_TRIGGER_ID],
		tagFiringOption: "ONCE_PER_EVENT",
		monitoringMetadata: { type: "MAP" },
		consentSettings: { consentStatus: "NOT_SET" },
	};

	const eventTag = {
		...base,
		tagId: "2",
		name: "GA4 event - CookTale analytics events",
		type: "gaawe",
		parameter: [
			{ type: "BOOLEAN", key: "sendEcommerceData", value: "false" },
			{ type: "TEMPLATE", key: "eventName", value: "{{Event}}" },
			{
				type: "TEMPLATE",
				key: "measurementIdOverride",
				value: GA4_MEASUREMENT_ID,
			},
			{
				type: "LIST",
				key: "eventSettingsTable",
				list: EVENT_PARAMS.map((key) => ({
					type: "MAP",
					map: [
						{ type: "TEMPLATE", key: "parameter", value: key },
						{
							type: "TEMPLATE",
							key: "parameterValue",
							value: `{{${dlvName(key)}}}`,
						},
					],
				})),
			},
		],
		fingerprint: "0",
		firingTriggerId: [trigger.triggerId],
		tagFiringOption: "ONCE_PER_EVENT",
		monitoringMetadata: { type: "MAP" },
		consentSettings: { consentStatus: "NOT_SET" },
	};

	return {
		exportFormatVersion: 2,
		exportTime: "2026-11-09 00:00:00",
		containerVersion: {
			path: `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/versions/0`,
			...base,
			containerVersionId: "0",
			container: {
				path: `accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}`,
				...base,
				name: "cooktale.in",
				publicId: GTM_PUBLIC_ID,
				usageContext: ["WEB"],
				fingerprint: "0",
				tagManagerUrl: `https://tagmanager.google.com/#/container/accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/workspaces?apiLink=container`,
			},
			tag: [googleTag, eventTag],
			trigger: [trigger],
			variable: variables,
			builtInVariable: [
				{ ...base, type: "EVENT", name: "Event" },
				{ ...base, type: "PAGE_URL", name: "Page URL" },
				{ ...base, type: "PAGE_HOSTNAME", name: "Page Hostname" },
				{ ...base, type: "PAGE_PATH", name: "Page Path" },
				{ ...base, type: "REFERRER", name: "Referrer" },
			],
			fingerprint: "0",
			tagManagerUrl: `https://tagmanager.google.com/#/versions/accounts/${GTM_ACCOUNT_ID}/containers/${GTM_CONTAINER_ID}/versions/0?apiLink=version`,
		},
	};
}
