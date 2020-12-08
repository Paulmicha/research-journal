/**
 * @file
 * Public URLs data miner based on channels exports.
 *
 * @see scripts/experiments/search_index/fetch.sh
 */

const slugify = require('@sindresorhus/slugify')
const fs = require('fs');
const path = require('path');
const { walk } = require('../../../fs');

// Excluded domains.
const blacklisted = [
	'github.com/Paulmicha/',
	// 'docs.google.com',
	'drive.google.com',
	'.zoom.',
	'.bbcollab.',
	'.webex.',
	'miro.com',
	'plateau.',
	'-weever.'
];

const blacklisted_channels = [
	'778322366161485897',
	'774206981191106580',
	'768541814524870727',
	'781585449646817293',
	'781550948236525598',
	'781475209537388565',
	'781427207662075905',
	'781425172003160074',
	'781222072335859732',
	'781498326435627038',
	'781496743870464000',
	'775704469924347944',
	'777907883488575499',
	'768506184810364939'
];

const irrelevant_channel_names = [
	'partages-ressources'
];

/**
 * Returns "clean" URL from message if it contains any and if not blacklisted.
 *
 * See https://gist.github.com/dperini/729294
 *
 * @returns String|Boolean
 *   False if no URL was found (or if it is blacklisted).
 *   String (the matched URL) otherwise.
 */
const get_url = (text) => {
	const urlRegex = new RegExp(
		"(?:(?:(?:https?|ftp):)?\\/\\/)" +
			// user:pass BasicAuth (optional)
			"(?:\\S+(?::\\S*)?@)?" +
			"(?:" +
				// IP address exclusion
				// private & local networks
				"(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
				"(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
				"(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
				// IP address dotted notation octets
				// excludes loopback network 0.0.0.0
				// excludes reserved space >= 224.0.0.0
				// excludes network & broadcast addresses
				// (first & last IP address of each class)
				"(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
				"(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
				"(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
			"|" +
				// host & domain names, may end with dot
				// can be replaced by a shortest alternative
				// (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
				"(?:" +
					"(?:" +
						"[a-z0-9\\u00a1-\\uffff]" +
						"[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
					")?" +
					"[a-z0-9\\u00a1-\\uffff]\\." +
				")+" +
				// TLD identifier name, may end with dot
				"(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
			")" +
			// port number (optional)
			"(?::\\d{2,5})?" +
			// resource path (optional)
			"(?:[/?#]\\S*)?",
		"i"
	);

	const match = urlRegex.exec(text);

	if (!match || !match[0]) {
		return false;
	}

	for (let i = 0; i < blacklisted.length; i++) {
		if (match[0].includes(blacklisted[i])) {
			return false;
		}
	}

	// When copy/pasting URLs inside parenthesis (or before a comma), the URL gets
	// appended with those -> regex to remove from the end those 2 characters.
	// TODO edge cases to look out for ?
	let url = match[0].replace(/([\),\s]+$)/g, '');

	// Remove Facebook tracking.
	const urlObj = new URL(url);
	urlObj.searchParams.delete('fbclid');

	return urlObj.href;
};

/**
 * Returns object of values defined by our simple token syntax.
 *
 * @return Object
 *
 * @example
 *   // input :
 *   text = "https://www.college-de-france.fr/site/luigi-rizzi/inaugural-lecture-2020-11-05-18h00.htm /tags: video, conférence, linguistique, structures syntaxiques /names: Luigi Rizzi /authors: Collège de France /description: Leçon inaugurale (vidéo d'1h) présentant les travaux de la nouvelle chaire Linguistique générale du Collège de France, confiée au linguiste Luigi Rizzi."
 *   // output :
 *   result = tokenize_message(text)
 *   // -> {
 *     description: "Leçon inaugurale (vidéo d'1h) présentant les travaux de la nouvelle chaire Linguistique générale du Collège de France, confiée au linguiste Luigi Rizzi.",
 *     authors: 'Collège de France',
 *     names: 'Luigi Rizzi',
 *     tags: 'video, conférence, linguistique, structures syntaxiques'
 *   }
 */
const tokenize_message = (text) => {
	let result = {};

	// Start from the end to gradually prune the text up to the first match.
	Array.from(text.matchAll(/\/([^:/]+)\h?:/gmi)).reverse().forEach(match => {
		const token = normalize_token_name(match[1]);
		const to_prune = text.substring(match.index);
		result[token] = to_prune.replace(match[0], '').trim().replace(/(^,)|(,$)/g, "");
		if (!result[token].length) {
			delete result[token];
		}
		text = text.substring(0, match.index);
	});

	return result;
}

/**
 * Normalizes token names.
 *
 * Performs translitteration + lowercase (slugify), and reduce synonyms or
 * aliases to "canonical" values.
 *
 * @example
 *   token = normalize_token_name("DéScriPtion");
 *   // -> "description"
 *
 * @example
 *   token = normalize_token_name("Mots-clés");
 *   // -> "tags"
 */
const normalize_token_name = (token) => {
	const aliases = {
		"d": "description",
		"desc": "description",
		"content": "description",
		"contenu": "description",
		"t": "tags",
		"tag": "tags",
		"mots-cles": "tags",
		"mot-cle": "tags",
		"a": "author",
		"auteur": "author",
		"auteurs": "author",
		"authors": "author",
		"h": "title",
		"headline": "title",
		"titre": "title",
		"n": "names",
		"nom": "names",
		"noms": "names",
		"name": "names",
		"m": "type",
		"types": "type",
		"support": "type",
		"supports": "type",
		"media": "type",
		"medias": "type"
	};

	token = slugify(token);

	Object.keys(aliases).forEach(alias => {
		if (token === alias) {
			token = aliases[alias];
		}
	});

	return token;
}

/**
 * Extracts relations.
 */
const parseReactions = reactions => {
	const result = [];

	reactions.forEach(reaction => {
		if (!reaction.emoji || !reaction.emoji.imageUrl) {
			return;
		}
		const fileName = path.basename(reaction.emoji.imageUrl);
		const imgPath = `static/media/emojis/${fileName}`;
		fs.copyFile(`private/channels/${reaction.emoji.imageUrl}`, imgPath, err => err && console.log(err));
		result.push({
			name: reaction.emoji.name,
			count: reaction.count,
			imgPath
		});
	});

	return result;
};

/**
 * Builds our custom data miner cache.
 */
const build_channels_urls_index = () => {
	let raw_data;
	const alreadyExtracted = []
	const index = { documents:[] };
	const titleForceFallback = [
		'Accueil',
		'binge.audio'
	];

	walk('private/channels', '.json').map(file_path => {
		raw_data = JSON.parse(fs.readFileSync(file_path).toString());

		if (blacklisted_channels.includes(raw_data.channel.id)) {
			return;
		}

		raw_data.messages.forEach(message => {
			const url = get_url(message.content);
			if (!url) {
				return;
			}
			// TODO enrich existing object when duplicates are found (instead of
			// skipping).
			if (alreadyExtracted.includes(url)) {
				return;
			}
			alreadyExtracted.push(url);

			message.content = message.content.replace(url, '');

			// First, look for custom tokens (embeds will only provide "fallback"
			// values, see below).
			const doc = tokenize_message(message.content);
			doc.url = url;

			// Unify channel name and tags. Excludes irrelevant channel names.
			if (!irrelevant_channel_names.includes(raw_data.channel.name)) {
				if (!('tags' in doc)) {
					doc.tags = raw_data.channel.name;
				} else if (!doc.tags.includes(raw_data.channel.name)) {
					doc.tags = `${raw_data.channel.name}, ${doc.tags}`;
				}
			}

			// Format date shared. TODO publication date ?
			// const d = new Date(message.timestamp);
			// doc.date_shared = `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}`;
			// doc.date_shared = new Date(message.timestamp).toLocaleDateString({
			// 	year: "numeric",
			// 	month: "2-digit",
			// 	day: "2-digit"
			// });
			doc.date_shared = message.timestamp;

			// Extract embeds contents as fallback.
			message.embeds.forEach(embed => {
				if (!('description' in doc)) {
					doc.description = embed.description;
				}
				if (!('author' in doc) && 'author' in embed && 'name' in embed.author) {
					doc.author = embed.author.name;
				}
				if (!('title' in doc)) {
					if ('title' in embed && embed.title.length && !titleForceFallback.includes(embed.title)) {
						doc.title = embed.title;
					} else if ('author' in doc) {
						doc.title = doc.author;
					}
				}
			});

			if (!('title' in doc)) {
				// Exception : Google docs to be shared must define their title via
				// token.
				if (doc.url.includes('docs.google.com')) {
					return;
				}
				doc.title = doc.url.replace(/https?:\/\//, '');
			}

			// Parses reactions.
			doc.reactions = [];
			if ('reactions' in message) {
				doc.reactions = parseReactions(message.reactions);
				console.log(doc);
			}

			index.documents.push(doc);
		});
	});

	// Sort by date shared DESC.
	index.documents.sort((a, b) => new Date(b.date_shared).getTime() - new Date(a.date_shared).getTime());

	return index;
};

module.exports = {
	build_channels_urls_index
};
